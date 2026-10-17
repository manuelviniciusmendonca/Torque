const pool = require("../config/db");

// ==========================================
// LISTAR LEMBRETES
// ==========================================

const listarLembretes = async (req, res) => {
    try {
        const { oficina_id } = req.query;

        if (!oficina_id) {
            return res.status(400).json({
                mensagem: "oficina_id é obrigatório"
            });
        }

        const [lembretes] = await pool.query(`
            SELECT
                l.*,
                c.nome AS cliente_nome,
                c.telefone AS cliente_telefone,
                c.whatsapp AS cliente_whatsapp,
                v.placa,
                v.marca,
                v.modelo,
                os.data_abertura AS os_data,
                s.nome AS servico_nome
            FROM lembretes l
            INNER JOIN clientes c ON l.cliente_id = c.id
            INNER JOIN veiculos v ON l.veiculo_id = v.id
            INNER JOIN ordens_servico os ON l.ordem_servico_id = os.id
            LEFT JOIN servicos s ON l.servico_id = s.id
            WHERE l.oficina_id = ?
            ORDER BY l.data_retorno ASC
        `, [oficina_id]);

        // Atualizar status baseado na data atual
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const lembretesAtualizados = lembretes.map(lembrete => {
            const dataRetorno = new Date(lembrete.data_retorno);
            const dataLembrete = new Date(lembrete.data_lembrete);
            
            // Só atualizar status se ainda não estiver concluído ou cancelado
            if (lembrete.status !== 'concluido' && lembrete.status !== 'cancelado') {
                if (dataLembrete <= hoje) {
                    if (dataRetorno < hoje) {
                        lembrete.status = 'vencido';
                    } else {
                        lembrete.status = 'proximo';
                    }
                } else {
                    lembrete.status = 'pendente';
                }
            }
            
            return lembrete;
        });

        res.json(lembretesAtualizados);

    } catch (error) {
        console.error("Erro ao listar lembretes:", error);
        res.status(500).json({
            mensagem: "Erro ao listar lembretes"
        });
    }
};

// ==========================================
// LISTAR RESUMO DE LEMBRETES
// ==========================================

const listarResumoLembretes = async (req, res) => {
    try {
        const { oficina_id } = req.query;

        if (!oficina_id) {
            return res.status(400).json({
                mensagem: "oficina_id é obrigatório"
            });
        }

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const [total] = await pool.query(`
            SELECT COUNT(*) as total
            FROM lembretes
            WHERE oficina_id = ?
            AND status NOT IN ('concluido', 'cancelado')
        `, [oficina_id]);

        const [hojeData] = await pool.query(`
            SELECT COUNT(*) as total
            FROM lembretes
            WHERE oficina_id = ?
            AND DATE(data_lembrete) = CURDATE()
            AND status NOT IN ('concluido', 'cancelado')
        `, [oficina_id]);

        const [proximos] = await pool.query(`
            SELECT COUNT(*) as total
            FROM lembretes
            WHERE oficina_id = ?
            AND DATE(data_lembrete) > CURDATE()
            AND DATE(data_lembrete) <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
            AND status NOT IN ('concluido', 'cancelado')
        `, [oficina_id]);

        const [atrasados] = await pool.query(`
            SELECT COUNT(*) as total
            FROM lembretes
            WHERE oficina_id = ?
            AND DATE(data_retorno) < CURDATE()
            AND status NOT IN ('concluido', 'cancelado')
        `, [oficina_id]);

        res.json({
            total: total[0].total,
            hoje: hojeData[0].total,
            proximos: proximos[0].total,
            atrasados: atrasados[0].total
        });

    } catch (error) {
        console.error("Erro ao listar resumo de lembretes:", error);
        res.status(500).json({
            mensagem: "Erro ao listar resumo de lembretes"
        });
    }
};

// ==========================================
// CRIAR LEMBRETE
// ==========================================

const criarLembrete = async (req, res) => {
    try {
        const {
            oficina_id,
            cliente_id,
            veiculo_id,
            ordem_servico_id,
            servico_id,
            motivo,
            intervalo_dias,
            antecedencia_dias,
            data_retorno_personalizada
        } = req.body;

        if (!oficina_id || !cliente_id || !veiculo_id || !ordem_servico_id || !motivo) {
            return res.status(400).json({
                mensagem: "oficina_id, cliente_id, veiculo_id, ordem_servico_id e motivo são obrigatórios"
            });
        }

        // Validar que cliente, veículo e OS pertencem à oficina
        const [clienteCheck] = await pool.query(
            "SELECT id FROM clientes WHERE id = ? AND oficina_id = ?",
            [cliente_id, oficina_id]
        );

        if (clienteCheck.length === 0) {
            return res.status(400).json({
                mensagem: "Cliente não pertence a esta oficina"
            });
        }

        const [veiculoCheck] = await pool.query(
            "SELECT id FROM veiculos WHERE id = ? AND oficina_id = ?",
            [veiculo_id, oficina_id]
        );

        if (veiculoCheck.length === 0) {
            return res.status(400).json({
                mensagem: "Veículo não pertence a esta oficina"
            });
        }

        const [osCheck] = await pool.query(
            "SELECT id, data_abertura FROM ordens_servico WHERE id = ? AND oficina_id = ?",
            [ordem_servico_id, oficina_id]
        );

        if (osCheck.length === 0) {
            return res.status(400).json({
                mensagem: "Ordem de serviço não pertence a esta oficina"
            });
        }

        // Calcular datas
        const dataOS = new Date(osCheck[0].data_abertura);
        let dataRetorno;

        if (data_retorno_personalizada) {
            dataRetorno = new Date(data_retorno_personalizada);
        } else if (intervalo_dias) {
            dataRetorno = new Date(dataOS);
            dataRetorno.setDate(dataRetorno.getDate() + parseInt(intervalo_dias));
        } else {
            // Padrão: 6 meses
            dataRetorno = new Date(dataOS);
            dataRetorno.setMonth(dataRetorno.getMonth() + 6);
        }

        const antecedencia = antecedencia_dias ? parseInt(antecedencia_dias) : 7;
        const dataLembrete = new Date(dataRetorno);
        dataLembrete.setDate(dataLembrete.getDate() - antecedencia);

        const [resultado] = await pool.query(`
            INSERT INTO lembretes
            (oficina_id, cliente_id, veiculo_id, ordem_servico_id, servico_id, motivo, data_retorno, data_lembrete, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pendente')
        `, [
            oficina_id,
            cliente_id,
            veiculo_id,
            ordem_servico_id,
            servico_id || null,
            motivo,
            dataRetorno.toISOString().split('T')[0],
            dataLembrete.toISOString().split('T')[0]
        ]);

        res.status(201).json({
            mensagem: "Lembrete criado com sucesso",
            id: resultado.insertId,
            data_retorno: dataRetorno.toISOString().split('T')[0],
            data_lembrete: dataLembrete.toISOString().split('T')[0]
        });

    } catch (error) {
        console.error("Erro ao criar lembrete:", error);
        res.status(500).json({
            mensagem: "Erro ao criar lembrete"
        });
    }
};

// ==========================================
// BUSCAR LEMBRETE
// ==========================================

const buscarLembrete = async (req, res) => {
    try {
        const { id } = req.params;

        const [lembretes] = await pool.query(`
            SELECT
                l.*,
                c.nome AS cliente_nome,
                c.telefone AS cliente_telefone,
                c.whatsapp AS cliente_whatsapp,
                v.placa,
                v.marca,
                v.modelo,
                os.data_abertura AS os_data,
                s.nome AS servico_nome
            FROM lembretes l
            INNER JOIN clientes c ON l.cliente_id = c.id
            INNER JOIN veiculos v ON l.veiculo_id = v.id
            INNER JOIN ordens_servico os ON l.ordem_servico_id = os.id
            LEFT JOIN servicos s ON l.servico_id = s.id
            WHERE l.id = ?
        `, [id]);

        if (lembretes.length === 0) {
            return res.status(404).json({
                mensagem: "Lembrete não encontrado"
            });
        }

        res.json(lembretes[0]);

    } catch (error) {
        console.error("Erro ao buscar lembrete:", error);
        res.status(500).json({
            mensagem: "Erro ao buscar lembrete"
        });
    }
};

// ==========================================
// ATUALIZAR LEMBRETE
// ==========================================

const atualizarLembrete = async (req, res) => {
    try {
        const { id } = req.params;
        const { motivo, data_retorno, antecedencia_dias, status } = req.body;

        // Buscar lembrete atual
        const [lembretesAtuais] = await pool.query(
            "SELECT * FROM lembretes WHERE id = ?",
            [id]
        );

        if (lembretesAtuais.length === 0) {
            return res.status(404).json({
                mensagem: "Lembrete não encontrado"
            });
        }

        const lembreteAtual = lembretesAtuais[0];

        // Calcular nova data de lembrete se data_retorno foi alterada
        let dataLembrete = lembreteAtual.data_lembrete;
        if (data_retorno) {
            const antecedencia = antecedencia_dias ? parseInt(antecedencia_dias) : 7;
            const novaDataRetorno = new Date(data_retorno);
            const novaDataLembrete = new Date(novaDataRetorno);
            novaDataLembrete.setDate(novaDataLembrete.getDate() - antecedencia);
            dataLembrete = novaDataLembrete.toISOString().split('T')[0];
        }

        const [resultado] = await pool.query(`
            UPDATE lembretes
            SET motivo = ?,
                data_retorno = COALESCE(?, data_retorno),
                data_lembrete = ?,
                status = COALESCE(?, status)
            WHERE id = ?
        `, [
            motivo || lembreteAtual.motivo,
            data_retorno || null,
            dataLembrete,
            status || lembreteAtual.status,
            id
        ]);

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Lembrete não encontrado"
            });
        }

        res.json({
            mensagem: "Lembrete atualizado com sucesso"
        });

    } catch (error) {
        console.error("Erro ao atualizar lembrete:", error);
        res.status(500).json({
            mensagem: "Erro ao atualizar lembrete"
        });
    }
};

// ==========================================
// CONCLUIR LEMBRETE
// ==========================================

const concluirLembrete = async (req, res) => {
    try {
        const { id } = req.params;

        const [resultado] = await pool.query(
            "UPDATE lembretes SET status = 'concluido' WHERE id = ?",
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Lembrete não encontrado"
            });
        }

        res.json({
            mensagem: "Lembrete concluído com sucesso"
        });

    } catch (error) {
        console.error("Erro ao concluir lembrete:", error);
        res.status(500).json({
            mensagem: "Erro ao concluir lembrete"
        });
    }
};

// ==========================================
// CANCELAR LEMBRETE
// ==========================================

const cancelarLembrete = async (req, res) => {
    try {
        const { id } = req.params;

        const [resultado] = await pool.query(
            "UPDATE lembretes SET status = 'cancelado' WHERE id = ?",
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Lembrete não encontrado"
            });
        }

        res.json({
            mensagem: "Lembrete cancelado com sucesso"
        });

    } catch (error) {
        console.error("Erro ao cancelar lembrete:", error);
        res.status(500).json({
            mensagem: "Erro ao cancelar lembrete"
        });
    }
};

// ==========================================
// EXCLUIR LEMBRETE
// ==========================================

const excluirLembrete = async (req, res) => {
    try {
        const { id } = req.params;

        const [resultado] = await pool.query(
            "DELETE FROM lembretes WHERE id = ?",
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Lembrete não encontrado"
            });
        }

        res.json({
            mensagem: "Lembrete excluído com sucesso"
        });

    } catch (error) {
        console.error("Erro ao excluir lembrete:", error);
        res.status(500).json({
            mensagem: "Erro ao excluir lembrete"
        });
    }
};

module.exports = {
    listarLembretes,
    listarResumoLembretes,
    criarLembrete,
    buscarLembrete,
    atualizarLembrete,
    concluirLembrete,
    cancelarLembrete,
    excluirLembrete
};