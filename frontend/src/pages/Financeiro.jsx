import { useEffect, useState } from "react";
import { api } from "../services/api";

function Financeiro() {
    const [abaAtiva, setAbaAtiva] = useState("receber");
    const [lancamentos, setLancamentos] = useState([]);
    const [parcelas, setParcelas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [mostrarModalPagamento, setMostrarModalPagamento] = useState(false);
    const [mostrarModalNovoLancamento, setMostrarModalNovoLancamento] = useState(false);
    const [lancamentoSelecionado, setLancamentoSelecionado] = useState(null);
    const [mostrarModalEstornar, setMostrarModalEstornar] = useState(false);
    const [pagamentoSelecionado, setPagamentoSelecionado] = useState(null);
    const [comprasPecas, setComprasPecas] = useState([]);
    const [erroComprasPecas, setErroComprasPecas] = useState("");

    const [filtros, setFiltros] = useState({
        status: "",
        de: "",
        ate: "",
        categoria_id: "",
        busca: ""
    });

    const contarFiltrosAtivos = () => {
        return Object.values(filtros).filter(valor => valor !== "").length;
    };

    const [dadosPagamento, setDadosPagamento] = useState([{
        valor: "",
        forma_pagamento: "dinheiro",
        data_pagamento: new Date().toISOString().split('T')[0]
    }]);

    const [novoLancamento, setNovoLancamento] = useState({
        tipo: "entrada",
        descricao: "",
        valor: "",
        vencimento: new Date().toISOString().split('T')[0],
        categoria_id: "",
        cliente_id: "",
        fornecedor: "",
        parcelas: 1
    });

    const [resumo, setResumo] = useState({
        a_receber: 0,
        a_pagar: 0,
        atrasado: 0,
        recebido_mes: 0,
        resultado_caixa: 0
    });

    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    };

    const formatarData = (data) => {
        if (!data) return "-";
        return new Date(data).toLocaleDateString('pt-BR');
    };

    const getStatusLabel = (status) => {
        const labels = {
            aberto: "Aberto",
            parcial: "Parcial",
            pago: "Pago",
            cancelado: "Cancelado"
        };
        return labels[status] || status;
    };

    const getStatusColor = (status) => {
        const colors = {
            aberto: "#F59E0B",
            parcial: "#3B82F6",
            pago: "#22C55E",
            cancelado: "#EF4444"
        };
        return colors[status] || "#6B7280";
    };

    const carregarLancamentos = async () => {
        try {
            setCarregando(true);
            const filtrosLancamentos = {
                ...filtros,
                tipo: "entrada"
            };
            const dados = await api.financeiro.listarLancamentos(filtrosLancamentos);
            setLancamentos(dados.lancamentos || []);
            calcularResumo(dados.lancamentos || []);
        } catch (error) {
            console.error("Erro ao carregar lançamentos:", error);
        } finally {
            setCarregando(false);
        }
    };

    const carregarParcelas = async () => {
        try {
            setCarregando(true);
            const dados = await api.financeiro.listarLancamentos({
                ...filtros,
                tipo: "entrada"
            });
            setParcelas((dados.lancamentos || []).filter(
                lancamento => Number(lancamento.parcela_total) > 1
            ));
        } catch (error) {
            console.error("Erro ao carregar parcelas:", error);
        } finally {
            setCarregando(false);
        }
    };

    const carregarCategorias = async () => {
        try {
            const dados = await api.financeiro.listarCategorias("entrada");
            setCategorias(dados);
        } catch (error) {
            console.error("Erro ao carregar categorias:", error);
        }
    };

    const carregarComprasPecas = async () => {
        try {
            const dados = await api.get("/estoque/compras");
            setComprasPecas(dados);
            setErroComprasPecas("");
        } catch (error) {
            console.error("Erro ao carregar compras de peças:", error);
            setErroComprasPecas(error.message || "Não foi possível carregar as compras registradas.");
        }
    };

    const calcularResumo = (lancamentos) => {
        const aReceberPagar = lancamentos
            .filter(l => l.status === 'aberto' || l.status === 'parcial')
            .reduce((sum, l) => sum + (l.saldo || 0), 0);

        const atrasado = lancamentos
            .filter(l => (l.status === 'aberto' || l.status === 'parcial') && new Date(l.vencimento) < new Date())
            .reduce((sum, l) => sum + (l.saldo || 0), 0);

        const recebidoPagoMes = lancamentos
            .filter(l => l.status === 'pago')
            .reduce((sum, l) => sum + (l.valor_pago || 0), 0);

        setResumo({
            a_receber: aReceberPagar,
            a_pagar: aReceberPagar,
            atrasado,
            recebido_mes: recebidoPagoMes,
            resultado_caixa: recebidoPagoMes
        });
    };

    const abrirModalPagamento = (lancamento) => {
        setLancamentoSelecionado(lancamento);
        setDadosPagamento([{
            valor: lancamento.saldo.toFixed(2),
            forma_pagamento: "dinheiro",
            data_pagamento: new Date().toISOString().split('T')[0]
        }]);
        setMostrarModalPagamento(true);
    };

    const adicionarLinhaPagamento = () => {
        setDadosPagamento([...dadosPagamento, {
            valor: "",
            forma_pagamento: "dinheiro",
            data_pagamento: new Date().toISOString().split('T')[0]
        }]);
    };

    const removerLinhaPagamento = (index) => {
        const novo = dadosPagamento.filter((_, i) => i !== index);
        setDadosPagamento(novo);
    };

    const realizarPagamento = async () => {
        try {
            const totalPagamento = dadosPagamento.reduce((sum, p) => sum + parseFloat(p.valor || 0), 0);
            
            if (totalPagamento > lancamentoSelecionado.saldo) {
                alert("A soma dos pagamentos excede o saldo do lançamento");
                return;
            }

            await api.financeiro.adicionarPagamentos(lancamentoSelecionado.id, dadosPagamento);
            setMostrarModalPagamento(false);
            carregarLancamentos();
        } catch (error) {
            alert("Erro ao realizar pagamento: " + error.message);
        }
    };

    const abrirModalEstornar = (pagamento) => {
        setPagamentoSelecionado(pagamento);
        setMostrarModalEstornar(true);
    };

    const estornarPagamento = async (motivo) => {
        try {
            await api.financeiro.estornarPagamento(pagamentoSelecionado.id, motivo);
            setMostrarModalEstornar(false);
            carregarLancamentos();
        } catch (error) {
            alert("Erro ao estornar pagamento: " + error.message);
        }
    };

    const criarNovoLancamento = async () => {
        try {
            await api.financeiro.criarLancamento(novoLancamento);
            setMostrarModalNovoLancamento(false);
            setNovoLancamento({
                tipo: "entrada",
                descricao: "",
                valor: "",
                vencimento: new Date().toISOString().split('T')[0],
                categoria_id: "",
                cliente_id: "",
                fornecedor: "",
                parcelas: 1
            });
            carregarLancamentos();
        } catch (error) {
            alert("Erro ao criar lançamento: " + error.message);
        }
    };

    useEffect(() => {
        if (abaAtiva === "compra_pecas") {
            setCarregando(true);
            carregarComprasPecas().finally(() => setCarregando(false));
        } else if (abaAtiva === "parcelas") {
            carregarParcelas();
        } else {
            carregarLancamentos();
            carregarCategorias();
        }
    }, [abaAtiva, filtros]);

    if (carregando) {
        return (
            <div className="dashboard">
                <p>Carregando...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">

            <div className="dashboard-header dashboard-page-header">
                <div>
                    <h1>Financeiro</h1>
                    <p>Controle financeiro da sua oficina</p>
                </div>
            </div>

            {/* Abas */}
            <div className="tabs">
                <button
                    className={`tab ${abaAtiva === "receber" ? "active" : ""}`}
                    onClick={() => setAbaAtiva("receber")}
                >
                    Painel
                </button>
                <button
                    className={`tab ${abaAtiva === "parcelas" ? "active" : ""}`}
                    onClick={() => setAbaAtiva("parcelas")}
                >
                    Parcelas
                </button>
                <button
                    className={`tab ${abaAtiva === "compra_pecas" ? "active" : ""}`}
                    onClick={() => setAbaAtiva("compra_pecas")}
                >
                    Compra de peças
                </button>
            </div>

            {abaAtiva === "receber" && (
                <>
                    {/* Cards de resumo */}
                    <div className="dashboard-cards">
                        <div className="dashboard-card dashboard-card-blue">
                            <span>A receber</span>
                            <strong>{formatarMoeda(resumo.a_receber)}</strong>
                        </div>
                        <div className="dashboard-card dashboard-card-red">
                            <span>Atrasado</span>
                            <strong>{formatarMoeda(resumo.atrasado)}</strong>
                        </div>
                        <div className="dashboard-card dashboard-card-green">
                            <span>Recebido no mês</span>
                            <strong>{formatarMoeda(resumo.recebido_mes)}</strong>
                        </div>
                        <div className="dashboard-card dashboard-card-indigo">
                            <span>Resultado de caixa</span>
                            <strong>{formatarMoeda(resumo.resultado_caixa)}</strong>
                        </div>
                    </div>

                    <div className="dashboard-section financial-transactions-section">
                        <div className="section-header">
                            <h2>Lançamentos</h2>
                        </div>
                        <div className="financial-filters-panel">
                            <div className="section-header financial-filters-heading">
                                <div>
                                    <h2>Filtros</h2>
                                    {contarFiltrosAtivos() > 0 && (
                                        <p style={{ margin: '4px 0 0 0', color: '#2563eb', fontSize: '13px' }}>
                                            {contarFiltrosAtivos()} filtro(s) ativo(s)
                                        </p>
                                    )}
                                </div>
                                <button
                                    className="primary-button"
                                    onClick={() => setMostrarModalNovoLancamento(true)}
                                >
                                    + Novo lançamento
                                </button>
                            </div>
                            <div className="financial-filter-fields">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Buscar</label>
                                        <input
                                            type="text"
                                            placeholder="Descrição, cliente..."
                                            value={filtros.busca}
                                            onChange={(e) => setFiltros({...filtros, busca: e.target.value})}
                                            style={filtros.busca ? { borderColor: '#2563eb', backgroundColor: '#eff6ff' } : {}}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Status</label>
                                        <select
                                            value={filtros.status}
                                            onChange={(e) => setFiltros({...filtros, status: e.target.value})}
                                            style={filtros.status ? { borderColor: '#2563eb', backgroundColor: '#eff6ff' } : {}}
                                        >
                                            <option value="">Todos</option>
                                            <option value="aberto">Aberto</option>
                                            <option value="parcial">Parcial</option>
                                            <option value="pago">Pago</option>
                                            <option value="cancelado">Cancelado</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Categoria</label>
                                        <select
                                            value={filtros.categoria_id}
                                            onChange={(e) => setFiltros({...filtros, categoria_id: e.target.value})}
                                            style={filtros.categoria_id ? { borderColor: '#2563eb', backgroundColor: '#eff6ff' } : {}}
                                        >
                                            <option value="">Todas</option>
                                            {categorias.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Vencimento (de)</label>
                                        <input
                                            type="date"
                                            value={filtros.de}
                                            onChange={(e) => setFiltros({...filtros, de: e.target.value})}
                                            style={filtros.de ? { borderColor: '#2563eb', backgroundColor: '#eff6ff' } : {}}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Vencimento (até)</label>
                                        <input
                                            type="date"
                                            value={filtros.ate}
                                            onChange={(e) => setFiltros({...filtros, ate: e.target.value})}
                                            style={filtros.ate ? { borderColor: '#2563eb', backgroundColor: '#eff6ff' } : {}}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>&nbsp;</label>
                                        <button
                                            className="secondary-button"
                                            onClick={() => setFiltros({ status: "", de: "", ate: "", categoria_id: "", busca: "" })}
                                            disabled={contarFiltrosAtivos() === 0}
                                        >
                                            Limpar filtros
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Descrição</th>
                                        <th>Cliente/Fornecedor</th>
                                        <th>Vencimento</th>
                                        <th>Valor</th>
                                        <th>Pago</th>
                                        <th>Saldo</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lancamentos.map(lancamento => (
                                        <tr key={lancamento.id}>
                                            <td>{lancamento.descricao}</td>
                                            <td>{lancamento.cliente_nome || lancamento.fornecedor || "-"}</td>
                                            <td>{formatarData(lancamento.vencimento)}</td>
                                            <td>{formatarMoeda(lancamento.valor)}</td>
                                            <td>{formatarMoeda(lancamento.valor_pago)}</td>
                                            <td style={{ fontWeight: 'bold' }}>
                                                {formatarMoeda(lancamento.saldo)}
                                            </td>
                                            <td>
                                                <span 
                                                    className="status-badge"
                                                    style={{ 
                                                        backgroundColor: getStatusColor(lancamento.status),
                                                        color: 'white'
                                                    }}
                                                >
                                                    {getStatusLabel(lancamento.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {abaAtiva === "parcelas" && (
                <>
                    <div className="dashboard-cards">
                        <div className="dashboard-card dashboard-card-blue">
                            <span>Parcelas pendentes</span>
                            <strong>{parcelas.filter(p => p.status === "aberto" || p.status === "parcial").length}</strong>
                        </div>
                        <div className="dashboard-card dashboard-card-red">
                            <span>Parcelas atrasadas</span>
                            <strong>{parcelas.filter(p =>
                                (p.status === "aberto" || p.status === "parcial") &&
                                new Date(`${p.vencimento}T00:00:00`) < new Date(new Date().toDateString())
                            ).length}</strong>
                        </div>
                        <div className="dashboard-card dashboard-card-green">
                            <span>Saldo pendente</span>
                            <strong>{formatarMoeda(parcelas
                                .filter(p => p.status === "aberto" || p.status === "parcial")
                                .reduce((total, p) => total + Number(p.saldo || 0), 0))}</strong>
                        </div>
                    </div>

                    <div className="dashboard-section">
                        <div className="section-header">
                            <h2>Parcelas</h2>
                            <p>Lançamentos de entrada divididos em mais de uma parcela</p>
                        </div>
                        {parcelas.length === 0 ? (
                            <div className="info-message">Nenhuma parcela encontrada.</div>
                        ) : (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Descrição</th>
                                            <th>Cliente</th>
                                            <th>Parcela</th>
                                            <th>Vencimento</th>
                                            <th>Valor</th>
                                            <th>Saldo</th>
                                            <th>Status</th>
                                            <th>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parcelas.map(parcela => {
                                            const estaAtrasada =
                                                (parcela.status === "aberto" || parcela.status === "parcial") &&
                                                new Date(`${parcela.vencimento}T00:00:00`) < new Date(new Date().toDateString());
                                            return (
                                                <tr key={parcela.id}>
                                                    <td>{parcela.descricao}</td>
                                                    <td>{parcela.cliente_nome || "-"}</td>
                                                    <td>{parcela.parcela_numero}/{parcela.parcela_total}</td>
                                                    <td>{formatarData(parcela.vencimento)}</td>
                                                    <td>{formatarMoeda(parcela.valor)}</td>
                                                    <td>{formatarMoeda(parcela.saldo)}</td>
                                                    <td>
                                                        <span
                                                            className="status-badge"
                                                            style={{
                                                                backgroundColor: estaAtrasada ? "#EF4444" : getStatusColor(parcela.status),
                                                                color: "white"
                                                            }}
                                                        >
                                                            {estaAtrasada ? "Atrasado" : getStatusLabel(parcela.status)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {(parcela.status === "aberto" || parcela.status === "parcial") && (
                                                            <button className="table-button" onClick={() => abrirModalPagamento(parcela)}>
                                                                Dar baixa
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {abaAtiva === "compra_pecas" && (
                <div className="dashboard-section">
                        <div className="section-header">
                            <h2>Compras registradas</h2>
                            <p>Histórico das compras de peças registradas no estoque</p>
                        </div>

                        {erroComprasPecas && (
                            <div className="info-message" role="alert" style={{ color: "#b91c1c" }}>
                                {erroComprasPecas}
                            </div>
                        )}

                        {!erroComprasPecas && comprasPecas.length === 0 && (
                            <div className="info-message">
                                Nenhuma compra de peças registrada.
                            </div>
                        )}

                        {comprasPecas.length > 0 && (
                            <div className="table-container">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Peça</th>
                                            <th>Código</th>
                                            <th>Fornecedor</th>
                                            <th>Quantidade</th>
                                            <th>Valor unitário</th>
                                            <th>Total</th>
                                            <th>Data de compra</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {comprasPecas.map((compra) => (
                                            <tr key={compra.id}>
                                                <td>{compra.peca_nome}</td>
                                                <td>{compra.peca_codigo || "-"}</td>
                                                <td>{compra.fornecedor || "-"}</td>
                                                <td>{compra.quantidade}</td>
                                                <td>{formatarMoeda(compra.valor_unitario)}</td>
                                                <td>{formatarMoeda(compra.valor_total)}</td>
                                                <td>{formatarData(compra.vencimento)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
            )}

            {/* Modal de pagamento */}
            {mostrarModalPagamento && lancamentoSelecionado && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Dar baixa em lançamento</h2>
                            <button className="close-button" onClick={() => setMostrarModalPagamento(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p><strong>Descrição:</strong> {lancamentoSelecionado.descricao}</p>
                            <p><strong>Valor total:</strong> {formatarMoeda(lancamentoSelecionado.valor)}</p>
                            <p><strong>Saldo restante:</strong> {formatarMoeda(lancamentoSelecionado.saldo)}</p>
                            
                            {dadosPagamento.map((pag, index) => (
                                <div key={index} className="form-row">
                                    <div className="form-group">
                                        <label>Valor</label>
                                        <input
                                            type="number"
                                            value={pag.valor}
                                            onChange={(e) => {
                                                const novo = [...dadosPagamento];
                                                novo[index].valor = e.target.value;
                                                setDadosPagamento(novo);
                                            }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Forma</label>
                                        <select
                                            value={pag.forma_pagamento}
                                            onChange={(e) => {
                                                const novo = [...dadosPagamento];
                                                novo[index].forma_pagamento = e.target.value;
                                                setDadosPagamento(novo);
                                            }}
                                        >
                                            <option value="dinheiro">Dinheiro</option>
                                            <option value="pix">PIX</option>
                                            <option value="debito">Débito</option>
                                            <option value="credito">Crédito</option>
                                            <option value="boleto">Boleto</option>
                                            <option value="transferencia">Transferência</option>
                                            <option value="outro">Outro</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Data</label>
                                        <input
                                            type="date"
                                            value={pag.data_pagamento}
                                            onChange={(e) => {
                                                const novo = [...dadosPagamento];
                                                novo[index].data_pagamento = e.target.value;
                                                setDadosPagamento(novo);
                                            }}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>&nbsp;</label>
                                        {dadosPagamento.length > 1 && (
                                            <button 
                                                className="table-button delete"
                                                onClick={() => removerLinhaPagamento(index)}
                                            >
                                                Remover
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            
                            <button 
                                className="secondary-button"
                                onClick={adicionarLinhaPagamento}
                            >
                                + Adicionar forma de pagamento
                            </button>
                        </div>
                        <div className="modal-actions">
                            <button 
                                className="secondary-button"
                                onClick={() => setMostrarModalPagamento(false)}
                            >
                                Cancelar
                            </button>
                            <button 
                                className="primary-button"
                                onClick={realizarPagamento}
                            >
                                Confirmar pagamento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de novo lançamento */}
            {mostrarModalNovoLancamento && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Novo lançamento</h2>
                            <button className="close-button" onClick={() => setMostrarModalNovoLancamento(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Tipo</label>
                                <select
                                    value={novoLancamento.tipo}
                                    onChange={(e) => setNovoLancamento({...novoLancamento, tipo: e.target.value})}
                                >
                                    <option value="entrada">Entrada</option>
                                    <option value="saida">Saída</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Descrição</label>
                                <input
                                    type="text"
                                    value={novoLancamento.descricao}
                                    onChange={(e) => setNovoLancamento({...novoLancamento, descricao: e.target.value})}
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Valor</label>
                                    <input
                                        type="number"
                                        value={novoLancamento.valor}
                                        onChange={(e) => setNovoLancamento({...novoLancamento, valor: e.target.value})}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Vencimento</label>
                                    <input
                                        type="date"
                                        value={novoLancamento.vencimento}
                                        onChange={(e) => setNovoLancamento({...novoLancamento, vencimento: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Categoria</label>
                                <select
                                    value={novoLancamento.categoria_id}
                                    onChange={(e) => setNovoLancamento({...novoLancamento, categoria_id: e.target.value})}
                                >
                                    <option value="">Selecione...</option>
                                    {categorias.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.nome}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Fornecedor (para saídas)</label>
                                <input
                                    type="text"
                                    value={novoLancamento.fornecedor}
                                    onChange={(e) => setNovoLancamento({...novoLancamento, fornecedor: e.target.value})}
                                />
                            </div>
                            <div className="form-group">
                                <label>Parcelas</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={novoLancamento.parcelas}
                                    onChange={(e) => setNovoLancamento({...novoLancamento, parcelas: parseInt(e.target.value)})}
                                />
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button 
                                className="secondary-button"
                                onClick={() => setMostrarModalNovoLancamento(false)}
                            >
                                Cancelar
                            </button>
                            <button 
                                className="primary-button"
                                onClick={criarNovoLancamento}
                            >
                                Criar lançamento
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de estornar */}
            {mostrarModalEstornar && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Estornar pagamento</h2>
                            <button className="close-button" onClick={() => setMostrarModalEstornar(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p>Deseja estornar o pagamento de {formatarMoeda(pagamentoSelecionado?.valor)}?</p>
                            <div className="form-group">
                                <label>Motivo do estorno</label>
                                <textarea
                                    rows="3"
                                    onChange={(e) => setPagamentoSelecionado({...pagamentoSelecionado, motivoEstorno: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button 
                                className="secondary-button"
                                onClick={() => setMostrarModalEstornar(false)}
                            >
                                Cancelar
                            </button>
                            <button 
                                className="table-button delete"
                                onClick={() => estornarPagamento(pagamentoSelecionado.motivoEstorno)}
                            >
                                Confirmar estorno
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default Financeiro;
