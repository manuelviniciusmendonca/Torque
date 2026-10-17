const pool = require('./config/db');

async function verificarPecas() {
    try {
        const [pecas] = await pool.query(
            `SELECT id, nome, codigo, quantidade, estoque_minimo, preco_custo, preco_venda, fornecedor
             FROM pecas
             ORDER BY id DESC`
        );

        console.log('Peças cadastradas no banco:');
        console.log(pecas);
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await pool.end();
    }
}

verificarPecas();
