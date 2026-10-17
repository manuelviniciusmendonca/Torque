import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { useConfirm } from "../components/ConfirmContext";

function OrdemServicoDetalhes() {
    const { id } = useParams();
    const navigate = useNavigate();
    const confirmAction = useConfirm();
    const [searchParams] = useSearchParams();
    const modoEdicao = searchParams.get('edit') === 'true';

    const [ordem, setOrdem] = useState(null);
    const [pecasOS, setPecasOS] = useState([]);
    const [servicosOS, setServicosOS] = useState([]);

    const [pecasDisponiveis, setPecasDisponiveis] = useState([]);
    const [servicosDisponiveis, setServicosDisponiveis] = useState([]);

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(false);

    const [salvandoStatus, setSalvandoStatus] = useState(false);
    const [salvandoNotas, setSalvandoNotas] = useState(false);
    const [salvandoTudo, setSalvandoTudo] = useState(false);
    const [mostrarModalPagamento, setMostrarModalPagamento] = useState(false);
    const [salvandoPagamento, setSalvandoPagamento] = useState(false);
    const [dadosPagamento, setDadosPagamento] = useState({
        forma_pagamento: "pix",
        numero_parcelas: 1,
        data_primeira_parcela: new Date().toISOString().slice(0, 10)
    });

    const [novaPeca, setNovaPeca] = useState({ peca_id: "", quantidade: 1 });
    const [novoServico, setNovoServico] = useState({ servico_id: "", quantidade: 1 });

    const [notas, setNotas] = useState({
        diagnostico: "",
        observacoes: ""
    });

    const [dadosEditaveis, setDadosEditaveis] = useState({
        nome: "",
        telefone: "",
        whatsapp: "",
        endereco: "",
        placa: "",
        marca: "",
        modelo: "",
        ano: "",
        cor: "",
        problema_relatado: "",
        quilometragem: 0,
        status: "aberta"
    });

    // ==========================================
    // CARREGAR DADOS
    // ==========================================

    const carregarOrdem = async () => {
        const dados = await api.get(`/ordens-servico/${id}`);
        setOrdem(dados);

        setNotas({
            diagnostico: dados.diagnostico || "",
            observacoes: dados.observacoes || ""
        });

        setDadosEditaveis({
            nome: dados.cliente_nome || "",
            telefone: dados.cliente_telefone || "",
            whatsapp: dados.cliente_whatsapp || "",
            endereco: dados.cliente_endereco || "",
            placa: dados.placa || "",
            marca: dados.marca || "",
            modelo: dados.modelo || "",
            ano: dados.ano || "",
            cor: dados.cor || "",
            problema_relatado: dados.problema_relatado || "",
            quilometragem: dados.quilometragem || 0,
            status: dados.status || "aberta"
        });
    };

    const carregarTudo = async () => {
        try {
            const [pecasOSData, servicosOSData] = await Promise.all([
                api.get(`/ordens-servico/${id}/pecas`),
                api.get(`/ordens-servico/${id}/servicos`)
            ]);

            await carregarOrdem();

            setPecasOS(pecasOSData);
            setServicosOS(servicosOSData);

            setErro(false);
        } catch (error) {
            console.error("Erro ao carregar ordem de serviço:", error);
            setErro(true);
        } finally {
            setCarregando(false);
        }
    };

    const carregarListasDisponiveis = async () => {
        try {
            const [pecas, servicos] = await Promise.all([
                api.get("/pecas"),
                api.get("/servicos")
            ]);

            setPecasDisponiveis(pecas);
            setServicosDisponiveis(servicos);
        } catch (error) {
            console.error("Erro ao carregar peças/serviços disponíveis:", error);
        }
    };

    useEffect(() => {
        carregarTudo();
        carregarListasDisponiveis();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    // ==========================================
    // FORMATAÇÃO
    // ==========================================

    const formatarData = (data) => {
        if (!data) return "-";
        return new Date(data).toLocaleDateString("pt-BR");
    };

    const formatarValor = (valor) => {
        return Number(valor || 0).toFixed(2);
    };

    // ==========================================
    // STATUS
    // ==========================================

    const alterarStatus = async (novoStatus) => {
        if (novoStatus === "concluida" && ordem.status !== "concluida") {
            setMostrarModalPagamento(true);
            return;
        }

        try {
            setSalvandoStatus(true);

            await api.put(`/ordens-servico/${id}`, {
                problema_relatado: ordem.problema_relatado,
                diagnostico: ordem.diagnostico,
                observacoes: ordem.observacoes,
                quilometragem: ordem.quilometragem,
                status: novoStatus,
                valor_total: ordem.valor_total
            });

            await carregarOrdem();
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            alert("Erro ao atualizar status.");
        } finally {
            setSalvandoStatus(false);
        }
    };

    const concluirComPagamento = async (event) => {
        event.preventDefault();
        let statusAtualizado = false;

        try {
            setSalvandoPagamento(true);

            await api.put(`/ordens-servico/${id}`, {
                problema_relatado: ordem.problema_relatado,
                diagnostico: ordem.diagnostico,
                observacoes: ordem.observacoes,
                quilometragem: ordem.quilometragem,
                status: "concluida",
                valor_total: ordem.valor_total
            });
            statusAtualizado = true;

            await api.post("/transacoes/parcelada", {
                oficina_id: ordem.oficina_id || 1,
                ordem_servico_id: Number(id),
                cliente_id: ordem.cliente_id,
                tipo: "entrada",
                descricao: `Ordem de Serviço #${id}`,
                valor_total: Number(ordem.valor_total) || 0,
                forma_pagamento: dadosPagamento.forma_pagamento,
                numero_parcelas: Number(dadosPagamento.numero_parcelas) || 1,
                data_primeira_parcela: dadosPagamento.data_primeira_parcela
            });

            setMostrarModalPagamento(false);
            await carregarOrdem();
        } catch (error) {
            console.error("Erro ao concluir ordem com pagamento:", error);
            if (statusAtualizado) {
                try {
                    await api.put(`/ordens-servico/${id}`, {
                        status: ordem.status,
                        valor_total: ordem.valor_total
                    });
                } catch (rollbackError) {
                    console.error("Erro ao desfazer conclusão da ordem:", rollbackError);
                }
            }
            alert(error.message || "Não foi possível registrar o pagamento.");
        } finally {
            setSalvandoPagamento(false);
        }
    };

    // ==========================================
    // DIAGNÓSTICO / OBSERVAÇÕES
    // ==========================================

    const salvarNotas = async () => {
        try {
            setSalvandoNotas(true);

            await api.put(`/ordens-servico/${id}`, {
                problema_relatado: ordem.problema_relatado,
                diagnostico: notas.diagnostico,
                observacoes: notas.observacoes,
                quilometragem: ordem.quilometragem,
                status: ordem.status,
                valor_total: ordem.valor_total
            });

            await carregarOrdem();

            alert("Alterações salvas.");
        } catch (error) {
            console.error("Erro ao salvar alterações:", error);
            alert("Erro ao salvar alterações.");
        } finally {
            setSalvandoNotas(false);
        }
    };

    // ==========================================
    // SALVAR TODAS AS ALTERAÇÕES (MODO EDIÇÃO)
    // ==========================================

    const salvarTodasAlteracoes = async () => {
        if (dadosEditaveis.status === "concluida" && ordem.status !== "concluida") {
            setMostrarModalPagamento(true);
            return;
        }

        try {
            setSalvandoTudo(true);

            await api.put(`/ordens-servico/${id}`, {
                nome: dadosEditaveis.nome,
                telefone: dadosEditaveis.telefone,
                whatsapp: dadosEditaveis.whatsapp,
                endereco: dadosEditaveis.endereco,
                placa: dadosEditaveis.placa,
                marca: dadosEditaveis.marca,
                modelo: dadosEditaveis.modelo,
                ano: dadosEditaveis.ano,
                cor: dadosEditaveis.cor,
                problema_relatado: dadosEditaveis.problema_relatado,
                diagnostico: notas.diagnostico,
                observacoes: notas.observacoes,
                quilometragem: dadosEditaveis.quilometragem,
                status: dadosEditaveis.status,
                valor_total: ordem.valor_total
            });

            await carregarOrdem();

            alert("Todas as alterações foram salvas com sucesso!");
            navigate(`/ordens-servico/${id}`);
        } catch (error) {
            console.error("Erro ao salvar alterações:", error);
            alert("Erro ao salvar alterações.");
        } finally {
            setSalvandoTudo(false);
        }
    };

    // ==========================================
    // PEÇAS
    // ==========================================

    const adicionarPeca = async (e) => {
        e.preventDefault();

        if (!novaPeca.peca_id) {
            alert("Selecione uma peça.");
            return;
        }

        try {
            await api.post(`/ordens-servico/${id}/pecas`, {
                peca_id: Number(novaPeca.peca_id),
                quantidade: Number(novaPeca.quantidade) || 1
            });

            setNovaPeca({ peca_id: "", quantidade: 1 });

            const pecasOSData = await api.get(`/ordens-servico/${id}/pecas`);
            setPecasOS(pecasOSData);

            await carregarOrdem();
            await carregarListasDisponiveis();
        } catch (error) {
            console.error("Erro ao adicionar peça:", error);
            alert("Erro ao adicionar peça (verifique o estoque disponível).");
        }
    };

    const removerPeca = async (itemId) => {
        try {
            await api.delete(`/ordens-servico/pecas/${itemId}`);

            const pecasOSData = await api.get(`/ordens-servico/${id}/pecas`);
            setPecasOS(pecasOSData);

            await carregarOrdem();
            await carregarListasDisponiveis();
        } catch (error) {
            console.error("Erro ao remover peça:", error);
            alert("Erro ao remover peça.");
        }
    };

    // ==========================================
    // SERVIÇOS
    // ==========================================

    const adicionarServico = async (e) => {
        e.preventDefault();

        if (!novoServico.servico_id) {
            alert("Selecione um serviço.");
            return;
        }

        try {
            await api.post(`/ordens-servico/${id}/servicos`, {
                servico_id: Number(novoServico.servico_id),
                quantidade: Number(novoServico.quantidade) || 1
            });

            setNovoServico({ servico_id: "", quantidade: 1 });

            const servicosOSData = await api.get(`/ordens-servico/${id}/servicos`);
            setServicosOS(servicosOSData);

            await carregarOrdem();
        } catch (error) {
            console.error("Erro ao adicionar serviço:", error);
            alert("Erro ao adicionar serviço.");
        }
    };

    const removerServico = async (itemId) => {
        try {
            await api.delete(`/ordens-servico/servicos/${itemId}`);

            const servicosOSData = await api.get(`/ordens-servico/${id}/servicos`);
            setServicosOS(servicosOSData);

            await carregarOrdem();
        } catch (error) {
            console.error("Erro ao remover serviço:", error);
            alert("Erro ao remover serviço.");
        }
    };

    // ==========================================
    // EXCLUIR OS
    // ==========================================

    const excluirOrdem = async () => {
        const confirmar = await confirmAction({
            title: "Excluir ordem de serviço?",
            message: "Esta ordem de serviço será removida permanentemente.",
            confirmLabel: "Excluir OS",
            variant: "danger"
        });

        if (!confirmar) {
            return;
        }

        try {
            await api.delete(`/ordens-servico/${id}`);
            navigate("/ordens-servico");
        } catch (error) {
            console.error("Erro ao excluir ordem de serviço:", error);
            alert("Erro ao excluir ordem de serviço.");
        }
    };

    // ==========================================
    // RENDER
    // ==========================================

    if (carregando) {
        return (
            <div className="dashboard">
                <p>Carregando ordem de serviço...</p>
            </div>
        );
    }

    if (erro || !ordem) {
        return (
            <div className="dashboard">
                <div className="dashboard-section">
                    <p>Não foi possível carregar a ordem de serviço.</p>

                    <button
                        className="secondary-button"
                        onClick={() => navigate("/ordens-servico")}
                    >
                        Voltar para ordens de serviço
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">

            <div className="dashboard-header">
                <div>
                    <h1>Ordem de Serviço #{ordem.id} {modoEdicao && "(Editando)"}</h1>

                    <p>
                        {ordem.marca} {ordem.modelo} — {ordem.placa}
                    </p>
                </div>

                <div className="header-actions">
                    <button
                        className="secondary-button"
                        onClick={() => navigate("/ordens-servico")}
                    >
                        Voltar
                    </button>
                    {modoEdicao && (
                        <button
                            className="primary-button"
                            onClick={salvarTodasAlteracoes}
                            disabled={salvandoTudo}
                        >
                            {salvandoTudo ? "Salvando..." : "Salvar alterações"}
                        </button>
                    )}
                </div>
            </div>

            {/* CLIENTE / VEÍCULO / STATUS */}

            <div className="dashboard-section">
                <h2>Informações gerais</h2>

                <div className="financial-summary">
                    <div>
                        <span>Cliente</span>
                        {modoEdicao ? (
                            <input
                                type="text"
                                value={dadosEditaveis.nome}
                                onChange={(e) =>
                                    setDadosEditaveis((estado) => ({ ...estado, nome: e.target.value }))
                                }
                            />
                        ) : (
                            <strong>{ordem.cliente_nome}</strong>
                        )}
                    </div>

                    <div>
                        <span>Telefone</span>
                        {modoEdicao ? (
                            <input
                                type="text"
                                value={dadosEditaveis.telefone}
                                onChange={(e) =>
                                    setDadosEditaveis((estado) => ({ ...estado, telefone: e.target.value }))
                                }
                            />
                        ) : (
                            <strong>{ordem.cliente_telefone || "-"}</strong>
                        )}
                    </div>

                    <div>
                        <span>WhatsApp</span>
                        {modoEdicao ? (
                            <input
                                type="text"
                                value={dadosEditaveis.whatsapp}
                                onChange={(e) =>
                                    setDadosEditaveis((estado) => ({ ...estado, whatsapp: e.target.value }))
                                }
                                placeholder="(79) 99999-9999"
                            />
                        ) : (
                            <strong>{ordem.cliente_whatsapp || "-"}</strong>
                        )}
                    </div>

                    <div>
                        <span>Endereço</span>
                        {modoEdicao ? (
                            <input
                                type="text"
                                value={dadosEditaveis.endereco}
                                onChange={(e) =>
                                    setDadosEditaveis((estado) => ({ ...estado, endereco: e.target.value }))
                                }
                                placeholder="Endereço do cliente"
                            />
                        ) : (
                            <strong>{ordem.cliente_endereco || "-"}</strong>
                        )}
                    </div>

                    <div>
                        <span>Marca</span>
                        {modoEdicao ? (
                            <input
                                type="text"
                                value={dadosEditaveis.marca}
                                onChange={(e) =>
                                    setDadosEditaveis((estado) => ({ ...estado, marca: e.target.value }))
                                }
                            />
                        ) : (
                            <strong>{ordem.marca}</strong>
                        )}
                    </div>

                    <div>
                        <span>Modelo</span>
                        {modoEdicao ? (
                            <input
                                type="text"
                                value={dadosEditaveis.modelo}
                                onChange={(e) =>
                                    setDadosEditaveis((estado) => ({ ...estado, modelo: e.target.value }))
                                }
                            />
                        ) : (
                            <strong>{ordem.modelo}</strong>
                        )}
                    </div>

                    <div>
                        <span>Placa</span>
                        {modoEdicao ? (
                            <input
                                type="text"
                                value={dadosEditaveis.placa}
                                onChange={(e) =>
                                    setDadosEditaveis((estado) => ({ ...estado, placa: e.target.value }))
                                }
                            />
                        ) : (
                            <strong>{ordem.placa}</strong>
                        )}
                    </div>

                    <div>
                        <span>Ano</span>
                        {modoEdicao ? (
                            <input
                                type="number"
                                value={dadosEditaveis.ano}
                                onChange={(e) =>
                                    setDadosEditaveis((estado) => ({ ...estado, ano: e.target.value }))
                                }
                            />
                        ) : (
                            <strong>{ordem.ano || "-"}</strong>
                        )}
                    </div>

                    <div>
                        <span>Cor</span>
                        {modoEdicao ? (
                            <input
                                type="text"
                                value={dadosEditaveis.cor}
                                onChange={(e) =>
                                    setDadosEditaveis((estado) => ({ ...estado, cor: e.target.value }))
                                }
                            />
                        ) : (
                            <strong>{ordem.cor || "-"}</strong>
                        )}
                    </div>

                    <div>
                        <span>Quilometragem</span>
                        {modoEdicao ? (
                            <input
                                type="number"
                                value={dadosEditaveis.quilometragem}
                                onChange={(e) =>
                                    setDadosEditaveis((estado) => ({ ...estado, quilometragem: e.target.value }))
                                }
                            />
                        ) : (
                            <strong>{Number(ordem.quilometragem || 0).toLocaleString("pt-BR")} km</strong>
                        )}
                    </div>

                    <div>
                        <span>Data de abertura</span>
                        <strong>{formatarData(ordem.data_abertura)}</strong>
                    </div>

                    <div>
                        <span>Valor total</span>
                        <strong>R$ {formatarValor(ordem.valor_total)}</strong>
                        {ordem.servicos_adicionais?.map((servicoAdicional) => (
                            <small key={servicoAdicional.id}>
                                {servicoAdicional.descricao}: R$ {formatarValor(servicoAdicional.valor)}
                            </small>
                        ))}
                        {Number(ordem.valor_adicional) > 0 && (
                            <small>
                                {ordem.descricao_adicional}: R$ {formatarValor(ordem.valor_adicional)}
                            </small>
                        )}
                    </div>

                    <div>
                        <span>Status</span>

                        {modoEdicao ? (
                            <select
                                value={dadosEditaveis.status}
                                onChange={(e) =>
                                    setDadosEditaveis((estado) => ({ ...estado, status: e.target.value }))
                                }
                            >
                                <option value="aguardando_avaliacao">Aguardando avaliação</option>
                                <option value="em_avaliacao">Em avaliação</option>
                                <option value="aguardando_aprovacao">Aguardando aprovação</option>
                                <option value="aguardando_peca">Aguardando peça</option>
                                <option value="em_execucao">Em execução</option>
                                <option value="concluida">Concluído / Aguardando retirada</option>
                            </select>
                        ) : (
                            <select
                                value={ordem.status}
                                disabled={salvandoStatus}
                                onChange={(e) => alterarStatus(e.target.value)}
                            >
                                <option value="aguardando_avaliacao">Aguardando avaliação</option>
                                <option value="em_avaliacao">Em avaliação</option>
                                <option value="aguardando_aprovacao">Aguardando aprovação</option>
                                <option value="aguardando_peca">Aguardando peça</option>
                                <option value="em_execucao">Em execução</option>
                                <option value="concluida">Concluído / Aguardando retirada</option>
                            </select>
                        )}
                    </div>
                </div>
            </div>

            {/* PROBLEMA / DIAGNÓSTICO / OBSERVAÇÕES */}

            <div className="dashboard-section">
                <h2>Manutenção</h2>

                <div className="form-group">
                    <label>Problema relatado</label>

                    <textarea
                        value={modoEdicao ? dadosEditaveis.problema_relatado : (ordem.problema_relatado || "")}
                        onChange={(e) =>
                            modoEdicao && setDadosEditaveis((estado) => ({ ...estado, problema_relatado: e.target.value }))
                        }
                        disabled={!modoEdicao}
                        rows="3"
                    />
                </div>

                <div className="form-group">
                    <label>Diagnóstico</label>

                    <textarea
                        value={notas.diagnostico}
                        onChange={(e) =>
                            setNotas((estado) => ({ ...estado, diagnostico: e.target.value }))
                        }
                        rows="3"
                    />
                </div>

                <div className="form-group">
                    <label>Observações</label>

                    <textarea
                        value={notas.observacoes}
                        onChange={(e) =>
                            setNotas((estado) => ({ ...estado, observacoes: e.target.value }))
                        }
                        rows="3"
                    />
                </div>

                {!modoEdicao && (
                    <button
                        className="primary-button"
                        onClick={salvarNotas}
                        disabled={salvandoNotas}
                    >
                        {salvandoNotas ? "Salvando..." : "Salvar alterações"}
                    </button>
                )}
            </div>

            {/* PEÇAS */}

            <div className="dashboard-section">
                <div className="section-header">
                    <div>
                        <h2>Peças</h2>
                        <p>Peças utilizadas nesta ordem de serviço</p>
                    </div>
                </div>

                <form onSubmit={adicionarPeca} className="form-row">
                    <div className="form-group">
                        <label>Peça</label>

                        <select
                            value={novaPeca.peca_id}
                            onChange={(e) =>
                                setNovaPeca((estado) => ({ ...estado, peca_id: e.target.value }))
                            }
                        >
                            <option value="">Selecione...</option>

                            {pecasDisponiveis.map((peca) => (
                                <option key={peca.id} value={peca.id}>
                                    {peca.nome} — R$ {formatarValor(peca.preco_venda)} (estoque: {peca.quantidade})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Quantidade</label>

                        <input
                            type="number"
                            min="1"
                            value={novaPeca.quantidade}
                            onChange={(e) =>
                                setNovaPeca((estado) => ({ ...estado, quantidade: e.target.value }))
                            }
                        />
                    </div>

                    <div className="form-group">
                        <label>&nbsp;</label>
                        <button type="submit" className="primary-button">
                            Adicionar peça
                        </button>
                    </div>
                </form>

                {pecasOS.length === 0 && <p>Nenhuma peça adicionada.</p>}

                {pecasOS.length > 0 && (
                    <table>
                        <thead>
                            <tr>
                                <th>Peça</th>
                                <th>Código</th>
                                <th>Qtd</th>
                                <th>Preço unit.</th>
                                <th>Subtotal</th>
                                <th>Ação</th>
                            </tr>
                        </thead>

                        <tbody>
                            {pecasOS.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.nome}</td>
                                    <td>{item.codigo || "-"}</td>
                                    <td>{item.quantidade}</td>
                                    <td>R$ {formatarValor(item.preco)}</td>
                                    <td>R$ {formatarValor(item.subtotal)}</td>
                                    <td>
                                        <button
                                            className="table-button delete"
                                            onClick={() => removerPeca(item.id)}
                                        >
                                            Remover
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* SERVIÇOS */}

            <div className="dashboard-section">
                <div className="section-header">
                    <div>
                        <h2>Serviços</h2>
                        <p>Serviços realizados nesta ordem de serviço</p>
                    </div>
                </div>

                <form onSubmit={adicionarServico} className="form-row">
                    <div className="form-group">
                        <label>Serviço</label>

                        <select
                            value={novoServico.servico_id}
                            onChange={(e) =>
                                setNovoServico((estado) => ({ ...estado, servico_id: e.target.value }))
                            }
                        >
                            <option value="">Selecione...</option>

                            {servicosDisponiveis.map((servico) => (
                                <option key={servico.id} value={servico.id}>
                                    {servico.nome} — R$ {formatarValor(servico.preco)}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Quantidade</label>

                        <input
                            type="number"
                            min="1"
                            value={novoServico.quantidade}
                            onChange={(e) =>
                                setNovoServico((estado) => ({ ...estado, quantidade: e.target.value }))
                            }
                        />
                    </div>

                    <div className="form-group">
                        <label>&nbsp;</label>
                        <button type="submit" className="primary-button">
                            Adicionar serviço
                        </button>
                    </div>
                </form>

                {servicosOS.length === 0 && <p>Nenhum serviço adicionado.</p>}

                {servicosOS.length > 0 && (
                    <table>
                        <thead>
                            <tr>
                                <th>Serviço</th>
                                <th>Qtd</th>
                                <th>Preço unit.</th>
                                <th>Subtotal</th>
                                <th>Ação</th>
                            </tr>
                        </thead>

                        <tbody>
                            {servicosOS.map((item) => (
                                <tr key={item.id}>
                                    <td>{item.nome}</td>
                                    <td>{item.quantidade}</td>
                                    <td>R$ {formatarValor(item.preco)}</td>
                                    <td>R$ {formatarValor(item.subtotal)}</td>
                                    <td>
                                        <button
                                            className="table-button delete"
                                            onClick={() => removerServico(item.id)}
                                        >
                                            Remover
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* EXCLUIR OS */}

            {mostrarModalPagamento && (
                <div className="modal-overlay" onClick={() => !salvandoPagamento && setMostrarModalPagamento(false)}>
                    <div className="modal-content payment-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>Registrar pagamento</h2>
                                <p>Escolha como o cliente pagará a OS #{id}.</p>
                            </div>
                            <button
                                className="close-button"
                                onClick={() => setMostrarModalPagamento(false)}
                                disabled={salvandoPagamento}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={concluirComPagamento}>
                            <div className="form-group">
                                <label>Forma de pagamento</label>
                                <select
                                    value={dadosPagamento.forma_pagamento}
                                    onChange={(event) => setDadosPagamento((estado) => ({
                                        ...estado,
                                        forma_pagamento: event.target.value
                                    }))}
                                >
                                    <option value="dinheiro">Dinheiro</option>
                                    <option value="pix">PIX</option>
                                    <option value="debito">Débito</option>
                                    <option value="credito">Crédito</option>
                                    <option value="boleto">Boleto</option>
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Número de parcelas</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={dadosPagamento.numero_parcelas}
                                        onChange={(event) => setDadosPagamento((estado) => ({
                                            ...estado,
                                            numero_parcelas: event.target.value
                                        }))}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Vencimento da primeira parcela</label>
                                    <input
                                        type="date"
                                        value={dadosPagamento.data_primeira_parcela}
                                        onChange={(event) => setDadosPagamento((estado) => ({
                                            ...estado,
                                            data_primeira_parcela: event.target.value
                                        }))}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => setMostrarModalPagamento(false)}
                                    disabled={salvandoPagamento}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="primary-button" disabled={salvandoPagamento}>
                                    {salvandoPagamento ? "Registrando..." : "Concluir e registrar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="dashboard-section">
                <button className="table-button delete" onClick={excluirOrdem}>
                    Excluir ordem de serviço
                </button>
            </div>

        </div>
    );
}

export default OrdemServicoDetalhes;