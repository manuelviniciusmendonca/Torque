require("dotenv").config();

const pool = require("./config/db");

async function runMigration() {
    try {
        const [columns] = await pool.query(
            `SELECT COLUMN_NAME
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'ordens_servico'
               AND COLUMN_NAME IN ('descricao_adicional', 'valor_adicional')`
        );
        const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));

        if (!existingColumns.has("descricao_adicional")) {
            await pool.query(
                "ALTER TABLE ordens_servico ADD COLUMN descricao_adicional VARCHAR(255) NULL"
            );
            console.log("Coluna descricao_adicional adicionada.");
        }

        if (!existingColumns.has("valor_adicional")) {
            await pool.query(
                "ALTER TABLE ordens_servico ADD COLUMN valor_adicional DECIMAL(10,2) NOT NULL DEFAULT 0.00"
            );
            console.log("Coluna valor_adicional adicionada.");
        }

        console.log("Migration de preço adicional da OS concluída.");
    } catch (error) {
        console.error("Erro ao migrar preço adicional da OS:", error);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

runMigration();
