import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

function Clientes() {
    const navigate = useNavigate();

    const [clientes, setClientes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(false);

    const buscarClientes = async () => {
        try {
            const dados = await api.get("/clientes/com-veiculos");

            setClientes(dados);
            setErro(false);
        } catch (error) {
            console.error("Erro ao carregar clientes:", error);
            setErro(true);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        buscarClientes();
    }, []);

    return (
        <div className="dashboard">

            <div className="dashboard-header">

                <div>
                    <h1>Clientes</h1>

                    <p>
                        Clientes cadastrados na oficina
                    </p>
                </div>

                <button
                    className="primary-button"
                    onClick={() => navigate("/ordens-servico")}
                >
                    + Nova OS
                </button>

            </div>

            <div className="table-container">

                {carregando && (
                    <p>
                        Carregando clientes...
                    </p>
                )}

                {erro && (
                    <p>
                        Não foi possível carregar os clientes.
                    </p>
                )}

                {!carregando &&
                    !erro &&
                    clientes.length === 0 && (
                        <p>
                            Nenhum cliente cadastrado.
                        </p>
                    )}

                {!carregando &&
                    !erro &&
                    clientes.length > 0 && (

                    <div className="entity-grid">

                        {clientes.map((cliente) => (

                            <div key={cliente.id} className="entity-card">

                                <div className="entity-card-header">
                                    <div>
                                        <span className="entity-card-label">Cliente</span>
                                        <h3>{cliente.nome}</h3>
                                    </div>

                                    <button
                                        className="table-button"
                                        onClick={() => navigate(`/clientes/${cliente.id}`)}
                                    >
                                        Ver
                                    </button>
                                </div>

                                <div className="entity-card-body">
                                    <div className="entity-row">
                                        <span>Telefone</span>
                                        <strong>{cliente.telefone || "-"}</strong>
                                    </div>

                                    <div className="entity-row">
                                        <span>Veículo</span>
                                        <strong>
                                            {cliente.veiculo
                                                ? `${cliente.veiculo.marca} ${cliente.veiculo.modelo}`
                                                : "-"}
                                        </strong>
                                    </div>

                                    <div className="entity-row">
                                        <span>Placa</span>
                                        <strong>{cliente.veiculo?.placa || "-"}</strong>
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

export default Clientes;