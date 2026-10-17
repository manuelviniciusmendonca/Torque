import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";

function VeiculoDetalhes() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [veiculo, setVeiculo] = useState(null);
    const [historico, setHistorico] = useState([]);

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(false);

    const carregarDados = async () => {
        try {
            const [veiculoData, historicoData] = await Promise.all([
                api.get(`/veiculos/${id}`),
                api.get(`/veiculos/${id}/historico`)
            ]);

            setVeiculo(veiculoData);
            setHistorico(historicoData);

            setErro(false);

        } catch (error) {
            console.error(
                "Erro ao carregar veículo:",
                error
            );

            setErro(true);

        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, [id]);

    const formatarData = (data) => {
        if (!data) {
            return "-";
        }

        return new Date(data).toLocaleDateString("pt-BR");
    };

    const formatarValor = (valor) => {
        return Number(valor || 0).toFixed(2);
    };

    if (carregando) {
        return (
            <div className="dashboard">
                <p>Carregando veículo...</p>
            </div>
        );
    }

    if (erro || !veiculo) {
        return (
            <div className="dashboard">

                <div className="dashboard-section">

                    <p>
                        Não foi possível carregar o veículo.
                    </p>

                    <button
                        className="secondary-button"
                        onClick={() => navigate("/veiculos")}
                    >
                        Voltar para veículos
                    </button>

                </div>

            </div>
        );
    }

    return (
        <div className="dashboard">

            <div className="dashboard-header">

                <div>

                    <h1>
                        {veiculo.marca} {veiculo.modelo}
                    </h1>

                    <p>
                        Placa: {veiculo.placa}
                    </p>

                </div>

                <button
                    className="secondary-button"
                    onClick={() => navigate("/veiculos")}
                >
                    Voltar
                </button>

            </div>

            <div className="dashboard-section">

                <h2>Informações do veículo</h2>

                <div className="financial-summary">

                    <div>
                        <span>Placa</span>

                        <strong>
                            {veiculo.placa}
                        </strong>
                    </div>

                    <div>
                        <span>Marca</span>

                        <strong>
                            {veiculo.marca}
                        </strong>
                    </div>

                    <div>
                        <span>Modelo</span>

                        <strong>
                            {veiculo.modelo}
                        </strong>
                    </div>

                    <div>
                        <span>Ano</span>

                        <strong>
                            {veiculo.ano || "-"}
                        </strong>
                    </div>

                    <div>
                        <span>Cor</span>

                        <strong>
                            {veiculo.cor || "-"}
                        </strong>
                    </div>

                    <div>
                        <span>Quilometragem</span>

                        <strong>
                            {Number(
                                veiculo.quilometragem || 0
                            ).toLocaleString("pt-BR")} km
                        </strong>
                    </div>

                </div>

            </div>

            <div className="dashboard-section">

                <h2>Cliente</h2>

                <p>
                    <strong>
                        {veiculo.cliente_nome}
                    </strong>
                </p>

                <p>
                    Telefone:{" "}
                    {veiculo.cliente_telefone || "-"}
                </p>

            </div>

            <div className="dashboard-section">

                <div className="section-header">

                    <div>

                        <h2>
                            Histórico de manutenção
                        </h2>

                        <p>
                            Todas as ordens de serviço deste veículo
                        </p>

                    </div>

                </div>

                {historico.length === 0 && (

                    <p>
                        Nenhuma manutenção registrada.
                    </p>

                )}

                {historico.length > 0 && (

                    <table>

                        <thead>

                            <tr>
                                <th>OS</th>
                                <th>Problema</th>
                                <th>Diagnóstico</th>
                                <th>Status</th>
                                <th>Valor</th>
                                <th>Data</th>
                                <th>Ação</th>
                            </tr>

                        </thead>

                        <tbody>

                            {historico.map((item) => (

                                <tr key={item.id}>

                                    <td>
                                        #{item.id}
                                    </td>

                                    <td>
                                        {item.problema_relatado || "-"}
                                    </td>

                                    <td>
                                        {item.diagnostico || "-"}
                                    </td>

                                    <td>
                                        {item.status}
                                    </td>

                                    <td>
                                        R${" "}
                                        {formatarValor(
                                            item.valor_total
                                        )}
                                    </td>

                                    <td>
                                        {formatarData(
                                            item.data_abertura
                                        )}
                                    </td>

                                    <td>

                                        <button
                                            className="table-button"
                                            onClick={() =>
                                                navigate(
                                                    `/ordens-servico/${item.id}`
                                                )
                                            }
                                        >
                                            Ver OS
                                        </button>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                )}

            </div>

        </div>
    );
}

export default VeiculoDetalhes;