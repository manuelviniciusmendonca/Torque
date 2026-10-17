const pool = require("../config/db");

const entradaEstoque = async (req, res) => {
    try {
        const { peca_id, quantidade } = req.body;

        if (!peca_id || !quantidade || quantidade <= 0) {
            return res.status(400).json({
                mensagem: "peca_id e uma quantidade válida são obrigatórios"
            });
        }

        const [pecas] = await pool.query(
            "SELECT id, nome FROM pecas WHERE id = ?",
            [peca_id]
        );

        if (pecas.length === 0) {
            return res.status(404).json({
                mensagem: "Peça não encontrada"
            });
        }

        await pool.query(
            `UPDATE pecas
             SET quantidade = quantidade + ?
             WHERE id = ?`,
            [quantidade, peca_id]
        );

        res.json({
            mensagem: "Entrada de estoque registrada com sucesso"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao registrar entrada de estoque"
        });
    }
};

const saidaEstoque = async (req, res) => {
    try {
        const { peca_id, quantidade } = req.body;

        if (!peca_id || !quantidade || quantidade <= 0) {
            return res.status(400).json({
                mensagem: "peca_id e uma quantidade válida são obrigatórios"
            });
        }

        const [pecas] = await pool.query(
            `SELECT id, nome, quantidade
             FROM pecas
             WHERE id = ?`,
            [peca_id]
        );

        if (pecas.length === 0) {
            return res.status(404).json({
                mensagem: "Peça não encontrada"
            });
        }

        if (pecas[0].quantidade < quantidade) {
            return res.status(400).json({
                mensagem: "Estoque insuficiente"
            });
        }

        await pool.query(
            `UPDATE pecas
             SET quantidade = quantidade - ?
             WHERE id = ?`,
            [quantidade, peca_id]
        );

        res.json({
            mensagem: "Saída de estoque registrada com sucesso"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao registrar saída de estoque"
        });
    }
};

const estoqueBaixo = async (req, res) => {
    try {
        const [pecas] = await pool.query(
            `SELECT
                id,
                nome,
                codigo,
                quantidade,
                estoque_minimo,
                preco_custo,
                preco_venda
             FROM pecas
             WHERE quantidade <= estoque_minimo
             ORDER BY quantidade ASC`
        );

        res.json(pecas);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao consultar estoque baixo"
        });
    }
};

module.exports = {
    entradaEstoque,
    saidaEstoque,
    estoqueBaixo
};