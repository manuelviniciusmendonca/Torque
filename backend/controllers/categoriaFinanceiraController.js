const pool = require("../config/db");
const { getOficinaId } = require("../helpers/oficinaHelper");

// Listar categorias
const listarCategorias = async (req, res) => {
    try {
        const oficinaId = getOficinaId(req);
        const { tipo } = req.query;

        let query = `
            SELECT id, nome, tipo, ativa, created_at, updated_at
            FROM categorias_financeiras
            WHERE oficina_id = ?
        `;
        const params = [oficinaId];

        if (tipo) {
            query += ` AND tipo = ?`;
            params.push(tipo);
        }

        query += ` ORDER BY nome`;

        const [categorias] = await pool.query(query, params);
        res.json(categorias);
    } catch (error) {
        console.error("Erro ao listar categorias:", error);
        res.status(500).json({ mensagem: "Erro ao listar categorias" });
    }
};

// Criar categoria
const criarCategoria = async (req, res) => {
    try {
        const oficinaId = getOficinaId(req);
        const { nome, tipo } = req.body;

        if (!nome || !tipo) {
            return res.status(400).json({ mensagem: "Nome e tipo são obrigatórios" });
        }

        if (!['entrada', 'saida'].includes(tipo)) {
            return res.status(400).json({ mensagem: "Tipo deve ser 'entrada' ou 'saida'" });
        }

        const [result] = await pool.query(
            `INSERT INTO categorias_financeiras (oficina_id, nome, tipo) VALUES (?, ?, ?)`,
            [oficinaId, nome, tipo]
        );

        res.status(201).json({
            id: result.insertId,
            oficina_id: oficinaId,
            nome,
            tipo,
            ativa: true
        });
    } catch (error) {
        console.error("Erro ao criar categoria:", error);
        res.status(500).json({ mensagem: "Erro ao criar categoria" });
    }
};

// Atualizar categoria
const atualizarCategoria = async (req, res) => {
    try {
        const oficinaId = getOficinaId(req);
        const { id } = req.params;
        const { nome, ativa } = req.body;

        const updates = [];
        const params = [];

        if (nome !== undefined) {
            updates.push("nome = ?");
            params.push(nome);
        }
        if (ativa !== undefined) {
            updates.push("ativa = ?");
            params.push(ativa);
        }

        if (updates.length === 0) {
            return res.status(400).json({ mensagem: "Nenhum campo para atualizar" });
        }

        params.push(id, oficinaId);

        const [result] = await pool.query(
            `UPDATE categorias_financeiras SET ${updates.join(", ")} WHERE id = ? AND oficina_id = ?`,
            params
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensagem: "Categoria não encontrada" });
        }

        res.json({ mensagem: "Categoria atualizada com sucesso" });
    } catch (error) {
        console.error("Erro ao atualizar categoria:", error);
        res.status(500).json({ mensagem: "Erro ao atualizar categoria" });
    }
};

// Deletar categoria
const deletarCategoria = async (req, res) => {
    try {
        const oficinaId = getOficinaId(req);
        const { id } = req.params;

        // Verificar se a categoria está em uso
        const [lancamentos] = await pool.query(
            `SELECT COUNT(*) as count FROM lancamentos WHERE categoria_id = ? AND oficina_id = ?`,
            [id, oficinaId]
        );

        if (lancamentos[0].count > 0) {
            return res.status(400).json({ mensagem: "Não é possível excluir categoria em uso" });
        }

        const [result] = await pool.query(
            `DELETE FROM categorias_financeiras WHERE id = ? AND oficina_id = ?`,
            [id, oficinaId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensagem: "Categoria não encontrada" });
        }

        res.json({ mensagem: "Categoria excluída com sucesso" });
    } catch (error) {
        console.error("Erro ao deletar categoria:", error);
        res.status(500).json({ mensagem: "Erro ao deletar categoria" });
    }
};

module.exports = {
    listarCategorias,
    criarCategoria,
    atualizarCategoria,
    deletarCategoria
};
