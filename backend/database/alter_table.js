const mysql = require("mysql2/promise");
const fs = require('fs');
const path = require('path');

async function alterTable() {
    try {
        // Ler arquivo .env para pegar senha
        const envPath = path.join(__dirname, '../.env');
        let dbPassword = '';
        
        try {
            const envContent = fs.readFileSync(envPath, 'utf8');
            const lines = envContent.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('DB_PASSWORD=')) {
                    dbPassword = line.substring('DB_PASSWORD='.length).trim();
                    break;
                }
            }
        } catch (error) {
            console.error('Erro ao ler .env:', error.message);
        }

        const connection = await mysql.createConnection({
            host: "localhost",
            user: "root",
            password: dbPassword,
            database: "torque",
            port: 3306
        });

        console.log('Conectado ao MySQL');

        // Verificar se os campos já existem
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'servicos' 
            AND TABLE_SCHEMA = 'torque'
            AND COLUMN_NAME IN ('precisa_lembrete', 'lembrete_intervalo_tipo', 'lembrete_intervalo_quantidade', 'lembrete_antecedencia_dias')
        `);

        const existingColumns = columns.map(col => col.COLUMN_NAME);
        console.log('Colunas existentes:', existingColumns);

        // Adicionar campos que não existem
        if (!existingColumns.includes('precisa_lembrete')) {
            await connection.query("ALTER TABLE servicos ADD COLUMN precisa_lembrete BOOLEAN DEFAULT FALSE");
            console.log('✓ Campo precisa_lembrete adicionado');
        }

        if (!existingColumns.includes('lembrete_intervalo_tipo')) {
            await connection.query("ALTER TABLE servicos ADD COLUMN lembrete_intervalo_tipo ENUM('dia', 'mes', 'ano') DEFAULT NULL");
            console.log('✓ Campo lembrete_intervalo_tipo adicionado');
        }

        if (!existingColumns.includes('lembrete_intervalo_quantidade')) {
            await connection.query("ALTER TABLE servicos ADD COLUMN lembrete_intervalo_quantidade INT DEFAULT NULL");
            console.log('✓ Campo lembrete_intervalo_quantidade adicionado');
        }

        if (!existingColumns.includes('lembrete_antecedencia_dias')) {
            await connection.query("ALTER TABLE servicos ADD COLUMN lembrete_antecedencia_dias INT DEFAULT 7");
            console.log('✓ Campo lembrete_antecedencia_dias adicionado');
        }

        console.log('✓ Tabela servicos alterada com sucesso!');

        await connection.end();
        process.exit(0);
    } catch (error) {
        console.error('✗ Erro ao alterar tabela:', error.message);
        process.exit(1);
    }
}

alterTable();