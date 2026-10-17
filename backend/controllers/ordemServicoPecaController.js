const pool = require("../config/db");
const sincronizarTransacaoOS = require("../utils/sincronizarTransacaoOS");

const adicionarPeca = async (req, res) => {
    try {
        const { ordem_servico_id } = req.params;
        const { peca_id, quantidade } = req.body;

        if (!peca_id) {
            return res.status(400).json({
                mensagem: "peca_id é obrigatório"
            });
        }

        const qtd = quantidade || 1;

        // Busca a peça
        const [pecas] = await pool.query(
            `SELECT preco_venda, quantidade
             FROM pecas
             WHERE id = ?`,
            [peca_id]
        );

        if (pecas.length === 0) {
            return res.status(404).json({
                mensagem: "Peça não encontrada"
            });
        }

        const peca = pecas[0];

        // Verifica estoque
        if (peca.quantidade < qtd) {
            return res.status(400).json({
                mensagem: "Estoque insuficiente"
            });
        }

        const preco = Number(peca.preco_venda);
        const subtotal = preco * qtd;

        // Adiciona a peça na OS
        const [resultado] = await pool.query(
            `INSERT INTO ordem_servico_pecas
            (
                ordem_servico_id,
                peca_id,
                quantidade,
                preco,
                subtotal
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                ordem_servico_id,
                peca_id,
                qtd,
                preco,
                subtotal
            ]
        );

        // Baixa o estoque
        await pool.query(
            `UPDATE pecas
             SET quantidade = quantidade - ?
             WHERE id = ?`,
            [qtd, peca_id]
        );

        // Atualiza o valor total da OS
        await atualizarTotalOS(ordem_servico_id);
        await sincronizarTransacaoOS(ordem_servico_id);

        res.status(201).json({
            mensagem: "Peça adicionada à ordem de serviço",
            id: resultado.insertId
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao adicionar peça"
        });
    }
};

const listarPecas = async (req, res) => {
    try {
        const { ordem_servico_id } = req.params;

        const [pecas] = await pool.query(
            `SELECT
                osp.*,
                p.nome,
                p.codigo
             FROM ordem_servico_pecas osp
             INNER JOIN pecas p ON osp.peca_id = p.id
             WHERE osp.ordem_servico_id = ?
             ORDER BY osp.id DESC`,
            [ordem_servico_id]
        );

        res.json(pecas);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao listar peças da ordem"
        });
    }
};

const removerPeca = async (req, res) => {
    try {
        const { id } = req.params;

        // Busca a peça antes de remover
        const [pecas] = await pool.query(
            `SELECT
                ordem_servico_id,
                peca_id,
                quantidade
             FROM ordem_servico_pecas
             WHERE id = ?`,
            [id]
        );

        if (pecas.length === 0) {
            return res.status(404).json({
                mensagem: "Peça não encontrada na ordem"
            });
        }

        const item = pecas[0];

        // Devolve a quantidade para o estoque
        await pool.query(
            `UPDATE pecas
             SET quantidade = quantidade + ?
             WHERE id = ?`,
            [item.quantidade, item.peca_id]
        );

        // Remove da OS
        await pool.query(
            "DELETE FROM ordem_servico_pecas WHERE id = ?",
            [id]
        );

        // Atualiza o total
        await atualizarTotalOS(item.ordem_servico_id);
        await sincronizarTransacaoOS(item.ordem_servico_id);

        res.json({
            mensagem: "Peça removida da ordem e devolvida ao estoque"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao remover peça"
        });
    }
};

const atualizarTotalOS = async (ordemServicoId) => {
    const [servicos] = await pool.query(
        `SELECT COALESCE(SUM(subtotal), 0) AS total
         FROM ordem_servico_servicos
         WHERE ordem_servico_id = ?`,
        [ordemServicoId]
    );

    const [pecas] = await pool.query(
        `SELECT COALESCE(SUM(subtotal), 0) AS total
         FROM ordem_servico_pecas
         WHERE ordem_servico_id = ?`,
        [ordemServicoId]
    );

    const [ordem] = await pool.query(
        `SELECT COALESCE(valor_adicional, 0) AS valor_adicional
         FROM ordens_servico
         WHERE id = ?`,
        [ordemServicoId]
    );

    const [servicosAdicionais] = await pool.query(
        `SELECT COALESCE(SUM(valor), 0) AS total
         FROM ordem_servico_adicionais
         WHERE ordem_servico_id = ?`,
        [ordemServicoId]
    );

    const totalServicos = Number(servicos[0].total);
    const totalPecas = Number(pecas[0].total);
    const valorAdicional = Number(ordem[0]?.valor_adicional || 0);
    const totalServicosAdicionais = Number(servicosAdicionais[0].total);

    const valorTotal = totalServicos + totalPecas + valorAdicional + totalServicosAdicionais;

    await pool.query(
        `UPDATE ordens_servico
         SET valor_total = ?
         WHERE id = ?`,
        [valorTotal, ordemServicoId]
    );
};

module.exports = {
    adicionarPeca,
    listarPecas,
    removerPeca
};