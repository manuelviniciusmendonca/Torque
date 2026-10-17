const pool = require("../config/db");
const sincronizarTransacaoOS = require("../utils/sincronizarTransacaoOS");

const adicionarServico = async (req, res) => {
    try {
        const { ordem_servico_id } = req.params;
        const { servico_id, quantidade } = req.body;

        if (!servico_id) {
            return res.status(400).json({
                mensagem: "servico_id é obrigatório"
            });
        }

        const qtd = quantidade || 1;

        // Busca o preço atual do serviço
        const [servicos] = await pool.query(
            "SELECT preco FROM servicos WHERE id = ?",
            [servico_id]
        );

        if (servicos.length === 0) {
            return res.status(404).json({
                mensagem: "Serviço não encontrado"
            });
        }

        const preco = Number(servicos[0].preco);
        const subtotal = preco * qtd;

        const [resultado] = await pool.query(
            `INSERT INTO ordem_servico_servicos
            (
                ordem_servico_id,
                servico_id,
                quantidade,
                preco,
                subtotal
            )
            VALUES (?, ?, ?, ?, ?)`,
            [
                ordem_servico_id,
                servico_id,
                qtd,
                preco,
                subtotal
            ]
        );

        await atualizarTotalOS(ordem_servico_id);
        await sincronizarTransacaoOS(ordem_servico_id);

        res.status(201).json({
            mensagem: "Serviço adicionado à ordem de serviço",
            id: resultado.insertId
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao adicionar serviço"
        });
    }
};

const listarServicos = async (req, res) => {
    try {
        const { ordem_servico_id } = req.params;

        const [servicos] = await pool.query(
            `SELECT
                oss.*,
                s.nome,
                s.descricao
             FROM ordem_servico_servicos oss
             INNER JOIN servicos s ON oss.servico_id = s.id
             WHERE oss.ordem_servico_id = ?
             ORDER BY oss.id DESC`,
            [ordem_servico_id]
        );

        res.json(servicos);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao listar serviços da ordem"
        });
    }
};

const removerServico = async (req, res) => {
    try {
        const { id } = req.params;

        const [servico] = await pool.query(
            "SELECT ordem_servico_id FROM ordem_servico_servicos WHERE id = ?",
            [id]
        );

        if (servico.length === 0) {
            return res.status(404).json({
                mensagem: "Serviço não encontrado na ordem"
            });
        }

        const ordemServicoId = servico[0].ordem_servico_id;

        await pool.query(
            "DELETE FROM ordem_servico_servicos WHERE id = ?",
            [id]
        );

        await atualizarTotalOS(ordemServicoId);
        await sincronizarTransacaoOS(ordemServicoId);

        res.json({
            mensagem: "Serviço removido da ordem"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao remover serviço"
        });
    }
};

const atualizarTotalOS = async (ordemServicoId) => {
    const [resultado] = await pool.query(
        `SELECT COALESCE(SUM(subtotal), 0) AS total
         FROM ordem_servico_servicos
         WHERE ordem_servico_id = ?`,
        [ordemServicoId]
    );

    const totalServicos = Number(resultado[0].total);

    const [pecas] = await pool.query(
        `SELECT COALESCE(SUM(subtotal), 0) AS total
         FROM ordem_servico_pecas
         WHERE ordem_servico_id = ?`,
        [ordemServicoId]
    );

    const totalPecas = Number(pecas[0].total);

    const [ordens] = await pool.query(
        "SELECT COALESCE(valor_adicional, 0) AS valor_adicional FROM ordens_servico WHERE id = ?",
        [ordemServicoId]
    );
    const valorAdicional = Number(ordens[0]?.valor_adicional || 0);

    const [servicosAdicionais] = await pool.query(
        `SELECT COALESCE(SUM(valor), 0) AS total
         FROM ordem_servico_adicionais
         WHERE ordem_servico_id = ?`,
        [ordemServicoId]
    );
    const totalServicosAdicionais = Number(servicosAdicionais[0].total);

    const valorTotal = totalServicos + totalPecas + valorAdicional + totalServicosAdicionais;

    await pool.query(
        "UPDATE ordens_servico SET valor_total = ? WHERE id = ?",
        [valorTotal, ordemServicoId]
    );
};

module.exports = {
    adicionarServico,
    listarServicos,
    removerServico
};