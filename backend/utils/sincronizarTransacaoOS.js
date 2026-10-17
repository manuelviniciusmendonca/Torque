const pool = require("../config/db");

const sincronizarTransacaoOS = async (ordemServicoId) => {
    const [ordens] = await pool.query(
        `SELECT oficina_id, status, valor_total
         FROM ordens_servico
         WHERE id = ?`,
        [ordemServicoId]
    );

    if (ordens.length === 0) {
        return;
    }

    const ordem = ordens[0];
    const [transacoes] = await pool.query(
        `SELECT id
         FROM transacoes
         WHERE ordem_servico_id = ?
         AND tipo = 'entrada'
         LIMIT 1`,
        [ordemServicoId]
    );

    if (transacoes.length === 0) {
        return;
    }

    const statusFinanceiro = ordem.status === "finalizada"
        ? "pago"
        : "pendente";

    await pool.query(
        `UPDATE transacoes
         SET valor = ?,
             descricao = ?,
             status = ?
         WHERE ordem_servico_id = ?
         AND tipo = 'entrada'`,
        [
            Number(ordem.valor_total) || 0,
            `Ordem de Serviço #${ordemServicoId}`,
            statusFinanceiro,
            ordemServicoId
        ]
    );
};

module.exports = sincronizarTransacaoOS;
