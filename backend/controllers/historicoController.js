const pool = require("../config/db");

const listarHistorico = async (req, res) => {
    try {
        const [historico] = await pool.query(`
            SELECT
                os.id,
                os.status,
                os.problema_relatado,
                os.diagnostico,
                os.observacoes,
                os.quilometragem,
                os.valor_total,
                os.data_abertura,
                os.data_conclusao,

                c.id AS cliente_id,
                c.nome AS cliente_nome,
                c.telefone AS cliente_telefone,

                v.id AS veiculo_id,
                v.placa,
                v.marca,
                v.modelo,
                v.ano,
                v.cor

            FROM ordens_servico os

            INNER JOIN clientes c
                ON os.cliente_id = c.id

            INNER JOIN veiculos v
                ON os.veiculo_id = v.id

            ORDER BY os.data_abertura DESC
        `);

        res.json(historico);

    } catch (error) {
        console.error("Erro ao listar histórico:", error);

        res.status(500).json({
            mensagem: "Erro ao listar histórico"
        });
    }
};

module.exports = {
    listarHistorico
};