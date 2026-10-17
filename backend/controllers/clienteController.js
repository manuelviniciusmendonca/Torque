const pool = require("../config/db");

const listarClientes = async (req, res) => {
    try {
        const [clientes] = await pool.query(
            "SELECT * FROM clientes ORDER BY id DESC"
        );

        res.json(clientes);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao listar clientes"
        });
    }
};

const criarCliente = async (req, res) => {
    try {
        const {
            oficina_id,
            nome,
            cpf_cnpj,
            telefone,
            email,
            whatsapp,
            endereco
        } = req.body;

        if (!oficina_id || !nome) {
            return res.status(400).json({
                mensagem: "oficina_id e nome são obrigatórios"
            });
        }

        const [resultado] = await pool.query(
            `INSERT INTO clientes
            (oficina_id, nome, cpf_cnpj, telefone, email, whatsapp, endereco)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                oficina_id,
                nome,
                cpf_cnpj,
                telefone,
                email,
                whatsapp,
                endereco
            ]
        );

        res.status(201).json({
            mensagem: "Cliente criado com sucesso",
            id: resultado.insertId
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao criar cliente"
        });
    }
};

const buscarCliente = async (req, res) => {
    try {
        const { id } = req.params;

        const [clientes] = await pool.query(
            "SELECT * FROM clientes WHERE id = ?",
            [id]
        );

        if (clientes.length === 0) {
            return res.status(404).json({
                mensagem: "Cliente não encontrado"
            });
        }

        res.json(clientes[0]);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao buscar cliente"
        });
    }
};

const atualizarCliente = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            nome,
            cpf_cnpj,
            telefone,
            email,
            whatsapp,
            endereco
        } = req.body;

        if (!nome) {
            return res.status(400).json({
                mensagem: "O nome é obrigatório"
            });
        }

        const [resultado] = await pool.query(
            `UPDATE clientes
             SET nome = ?,
                 cpf_cnpj = ?,
                 telefone = ?,
                 email = ?,
                 whatsapp = ?,
                 endereco = ?
             WHERE id = ?`,
            [
                nome,
                cpf_cnpj,
                telefone,
                email,
                whatsapp,
                endereco,
                id
            ]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Cliente não encontrado"
            });
        }

        res.json({
            mensagem: "Cliente atualizado com sucesso"
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao atualizar cliente"
        });
    }
};

const excluirCliente = async (req, res) => {
    try {
        const { id } = req.params;

        const [resultado] = await pool.query(
            "DELETE FROM clientes WHERE id = ?",
            [id]
        );

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensagem: "Cliente não encontrado"
            });
        }

        res.json({
            mensagem: "Cliente excluído com sucesso"
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao excluir cliente"
        });
    }
};

const listarClientesComVeiculos = async (req, res) => {
    try {
        const [clientes] = await pool.query(
            `SELECT
                c.id,
                c.nome,
                c.telefone,
                v.id AS veiculo_id,
                v.marca,
                v.modelo,
                v.placa,
                v.ano,
                v.cor,
                v.quilometragem
             FROM clientes c
             LEFT JOIN veiculos v
                ON c.id = v.cliente_id
             ORDER BY c.id DESC`
        );

        const resultado = clientes.map((cliente) => ({
            id: cliente.id,
            nome: cliente.nome,
            telefone: cliente.telefone,
            veiculo: cliente.veiculo_id
                ? {
                    id: cliente.veiculo_id,
                    marca: cliente.marca,
                    modelo: cliente.modelo,
                    placa: cliente.placa,
                    ano: cliente.ano,
                    cor: cliente.cor,
                    quilometragem: cliente.quilometragem
                }
                : null
        }));

        res.json(resultado);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao listar clientes com veículos"
        });
    }
};

const listarHistoricoCliente = async (req, res) => {
    try {
        const { id } = req.params;

        const [historico] = await pool.query(
            `
            SELECT
                os.id,
                os.status,
                os.problema_relatado,
                os.diagnostico,
                os.observacoes,
                os.quilometragem,
                os.valor_total,
                os.data_abertura,
                os.data_conclusao,

                v.id AS veiculo_id,
                v.placa,
                v.marca,
                v.modelo,
                v.ano,
                v.cor

            FROM ordens_servico os

            INNER JOIN veiculos v
                ON os.veiculo_id = v.id

            WHERE os.cliente_id = ?

            ORDER BY os.data_abertura DESC
            `,
            [id]
        );

        res.json(historico);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao buscar histórico do cliente"
        });
    }
};

module.exports = {
    listarClientes,
    listarClientesComVeiculos,
    listarHistoricoCliente,
    criarCliente,
    buscarCliente,
    atualizarCliente,
    excluirCliente
};