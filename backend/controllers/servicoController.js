const pool = require("../config/db");

const listarServicos = async (req, res) => {
    try {
        const [servicos] = await pool.query(
            "SELECT * FROM servicos ORDER BY id DESC"
        );

        res.json(servicos);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao listar serviços"
        });
    }
};

const criarServico = async (req, res) => {
    try {
        const {
            oficina_id,
            nome,
            descricao,
            preco,
            precisa_lembrete,
            lembrete_intervalo_tipo,
            lembrete_intervalo_quantidade,
            lembrete_antecedencia_dias
        } = req.body;

        if (!oficina_id || !nome || preco === undefined) {
            return res.status(400).json({
                mensagem: "oficina_id, nome e preco são obrigatórios"
            });
        }

        const [resultado] = await pool.query(
            `INSERT INTO servicos
            (oficina_id, nome, descricao, preco, precisa_lembrete, lembrete_intervalo_tipo, lembrete_intervalo_quantidade, lembrete_antecedencia_dias)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                oficina_id,
                nome,
                descricao,
                preco,
                precisa_lembrete || false,
                lembrete_intervalo_tipo || null,
                lembrete_intervalo_quantidade || null,
                lembrete_antecedencia_dias ?? 7
            ]
        );

        res.status(201).json({
            mensagem: "Serviço criado com sucesso",
            id: resultado.insertId
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao criar serviço"
        });
    }
};

const buscarServico = async (req, res) => {
    try {
        const { id } = req.params;

        const [servicos] = await pool.query(
            "SELECT * FROM servicos WHERE id = ?",
            [id]
        );

        if (servicos.length === 0) {
            return res.status(404).json({
                mensagem: "Serviço não encontrado"
            });
        }

        res.json(servicos[0]);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao buscar serviço"
        });
    }
};

const atualizarServico = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nome,
            descricao,
            preco,
            precisa_lembrete,
            lembrete_intervalo_tipo,
            lembrete_intervalo_quantidade,
            lembrete_antecedencia_dias
        } = req.body;

        if (!nome || preco === undefined) {
            return res.status(400).json({
                mensagem: "nome e preco são obrigatórios"
            });
        }

        const [resultado] = await pool.query(
            `UPDATE servicos
             SET nome = ?,
                 descricao = ?,
                 preco = ?,
                 precisa_lembrete = ?,
                 lembrete_intervalo_tipo = ?,
                 lembrete_intervalo_quantidade = ?,
                 lembrete_antecedencia_dias = ?
             WHERE id = ?`,
            [
                nome,
                descricao,
                preco,
                precisa_lembrete !== undefined ? precisa_lembrete : false,
                lembrete_intervalo_tipo || null,
                lembrete_intervalo_quantidade || null,
                lembrete_antecedencia_dias ?? 7,
                id
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Serviço não encontrado"
            });
        }

        res.json({
            mensagem: "Serviço atualizado com sucesso"
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao atualizar serviço"
        });
    }
};

const alternarLembreteServico = async (req, res) => {
    try {
        const { id } = req.params;
        const { precisa_lembrete } = req.body;

        if (typeof precisa_lembrete !== "boolean") {
            return res.status(400).json({
                mensagem: "precisa_lembrete deve ser um valor booleano"
            });
        }

        const [resultado] = precisa_lembrete
            ? await pool.query(
                `UPDATE servicos
                 SET precisa_lembrete = true,
                     lembrete_intervalo_tipo = COALESCE(lembrete_intervalo_tipo, 'mes'),
                     lembrete_intervalo_quantidade = COALESCE(lembrete_intervalo_quantidade, 6),
                     lembrete_antecedencia_dias = COALESCE(lembrete_antecedencia_dias, 7)
                 WHERE id = ?`,
                [id]
            )
            : await pool.query(
                "UPDATE servicos SET precisa_lembrete = false WHERE id = ?",
                [id]
            );

        if (resultado.affectedRows === 0) {
            const [servicos] = await pool.query(
                "SELECT id FROM servicos WHERE id = ?",
                [id]
            );

            if (servicos.length === 0) {
                return res.status(404).json({
                    mensagem: "Serviço não encontrado"
                });
            }
        }

        res.json({
            mensagem: precisa_lembrete
                ? "Lembrete do serviço ativado com sucesso"
                : "Lembrete do serviço desativado com sucesso",
            precisa_lembrete
        });
    } catch (error) {
        console.error("Erro ao alternar lembrete do serviço:", error);

        res.status(500).json({
            mensagem: "Erro ao alternar lembrete do serviço"
        });
    }
};

const excluirServico = async (req, res) => {
    try {
        const { id } = req.params;

        const [resultado] = await pool.query(
            "DELETE FROM servicos WHERE id = ?",
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Serviço não encontrado"
            });
        }

        res.json({
            mensagem: "Serviço excluído com sucesso"
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao excluir serviço"
        });
    }
};

module.exports = {
    listarServicos,
    criarServico,
    buscarServico,
    atualizarServico,
    alternarLembreteServico,
    excluirServico
};