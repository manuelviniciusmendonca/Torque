const pool = require("../config/db");
const { getOficinaId } = require("../helpers/oficinaHelper");

// Adicionar pagamentos a um lançamento
const adicionarPagamentos = async (req, res) => {
    const conexao = await pool.getConnection();
    
    try {
        await conexao.beginTransaction();
        
        const oficinaId = getOficinaId(req);
        const { id } = req.params;
        const pagamentos = req.body;

        if (!Array.isArray(pagamentos) || pagamentos.length === 0) {
            await conexao.rollback();
            return res.status(400).json({ mensagem: "Array de pagamentos é obrigatório" });
        }

        // Validar cada pagamento
        for (const pag of pagamentos) {
            if (!pag.valor || !pag.forma_pagamento || !pag.data_pagamento) {
                await conexao.rollback();
                return res.status(400).json({ mensagem: "Cada pagamento deve ter valor, forma_pagamento e data_pagamento" });
            }

            if (!['dinheiro', 'pix', 'debito', 'credito', 'boleto', 'transferencia', 'outro'].includes(pag.forma_pagamento)) {
                await conexao.rollback();
                return res.status(400).json({ mensagem: "Forma de pagamento inválida" });
            }

            if (parseFloat(pag.valor) <= 0) {
                await conexao.rollback();
                return res.status(400).json({ mensagem: "Valor do pagamento deve ser positivo" });
            }
        }

        // Bloquear o lançamento para update
        const [lancamentos] = await conexao.query(
            `SELECT * FROM lancamentos WHERE id = ? AND oficina_id = ? FOR UPDATE`,
            [id, oficinaId]
        );

        if (lancamentos.length === 0) {
            await conexao.rollback();
            return res.status(404).json({ mensagem: "Lançamento não encontrado" });
        }

        const lancamento = lancamentos[0];

        if (lancamento.status === 'cancelado') {
            await conexao.rollback();
            return res.status(400).json({ mensagem: "Não é possível adicionar pagamentos a lançamento cancelado" });
        }

        // Calcular saldo atual
        const [pagamentosExistentes] = await conexao.query(
            `SELECT COALESCE(SUM(valor), 0) as total FROM pagamentos WHERE lancamento_id = ? AND estornado = FALSE`,
            [id]
        );

        const valorPagoExistente = parseFloat(pagamentosExistentes[0].total);
        const valorTotalLancamento = parseFloat(lancamento.valor);
        const valorSomaPagamentos = pagamentos.reduce((sum, p) => sum + parseFloat(p.valor), 0);

        if (valorPagoExistente + valorSomaPagamentos > valorTotalLancamento) {
            await conexao.rollback();
            return res.status(400).json({ 
                mensagem: "A soma dos pagamentos excede o valor do lançamento",
                saldo_disponivel: valorTotalLancamento - valorPagoExistente
            });
        }

        // Inserir os pagamentos
        const pagamentosCriados = [];
        for (const pag of pagamentos) {
            const [result] = await conexao.query(
                `INSERT INTO pagamentos (oficina_id, lancamento_id, valor, forma_pagamento, data_pagamento, observacao)
                VALUES (?, ?, ?, ?, ?, ?)`,
                [oficinaId, id, pag.valor, pag.forma_pagamento, pag.data_pagamento, pag.observacao || null]
            );
            pagamentosCriados.push(result.insertId);
        }

        // Atualizar status do lançamento
        const novoValorPago = valorPagoExistente + valorSomaPagamentos;
        let novoStatus = lancamento.status;

        if (novoValorPago >= valorTotalLancamento) {
            novoStatus = 'pago';
        } else if (novoValorPago > 0) {
            novoStatus = 'parcial';
        }

        await conexao.query(
            `UPDATE lancamentos SET status = ?, atualizado_em = NOW() WHERE id = ?`,
            [novoStatus, id]
        );

        await conexao.commit();

        // Retornar os pagamentos criados
        const [pagamentosDetalhes] = await conexao.query(
            `SELECT * FROM pagamentos WHERE id IN (${pagamentosCriados.join(',')})`
        );

        res.status(201).json({
            mensagem: "Pagamentos adicionados com sucesso",
            pagamentos: pagamentosDetalhes,
            novo_status: novoStatus
        });
    } catch (error) {
        await conexao.rollback();
        console.error("Erro ao adicionar pagamentos:", error);
        res.status(500).json({ mensagem: "Erro ao adicionar pagamentos" });
    } finally {
        conexao.release();
    }
};

// Estornar pagamento
const estornarPagamento = async (req, res) => {
    const conexao = await pool.getConnection();
    
    try {
        await conexao.beginTransaction();
        
        const oficinaId = getOficinaId(req);
        const { id } = req.params;
        const { motivo } = req.body;

        if (!motivo) {
            await conexao.rollback();
            return res.status(400).json({ mensagem: "Motivo do estorno é obrigatório" });
        }

        // Verificar se o pagamento existe e pertence à oficina
        const [pagamentos] = await conexao.query(
            `SELECT p.*, l.status as lancamento_status FROM pagamentos p
            JOIN lancamentos l ON p.lancamento_id = l.id
            WHERE p.id = ? AND p.oficina_id = ? FOR UPDATE`,
            [id, oficinaId]
        );

        if (pagamentos.length === 0) {
            await conexao.rollback();
            return res.status(404).json({ mensagem: "Pagamento não encontrado" });
        }

        const pagamento = pagamentos[0];

        if (pagamento.estornado) {
            await conexao.rollback();
            return res.status(400).json({ mensagem: "Pagamento já estornado" });
        }

        // Estornar o pagamento
        await conexao.query(
            `UPDATE pagamentos SET estornado = TRUE, estornado_em = NOW(), motivo_estorno = ? WHERE id = ?`,
            [motivo, id]
        );

        // Recalcular status do lançamento
        const [pagamentosLancamento] = await conexao.query(
            `SELECT COALESCE(SUM(valor), 0) as total FROM pagamentos WHERE lancamento_id = ? AND estornado = FALSE`,
            [pagamento.lancamento_id]
        );

        const valorPago = parseFloat(pagamentosLancamento[0].total);
        const valorLancamento = parseFloat(pagamento.valor); // Obter valor do lançamento
        let novoStatus = pagamento.lancamento_status;

        if (valorPago >= valorLancamento) {
            novoStatus = 'pago';
        } else if (valorPago > 0) {
            novoStatus = 'parcial';
        } else {
            novoStatus = 'aberto';
        }

        await conexao.query(
            `UPDATE lancamentos SET status = ?, atualizado_em = NOW() WHERE id = ?`,
            [novoStatus, pagamento.lancamento_id]
        );

        await conexao.commit();
        res.json({ mensagem: "Pagamento estornado com sucesso", novo_status: novoStatus });
    } catch (error) {
        await conexao.rollback();
        console.error("Erro ao estornar pagamento:", error);
        res.status(500).json({ mensagem: "Erro ao estornar pagamento" });
    } finally {
        conexao.release();
    }
};

// Listar pagamentos de um lançamento
const listarPagamentos = async (req, res) => {
    try {
        const oficinaId = getOficinaId(req);
        const { lancamento_id } = req.params;

        const [pagamentos] = await pool.query(
            `SELECT * FROM pagamentos WHERE lancamento_id = ? AND oficina_id = ? ORDER BY data_pagamento DESC`,
            [lancamento_id, oficinaId]
        );

        res.json(pagamentos);
    } catch (error) {
        console.error("Erro ao listar pagamentos:", error);
        res.status(500).json({ mensagem: "Erro ao listar pagamentos" });
    }
};

module.exports = {
    adicionarPagamentos,
    estornarPagamento,
    listarPagamentos
};
