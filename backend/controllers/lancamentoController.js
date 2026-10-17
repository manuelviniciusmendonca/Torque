const pool = require("../config/db");
const { getOficinaId } = require("../helpers/oficinaHelper");
const { v4: uuidv4 } = require("uuid");

// Converter valor para centavos para evitar problemas de float
const toCentavos = (valor) => Math.round(valor * 100);
const fromCentavos = (centavos) => centavos / 100;

// Listar lançamentos
const listarLancamentos = async (req, res) => {
    try {
        const oficinaId = getOficinaId(req);
        const {
            tipo,
            status,
            de,
            ate,
            categoria_id,
            cliente_id,
            busca,
            excluir_compras_pecas,
            pagina = 1,
            por_pagina = 20
        } = req.query;

        let query = `
            SELECT 
                l.*,
                c.nome as categoria_nome,
                cl.nome as cliente_nome,
                cl.telefone as cliente_telefone,
                v.placa as veiculo_placa,
                cp.peca_nome as peca_comprada_nome,
                cp.peca_codigo as peca_comprada_codigo,
                cp.quantidade as peca_comprada_quantidade,
                cp.valor_unitario as peca_comprada_valor_unitario,
                cp.valor_total as peca_comprada_valor_total,
                (
                    SELECT COALESCE(SUM(p.valor), 0)
                    FROM pagamentos p
                    WHERE p.lancamento_id = l.id AND p.estornado = FALSE
                ) as valor_pago
            FROM lancamentos l
            LEFT JOIN categorias_financeiras c ON l.categoria_id = c.id
            LEFT JOIN clientes cl ON l.cliente_id = cl.id
            LEFT JOIN ordens_servico os ON l.ordem_servico_id = os.id
            LEFT JOIN veiculos v ON os.veiculo_id = v.id
            LEFT JOIN compras_pecas cp ON cp.lancamento_id = l.id
            WHERE l.oficina_id = ?
        `;
        const params = [oficinaId];

        if (excluir_compras_pecas === "true") {
            query += ` AND NOT EXISTS (
                SELECT 1 FROM compras_pecas cp
                WHERE cp.lancamento_id = l.id AND cp.oficina_id = ?
            )`;
            params.push(oficinaId);
        }

        if (tipo) {
            query += ` AND l.tipo = ?`;
            params.push(tipo);
        }

        if (status) {
            query += ` AND l.status = ?`;
            params.push(status);
        }

        if (de) {
            query += ` AND l.vencimento >= ?`;
            params.push(de);
        }

        if (ate) {
            query += ` AND l.vencimento <= ?`;
            params.push(ate);
        }

        if (categoria_id) {
            query += ` AND l.categoria_id = ?`;
            params.push(categoria_id);
        }

        if (cliente_id) {
            query += ` AND l.cliente_id = ?`;
            params.push(cliente_id);
        }

        if (busca) {
            query += ` AND (l.descricao LIKE ? OR cl.nome LIKE ? OR v.placa LIKE ?)`;
            const buscaTerm = `%${busca}%`;
            params.push(buscaTerm, buscaTerm, buscaTerm);
        }

        const offset = (pagina - 1) * por_pagina;
        query += ` ORDER BY l.vencimento DESC, l.criado_em DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(por_pagina), offset);

        const [lancamentos] = await pool.query(query, params);

        // Calcular saldo para cada lançamento
        const lancamentosComSaldo = lancamentos.map(l => ({
            ...l,
            saldo: parseFloat(l.valor) - parseFloat(l.valor_pago)
        }));

        // Contar total para paginação
        let countQuery = `
            SELECT COUNT(*) as total
            FROM lancamentos l
            WHERE l.oficina_id = ?
        `;
        const countParams = [oficinaId];

        if (excluir_compras_pecas === "true") {
            countQuery += ` AND NOT EXISTS (
                SELECT 1 FROM compras_pecas cp
                WHERE cp.lancamento_id = l.id AND cp.oficina_id = ?
            )`;
            countParams.push(oficinaId);
        }

        if (tipo) {
            countQuery += ` AND l.tipo = ?`;
            countParams.push(tipo);
        }

        if (status) {
            if (status === 'atrasado') {
                countQuery += ` AND l.status IN ('aberto', 'parcial') AND l.vencimento < CURDATE()`;
            } else {
                countQuery += ` AND l.status = ?`;
                countParams.push(status);
            }
        }

        if (de) {
            countQuery += ` AND l.vencimento >= ?`;
            countParams.push(de);
        }

        if (ate) {
            countQuery += ` AND l.vencimento <= ?`;
            countParams.push(ate);
        }

        if (categoria_id) {
            countQuery += ` AND l.categoria_id = ?`;
            countParams.push(categoria_id);
        }

        if (cliente_id) {
            countQuery += ` AND l.cliente_id = ?`;
            countParams.push(cliente_id);
        }

        if (busca) {
            countQuery += ` AND (l.descricao LIKE ? OR EXISTS (
                SELECT 1 FROM clientes cl WHERE cl.id = l.cliente_id AND cl.nome LIKE ?
            ) OR EXISTS (
                SELECT 1 FROM ordens_servico os 
                JOIN veiculos v ON os.veiculo_id = v.id
                WHERE os.id = l.ordem_servico_id AND v.placa LIKE ?
            ))`;
            const buscaTerm = `%${busca}%`;
            countParams.push(buscaTerm, buscaTerm, buscaTerm);
        }

        const [countResult] = await pool.query(countQuery, countParams);

        res.json({
            lancamentos: lancamentosComSaldo,
            total: countResult[0].total,
            pagina: parseInt(pagina),
            por_pagina: parseInt(por_pagina)
        });
    } catch (error) {
        console.error("Erro ao listar lançamentos:", error);
        res.status(500).json({ mensagem: "Erro ao listar lançamentos" });
    }
};

// Criar lançamento avulso
const criarLancamento = async (req, res) => {
    const conexao = await pool.getConnection();
    
    try {
        await conexao.beginTransaction();
        
        const oficinaId = getOficinaId(req);
        const {
            tipo,
            descricao,
            categoria_id,
            cliente_id,
            fornecedor,
            valor,
            vencimento,
            parcelas
        } = req.body;

        if (!tipo || !descricao || !valor || !vencimento) {
            await conexao.rollback();
            return res.status(400).json({ mensagem: "Tipo, descrição, valor e vencimento são obrigatórios" });
        }

        if (!['entrada', 'saida'].includes(tipo)) {
            await conexao.rollback();
            return res.status(400).json({ mensagem: "Tipo deve ser 'entrada' ou 'saida'" });
        }

        const valorFloat = parseFloat(valor);
        if (isNaN(valorFloat) || valorFloat <= 0) {
            await conexao.rollback();
            return res.status(400).json({ mensagem: "Valor deve ser um número positivo" });
        }

        // Se não tiver parcelas, cria um único lançamento
        if (!parcelas || parcelas <= 1) {
            const [result] = await conexao.query(
                `INSERT INTO lancamentos 
                (oficina_id, tipo, descricao, categoria_id, cliente_id, fornecedor, valor, vencimento, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aberto')`,
                [oficinaId, tipo, descricao, categoria_id || null, cliente_id || null, fornecedor || null, valorFloat, vencimento]
            );

            await conexao.commit();
            
            const [novoLancamento] = await conexao.query(
                `SELECT * FROM lancamentos WHERE id = ?`,
                [result.insertId]
            );

            res.status(201).json(novoLancamento[0]);
        } else {
            // Criar parcelas
            const grupoParcelas = uuidv4();
            const valorPorParcela = valorFloat / parcelas;
            const lancamentosCriados = [];

            for (let i = 0; i < parcelas; i++) {
                // A última parcela absorve o centavo restante
                const valorParcela = i === parcelas - 1 
                    ? valorFloat - (valorPorParcela * (parcelas - 1))
                    : valorPorParcela;

                // Calcular vencimento mensal
                const dataVencimento = new Date(vencimento);
                dataVencimento.setMonth(dataVencimento.getMonth() + i);

                const [result] = await conexao.query(
                    `INSERT INTO lancamentos 
                    (oficina_id, tipo, descricao, categoria_id, cliente_id, fornecedor, valor, vencimento, status, parcela_numero, parcela_total, grupo_parcelas)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'aberto', ?, ?, ?)`,
                    [oficinaId, tipo, descricao, categoria_id || null, cliente_id || null, fornecedor || null, valorParcela, dataVencimento.toISOString().split('T')[0], i + 1, parcelas, grupoParcelas]
                );

                lancamentosCriados.push(result.insertId);
            }

            await conexao.commit();

            const [lancamentosDetalhes] = await conexao.query(
                `SELECT * FROM lancamentos WHERE id IN (${lancamentosCriados.join(',')})`
            );

            res.status(201).json(lancamentosDetalhes);
        }
    } catch (error) {
        await conexao.rollback();
        console.error("Erro ao criar lançamento:", error);
        res.status(500).json({ mensagem: "Erro ao criar lançamento" });
    } finally {
        conexao.release();
    }
};

// Obter lançamento por ID
const obterLancamento = async (req, res) => {
    try {
        const oficinaId = getOficinaId(req);
        const { id } = req.params;

        const [lancamentos] = await pool.query(
            `SELECT 
                l.*,
                c.nome as categoria_nome,
                cl.nome as cliente_nome,
                cl.telefone as cliente_telefone,
                v.placa as veiculo_placa
            FROM lancamentos l
            LEFT JOIN categorias_financeiras c ON l.categoria_id = c.id
            LEFT JOIN clientes cl ON l.cliente_id = cl.id
            LEFT JOIN ordens_servico os ON l.ordem_servico_id = os.id
            LEFT JOIN veiculos v ON os.veiculo_id = v.id
            WHERE l.id = ? AND l.oficina_id = ?`,
            [id, oficinaId]
        );

        if (lancamentos.length === 0) {
            return res.status(404).json({ mensagem: "Lançamento não encontrado" });
        }

        const lancamento = lancamentos[0];

        // Obter pagamentos
        const [pagamentos] = await pool.query(
            `SELECT * FROM pagamentos WHERE lancamento_id = ? ORDER BY data_pagamento DESC`,
            [id]
        );

        // Calcular saldo
        const valorPago = pagamentos.reduce((sum, p) => p.estornado ? sum : sum + parseFloat(p.valor), 0);
        lancamento.saldo = parseFloat(lancamento.valor) - valorPago;
        lancamento.pagamentos = pagamentos;

        res.json(lancamento);
    } catch (error) {
        console.error("Erro ao obter lançamento:", error);
        res.status(500).json({ mensagem: "Erro ao obter lançamento" });
    }
};

// Atualizar lançamento (só vencimento e descrição para lançamentos de OS)
const atualizarLancamento = async (req, res) => {
    try {
        const oficinaId = getOficinaId(req);
        const { id } = req.params;
        const { descricao, vencimento } = req.body;

        // Verificar se o lançamento existe e pertence à oficina
        const [lancamentos] = await pool.query(
            `SELECT * FROM lancamentos WHERE id = ? AND oficina_id = ?`,
            [id, oficinaId]
        );

        if (lancamentos.length === 0) {
            return res.status(404).json({ mensagem: "Lançamento não encontrado" });
        }

        const lancamento = lancamentos[0];

        // Se for lançamento de OS, só permite editar vencimento e descrição
        if (lancamento.ordem_servico_id) {
            const updates = [];
            const params = [];

            if (descricao !== undefined) {
                updates.push("descricao = ?");
                params.push(descricao);
            }

            if (vencimento !== undefined) {
                updates.push("vencimento = ?");
                params.push(vencimento);
            }

            if (updates.length === 0) {
                return res.status(400).json({ mensagem: "Nenhum campo para atualizar" });
            }

            params.push(id, oficinaId);

            await pool.query(
                `UPDATE lancamentos SET ${updates.join(", ")} WHERE id = ? AND oficina_id = ?`,
                params
            );

            res.json({ mensagem: "Lançamento atualizado com sucesso" });
        } else {
            // Lançamento avulso não pode ser editado
            return res.status(400).json({ mensagem: "Lançamento avulso não pode ser editado. Cancele e crie um novo." });
        }
    } catch (error) {
        console.error("Erro ao atualizar lançamento:", error);
        res.status(500).json({ mensagem: "Erro ao atualizar lançamento" });
    }
};

// Cancelar lançamento
const cancelarLancamento = async (req, res) => {
    const conexao = await pool.getConnection();
    
    try {
        await conexao.beginTransaction();
        
        const oficinaId = getOficinaId(req);
        const { id } = req.params;
        const { motivo } = req.body;

        if (!motivo) {
            await conexao.rollback();
            return res.status(400).json({ mensagem: "Motivo do cancelamento é obrigatório" });
        }

        // Verificar se o lançamento existe e pertence à oficina
        const [lancamentos] = await conexao.query(
            `SELECT * FROM lancamentos WHERE id = ? AND oficina_id = ? FOR UPDATE`,
            [id, oficinaId]
        );

        if (lancamentos.length === 0) {
            await conexao.rollback();
            return res.status(404).json({ mensagem: "Lançamento não encontrado" });
        }

        const lancamento = lancamentos[0];

        // Verificar se há pagamentos ativos
        const [pagamentos] = await conexao.query(
            `SELECT COUNT(*) as count FROM pagamentos WHERE lancamento_id = ? AND estornado = FALSE`,
            [id]
        );

        if (pagamentos[0].count > 0) {
            await conexao.rollback();
            return res.status(400).json({ mensagem: "Não é possível cancelar lançamento com pagamentos ativos. Estorne os pagamentos primeiro." });
        }

        // Cancelar o lançamento
        await conexao.query(
            `UPDATE lancamentos SET status = 'cancelado', cancelado_em = NOW(), motivo_cancelamento = ? WHERE id = ?`,
            [motivo, id]
        );

        await conexao.commit();
        res.json({ mensagem: "Lançamento cancelado com sucesso" });
    } catch (error) {
        await conexao.rollback();
        console.error("Erro ao cancelar lançamento:", error);
        res.status(500).json({ mensagem: "Erro ao cancelar lançamento" });
    } finally {
        conexao.release();
    }
};

module.exports = {
    listarLancamentos,
    criarLancamento,
    obterLancamento,
    atualizarLancamento,
    cancelarLancamento
};
