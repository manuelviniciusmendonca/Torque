import { useEffect, useState } from "react";
import { api } from "../services/api";

function Estoque() {
    const [pecas, setPecas] = useState([]);
    const [estoqueBaixo, setEstoqueBaixo] = useState([]);
    const [comprasPecas, setComprasPecas] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(false);
    const [mostrarModalCompra, setMostrarModalCompra] = useState(false);
    const [salvandoCompra, setSalvandoCompra] = useState(false);
    const [erroCompra, setErroCompra] = useState("");
    const [dadosCompra, setDadosCompra] = useState({
        peca_id: "",
        codigo_peca: "",
        fornecedor: "",
        quantidade: "",
        valor_unitario: "",
        vencimento: new Date().toISOString().split("T")[0]
    });

    const carregarDados = async () => {
        try {
            const [todasPecas, baixas, compras] = await Promise.all([
                api.get("/pecas"),
                api.get("/estoque/baixo"),
                api.get("/estoque/compras")
            ]);

            setPecas(todasPecas);
            setEstoqueBaixo(baixas);
            setComprasPecas(compras);
            setErro(false);
        } catch (error) {
            console.error("Erro ao carregar estoque:", error);
            setErro(true);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, []);

    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };

    const estaBaixo = (peca) => {
        return Number(peca.quantidade) <= Number(peca.estoque_minimo || 0);
    };

    const fecharModalCompra = () => {
        setMostrarModalCompra(false);
        setErroCompra("");
        setDadosCompra({
            peca_id: "",
            codigo_peca: "",
            fornecedor: "",
            quantidade: "",
            valor_unitario: "",
            vencimento: new Date().toISOString().split("T")[0]
        });
    };

    const registrarCompra = async (event) => {
        event.preventDefault();
        setErroCompra("");
        setSalvandoCompra(true);

        try {
            await api.post("/estoque/compras", {
                ...dadosCompra,
                peca_id: Number(dadosCompra.peca_id),
                quantidade: Number(dadosCompra.quantidade),
                valor_unitario: Number(dadosCompra.valor_unitario)
            });
            fecharModalCompra();
            setCarregando(true);
            await carregarDados();
        } catch (error) {
            console.error("Erro ao registrar compra:", error);
            setErroCompra(error.message || "Não foi possível registrar a compra.");
        } finally {
            setSalvandoCompra(false);
        }
    };

    const valorTotalCompra = Math.round(Number(dadosCompra.valor_unitario || 0) * 100) *
        Number(dadosCompra.quantidade || 0) / 100;

    const valorTotalEstoqueVenda = pecas.reduce((total, peca) => {
        return total + Number(peca.quantidade || 0) * Number(peca.preco_venda || 0);
    }, 0);

    const valorTotalEstoqueCusto = pecas.reduce((total, peca) => {
        return total + Number(peca.quantidade || 0) * Number(peca.preco_custo || 0);
    }, 0);

    const valorTotalCompras = comprasPecas.reduce((total, compra) => {
        return total + Number(compra.valor_total || 0);
    }, 0);

    if (carregando) {
        return (
            <div className="dashboard">
                <p>Carregando estoque...</p>
            </div>
        );
    }

    if (erro) {
        return (
            <div className="dashboard-error">
                <h2>Não foi possível carregar o estoque.</h2>
                <p>Verifique se o servidor está funcionando.</p>
            </div>
        );
    }

    return (
        <div className="dashboard">

            <div className="dashboard-header dashboard-page-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                <div>
                    <h1>Estoque</h1>
                    <p>Visão geral das peças e movimentações</p>
                </div>
                <button className="primary-button" onClick={() => setMostrarModalCompra(true)}>
                    + Nova compra de peças
                </button>
            </div>

            {/* Cards de resumo */}
            <div className="dashboard-cards">
                <div className="dashboard-card dashboard-card-blue">
                    <span>Peças cadastradas</span>
                    <strong>{pecas.length}</strong>
                </div>
                <div className="dashboard-card dashboard-card-red">
                    <span>Estoque baixo</span>
                    <strong>{estoqueBaixo.length}</strong>
                </div>
                <div className="dashboard-card dashboard-card-green">
                    <span>Valor de venda</span>
                    <strong>{formatarMoeda(valorTotalEstoqueVenda)}</strong>
                </div>
                <div className="dashboard-card dashboard-card-sky">
                    <span>Valor de custo</span>
                    <strong>{formatarMoeda(valorTotalEstoqueCusto)}</strong>
                </div>
                <div className="dashboard-card dashboard-card-indigo">
                    <span>Total em compras registradas</span>
                    <strong>{formatarMoeda(valorTotalCompras)}</strong>
                </div>
            </div>

            {/* ALERTA DE ESTOQUE BAIXO */}
            <div className="dashboard-section">
                <div className="section-header">
                    <h2>Estoque baixo</h2>
                    <p>Peças que atingiram ou passaram do estoque mínimo</p>
                </div>

                {estoqueBaixo.length === 0 && (
                    <div className="info-message">
                        Nenhuma peça com estoque baixo no momento.
                    </div>
                )}

                {estoqueBaixo.length > 0 && (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Peça</th>
                                    <th>Código</th>
                                    <th>Estoque atual</th>
                                    <th>Estoque mínimo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {estoqueBaixo.map((peca) => (
                                    <tr key={peca.id}>
                                        <td>
                                            <strong>{peca.nome}</strong>
                                        </td>
                                        <td>
                                            {peca.codigo || "-"}
                                        </td>
                                        <td>
                                            <span className="status-badge" style={{ backgroundColor: "#EF4444", color: "white" }}>
                                                {peca.quantidade}
                                            </span>
                                        </td>
                                        <td>
                                            {peca.estoque_minimo}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* TODAS AS PEÇAS */}
            <div className="dashboard-section">
                <div className="section-header">
                    <h2>Todas as peças</h2>
                    <p>Lista completa de peças cadastradas</p>
                </div>

                {pecas.length === 0 && (
                    <div className="info-message">
                        Nenhuma peça cadastrada.
                    </div>
                )}

                {pecas.length > 0 && (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Peça</th>
                                    <th>Código</th>
                                    <th>Estoque</th>
                                    <th>Preço de custo</th>
                                    <th>Preço de venda</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pecas.map((peca) => (
                                    <tr key={peca.id}>
                                        <td>
                                            {peca.nome}
                                        </td>
                                        <td>
                                            {peca.codigo || "-"}
                                        </td>
                                        <td>
                                            {peca.quantidade}
                                            {estaBaixo(peca) && (
                                                <span className="status-badge" style={{ backgroundColor: "#EF4444", color: "white", marginLeft: "8px" }}>
                                                    Baixo
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {formatarMoeda(peca.preco_custo)}
                                        </td>
                                        <td>
                                            {formatarMoeda(peca.preco_venda)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {mostrarModalCompra && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Registrar compra de peças</h2>
                            <button className="close-button" onClick={fecharModalCompra}>×</button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={registrarCompra}>
                                <div className="form-group">
                                    <label>Peça</label>
                                    <select
                                        value={dadosCompra.peca_id}
                                        onChange={(event) => setDadosCompra({ ...dadosCompra, peca_id: event.target.value })}
                                        required
                                    >
                                        <option value="">Selecione uma peça</option>
                                        {pecas.map((peca) => (
                                            <option key={peca.id} value={peca.id}>
                                                {peca.nome} {peca.codigo ? `(${peca.codigo})` : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Código (opcional)</label>
                                    <input
                                        type="text"
                                        maxLength="100"
                                        value={dadosCompra.codigo_peca}
                                        onChange={(event) => setDadosCompra({ ...dadosCompra, codigo_peca: event.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Fornecedor</label>
                                    <input
                                        type="text"
                                        value={dadosCompra.fornecedor}
                                        onChange={(event) => setDadosCompra({ ...dadosCompra, fornecedor: event.target.value })}
                                    />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Quantidade</label>
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={dadosCompra.quantidade}
                                            onChange={(event) => setDadosCompra({ ...dadosCompra, quantidade: event.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Valor unitário</label>
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            value={dadosCompra.valor_unitario}
                                            onChange={(event) => setDadosCompra({ ...dadosCompra, valor_unitario: event.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="dashboard-card dashboard-card-blue" style={{ marginBottom: "16px" }}>
                                    <span>Total da compra</span>
                                    <strong>{formatarMoeda(valorTotalCompra)}</strong>
                                    <small>Valor unitário × quantidade</small>
                                </div>
                                <div className="form-group">
                                    <label>Vencimento</label>
                                    <input
                                        type="date"
                                        value={dadosCompra.vencimento}
                                        onChange={(event) => setDadosCompra({ ...dadosCompra, vencimento: event.target.value })}
                                        required
                                    />
                                </div>
                                {erroCompra && (
                                    <div className="info-message" role="alert" style={{ color: "#b91c1c", marginBottom: "16px" }}>
                                        {erroCompra}
                                    </div>
                                )}
                                <div className="modal-actions">
                                    <button type="button" className="secondary-button" onClick={fecharModalCompra}>
                                        Cancelar
                                    </button>
                                    <button type="submit" className="primary-button" disabled={salvandoCompra}>
                                        {salvandoCompra ? "Registrando..." : "Confirmar compra"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Estoque;
