require("dotenv").config();

const fs = require("fs");
const path = require("path");
const pool = require("./config/db");

async function runMigration() {
    try {
        const sql = fs.readFileSync(
            path.join(__dirname, "migrations", "004_os_servicos_adicionais.sql"),
            "utf8"
        );
        await pool.query(sql);
        console.log("Migration 004_os_servicos_adicionais executada com sucesso.");
    } catch (error) {
        console.error("Erro ao executar a migration 004_os_servicos_adicionais:", error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

runMigration();
