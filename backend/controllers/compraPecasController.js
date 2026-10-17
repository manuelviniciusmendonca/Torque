const pool = require("../config/db");
const { getOficinaId } = require("../helpers/oficinaHelper");

const listarCompras = async (req, res) => {
    try {
        const oficinaId = getOficinaId(req);
        const [compras] = await pool.query(
            `SELECT cp.*, COALESCE(cp.peca_nome, p.nome) AS peca_nome,
                    COALESCE(cp.peca_codigo, p.codigo) AS peca_codigo
             FROM compras_pecas cp
             LEFT JOIN pecas p ON p.id = cp.peca_id
             WHERE cp.oficina_id = ?
             ORDER BY cp.criado_em DESC, cp.id DESC`,
            [oficinaId]
        );

        res.json(compras);
    } catch (error) {
        console.error("Erro ao listar compras de peças:", error);
        res.status(500).json({ mensagem: "Erro ao listar compras de peças" });
    }
};

const registrarCompra = async (req, res) => {
    const conexao = await pool.getConnection();

    try {
        const oficinaId = getOficinaId(req);
        const { peca_id, codigo_peca, fornecedor, quantidade, valor_unitario, vencimento } = req.body;
        const pecaId = Number(peca_id);
        const qtd = Number(quantidade);
        const valorUnitario = Number(valor_unitario);
        const codigoPeca = typeof codigo_peca === "string" ? codigo_peca.trim() : "";

        if (!Number.isInteger(pecaId) || pecaId <= 0 ||
            !Number.isInteger(qtd) || qtd <= 0 ||
            !Number.isFinite(valorUnitario) || valorUnitario <= 0 ||
            codigoPeca.length > 100 ||
            !vencimento) {
            return res.status(400).json({
                mensagem: "Peça, quantidade, valor unitário e vencimento válidos são obrigatórios; o código deve ter no máximo 100 caracteres"
            });
        }

        const valorUnitarioCentavos = Math.round(valorUnitario * 100);
        const valorTotal = (valorUnitarioCentavos * qtd) / 100;

        await conexao.beginTransaction();

        const [pecas] = await conexao.query(
            `SELECT id, nome, codigo
             FROM pecas
             WHERE id = ? AND oficina_id = ?
             FOR UPDATE`,
            [pecaId, oficinaId]
        );

        if (pecas.length === 0) {
            await conexao.rollback();
            return res.status(404).json({ mensagem: "Peça não encontrada" });
        }

        const [categorias] = await conexao.query(
            `SELECT id
             FROM categorias_financeiras
             WHERE oficina_id = ? AND tipo = 'saida' AND nome = 'Fornecedores' AND ativa = TRUE
             LIMIT 1`,
            [oficinaId]
        );

        const [lancamento] = await conexao.query(
            `INSERT INTO lancamentos
             (oficina_id, tipo, descricao, categoria_id, fornecedor, valor, vencimento, status)
             VALUES (?, 'saida', ?, ?, ?, ?, ?, 'aberto')`,
            [
                oficinaId,
                `Compra de peças: ${pecas[0].nome}`,
                categorias[0]?.id || null,
                fornecedor || null,
                valorTotal,
                vencimento
            ]
        );

        const [compra] = await conexao.query(
            `INSERT INTO compras_pecas
             (oficina_id, peca_id, peca_nome, peca_codigo, fornecedor, quantidade, valor_unitario, valor_total, vencimento, lancamento_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                oficinaId,
                pecaId,
                pecas[0].nome,
                codigoPeca || pecas[0].codigo,
                fornecedor || null,
                qtd,
                valorUnitarioCentavos / 100,
                valorTotal,
                vencimento,
                lancamento.insertId
            ]
        );

        await conexao.query(
            `UPDATE pecas
             SET quantidade = quantidade + ?, preco_custo = ?
             WHERE id = ? AND oficina_id = ?`,
            [qtd, valorUnitarioCentavos / 100, pecaId, oficinaId]
        );

        await conexao.commit();

        res.status(201).json({
            id: compra.insertId,
            peca_id: pecaId,
            peca_nome: pecas[0].nome,
            peca_codigo: codigoPeca || pecas[0].codigo,
            fornecedor: fornecedor || null,
            quantidade: qtd,
            valor_unitario: valorUnitarioCentavos / 100,
            valor_total: valorTotal,
            vencimento,
            lancamento_id: lancamento.insertId
        });
    } catch (error) {
        await conexao.rollback();
        console.error("Erro ao registrar compra de peças:", error);
        res.status(500).json({ mensagem: "Erro ao registrar compra de peças" });
    } finally {
        conexao.release();
    }
};

module.exports = { listarCompras, registrarCompra };
