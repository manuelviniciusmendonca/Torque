require('dotenv').config();
const fs = require('fs');
const pool = require('./config/db');

async function runMigration() {
    const conexao = await pool.getConnection();
    
    try {
        await conexao.beginTransaction();
        
        console.log('Executando migration 001_financeiro...\n');
        
        const sql = fs.readFileSync('./migrations/001_financeiro.sql', 'utf8');
        
        // Divide o SQL em statements separados por ponto e vírgula
        const statements = sql.split(';').filter(s => s.trim().length > 0);
        
        for (const statement of statements) {
            if (statement.trim().toUpperCase().startsWith('--')) {
                console.log(statement.trim());
                continue;
            }
            
            try {
                await conexao.query(statement);
                console.log('✓ Executado:', statement.substring(0, 50) + '...');
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY' || error.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log('⚠ Já existe (ignorado):', error.message);
                } else {
                    throw error;
                }
            }
        }
        
        await conexao.commit();
        console.log('\n✓ Migration 001_financeiro concluída com sucesso!');
        
    } catch (error) {
        await conexao.rollback();
        console.error('Erro na migration:', error);
        throw error;
    } finally {
        conexao.release();
        await pool.end();
    }
}

runMigration();
