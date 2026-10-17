const pool = require("../config/db");

const listarPecas = async (req, res) => {
    try {
        const [pecas] = await pool.query(
            `SELECT *
             FROM pecas
             ORDER BY id DESC`
        );

        res.json(pecas);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao listar peças"
        });
    }
};

const criarPeca = async (req, res) => {
    try {
        const {
            oficina_id,
            nome,
            codigo,
            descricao,
            quantidade,
            estoque_minimo,
            preco_custo,
            preco_venda,
            fornecedor
        } = req.body;

        if (!oficina_id || !nome) {
            return res.status(400).json({
                mensagem: "oficina_id e nome são obrigatórios"
            });
        }

        const [resultado] = await pool.query(
            `INSERT INTO pecas
            (
                oficina_id,
                nome,
                codigo,
                descricao,
                quantidade,
                estoque_minimo,
                preco_custo,
                preco_venda,
                fornecedor
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                oficina_id,
                nome,
                codigo || null,
                descricao || null,
                quantidade || 0,
                estoque_minimo || 0,
                preco_custo || 0,
                preco_venda || 0,
                fornecedor || null
            ]
        );

        res.status(201).json({
            mensagem: "Peça criada com sucesso",
            id: resultado.insertId
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao criar peça"
        });
    }
};

const buscarPeca = async (req, res) => {
    try {
        const { id } = req.params;

        const [pecas] = await pool.query(
            `SELECT *
             FROM pecas
             WHERE id = ?`,
            [id]
        );

        if (pecas.length === 0) {
            return res.status(404).json({
                mensagem: "Peça não encontrada"
            });
        }

        res.json(pecas[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao buscar peça"
        });
    }
};

const atualizarPeca = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nome,
            codigo,
            descricao,
            quantidade,
            estoque_minimo,
            preco_custo,
            preco_venda,
            fornecedor
        } = req.body;

        const [resultado] = await pool.query(
            `UPDATE pecas
             SET nome = ?,
                 codigo = ?,
                 descricao = ?,
                 quantidade = ?,
                 estoque_minimo = ?,
                 preco_custo = ?,
                 preco_venda = ?,
                 fornecedor = ?
             WHERE id = ?`,
            [
                nome,
                codigo || null,
                descricao || null,
                quantidade || 0,
                estoque_minimo || 0,
                preco_custo || 0,
                preco_venda || 0,
                fornecedor || null,
                id
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Peça não encontrada"
            });
        }

        res.json({
            mensagem: "Peça atualizada com sucesso"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao atualizar peça"
        });
    }
};

const excluirPeca = async (req, res) => {
    try {
        const { id } = req.params;

        const [resultado] = await pool.query(
            `DELETE FROM pecas
             WHERE id = ?`,
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Peça não encontrada"
            });
        }

        res.json({
            mensagem: "Peça excluída com sucesso"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao excluir peça"
        });
    }
};

module.exports = {
    listarPecas,
    criarPeca,
    buscarPeca,
    atualizarPeca,
    excluirPeca
};