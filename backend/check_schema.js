require('dotenv').config();
const pool = require('./config/db');

async function checkSchema() {
    try {
        console.log('Verificando schema atual...\n');

        const tables = ['transacoes', 'ordens_servico', 'ordem_servico_servicos', 'ordem_servico_pecas', 'pecas'];

        for (const table of tables) {
            console.log(`\n=== ${table.toUpperCase()} ===`);
            const [result] = await pool.query(`SHOW CREATE TABLE ${table}`);
            console.log(result[0]['Create Table']);
        }

        console.log('\nSchema salvo em backend/migrations/000_schema_atual.sql');
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await pool.end();
    }
}

checkSchema();
