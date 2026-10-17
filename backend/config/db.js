const mysql = require("mysql2/promise");
const path = require('path');
const fs = require('fs');

// Carregar dotenv
require('dotenv').config();

// Ler o arquivo .env diretamente para evitar problemas de codificação
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

// Se não encontrou no arquivo, usar variável de ambiente
if (!dbPassword && process.env.DB_PASSWORD) {
    dbPassword = process.env.DB_PASSWORD.trim();
}

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: dbPassword,
    database: process.env.DB_NAME || 'torque',
    port: parseInt(process.env.DB_PORT) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Testar a conexão ao criar o pool
pool.getConnection()
    .then(connection => {
        console.log('✓ Conexão com o MySQL estabelecida com sucesso');
        connection.release();
    })
    .catch(error => {
        console.error('✗ Erro ao conectar com o MySQL:', error.message);
        console.error('Código do erro:', error.code);
        console.error('Verifique as credenciais no arquivo .env');
    });

module.exports = pool;