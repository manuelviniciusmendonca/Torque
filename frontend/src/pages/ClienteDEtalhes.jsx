import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";

function ClienteDetalhes() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [cliente, setCliente] = useState(null);
    const [historico, setHistorico] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(false);

    const carregarDados = async () => {
        try {
            const [dadosCliente, dadosHistorico] = await Promise.all([
                api.get(`/clientes/${id}`),
                api.get(`/clientes/${id}/historico`)
            ]);

            setCliente(dadosCliente);
            setHistorico(dadosHistorico);
            setErro(false);
        } catch (error) {
            console.error("Erro ao carregar cliente:", error);
            setErro(true);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarDados();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const formatarData = (data) => {
        if (!data) return "-";

        return new Date(data).toLocaleDateString("pt-BR");
    };

    const formatarValor = (valor) => {
        return Number(valor || 0).toFixed(2);
    };

    if (carregando) {
        return <p>Carregando cliente...</p>;
    }

    if (erro || !cliente) {
        return (
            <div className="dashboard">
                <div className="dashboard-section">
                    <p>Não foi possível carregar o cliente.</p>

                    <button
                        className="secondary-button"
                        onClick={() => navigate("/clientes")}
                    >
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">

            <div className="dashboard-header">

                <div>
                    <h1>{cliente.nome}</h1>

                    <p>
                        Histórico de manutenções deste cliente
                    </p>
                </div>

                <button
                    className="secondary-button"
                    onClick={() => navigate("/clientes")}
                >
                    Voltar
                </button>

            </div>

            {/* DADOS DO CLIENTE */}

            <div className="dashboard-section">

                <h2>Dados do cliente</h2>

                <div className="financial-summary">

                    <div>
                        <span>Telefone</span>
                        <strong>{cliente.telefone || "-"}</strong>
                    </div>

                    <div>
                        <span>WhatsApp</span>
                        <strong>{cliente.whatsapp || "-"}</strong>
                    </div>

                </div>

            </div>

            {/* HISTÓRICO DE MANUTENÇÕES */}

            <h2>Manutenções</h2>

            {!erro && historico.length === 0 && (
                <div className="dashboard-section">
                    <p>
                        Nenhuma manutenção encontrada para este cliente.
                    </p>
                </div>
            )}

            {!erro && historico.length > 0 && (

                <div>

                    {historico.map((item) => (

                        <div
                            className="dashboard-section"
                            key={item.id}
                        >

                            {/* CABEÇALHO DA OS */}

                            <div className="dashboard-header">

                                <div>

                                    <h2>
                                        OS #{item.id}
                                    </h2>

                                    <p>
                                        {item.marca} {item.modelo} —{" "}
                                        {item.placa}
                                    </p>

                                </div>

                                <div>

                                    <strong>
                                        R$ {formatarValor(item.valor_total)}
                                    </strong>

                                </div>

                            </div>


                            {/* INFORMAÇÕES DO VEÍCULO */}

                            <h3>
                                Veículo
                            </h3>

                            <div className="form-row">

                                <div>
                                    <strong>Marca</strong>
                                    <p>{item.marca || "-"}</p>
                                </div>

                                <div>
                                    <strong>Modelo</strong>
                                    <p>{item.modelo || "-"}</p>
                                </div>

                                <div>
                                    <strong>Placa</strong>
                                    <p>{item.placa || "-"}</p>
                                </div>

                                <div>
                                    <strong>Ano</strong>
                                    <p>{item.ano || "-"}</p>
                                </div>

                                <div>
                                    <strong>Cor</strong>
                                    <p>{item.cor || "-"}</p>
                                </div>

                            </div>


                            {/* INFORMAÇÕES DA MANUTENÇÃO */}

                            <h3>
                                Manutenção
                            </h3>

                            <div className="form-row">

                                <div>
                                    <strong>Data</strong>
                                    <p>
                                        {formatarData(
                                            item.data_abertura
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <strong>Quilometragem</strong>
                                    <p>
                                        {item.quilometragem || 0} km
                                    </p>
                                </div>

                                <div>
                                    <strong>Status</strong>
                                    <p>
                                        {item.status}
                                    </p>
                                </div>

                            </div>


                            {/* PROBLEMA */}

                            <h3>
                                Problema relatado
                            </h3>

                            <p>
                                {item.problema_relatado || "-"}
                            </p>


                            {/* DIAGNÓSTICO */}

                            <h3>
                                Diagnóstico
                            </h3>

                            <p>
                                {item.diagnostico || "-"}
                            </p>


                            {/* OBSERVAÇÕES */}

                            <h3>
                                Observações
                            </h3>

                            <p>
                                {item.observacoes || "-"}
                            </p>


                            {/* SERVIÇOS */}

                            <h3>
                                Serviços realizados
                            </h3>

                            {item.servicos && item.servicos.length > 0 ? (

                                <table>

                                    <thead>

                                        <tr>
                                            <th>Serviço</th>
                                            <th>Quantidade</th>
                                            <th>Preço</th>
                                            <th>Subtotal</th>
                                        </tr>

                                    </thead>

                                    <tbody>

                                        {item.servicos.map((servico) => (

                                            <tr key={servico.id}>

                                                <td>
                                                    {servico.nome}
                                                </td>

                                                <td>
                                                    {servico.quantidade}
                                                </td>

                                                <td>
                                                    R$ {formatarValor(
                                                        servico.preco
                                                    )}
                                                </td>

                                                <td>
                                                    R$ {formatarValor(
                                                        servico.subtotal
                                                    )}
                                                </td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            ) : (

                                <p>
                                    Nenhum serviço registrado.
                                </p>

                            )}


                            {/* PEÇAS */}

                            <h3>
                                Peças utilizadas
                            </h3>

                            {item.pecas && item.pecas.length > 0 ? (

                                <table>

                                    <thead>

                                        <tr>
                                            <th>Peça</th>
                                            <th>Código</th>
                                            <th>Quantidade</th>
                                            <th>Preço</th>
                                            <th>Subtotal</th>
                                        </tr>

                                    </thead>

                                    <tbody>

                                        {item.pecas.map((peca) => (

                                            <tr key={peca.id}>

                                                <td>
                                                    {peca.nome}
                                                </td>

                                                <td>
                                                    {peca.codigo || "-"}
                                                </td>

                                                <td>
                                                    {peca.quantidade}
                                                </td>

                                                <td>
                                                    R$ {formatarValor(
                                                        peca.preco
                                                    )}
                                                </td>

                                                <td>
                                                    R$ {formatarValor(
                                                        peca.subtotal
                                                    )}
                                                </td>

                                            </tr>

                                        ))}

                                    </tbody>

                                </table>

                            ) : (

                                <p>
                                    Nenhuma peça utilizada.
                                </p>

                            )}


                            {/* RODAPÉ */}

                            <div className="financial-summary">

                                <div>

                                    <span>
                                        Total da manutenção
                                    </span>

                                    <strong>
                                        R$ {formatarValor(
                                            item.valor_total
                                        )}
                                    </strong>

                                </div>

                                <button
                                    className="primary-button"
                                    onClick={() =>
                                        navigate(
                                            `/ordens-servico/${item.id}`
                                        )
                                    }
                                >
                                    Ver OS completa
                                </button>

                            </div>

                        </div>

                    ))}

                </div>

            )}

        </div>
    );
}

export default ClienteDetalhes;