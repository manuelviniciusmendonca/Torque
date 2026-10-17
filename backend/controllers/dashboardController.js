const pool = require("../config/db");

const obterDadosDashboard = async (req, res) => {
    try {
        const { oficina_id } = req.params;

        // ==========================================
        // 1. CARDS PRINCIPAIS
        // ==========================================

        // OS em andamento (todos os status exceto concluida e finalizada)
        const [osEmAndamento] = await pool.query(
            `SELECT COUNT(*) as total
             FROM ordens_servico
             WHERE oficina_id = ?
             AND status NOT IN ('concluida', 'finalizada')`,
            [oficina_id]
        );

        // Aguardando retirada (status concluida)
        const [osAguardandoRetirada] = await pool.query(
            `SELECT COUNT(*) as total
             FROM ordens_servico
             WHERE oficina_id = ?
             AND status = 'concluida'`,
            [oficina_id]
        );

        // OS abertas hoje
        const [osAbertasHoje] = await pool.query(
            `SELECT COUNT(*) as total
             FROM ordens_servico
             WHERE oficina_id = ?
             AND DATE(data_abertura) = CURDATE()`,
            [oficina_id]
        );

        // Faturamento do mês (entradas pagas do mês atual)
        const [faturamentoMes] = await pool.query(
            `SELECT COALESCE(SUM(valor), 0) as total
             FROM transacoes
             WHERE oficina_id = ?
             AND tipo = 'entrada'
             AND status = 'pago'
             AND MONTH(data) = MONTH(CURRENT_DATE())
             AND YEAR(data) = YEAR(CURRENT_DATE())`,
            [oficina_id]
        );

        // Estoque baixo (quantidade <= estoque_minimo)
        const [estoqueBaixo] = await pool.query(
            `SELECT COUNT(*) as total
             FROM pecas
             WHERE oficina_id = ?
             AND quantidade <= estoque_minimo`,
            [oficina_id]
        );

        // ==========================================
        // 2. RESUMO DE OS POR STATUS
        // ==========================================

        const [osPorStatus] = await pool.query(
            `SELECT status, COUNT(*) as total
             FROM ordens_servico
             WHERE oficina_id = ?
             GROUP BY status`,
            [oficina_id]
        );

        const statusMap = {
            aguardando_avaliacao: 0,
            em_avaliacao: 0,
            aguardando_aprovacao: 0,
            aguardando_peca: 0,
            em_execucao: 0,
            concluida: 0,
            finalizada: 0,
            aberta: 0,
            em_andamento: 0
        };

        osPorStatus.forEach(row => {
            if (statusMap.hasOwnProperty(row.status)) {
                statusMap[row.status] = row.total;
            }
        });

        // ==========================================
        // 3. ORDENS RECENTES (últimas 10)
        // ==========================================

        const [ordensRecentes] = await pool.query(
            `SELECT
                os.id,
                os.status,
                os.valor_total,
                os.data_abertura,
                c.nome AS cliente_nome,
                v.marca,
                v.modelo,
                v.placa
             FROM ordens_servico os
             INNER JOIN clientes c ON os.cliente_id = c.id
             INNER JOIN veiculos v ON os.veiculo_id = v.id
             WHERE os.oficina_id = ?
             ORDER BY os.id DESC
             LIMIT 10`,
            [oficina_id]
        );

        // ==========================================
        // 4. ESTOQUE BAIXO (detalhes)
        // ==========================================

        const [pecasEstoqueBaixo] = await pool.query(
            `SELECT
                id,
                nome,
                quantidade,
                estoque_minimo
             FROM pecas
             WHERE oficina_id = ?
             AND quantidade <= estoque_minimo
             ORDER BY quantidade ASC
             LIMIT 10`,
            [oficina_id]
        );

        // ==========================================
        // 5. SERVIÇOS MAIS REALIZADOS
        // ==========================================

        const [servicosMaisRealizados] = await pool.query(
            `SELECT
                s.nome,
                SUM(oss.quantidade) as total_realizado
             FROM ordem_servico_servicos oss
             INNER JOIN servicos s ON oss.servico_id = s.id
             INNER JOIN ordens_servico os ON oss.ordem_servico_id = os.id
             WHERE os.oficina_id = ?
             GROUP BY s.id, s.nome
             ORDER BY total_realizado DESC
             LIMIT 5`,
            [oficina_id]
        );

        // ==========================================
        // 6. FATURAMENTO DOS ÚLTIMOS 30 DIAS
        // ==========================================

        const [faturamento30Dias] = await pool.query(
            `SELECT
                DATE(data) as data,
                COALESCE(SUM(valor), 0) as total
             FROM transacoes
             WHERE oficina_id = ?
             AND tipo = 'entrada'
             AND status = 'pago'
             AND data >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
             GROUP BY DATE(data)
             ORDER BY data ASC`,
            [oficina_id]
        );

        // ==========================================
        // 7. ALERTAS OPERACIONAIS
        // ==========================================

        const alertas = [];

        // OS aguardando aprovação
        const [osAguardandoAprovacao] = await pool.query(
            `SELECT COUNT(*) as total
             FROM ordens_servico
             WHERE oficina_id = ?
             AND status = 'aguardando_aprovacao'`,
            [oficina_id]
        );

        if (osAguardandoAprovacao[0].total > 0) {
            alertas.push({
                tipo: 'warning',
                mensagem: `${osAguardandoAprovacao[0].total} OS aguardando aprovação do cliente`
            });
        }

        // OS aguardando peça
        const [osAguardandoPeca] = await pool.query(
            `SELECT COUNT(*) as total
             FROM ordens_servico
             WHERE oficina_id = ?
             AND status = 'aguardando_peca'`,
            [oficina_id]
        );

        if (osAguardandoPeca[0].total > 0) {
            alertas.push({
                tipo: 'warning',
                mensagem: `${osAguardandoPeca[0].total} OS aguardando chegada de peças`
            });
        }

        // OS aguardando retirada
        if (osAguardandoRetirada[0].total > 0) {
            alertas.push({
                tipo: 'info',
                mensagem: `${osAguardandoRetirada[0].total} OS prontas aguardando retirada`
            });
        }

        // Estoque baixo
        if (pecasEstoqueBaixo.length > 0) {
            alertas.push({
                tipo: 'danger',
                mensagem: `${pecasEstoqueBaixo.length} peças com estoque baixo`
            });
        }

        // ==========================================
        // RETORNAR DADOS
        // ==========================================

        res.json({
            cards: {
                os_em_andamento: osEmAndamento[0].total,
                aguardando_retirada: osAguardandoRetirada[0].total,
                os_abertas_hoje: osAbertasHoje[0].total,
                faturamento_mes: Number(faturamentoMes[0].total),
                estoque_baixo: estoqueBaixo[0].total
            },
            os_por_status: statusMap,
            ordens_recentes: ordensRecentes,
            estoque_baixo_detalhes: pecasEstoqueBaixo,
            servicos_mais_realizados: servicosMaisRealizados,
            faturamento_30_dias: faturamento30Dias,
            alertas
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            mensagem: "Erro ao carregar dados do dashboard"
        });
    }
};

module.exports = {
    obterDadosDashboard
};
