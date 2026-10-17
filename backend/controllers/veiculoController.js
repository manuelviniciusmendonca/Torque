const pool = require("../config/db");


// ==========================================
// LISTAR VEÍCULOS
// ==========================================

const listarVeiculos = async (req, res) => {
    try {
        const [veiculos] = await pool.query(`
            SELECT 
                v.*,
                c.nome AS cliente_nome,
                c.telefone AS cliente_telefone,
                os.problema_relatado,
                os.status AS os_status,
                os.data_abertura
            FROM veiculos v

            INNER JOIN clientes c
                ON v.cliente_id = c.id

            LEFT JOIN ordens_servico os
                ON os.id = (
                    SELECT os2.id
                    FROM ordens_servico os2
                    WHERE os2.veiculo_id = v.id
                    ORDER BY os2.id DESC
                    LIMIT 1
                )

            ORDER BY v.id DESC
        `);

        res.json(veiculos);

    } catch (error) {
        console.error("Erro ao listar veículos:", error);

        res.status(500).json({
            mensagem: "Erro ao listar veículos"
        });
    }
};


// ==========================================
// CRIAR VEÍCULO
// ==========================================

const criarVeiculo = async (req, res) => {
    try {
        const {
            oficina_id,
            cliente_id,
            placa,
            marca,
            modelo,
            ano,
            cor,
            quilometragem
        } = req.body;

        if (
            !oficina_id ||
            !cliente_id ||
            !placa ||
            !marca ||
            !modelo
        ) {
            return res.status(400).json({
                mensagem:
                    "oficina_id, cliente_id, placa, marca e modelo são obrigatórios"
            });
        }

        const [resultado] = await pool.query(
            `
            INSERT INTO veiculos
            (
                oficina_id,
                cliente_id,
                placa,
                marca,
                modelo,
                ano,
                cor,
                quilometragem
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                oficina_id,
                cliente_id,
                placa,
                marca,
                modelo,
                ano || null,
                cor || null,
                quilometragem || 0
            ]
        );

        res.status(201).json({
            mensagem: "Veículo criado com sucesso",
            id: resultado.insertId
        });

    } catch (error) {
        console.error("Erro ao criar veículo:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem:
                    "Já existe um veículo com essa placa nesta oficina"
            });
        }

        res.status(500).json({
            mensagem: "Erro ao criar veículo"
        });
    }
};


// ==========================================
// BUSCAR VEÍCULO
// ==========================================

const buscarVeiculo = async (req, res) => {
    try {
        const { id } = req.params;

        const [veiculos] = await pool.query(
            `
            SELECT 
                v.*,
                c.nome AS cliente_nome,
                c.telefone AS cliente_telefone
            FROM veiculos v

            INNER JOIN clientes c
                ON v.cliente_id = c.id

            WHERE v.id = ?
            `,
            [id]
        );

        if (veiculos.length === 0) {
            return res.status(404).json({
                mensagem: "Veículo não encontrado"
            });
        }

        res.json(veiculos[0]);

    } catch (error) {
        console.error("Erro ao buscar veículo:", error);

        res.status(500).json({
            mensagem: "Erro ao buscar veículo"
        });
    }
};


// ==========================================
// ATUALIZAR VEÍCULO
// ==========================================

const atualizarVeiculo = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            cliente_id,
            placa,
            marca,
            modelo,
            ano,
            cor,
            quilometragem
        } = req.body;

        if (
            !cliente_id ||
            !placa ||
            !marca ||
            !modelo
        ) {
            return res.status(400).json({
                mensagem:
                    "cliente_id, placa, marca e modelo são obrigatórios"
            });
        }

        const [resultado] = await pool.query(
            `
            UPDATE veiculos

            SET cliente_id = ?,
                placa = ?,
                marca = ?,
                modelo = ?,
                ano = ?,
                cor = ?,
                quilometragem = ?

            WHERE id = ?
            `,
            [
                cliente_id,
                placa,
                marca,
                modelo,
                ano || null,
                cor || null,
                quilometragem || 0,
                id
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Veículo não encontrado"
            });
        }

        res.json({
            mensagem: "Veículo atualizado com sucesso"
        });

    } catch (error) {
        console.error("Erro ao atualizar veículo:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                mensagem:
                    "Já existe um veículo com essa placa nesta oficina"
            });
        }

        res.status(500).json({
            mensagem: "Erro ao atualizar veículo"
        });
    }
};


// ==========================================
// EXCLUIR VEÍCULO
// ==========================================

const excluirVeiculo = async (req, res) => {
    try {
        const { id } = req.params;

        const [resultado] = await pool.query(
            "DELETE FROM veiculos WHERE id = ?",
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Veículo não encontrado"
            });
        }

        res.json({
            mensagem: "Veículo excluído com sucesso"
        });

    } catch (error) {
        console.error("Erro ao excluir veículo:", error);

        res.status(500).json({
            mensagem: "Erro ao excluir veículo"
        });
    }
};


// ==========================================
// HISTÓRICO DE MANUTENÇÃO DO VEÍCULO
// ==========================================

const listarHistoricoVeiculo = async (req, res) => {
    try {
        const { id } = req.params;

        const [historico] = await pool.query(
            `
            SELECT
                os.*,
                c.nome AS cliente_nome,
                c.telefone AS cliente_telefone
            FROM ordens_servico os

            INNER JOIN clientes c
                ON os.cliente_id = c.id

            WHERE os.veiculo_id = ?

            ORDER BY os.data_abertura DESC
            `,
            [id]
        );

        res.json(historico);

    } catch (error) {
        console.error("Erro ao listar histórico do veículo:", error);

        res.status(500).json({
            mensagem: "Erro ao listar histórico do veículo"
        });
    }
};


module.exports = {
    listarVeiculos,
    criarVeiculo,
    buscarVeiculo,
    atualizarVeiculo,
    excluirVeiculo,
    listarHistoricoVeiculo
};