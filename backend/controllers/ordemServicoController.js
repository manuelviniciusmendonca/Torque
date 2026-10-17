const pool = require("../config/db");

// ==========================================
// LISTAR ORDENS DE SERVIÇO
// ==========================================

const listarOrdensServico = async (req, res) => {
    try {
        const [ordens] = await pool.query(`
            SELECT
                os.*,
                c.nome AS cliente_nome,
                c.telefone AS cliente_telefone,
                c.whatsapp AS cliente_whatsapp,
                c.endereco AS cliente_endereco,
                v.placa,
                v.marca,
                v.modelo,
                v.ano,
                v.cor
            FROM ordens_servico os
            INNER JOIN clientes c ON os.cliente_id = c.id
            INNER JOIN veiculos v ON os.veiculo_id = v.id
            ORDER BY os.id DESC
        `);

        res.json(ordens);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao listar ordens de serviço"
        });
    }
};


// ==========================================
// CRIAR ORDEM DE SERVIÇO
// ==========================================

const criarOrdemServico = async (req, res) => {
    const conexao = await pool.getConnection();

    try {

        const {
            oficina_id,
            nome,
            telefone,
            whatsapp,
            endereco,
            placa,
            marca,
            modelo,
            ano,
            cor,
            quilometragem,
            problema_relatado,
            diagnostico,
            observacoes,
            pecas = [],
            servicos = [],
            servicos_adicionais = [],
            status = "aberta",
            descricao_adicional,
            valor_adicional = 0
        } = req.body;

        const statusPermitidos = [
            "aberta",
            "aguardando_avaliacao",
            "em_avaliacao",
            "aguardando_aprovacao",
            "aguardando_peca",
            "em_execucao"
        ];
        const descricaoAdicional = typeof descricao_adicional === "string"
            ? descricao_adicional.trim()
            : "";
        const valorAdicionalCentavos = Math.round(Number(valor_adicional || 0) * 100);
        const servicosAdicionaisValidos = Array.isArray(servicos_adicionais)
            ? servicos_adicionais.map((item) => {
                if (!item || typeof item !== "object") {
                    return { descricao: "", valorCentavos: NaN };
                }

                return {
                    descricao: typeof item.descricao === "string" ? item.descricao.trim() : "",
                    valorCentavos: Math.round(Number(item.valor || 0) * 100)
                };
            })
            : null;


        // ==========================================
        // VALIDAÇÕES
        // ==========================================

        if (!oficina_id || !nome || !telefone) {
            return res.status(400).json({
                mensagem: "oficina_id, nome e telefone são obrigatórios"
            });
        }

        if (!placa || !marca || !modelo) {
            return res.status(400).json({
                mensagem: "placa, marca e modelo são obrigatórios"
            });
        }

        if (!statusPermitidos.includes(status)) {
            return res.status(400).json({ mensagem: "Status inicial da ordem inválido" });
        }

        if (!Number.isFinite(valorAdicionalCentavos) || valorAdicionalCentavos < 0 ||
            (valorAdicionalCentavos > 0 && !descricaoAdicional) ||
            descricaoAdicional.length > 255) {
            return res.status(400).json({
                mensagem: "Informe uma descrição de até 255 caracteres para o preço adicional e um valor válido"
            });
        }

        if (!servicosAdicionaisValidos ||
            servicosAdicionaisValidos.some((item) =>
                !item.descricao ||
                item.descricao.length > 255 ||
                !Number.isFinite(item.valorCentavos) ||
                item.valorCentavos <= 0
            )) {
            return res.status(400).json({
                mensagem: "Cada serviço adicional deve ter uma descrição de até 255 caracteres e um valor maior que zero"
            });
        }

        const totalServicosAdicionaisCentavos = servicosAdicionaisValidos.reduce(
            (total, item) => total + item.valorCentavos,
            0
        );

        await conexao.beginTransaction();


        // ==========================================
        // 1. PROCURAR CLIENTE
        // ==========================================

        let clienteId;

        const [clientes] = await conexao.query(
            `
            SELECT id
            FROM clientes
            WHERE oficina_id = ?
            AND telefone = ?
            LIMIT 1
            `,
            [
                oficina_id,
                telefone
            ]
        );


        if (clientes.length > 0) {

            clienteId = clientes[0].id;

            await conexao.query(
                `
                UPDATE clientes
                SET nome = ?,
                    whatsapp = ?,
                    endereco = ?
                WHERE id = ?
                `,
                [
                    nome,
                    whatsapp || null,
                    endereco || null,
                    clienteId
                ]
            );

        } else {

            const [novoCliente] = await conexao.query(
                `
                INSERT INTO clientes
                (
                    oficina_id,
                    nome,
                    telefone,
                    whatsapp,
                    endereco
                )
                VALUES (?, ?, ?, ?, ?)
                `,
                [
                    oficina_id,
                    nome,
                    telefone,
                    whatsapp || null,
                    endereco || null
                ]
            );

            clienteId = novoCliente.insertId;
        }


        // ==========================================
        // 2. PROCURAR VEÍCULO PELA PLACA
        // ==========================================

        let veiculoId;

        const [veiculos] = await conexao.query(
            `
            SELECT id
            FROM veiculos
            WHERE oficina_id = ?
            AND placa = ?
            LIMIT 1
            `,
            [
                oficina_id,
                placa
            ]
        );


        if (veiculos.length > 0) {

            veiculoId = veiculos[0].id;

            await conexao.query(
                `
                UPDATE veiculos
                SET cliente_id = ?,
                    marca = ?,
                    modelo = ?,
                    ano = ?,
                    cor = ?,
                    quilometragem = ?
                WHERE id = ?
                `,
                [
                    clienteId,
                    marca,
                    modelo,
                    ano || null,
                    cor || null,
                    quilometragem || 0,
                    veiculoId
                ]
            );

        } else {

            const [novoVeiculo] = await conexao.query(
                `
                INSERT INTO veiculos
                (
                    oficina_id,
                    cliente_id,
                    placa,
                    marca,
                    modelo,
                    ano,
                    cor,
                    quilometragem
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                [
                    oficina_id,
                    clienteId,
                    placa,
                    marca,
                    modelo,
                    ano || null,
                    cor || null,
                    quilometragem || 0
                ]
            );

            veiculoId = novoVeiculo.insertId;
        }


        // ==========================================
        // 3. CRIAR ORDEM DE SERVIÇO
        // ==========================================

        let valorTotalCentavos = valorAdicionalCentavos + totalServicosAdicionaisCentavos;

        const [resultado] = await conexao.query(
            `
            INSERT INTO ordens_servico
            (
                oficina_id,
                cliente_id,
                veiculo_id,
                problema_relatado,
                diagnostico,
                observacoes,
                quilometragem,
                status,
                valor_total,
                descricao_adicional,
                valor_adicional
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                oficina_id,
                clienteId,
                veiculoId,
                problema_relatado || null,
                diagnostico || null,
                observacoes || null,
                quilometragem || 0,
                status,
                valorAdicionalCentavos / 100,
                descricaoAdicional || null,
                valorAdicionalCentavos / 100
            ]
        );

        const ordemId = resultado.insertId;

        for (const adicional of servicosAdicionaisValidos) {
            await conexao.query(
                `INSERT INTO ordem_servico_adicionais
                (ordem_servico_id, descricao, valor)
                VALUES (?, ?, ?)`,
                [ordemId, adicional.descricao, adicional.valorCentavos / 100]
            );
        }


        // ==========================================
        // 4. ADICIONAR PEÇAS
        // ==========================================

        for (const item of pecas) {
            const qtd = Number(item.quantidade) || 1;
            const pecaId = Number(item.peca_id);

            if (!pecaId) continue;

            const [pecasEncontradas] = await conexao.query(
                `SELECT preco_venda, quantidade FROM pecas WHERE id = ? FOR UPDATE`,
                [pecaId]
            );

            if (pecasEncontradas.length === 0) {
                throw new Error(`Peça ${pecaId} não encontrada`);
            }

            const peca = pecasEncontradas[0];

            if (peca.quantidade < qtd) {
                throw new Error(`Estoque insuficiente para a peça: ${pecaId}`);
            }

            const preco = Number(peca.preco_venda);
            const subtotalCentavos = Math.round(preco * 100) * qtd;
            const subtotal = subtotalCentavos / 100;
            valorTotalCentavos += subtotalCentavos;

            await conexao.query(
                `INSERT INTO ordem_servico_pecas
                (ordem_servico_id, peca_id, quantidade, preco, subtotal)
                VALUES (?, ?, ?, ?, ?)`,
                [ordemId, pecaId, qtd, preco, subtotal]
            );

            await conexao.query(
                `UPDATE pecas SET quantidade = quantidade - ? WHERE id = ?`,
                [qtd, pecaId]
            );
        }


        // ==========================================
        // 5. ADICIONAR SERVIÇOS
        // ==========================================

        for (const item of servicos) {
            const qtd = Number(item.quantidade) || 1;
            const servicoId = Number(item.servico_id);

            if (!servicoId) continue;

            const [servicosEncontrados] = await conexao.query(
                `SELECT preco FROM servicos WHERE id = ?`,
                [servicoId]
            );

            if (servicosEncontrados.length === 0) {
                throw new Error(`Serviço ${servicoId} não encontrado`);
            }

            const preco = Number(servicosEncontrados[0].preco);
            const subtotalCentavos = Math.round(preco * 100) * qtd;
            const subtotal = subtotalCentavos / 100;
            valorTotalCentavos += subtotalCentavos;

            await conexao.query(
                `INSERT INTO ordem_servico_servicos
                (ordem_servico_id, servico_id, quantidade, preco, subtotal)
                VALUES (?, ?, ?, ?, ?)`,
                [ordemId, servicoId, qtd, preco, subtotal]
            );
        }


        // ==========================================
        // 6. ATUALIZA VALOR TOTAL DA OS
        // ==========================================

        await conexao.query(
            `UPDATE ordens_servico SET valor_total = ? WHERE id = ?`,
            [valorTotalCentavos / 100, ordemId]
        );


        await conexao.commit();


        // ==========================================
        // 7. RESPOSTA
        // ==========================================

        res.status(201).json({
            mensagem: "Ordem de serviço criada com sucesso",
            id: ordemId,
            cliente_id: clienteId,
            veiculo_id: veiculoId,
            valor_total: valorTotalCentavos / 100,
            valor_adicional: valorAdicionalCentavos / 100,
            servicos_adicionais: servicosAdicionaisValidos.map((item) => ({
                descricao: item.descricao,
                valor: item.valorCentavos / 100
            }))
        });

    } catch (error) {

        await conexao.rollback();

        console.error("Erro ao criar ordem de serviço:", error);

        res.status(500).json({
            mensagem: error.message || "Erro ao criar ordem de serviço"
        });
    } finally {
        conexao.release();
    }
};


// ==========================================
// BUSCAR ORDEM DE SERVIÇO
// ==========================================

const buscarOrdemServico = async (req, res) => {
    try {

        const { id } = req.params;

        const [ordens] = await pool.query(
            `
            SELECT
                os.*,
                c.nome AS cliente_nome,
                c.telefone AS cliente_telefone,
                c.whatsapp AS cliente_whatsapp,
                c.endereco AS cliente_endereco,
                v.placa,
                v.marca,
                v.modelo,
                v.ano,
                v.cor
            FROM ordens_servico os
            INNER JOIN clientes c ON os.cliente_id = c.id
            INNER JOIN veiculos v ON os.veiculo_id = v.id
            WHERE os.id = ?
            `,
            [id]
        );


        if (ordens.length === 0) {
            return res.status(404).json({
                mensagem: "Ordem de serviço não encontrada"
            });
        }


        const [servicosAdicionais] = await pool.query(
            `SELECT id, descricao, valor
             FROM ordem_servico_adicionais
             WHERE ordem_servico_id = ?
             ORDER BY id`,
            [id]
        );

        res.json({
            ...ordens[0],
            servicos_adicionais: servicosAdicionais
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao buscar ordem de serviço"
        });
    }
};


// ==========================================
// ATUALIZAR ORDEM DE SERVIÇO
// ==========================================

const atualizarOrdemServico = async (req, res) => {
    try {

        const { id } = req.params;

        const {
            problema_relatado,
            diagnostico,
            observacoes,
            quilometragem,
            status,
            valor_total,
            nome,
            telefone,
            whatsapp,
            endereco,
            placa,
            marca,
            modelo,
            ano,
            cor
        } = req.body;


        // ==========================================
        // BUSCA A OS ATUAL (PRA SABER O STATUS ANTERIOR E IDs)
        // ==========================================

        const [ordensAtuais] = await pool.query(
            `SELECT oficina_id, status, cliente_id, veiculo_id
             FROM ordens_servico
             WHERE id = ?`,
            [id]
        );

        if (ordensAtuais.length === 0) {
            return res.status(404).json({
                mensagem: "Ordem de serviço não encontrada"
            });
        }

        const statusAnterior = ordensAtuais[0].status;
        const oficinaId = ordensAtuais[0].oficina_id;
        const clienteId = ordensAtuais[0].cliente_id;
        const veiculoId = ordensAtuais[0].veiculo_id;


        // ==========================================
        // ATUALIZAR CLIENTE SE FORNECIDO
        // ==========================================

        if (
            nome !== undefined ||
            telefone !== undefined ||
            whatsapp !== undefined ||
            endereco !== undefined
        ) {
            await pool.query(
                `UPDATE clientes
                 SET nome = COALESCE(?, nome),
                     telefone = COALESCE(?, telefone),
                     whatsapp = COALESCE(?, whatsapp),
                     endereco = COALESCE(?, endereco)
                 WHERE id = ?`,
                [
                    nome ?? null,
                    telefone ?? null,
                    whatsapp ?? null,
                    endereco ?? null,
                    clienteId
                ]
            );
        }


        // ==========================================
        // ATUALIZAR VEÍCULO SE FORNECIDO
        // ==========================================

        if (
            placa !== undefined ||
            marca !== undefined ||
            modelo !== undefined ||
            ano !== undefined ||
            cor !== undefined
        ) {
            await pool.query(
                `UPDATE veiculos
                 SET placa = COALESCE(?, placa),
                     marca = COALESCE(?, marca),
                     modelo = COALESCE(?, modelo),
                     ano = COALESCE(?, ano),
                     cor = COALESCE(?, cor)
                 WHERE id = ?`,
                [
                    placa ?? null,
                    marca ?? null,
                    modelo ?? null,
                    ano !== undefined && ano !== "" ? Number(ano) : null,
                    cor ?? null,
                    veiculoId
                ]
            );
        }


        const [resultado] = await pool.query(
            `
            UPDATE ordens_servico

            SET problema_relatado = ?,
                diagnostico = ?,
                observacoes = ?,
                quilometragem = ?,
                status = ?,
                valor_total = ?

            WHERE id = ?
            `,
            [
                problema_relatado || null,
                diagnostico || null,
                observacoes || null,
                quilometragem || 0,
                status,
                Number(valor_total) || 0,
                id
            ]
        );


        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Ordem de serviço não encontrada"
            });
        }


        // Lembretes são criados quando a OS é concluída.
        if (status === "concluida" && statusAnterior !== "concluida") {
            // Buscar serviços da OS que precisam de lembrete
            const [servicosOS] = await pool.query(
                `SELECT s.*, oss.quantidade
                 FROM ordem_servico_servicos oss
                 INNER JOIN servicos s ON oss.servico_id = s.id
                 WHERE oss.ordem_servico_id = ?
                 AND s.precisa_lembrete = true`,
                [id]
            );

            // Buscar dados da OS para criar lembretes
            const [dadosOS] = await pool.query(
                `SELECT cliente_id, veiculo_id, data_abertura
                 FROM ordens_servico
                 WHERE id = ?`,
                [id]
            );

            if (dadosOS.length > 0) {
                const osData = dadosOS[0];
                const dataOS = new Date(osData.data_abertura);

                for (const servico of servicosOS) {
                    // Calcular data de retorno baseado na configuração do serviço
                    let diasAdicionar = 0;
                    
                    if (servico.lembrete_intervalo_tipo === 'dia') {
                        diasAdicionar = servico.lembrete_intervalo_quantidade || 0;
                    } else if (servico.lembrete_intervalo_tipo === 'mes') {
                        diasAdicionar = (servico.lembrete_intervalo_quantidade || 0) * 30;
                    } else if (servico.lembrete_intervalo_tipo === 'ano') {
                        diasAdicionar = (servico.lembrete_intervalo_quantidade || 0) * 365;
                    }

                    if (diasAdicionar > 0) {
                        const dataRetorno = new Date(dataOS);
                        dataRetorno.setDate(dataRetorno.getDate() + diasAdicionar);

                        const antecedencia = servico.lembrete_antecedencia_dias || 7;
                        const dataLembrete = new Date(dataRetorno);
                        dataLembrete.setDate(dataLembrete.getDate() - antecedencia);

                        await pool.query(
                            `INSERT INTO lembretes
                            (oficina_id, cliente_id, veiculo_id, ordem_servico_id, servico_id, motivo, data_retorno, data_lembrete, status)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendente')`,
                            [
                                oficinaId,
                                osData.cliente_id,
                                osData.veiculo_id,
                                id,
                                servico.id,
                                servico.nome,
                                dataRetorno.toISOString().split('T')[0],
                                dataLembrete.toISOString().split('T')[0]
                            ]
                        );
                    }
                }
            }
        }

        // Gerar lançamento financeiro quando a OS é finalizada
        if (status === "finalizada" && statusAnterior !== "finalizada") {
            // Buscar categoria "Serviços"
            const [categorias] = await pool.query(
                `SELECT id FROM categorias_financeiras
                 WHERE oficina_id = ? AND nome = 'Serviços' AND tipo = 'entrada'
                 LIMIT 1`,
                [oficinaId]
            );

            const categoriaId = categorias.length > 0 ? categorias[0].id : null;

            // Verificar se já existe lançamento para esta OS
            const [lancamentoExistente] = await pool.query(
                `SELECT id FROM lancamentos
                 WHERE ordem_servico_id = ? AND oficina_id = ?
                 LIMIT 1`,
                [id, oficinaId]
            );

            // Só cria se não existir lançamento
            if (lancamentoExistente.length === 0 && valor_total > 0) {
                await pool.query(
                    `INSERT INTO lancamentos
                    (oficina_id, tipo, descricao, categoria_id, ordem_servico_id, cliente_id, valor, vencimento, status, criado_em, atualizado_em)
                    VALUES (?, 'entrada', ?, ?, ?, ?, ?, CURDATE(), 'aberto', NOW(), NOW())`,
                    [
                        oficinaId,
                        `Ordem de Serviço #${id}`,
                        categoriaId,
                        id,
                        clienteId,
                        Number(valor_total)
                    ]
                );
            }
        }

        // Atualizar lançamento financeiro se o valor mudar depois de finalizada
        if (
            (status === "concluida" || status === "finalizada") &&
            (statusAnterior === "concluida" || statusAnterior === "finalizada")
        ) {
            // Verificar se existe lançamento vinculado
            const [lancamento] = await pool.query(
                `SELECT id FROM lancamentos
                 WHERE ordem_servico_id = ? AND oficina_id = ?
                 LIMIT 1`,
                [id, oficinaId]
            );

            if (lancamento.length > 0) {
                await pool.query(
                    `UPDATE lancamentos
                     SET valor = ?,
                         descricao = ?,
                         atualizado_em = NOW()
                     WHERE id = ?`,
                    [
                        Number(valor_total) || 0,
                        `Ordem de Serviço #${id}`,
                        lancamento[0].id
                    ]
                );
            }
        }

        res.json({
            mensagem: "Ordem de serviço atualizada com sucesso"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao atualizar ordem de serviço"
        });
    }
};


// ==========================================
// EXCLUIR ORDEM DE SERVIÇO
// ==========================================

const excluirOrdemServico = async (req, res) => {
    try {

        const { id } = req.params;

        await pool.query(
            "DELETE FROM transacoes WHERE ordem_servico_id = ?",
            [id]
        );

        const [resultado] = await pool.query(
            "DELETE FROM ordens_servico WHERE id = ?",
            [id]
        );


        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Ordem de serviço não encontrada"
            });
        }


        res.json({
            mensagem: "Ordem de serviço excluída com sucesso"
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao excluir ordem de serviço"
        });
    }
};


// ==========================================
// EXPORTAÇÕES
// ==========================================

module.exports = {
    listarOrdensServico,
    criarOrdemServico,
    buscarOrdemServico,
    atualizarOrdemServico,
    excluirOrdemServico
};