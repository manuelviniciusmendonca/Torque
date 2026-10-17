import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

function Historico() {
    const navigate = useNavigate();

    const [historico, setHistorico] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(false);

    const buscarHistorico = async () => {
        try {
            const dados = await api.get("/historico");

            setHistorico(dados);
            setErro(false);
        } catch (error) {
            console.error("Erro ao carregar histórico:", error);
            setErro(true);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        buscarHistorico();
    }, []);

    const formatarData = (data) => {
        if (!data) return "-";

        return new Date(data).toLocaleDateString("pt-BR");
    };

    const formatarValor = (valor) => {
        return Number(valor || 0).toFixed(2);
    };

    // Separar ordens em andamento e realizadas
    const ordensEmAndamento = historico.filter(item => item.status !== "concluida" && item.status !== "finalizada");
    const ordensRealizadas = historico.filter(item => item.status === "concluida" || item.status === "finalizada");

    return (
        <div className="dashboard">

            <div className="dashboard-header">

                <div>
                    <h1>Histórico</h1>

                    <p>
                        Gerencie ordens de serviço em andamento e realizadas
                    </p>
                </div>

            </div>

            <div className="historico-cards-container">

                {/* CARD - EM ANDAMENTO */}
                <div className="historico-card em-andamento">
                    <div className="historico-card-header">
                        <h2>Em Andamento</h2>
                        <span className="count-badge">{ordensEmAndamento.length}</span>
                    </div>

                    {carregando && <p>Carregando...</p>}
                    {erro && <p>Erro ao carregar</p>}
                    {!carregando && !erro && ordensEmAndamento.length === 0 && (
                        <p className="mensagem-vazia">Nenhuma ordem em andamento</p>
                    )}

                    {!carregando && !erro && ordensEmAndamento.length > 0 && (
                        <div className="historico-list">
                            {ordensEmAndamento.map((item) => (
                                <div
                                    key={item.id}
                                    className="historico-item"
                                    onClick={() => navigate(`/ordens-servico/${item.id}`)}
                                >
                                    <div className="historico-item-info">
                                        <strong>#{item.id}</strong>
                                        <span>{item.cliente_nome}</span>
                                        <small>{item.marca} {item.modelo} - {item.placa}</small>
                                    </div>
                                    <div className="historico-item-status">
                                        <span className={`status-badge ${item.status}`}>{item.status}</span>
                                        <span>R$ {formatarValor(item.valor_total)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* CARD - REALIZADOS */}
                <div className="historico-card realizados">
                    <div className="historico-card-header">
                        <h2>Realizados</h2>
                        <span className="count-badge">{ordensRealizadas.length}</span>
                    </div>

                    {carregando && <p>Carregando...</p>}
                    {erro && <p>Erro ao carregar</p>}
                    {!carregando && !erro && ordensRealizadas.length === 0 && (
                        <p className="mensagem-vazia">Nenhuma ordem realizada</p>
                    )}

                    {!carregando && !erro && ordensRealizadas.length > 0 && (
                        <div className="historico-list">
                            {ordensRealizadas.map((item) => (
                                <div
                                    key={item.id}
                                    className="historico-item"
                                    onClick={() => navigate(`/ordens-servico/${item.id}`)}
                                >
                                    <div className="historico-item-info">
                                        <strong>#{item.id}</strong>
                                        <span>{item.cliente_nome}</span>
                                        <small>{item.marca} {item.modelo} - {item.placa}</small>
                                    </div>
                                    <div className="historico-item-status">
                                        <span className="status-badge concluida">Concluída</span>
                                        <span>R$ {formatarValor(item.valor_total)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

        </div>
    );
}

export default Historico;