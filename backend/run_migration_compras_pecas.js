require("dotenv").config();

const fs = require("fs");
const path = require("path");
const pool = require("./config/db");

async function runMigration() {
    try {
        const sql = fs.readFileSync(
            path.join(__dirname, "migrations", "002_compras_pecas.sql"),
            "utf8"
        );
        await pool.query(sql);
        console.log("Migration 002_compras_pecas executada com sucesso.");
    } catch (error) {
        console.error("Erro ao executar a migration 002_compras_pecas:", error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

runMigration();
