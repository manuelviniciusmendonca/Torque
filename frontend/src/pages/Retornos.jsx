import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useConfirm } from "../components/ConfirmContext";

function Retornos() {
    const navigate = useNavigate();
    const confirmAction = useConfirm();

    const [lembretes, setLembretes] = useState([]);
    const [resumo, setResumo] = useState({
        total: 0,
        hoje: 0,
        proximos: 0,
        atrasados: 0
    });
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(false);

    const buscarLembretes = async () => {
        try {
            const dados = await api.get("/lembretes?oficina_id=1");
            setLembretes(dados);
            setErro(false);
        } catch (error) {
            console.error("Erro ao carregar lembretes:", error);
            setErro(true);
        } finally {
            setCarregando(false);
        }
    };

    const buscarResumo = async () => {
        try {
            const dados = await api.get("/lembretes/resumo?oficina_id=1");
            setResumo(dados);
        } catch (error) {
            console.error("Erro ao carregar resumo:", error);
        }
    };

    useEffect(() => {
        buscarLembretes();
        buscarResumo();
    }, []);

    const formatarData = (data) => {
        if (!data) return "-";
        return new Date(data).toLocaleDateString("pt-BR");
    };

    const calcularDiasRestantes = (data) => {
        if (!data) return 0;
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataAlvo = new Date(data);
        const diffTime = dataAlvo - hoje;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const categorizarLembretes = () => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        return {
            hoje: lembretes.filter(l => {
                const dataLembrete = new Date(l.data_lembrete);
                return dataLembrete.toDateString() === hoje.toDateString() && l.status !== 'concluido' && l.status !== 'cancelado';
            }),
            proximos: lembretes.filter(l => {
                const dataLembrete = new Date(l.data_lembrete);
                const diffTime = dataLembrete - hoje;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays > 0 && diffDays <= 7 && l.status !== 'concluido' && l.status !== 'cancelado';
            }),
            vencidos: lembretes.filter(l => {
                const dataRetorno = new Date(l.data_retorno);
                return dataRetorno < hoje && l.status !== 'concluido' && l.status !== 'cancelado';
            }),
            pendentes: lembretes.filter(l => {
                const dataLembrete = new Date(l.data_lembrete);
                const diffTime = dataLembrete - hoje;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                return diffDays > 7 && l.status === 'pendente';
            }),
            concluidos: lembretes.filter(l => l.status === 'concluido'),
            cancelados: lembretes.filter(l => l.status === 'cancelado')
        };
    };

    const categorias = categorizarLembretes();

    const contatarCliente = (telefone, whatsapp) => {
        const numero = whatsapp || telefone;
        if (numero) {
            const numeroLimpo = numero.replace(/\D/g, '');
            window.open(`https://wa.me/55${numeroLimpo}`, '_blank');
        } else {
            alert("Cliente não possui telefone cadastrado");
        }
    };

    const concluirLembrete = async (id) => {
        const confirmar = await confirmAction({
            title: "Concluir lembrete?",
            message: "O lembrete será marcado como concluído.",
            confirmLabel: "Concluir",
            variant: "primary"
        });
        if (!confirmar) return;

        try {
            await api.put(`/lembretes/${id}/concluir`);
            await buscarLembretes();
            await buscarResumo();
            alert("Lembrete concluído!");
        } catch (error) {
            console.error("Erro ao concluir lembrete:", error);
            alert("Erro ao concluir lembrete");
        }
    };

    const cancelarLembrete = async (id) => {
        const confirmar = await confirmAction({
            title: "Cancelar lembrete?",
            message: "O lembrete será marcado como cancelado.",
            confirmLabel: "Cancelar lembrete",
            variant: "warning"
        });
        if (!confirmar) return;

        try {
            await api.put(`/lembretes/${id}/cancelar`);
            await buscarLembretes();
            await buscarResumo();
            alert("Lembrete cancelado!");
        } catch (error) {
            console.error("Erro ao cancelar lembrete:", error);
            alert("Erro ao cancelar lembrete");
        }
    };

    const excluirLembrete = async (id) => {
        const confirmar = await confirmAction({
            title: "Excluir lembrete?",
            message: "Este lembrete será removido permanentemente.",
            confirmLabel: "Excluir lembrete",
            variant: "danger"
        });
        if (!confirmar) return;

        try {
            await api.delete(`/lembretes/${id}`);
            await buscarLembretes();
            await buscarResumo();
            alert("Lembrete excluído!");
        } catch (error) {
            console.error("Erro ao excluir lembrete:", error);
            alert("Erro ao excluir lembrete");
        }
    };

    const renderLembreteCard = (lembrete) => {
        const diasRestantes = calcularDiasRestantes(lembrete.data_retorno);
        
        return (
            <div key={lembrete.id} className="lembrete-card">
                <div className="lembrete-header">
                    <div>
                        <strong>#{lembrete.id}</strong>
                        <span className={`status-badge ${lembrete.status}`}>{lembrete.status}</span>
                    </div>
                    <div className="lembrete-actions">
                        <button 
                            className="table-button"
                            onClick={() => contatarCliente(lembrete.cliente_telefone, lembrete.cliente_whatsapp)}
                            title="Contatar cliente"
                        >
                            📱
                        </button>
                        {lembrete.status !== 'concluido' && lembrete.status !== 'cancelado' && (
                            <>
                                <button 
                                    className="table-button finalize"
                                    onClick={() => concluirLembrete(lembrete.id)}
                                    title="Concluir"
                                >
                                    ✓
                                </button>
                                <button 
                                    className="table-button delete"
                                    onClick={() => cancelarLembrete(lembrete.id)}
                                    title="Cancelar"
                                >
                                    ✕
                                </button>
                            </>
                        )}
                        <button 
                            className="table-button delete"
                            onClick={() => excluirLembrete(lembrete.id)}
                            title="Excluir"
                        >
                            🗑
                        </button>
                    </div>
                </div>
                
                <div className="lembrete-cliente">
                    <strong>{lembrete.cliente_nome}</strong>
                    <small>{lembrete.cliente_telefone}</small>
                </div>
                
                <div className="lembrete-veiculo">
                    <span>{lembrete.marca} {lembrete.modelo}</span>
                    <small>{lembrete.placa}</small>
                </div>
                
                <div className="lembrete-detalhes">
                    <div>
                        <span>Motivo:</span>
                        <strong>{lembrete.motivo}</strong>
                    </div>
                    <div>
                        <span>Retorno:</span>
                        <strong>{formatarData(lembrete.data_retorno)}</strong>
                        {diasRestantes !== 0 && (
                            <small className={diasRestantes < 0 ? 'texto-vermelho' : 'texto-verde'}>
                                {diasRestantes < 0 ? `${Math.abs(diasRestantes)} dias atrasado` : `${diasRestantes} dias restantes`}
                            </small>
                        )}
                    </div>
                    {lembrete.servico_nome && (
                        <div>
                            <span>Serviço:</span>
                            <strong>{lembrete.servico_nome}</strong>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>Retornos</h1>
                    <p>Lembretes de retorno criados automaticamente pelos serviços</p>
                </div>
            </div>

            {/* Resumo */}
            <div className="dashboard-cards">
                <div className="dashboard-card">
                    <span>Total de retornos</span>
                    <strong>{resumo.total}</strong>
                </div>
                <div className="dashboard-card" style={{borderTop: '4px solid #b42318'}}>
                    <span>Hoje</span>
                    <strong>{resumo.hoje}</strong>
                </div>
                <div className="dashboard-card" style={{borderTop: '4px solid #f59e0b'}}>
                    <span>Próximos 7 dias</span>
                    <strong>{resumo.proximos}</strong>
                </div>
                <div className="dashboard-card" style={{borderTop: '4px solid #dc2626'}}>
                    <span>Atrasados</span>
                    <strong>{resumo.atrasados}</strong>
                </div>
            </div>

            {carregando && <p>Carregando lembretes...</p>}
            {erro && <p>Erro ao carregar lembretes.</p>}

            {!carregando && !erro && (
                <div className="lembretes-container">
                    {/* Hoje */}
                    {categorias.hoje.length > 0 && (
                        <div className="lembretes-section">
                            <h2>📅 Hoje ({categorias.hoje.length})</h2>
                            <div className="lembretes-grid">
                                {categorias.hoje.map(renderLembreteCard)}
                            </div>
                        </div>
                    )}

                    {/* Próximos */}
                    {categorias.proximos.length > 0 && (
                        <div className="lembretes-section">
                            <h2>📆 Próximos 7 dias ({categorias.proximos.length})</h2>
                            <div className="lembretes-grid">
                                {categorias.proximos.map(renderLembreteCard)}
                            </div>
                        </div>
                    )}

                    {/* Vencidos */}
                    {categorias.vencidos.length > 0 && (
                        <div className="lembretes-section">
                            <h2>⚠️ Atrasados ({categorias.vencidos.length})</h2>
                            <div className="lembretes-grid">
                                {categorias.vencidos.map(renderLembreteCard)}
                            </div>
                        </div>
                    )}

                    {/* Pendentes */}
                    {categorias.pendentes.length > 0 && (
                        <div className="lembretes-section">
                            <h2>⏳ Pendentes ({categorias.pendentes.length})</h2>
                            <div className="lembretes-grid">
                                {categorias.pendentes.map(renderLembreteCard)}
                            </div>
                        </div>
                    )}

                    {/* Concluídos */}
                    {categorias.concluidos.length > 0 && (
                        <div className="lembretes-section">
                            <h2>✅ Concluídos ({categorias.concluidos.length})</h2>
                            <div className="lembretes-grid">
                                {categorias.concluidos.map(renderLembreteCard)}
                            </div>
                        </div>
                    )}

                    {/* Cancelados */}
                    {categorias.cancelados.length > 0 && (
                        <div className="lembretes-section">
                            <h2>❌ Cancelados ({categorias.cancelados.length})</h2>
                            <div className="lembretes-grid">
                                {categorias.cancelados.map(renderLembreteCard)}
                            </div>
                        </div>
                    )}

                    {/* Sem lembretes */}
                    {lembretes.length === 0 && (
                        <div className="mensagem-vazia">
                            <p>Nenhum lembrete de retorno cadastrado.</p>
                            <p>Os lembretes são criados automaticamente ao finalizar ordens de serviço que contenham serviços configurados com retorno.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Retornos;