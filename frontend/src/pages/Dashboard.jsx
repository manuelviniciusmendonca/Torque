import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

function Dashboard() {
    const navigate = useNavigate();
    const [dados, setDados] = useState(null);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(false);

    useEffect(() => {
        const carregarDashboard = async () => {
            try {
                const resultado = await api.get("/dashboard/1");
                setDados(resultado);
                setErro(false);
            } catch (error) {
                console.error(error);
                setErro(true);
            } finally {
                setCarregando(false);
            }
        };

        carregarDashboard();
    }, []);

    const formatarValor = (valor) => {
        return Number(valor || 0).toFixed(2);
    };

    const formatarData = (data) => {
        if (!data) return "-";
        return new Date(data).toLocaleDateString("pt-BR");
    };

    const getStatusLabel = (status) => {
        const labels = {
            aguardando_avaliacao: "Aguardando avaliação",
            em_avaliacao: "Em avaliação",
            aguardando_aprovacao: "Aguardando aprovação",
            aguardando_peca: "Aguardando peça",
            em_execucao: "Em execução",
            concluida: "Concluído / Aguardando retirada",
            finalizada: "Finalizada",
            aberta: "Aberta",
            em_andamento: "Em andamento"
        };
        return labels[status] || status;
    };

    const getStatusColor = (status) => {
        const colors = {
            aguardando_avaliacao: "#F59E0B",
            em_avaliacao: "#3B82F6",
            aguardando_aprovacao: "#F97316",
            aguardando_peca: "#8B5CF6",
            em_execucao: "#06B6D4",
            concluida: "#22C55E",
            finalizada: "#166534",
            aberta: "#F59E0B",
            em_andamento: "#06B6D4"
        };
        return colors[status] || "#6B7280";
    };

    const statusConfig = [
        ["aguardando_avaliacao", "Aguardando avaliação"],
        ["em_avaliacao", "Em avaliação"],
        ["aguardando_aprovacao", "Aguardando aprovação"],
        ["aguardando_peca", "Aguardando peça"],
        ["em_execucao", "Em execução"],
        ["concluida", "Aguardando retirada"],
        ["finalizada", "Finalizada"]
    ];

    if (carregando) {
        return (
            <div className="dashboard">
                <p>Carregando dashboard...</p>
            </div>
        );
    }

    if (erro) {
        return (
            <div className="dashboard-error">
                <h2>Não foi possível carregar o dashboard.</h2>
                <p>Verifique se o servidor está funcionando.</p>
            </div>
        );
    }

    return (
        <div className="dashboard">

            <div className="dashboard-header dashboard-page-header">
                <div>
                    <h1>Dashboard</h1>
                    <p>Visão geral da sua oficina</p>
                </div>
                <div className="dashboard-header-meta">
                    <span>Atualizado agora</span>
                </div>
            </div>

            {/* 1. CARDS PRINCIPAIS */}
            <div className="dashboard-cards">
                <div className="dashboard-card dashboard-card-blue" style={{ '--card-accent': '#2563eb' }}>
                    <span>OS em andamento</span>
                    <strong>{dados.cards.os_em_andamento}</strong>
                    <small>Em atendimento</small>
                </div>

                <div className="dashboard-card dashboard-card-green" style={{ '--card-accent': '#16a34a' }}>
                    <span>Aguardando retirada</span>
                    <strong>{dados.cards.aguardando_retirada}</strong>
                    <small>Serviços concluídos</small>
                </div>

                <div className="dashboard-card dashboard-card-sky" style={{ '--card-accent': '#0284c7' }}>
                    <span>OS abertas hoje</span>
                    <strong>{dados.cards.os_abertas_hoje}</strong>
                    <small>Novas entradas</small>
                </div>

                <div className="dashboard-card dashboard-card-indigo" style={{ '--card-accent': '#1d4ed8' }}>
                    <span>Faturamento do mês</span>
                    <strong>R$ {formatarValor(dados.cards.faturamento_mes)}</strong>
                    <small>Entradas pagas</small>
                </div>

                <div className="dashboard-card dashboard-card-red" style={{ '--card-accent': '#dc2626' }}>
                    <span>Estoque baixo</span>
                    <strong>{dados.cards.estoque_baixo}</strong>
                    <small>Itens precisam de atenção</small>
                </div>
            </div>

            {/* 2. RESUMO DE OS POR STATUS */}
            <div className="dashboard-section">
                <div className="section-header">
                    <h2>Resumo de Ordens de Serviço</h2>
                </div>
                <div className="os-status-summary">
                    {statusConfig.map(([status, label]) => (
                        <div className="status-item" key={status}>
                            <div className="status-indicator" style={{ backgroundColor: getStatusColor(status) }}></div>
                            <span>{label}</span>
                            <strong>{dados.os_por_status[status] || 0}</strong>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. ORDENS RECENTES */}
            <div className="dashboard-section dashboard-two-columns">
                <div>
                <div className="section-header">
                    <h2>Ordens Recentes</h2>
                    <p>Acompanhe os últimos atendimentos registrados</p>
                </div>
                <div className="table-container">
                    {dados.ordens_recentes.length === 0 ? (
                        <p>Nenhuma ordem de serviço cadastrada.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>OS</th>
                                    <th>Cliente</th>
                                    <th>Veículo</th>
                                    <th>Status</th>
                                    <th>Valor</th>
                                    <th>Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dados.ordens_recentes.map((ordem) => (
                                    <tr 
                                        key={ordem.id} 
                                        className="table-row-clickable"
                                        onClick={() => navigate(`/ordens-servico/${ordem.id}`)}
                                    >
                                        <td><strong>#{ordem.id}</strong></td>
                                        <td>{ordem.cliente_nome}</td>
                                        <td>{ordem.marca} {ordem.modelo} - {ordem.placa}</td>
                                        <td>
                                            <span 
                                                className="status-badge"
                                                style={{ 
                                                    backgroundColor: getStatusColor(ordem.status) + "20",
                                                    color: getStatusColor(ordem.status)
                                                }}
                                            >
                                                {getStatusLabel(ordem.status)}
                                            </span>
                                        </td>
                                        <td>R$ {formatarValor(ordem.valor_total)}</td>
                                        <td>{formatarData(ordem.data_abertura)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                </div>
            </div>

            {/* 4. ESTOQUE BAIXO */}
            <div className="dashboard-section dashboard-two-columns">
                <div>
                <div className="section-header">
                    <h2>Estoque Baixo</h2>
                    <p>Peças abaixo do nível mínimo configurado</p>
                </div>
                {dados.estoque_baixo_detalhes.length === 0 ? (
                    <div className="info-message">
                        <p>✓ Estoque normal - nenhuma peça abaixo do mínimo</p>
                    </div>
                ) : (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Peça</th>
                                    <th>Quantidade Atual</th>
                                    <th>Estoque Mínimo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dados.estoque_baixo_detalhes.map((peca) => (
                                    <tr key={peca.id}>
                                        <td>{peca.nome}</td>
                                        <td style={{ color: "#DC2626", fontWeight: "bold" }}>{peca.quantidade}</td>
                                        <td>{peca.estoque_minimo}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                </div>
            </div>

            {/* 5. SERVIÇOS MAIS REALIZADOS */}
            <div className="dashboard-section">
                <div className="section-header">
                    <h2>Serviços Mais Realizados</h2>
                </div>
                {dados.servicos_mais_realizados.length === 0 ? (
                    <p>Nenhum serviço realizado ainda.</p>
                ) : (
                    <div className="servicos-list">
                        {dados.servicos_mais_realizados.map((servico, index) => (
                            <div key={index} className="servico-item">
                                <span>{servico.nome}</span>
                                <strong>{servico.total_realizado}x</strong>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 6. FATURAMENTO (GRÁFICO SIMPLES) */}
            <div className="dashboard-section">
                <div className="section-header">
                    <h2>Faturamento dos Últimos 30 Dias</h2>
                    <p>Entradas pagas agrupadas por dia</p>
                </div>
                {dados.faturamento_30_dias.length === 0 ? (
                    <p>Sem dados de faturamento no período.</p>
                ) : (
                    <div className="chart-summary">
                        <strong>R$ {formatarValor(dados.faturamento_30_dias.reduce((total, item) => total + Number(item.total || 0), 0))}</strong>
                        <span>Total no período</span>
                    </div>
                )}
                {dados.faturamento_30_dias.length > 0 && (
                    <div className="faturamento-chart" role="img" aria-label="Gráfico de faturamento dos últimos 30 dias">
                        {dados.faturamento_30_dias.map((item, index) => {
                            const maxValor = Math.max(...dados.faturamento_30_dias.map(d => d.total));
                            const altura = maxValor > 0 ? (item.total / maxValor) * 100 : 0;
                            return (
                                <div key={index} className="chart-bar-container">
                                    <div 
                                        className="chart-bar"
                                        style={{ height: `${altura}%` }}
                                        title={`R$ ${formatarValor(item.total)}`}
                                    ></div>
                                    <div className="chart-label">
                                        {new Date(item.data).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 7. ALERTAS OPERACIONAIS */}
            {dados.alertas.length > 0 && (
                <div className="dashboard-section">
                    <div className="section-header">
                        <h2>Alertas Operacionais</h2>
                    </div>
                    <div className="alertas-container">
                        {dados.alertas.map((alerta, index) => (
                            <div key={index} className={`alerta-item alerta-${alerta.tipo}`}>
                                <span>{alerta.mensagem}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}

export default Dashboard;
