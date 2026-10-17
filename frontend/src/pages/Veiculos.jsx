import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

function Veiculos() {
    const navigate = useNavigate();

    const [veiculos, setVeiculos] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(false);

    const buscarVeiculos = async () => {
        try {
            const dados = await api.get("/veiculos");

            setVeiculos(dados);
            setErro(false);

        } catch (error) {
            console.error("Erro ao carregar veículos:", error);
            setErro(true);

        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        buscarVeiculos();
    }, []);

    const formatarData = (data) => {
        if (!data) return "-";

        return new Date(data).toLocaleDateString("pt-BR");
    };

    return (
        <div className="dashboard">

            <div className="dashboard-header">

                <div>
                    <h1>Veículos</h1>

                    <p>
                        Veículos cadastrados na sua oficina
                    </p>
                </div>

            </div>

            <div className="table-container">

                {carregando && (
                    <p>
                        Carregando veículos...
                    </p>
                )}

                {erro && (
                    <p>
                        Não foi possível carregar os veículos.
                    </p>
                )}

                {!carregando &&
                    !erro &&
                    veiculos.length === 0 && (
                    <p>
                        Nenhum veículo cadastrado.
                    </p>
                )}

                {!carregando &&
                    !erro &&
                    veiculos.length > 0 && (

                    <div className="entity-grid">

                        {veiculos.map((veiculo) => (

                            <div key={veiculo.id} className="entity-card">

                                <div className="entity-card-header">
                                    <div>
                                        <span className="entity-card-label">Veículo</span>
                                        <h3>{veiculo.marca} {veiculo.modelo}</h3>
                                        <small className="entity-card-subtitle">{veiculo.placa}</small>
                                    </div>

                                    <button
                                        className="table-button"
                                        onClick={() => navigate(`/veiculos/${veiculo.id}`)}
                                    >
                                        Ver
                                    </button>
                                </div>

                                <div className="entity-card-body">
                                    <div className="entity-row">
                                        <span>Cliente</span>
                                        <strong>{veiculo.cliente_nome}</strong>
                                    </div>

                                    <div className="entity-row">
                                        <span>Telefone</span>
                                        <strong>{veiculo.cliente_telefone || "-"}</strong>
                                    </div>

                                    <div className="entity-row">
                                        <span>Ano / Cor</span>
                                        <strong>{veiculo.ano || "-"} / {veiculo.cor || "-"}</strong>
                                    </div>

                                    <div className="entity-row">
                                        <span>KM</span>
                                        <strong>{veiculo.quilometragem ? `${veiculo.quilometragem} km` : "0 km"}</strong>
                                    </div>

                                    <div className="entity-row">
                                        <span>Último problema</span>
                                        <strong>{veiculo.problema_relatado || "Nenhuma manutenção"}</strong>
                                    </div>

                                    <div className="entity-row">
                                        <span>Status</span>
                                        <strong>{veiculo.os_status || "-"}</strong>
                                    </div>

                                    <div className="entity-row">
                                        <span>Data</span>
                                        <strong>{formatarData(veiculo.data_abertura)}</strong>
                                    </div>
                                </div>

                            </div>

                        ))}

                    </div>
                )}

            </div>

        </div>
    );
}

export default Veiculos;