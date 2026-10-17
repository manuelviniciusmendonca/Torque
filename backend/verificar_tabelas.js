require('dotenv').config();
const pool = require('./config/db');

async function verificarTabelas() {
    try {
        console.log('Verificando tabelas no banco...\n');
        
        const [tabelas] = await pool.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'torque'
        `);
        
        console.log('Tabelas existentes:');
        tabelas.forEach(t => console.log(`  - ${t.TABLE_NAME}`));
        
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await pool.end();
    }
}

verificarTabelas();
