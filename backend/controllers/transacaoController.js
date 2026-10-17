const pool = require("../config/db");

const FORMAS_PAGAMENTO = ["dinheiro", "pix", "debito", "credito", "boleto"];

const validarFormaPagamento = (forma) =>
    !forma || FORMAS_PAGAMENTO.includes(forma);

const normalizarData = (data) => {
    if (!data) return null;
    return String(data).slice(0, 10);
};

const listarTransacoes = async (req, res) => {
    try {
        const { oficina_id } = req.query;
        const filtros = [];
        const parametros = [];

        if (oficina_id) {
            filtros.push("t.oficina_id = ?");
            parametros.push(oficina_id);
        }

        const [transacoes] = await pool.query(
            `SELECT
                t.*,
                os.cliente_id,
                os.status AS ordem_status,
                c.nome AS cliente_nome,
                c.telefone AS cliente_telefone
             FROM transacoes t
             LEFT JOIN ordens_servico os
                ON t.ordem_servico_id = os.id
             LEFT JOIN clientes c
                ON os.cliente_id = c.id
             ${filtros.length > 0 ? `WHERE ${filtros.join(" AND ")}` : ""}
             ORDER BY t.id DESC`,
            parametros
        );

        res.json(transacoes);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao listar transações"
        });
    }
};


const criarTransacao = async (req, res) => {
    try {
        let {
            oficina_id,
            ordem_servico_id,
            cliente_id,
            tipo,
            descricao,
            valor,
            status,
            data
            ,forma_pagamento,
            data_vencimento,
            parcela,
            total_parcelas
        } = req.body;

        if (!oficina_id || !tipo || !descricao || valor === undefined) {
            return res.status(400).json({
                mensagem: "oficina_id, tipo, descricao e valor são obrigatórios"
            });
        }

        if (tipo !== "entrada" && tipo !== "saida") {
            return res.status(400).json({
                mensagem: "O tipo deve ser entrada ou saida"
            });
        }

        if (!validarFormaPagamento(forma_pagamento)) {
            return res.status(400).json({ mensagem: "Forma de pagamento inválida" });
        }

        if (ordem_servico_id) {
            const [ordens] = await pool.query(
                `SELECT id, oficina_id, valor_total
                 FROM ordens_servico
                 WHERE id = ? AND oficina_id = ?`,
                [ordem_servico_id, oficina_id]
            );

            if (ordens.length === 0) {
                return res.status(404).json({
                    mensagem: "Ordem de serviço não encontrada"
                });
            }

            const [transacoesVinculadas] = await pool.query(
                `SELECT id
                 FROM transacoes
                 WHERE ordem_servico_id = ?
                 LIMIT 1`,
                [ordem_servico_id]
            );

            if (transacoesVinculadas.length > 0) {
                return res.status(409).json({
                    mensagem: "Esta ordem de serviço já possui uma cobrança financeira"
                });
            }
        }

        const [resultado] = await pool.query(
            `INSERT INTO transacoes
            (
                oficina_id,
                ordem_servico_id,
                cliente_id,
                tipo,
                descricao,
                valor,
                status,
                data,
                forma_pagamento,
                data_vencimento,
                parcela,
                total_parcelas
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                oficina_id,
                ordem_servico_id || null,
                cliente_id || null,
                tipo,
                descricao,
                valor,
                status || "pendente",
                data || new Date(),
                forma_pagamento || null,
                normalizarData(data_vencimento),
                parcela || null,
                total_parcelas || null
            ]
        );

        res.status(201).json({
            mensagem: "Transação criada com sucesso",
            id: resultado.insertId
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao criar transação"
        });
    }
};

const criarTransacaoParcelada = async (req, res) => {
    const conexao = await pool.getConnection();

    try {
        let {
            oficina_id,
            ordem_servico_id,
            cliente_id: clienteIdInformado,
            tipo,
            descricao,
            valor_total,
            forma_pagamento,
            numero_parcelas = 1,
            data_primeira_parcela
        } = req.body;

        const parcelas = Number(numero_parcelas) || 1;
        const valorTotal = Number(valor_total);

        if (!oficina_id || !tipo || !descricao || !Number.isFinite(valorTotal) || valorTotal < 0) {
            return res.status(400).json({
                mensagem: "oficina_id, tipo, descricao e valor_total são obrigatórios"
            });
        }

        if (!["entrada", "saida"].includes(tipo) || !validarFormaPagamento(forma_pagamento)) {
            return res.status(400).json({ mensagem: "Dados da transação inválidos" });
        }

        if (!Number.isInteger(parcelas) || parcelas < 1) {
            return res.status(400).json({ mensagem: "numero_parcelas deve ser um inteiro maior que zero" });
        }

        if (ordem_servico_id) {
            const [ordens] = await conexao.query(
                "SELECT id, oficina_id, cliente_id FROM ordens_servico WHERE id = ? AND oficina_id = ?",
                [ordem_servico_id, oficina_id]
            );
            if (ordens.length === 0) {
                return res.status(404).json({ mensagem: "Ordem de serviço não encontrada" });
            }
            const [existentes] = await conexao.query(
                "SELECT id FROM transacoes WHERE ordem_servico_id = ? LIMIT 1",
                [ordem_servico_id]
            );
            if (existentes.length > 0) {
                return res.status(409).json({ mensagem: "Esta ordem já possui transações financeiras" });
            }

            if (!clienteIdInformado) {
                clienteIdInformado = ordens[0].cliente_id;
            }
        }

        const primeiraData = normalizarData(data_primeira_parcela) ||
            new Date().toISOString().slice(0, 10);
        const valorBase = Math.round((valorTotal / parcelas) * 100) / 100;
        const dataLancamento = new Date();

        await conexao.beginTransaction();

        for (let indice = 1; indice <= parcelas; indice += 1) {
            const valorParcela = indice === parcelas
                ? Math.round((valorTotal - valorBase * (parcelas - 1)) * 100) / 100
                : valorBase;
            const vencimento = new Date(`${primeiraData}T12:00:00`);
            vencimento.setDate(vencimento.getDate() + ((indice - 1) * 30));
            const vencimentoFormatado = vencimento.toISOString().slice(0, 10);
            const descricaoParcela = parcelas > 1
                ? `${descricao} — Parcela ${indice}/${parcelas}`
                : descricao;

            await conexao.query(
                `INSERT INTO transacoes
                (oficina_id, ordem_servico_id, cliente_id, tipo, descricao, valor, status, data,
                 forma_pagamento, data_vencimento, parcela, total_parcelas)
                VALUES (?, ?, ?, ?, ?, ?, 'pendente', ?, ?, ?, ?, ?)` ,
                [
                    oficina_id,
                    ordem_servico_id || null,
                    clienteIdInformado || null,
                    tipo,
                    descricaoParcela,
                    valorParcela,
                    dataLancamento,
                    forma_pagamento || null,
                    vencimentoFormatado,
                    parcelas > 1 ? indice : null,
                    parcelas > 1 ? parcelas : null
                ]
            );
        }

        await conexao.commit();
        res.status(201).json({ mensagem: "Transação criada com sucesso", parcelas });
    } catch (error) {
        await conexao.rollback();
        console.error(error);
        res.status(500).json({ mensagem: "Erro ao criar transação parcelada" });
    } finally {
        conexao.release();
    }
};

const listarTransacoesVencidas = async (req, res) => {
    try {
        const { oficina_id } = req.params;
        const [transacoes] = await pool.query(
            `SELECT t.*, os.status AS ordem_status, c.nome AS cliente_nome,
                    c.telefone AS cliente_telefone,
                    DATEDIFF(CURRENT_DATE(), t.data_vencimento) AS dias_atraso
             FROM transacoes t
             LEFT JOIN ordens_servico os ON t.ordem_servico_id = os.id
             LEFT JOIN clientes c ON os.cliente_id = c.id
             WHERE t.oficina_id = ?
               AND t.tipo = 'entrada'
               AND t.status = 'pendente'
               AND t.valor > 0
               AND t.data_vencimento IS NOT NULL
               AND t.data_vencimento < CURRENT_DATE()
               AND (
                    t.ordem_servico_id IS NULL
                    OR os.status IN ('concluida', 'finalizada')
               )
             ORDER BY t.data_vencimento ASC, t.id ASC`,
            [oficina_id]
        );
        res.json(transacoes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensagem: "Erro ao listar contas vencidas" });
    }
};


const buscarTransacao = async (req, res) => {
    try {
        const { id } = req.params;

        const [transacoes] = await pool.query(
            `SELECT
                t.*,
                os.cliente_id,
                c.nome AS cliente_nome
             FROM transacoes t
             LEFT JOIN ordens_servico os
                ON t.ordem_servico_id = os.id
             LEFT JOIN clientes c
                ON os.cliente_id = c.id
             WHERE t.id = ?`,
            [id]
        );

        if (transacoes.length === 0) {
            return res.status(404).json({
                mensagem: "Transação não encontrada"
            });
        }

        res.json(transacoes[0]);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao buscar transação"
        });
    }
};


const atualizarTransacao = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            tipo,
            descricao,
            valor,
            status,
            data
        } = req.body;

        const [transacoesVinculadas] = await pool.query(
            `SELECT t.ordem_servico_id, os.status AS ordem_status
             FROM transacoes t
             LEFT JOIN ordens_servico os
                ON t.ordem_servico_id = os.id
             WHERE t.id = ?`,
            [id]
        );

        if (transacoesVinculadas.length === 0) {
            return res.status(404).json({
                mensagem: "Transação não encontrada"
            });
        }

        const transacaoVinculada = transacoesVinculadas[0];

        if (tipo !== "entrada" && tipo !== "saida") {
            return res.status(400).json({
                mensagem: "O tipo deve ser entrada ou saida"
            });
        }

        const [resultado] = await pool.query(
            `UPDATE transacoes
             SET tipo = ?,
                 descricao = ?,
                 valor = ?,
                 status = ?,
                 data = ?
             WHERE id = ?`,
            [
                tipo,
                descricao,
                valor,
                status,
                data || new Date(),
                id
            ]
        );

        res.json({
            mensagem: "Transação atualizada com sucesso"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao atualizar transação"
        });
    }
};


// excluirTransacao removido conforme nova especificação financeira
// Dinheiro só pode ser cancelado ou estornado, não deletado


const resumoFinanceiro = async (req, res) => {
    try {
        const { oficina_id } = req.params;

        const [resultado] = await pool.query(
            `SELECT
                COALESCE(SUM(
                    CASE
                        WHEN tipo = 'entrada' AND status = 'pago'
                        THEN valor
                        ELSE 0
                    END
                ), 0) AS total_entradas,

                COALESCE(SUM(
                    CASE
                        WHEN tipo = 'saida' AND status = 'pago'
                        THEN valor
                        ELSE 0
                    END
                ), 0) AS total_saidas,

                COALESCE(SUM(
                    CASE
                        WHEN tipo = 'entrada' AND status = 'pendente'
                        THEN valor
                        ELSE 0
                    END
                ), 0) AS entradas_pendentes,

                COALESCE(SUM(
                    CASE
                        WHEN tipo = 'saida' AND status = 'pendente'
                        THEN valor
                        ELSE 0
                    END
                ), 0) AS saidas_pendentes

             FROM transacoes
             WHERE oficina_id = ?`,
            [oficina_id]
        );

        const dados = resultado[0];

        const saldo =
            Number(dados.total_entradas) -
            Number(dados.total_saidas);

        res.json({
            total_entradas: Number(dados.total_entradas),
            total_saidas: Number(dados.total_saidas),
            entradas_pendentes: Number(dados.entradas_pendentes),
            saidas_pendentes: Number(dados.saidas_pendentes),
            saldo
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao calcular resumo financeiro"
        });
    }
};


const dashboardFinanceiro = async (req, res) => {
    try {
        const { oficina_id } = req.params;

        const [resultado] = await pool.query(
            `SELECT
                COALESCE(SUM(
                    CASE
                        WHEN tipo = 'entrada'
                        AND status = 'pago'
                        AND MONTH(data) = MONTH(CURRENT_DATE())
                        AND YEAR(data) = YEAR(CURRENT_DATE())
                        THEN valor
                        ELSE 0
                    END
                ), 0) AS faturamento_mes,

                COALESCE(SUM(
                    CASE
                        WHEN tipo = 'saida'
                        AND status = 'pago'
                        AND MONTH(data) = MONTH(CURRENT_DATE())
                        AND YEAR(data) = YEAR(CURRENT_DATE())
                        THEN valor
                        ELSE 0
                    END
                ), 0) AS despesas_mes,

                COALESCE(SUM(
                    CASE
                        WHEN tipo = 'entrada'
                        AND status = 'pendente'
                        THEN valor
                        ELSE 0
                    END
                ), 0) AS contas_receber,

                COALESCE(SUM(
                    CASE
                        WHEN tipo = 'saida'
                        AND status = 'pendente'
                        THEN valor
                        ELSE 0
                    END
                ), 0) AS contas_pagar,

                (
                    SELECT COUNT(*)
                    FROM ordens_servico os_pendentes
                    WHERE os_pendentes.oficina_id = ?
                    AND os_pendentes.status = 'concluida'
                ) AS quantidade_pendentes

             FROM transacoes
             WHERE oficina_id = ?`,
            [oficina_id, oficina_id]
        );

        const dados = resultado[0];

        const faturamento = Number(dados.faturamento_mes);
        const despesas = Number(dados.despesas_mes);

        res.json({
            faturamento_mes: faturamento,
            despesas_mes: despesas,
            lucro_mes: faturamento - despesas,
            contas_receber: Number(dados.contas_receber),
            contas_pagar: Number(dados.contas_pagar),
            quantidade_pendentes: Number(dados.quantidade_pendentes)
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao carregar dashboard financeiro"
        });
    }
};


module.exports = {
    listarTransacoes,
    criarTransacao,
    buscarTransacao,
    atualizarTransacao,
    resumoFinanceiro,
    dashboardFinanceiro,
    criarTransacaoParcelada,
    listarTransacoesVencidas
};