import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useConfirm } from "../components/ConfirmContext";

function OrdensServico() {
    const navigate = useNavigate();
    const confirmAction = useConfirm();

    const [ordens, setOrdens] = useState([]);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(false);
    const [salvando, setSalvando] = useState(false);

    const [ordemSelecionada, setOrdemSelecionada] = useState(null);
    const [mostrarModalDetalhes, setMostrarModalDetalhes] = useState(false);
    const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);
    const [pecasOS, setPecasOS] = useState([]);
    const [servicosOS, setServicosOS] = useState([]);
    const [mostrarModalPagamento, setMostrarModalPagamento] = useState(false);
    const [ordemPagamentoId, setOrdemPagamentoId] = useState(null);
    const [dadosPagamento, setDadosPagamento] = useState({
        forma_pagamento: "pix",
        valor: "",
        data_pagamento: new Date().toISOString().split('T')[0]
    });
    const [salvandoPagamento, setSalvandoPagamento] = useState(false);

    const [formulario, setFormulario] = useState({
        nome: "",
        telefone: "",
        whatsapp: "",
        endereco: "",
        placa: "",
        marca: "",
        modelo: "",
        ano: "",
        cor: "",
        quilometragem: "",
        problema_relatado: "",
        diagnostico: "",
        observacoes: ""
    });

    const [pecasDisponiveis, setPecasDisponiveis] = useState([]);
    const [servicosDisponiveis, setServicosDisponiveis] = useState([]);

    const [novaPeca, setNovaPeca] = useState({ peca_id: "", quantidade: 1 });
    const [novoServico, setNovoServico] = useState({ servico_id: "", quantidade: 1 });

    const [pecasSelecionadas, setPecasSelecionadas] = useState([]);
    const [servicosSelecionados, setServicosSelecionados] = useState([]);

    const [carregandoPecas, setCarregandoPecas] = useState(false);
    const [carregandoServicos, setCarregandoServicos] = useState(false);
    const [erroPecas, setErroPecas] = useState("");
    const [erroServicos, setErroServicos] = useState("");

    const buscarOrdens = async () => {
        try {
            const dados = await api.get("/ordens-servico");
            
            // Filtrar para não mostrar ordens finalizadas na lista principal
            const ordensAtivas = dados.filter(ordem => ordem.status !== "finalizada");
            
            setOrdens(ordensAtivas);
            setErro(false);

        } catch (error) {
            console.error(error);
            setErro(true);

        } finally {
            setCarregando(false);
        }
    };

    const carregarListas = async () => {
        setErroPecas("");
        setErroServicos("");

        setCarregandoPecas(true);
        try {
            const pecas = await api.get("/pecas");
            setPecasDisponiveis(Array.isArray(pecas) ? pecas : []);
        } catch (e) {
            console.error("Erro peças:", e);
            setErroPecas(e.message || "Erro ao carregar peças");
        } finally {
            setCarregandoPecas(false);
        }

        setCarregandoServicos(true);
        try {
            const servicos = await api.get("/servicos");
            setServicosDisponiveis(Array.isArray(servicos) ? servicos : []);
        } catch (e) {
            console.error("Erro serviços:", e);
            setErroServicos(e.message || "Erro ao carregar serviços");
        } finally {
            setCarregandoServicos(false);
        }
    };

    useEffect(() => {
        buscarOrdens();
    }, []);

    useEffect(() => {
        if (mostrarFormulario) {
            carregarListas();
        }
    }, [mostrarFormulario]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormulario((anterior) => ({
            ...anterior,
            [name]: value
        }));
    };

    const limparFormulario = () => {
        setFormulario({
            nome: "",
            telefone: "",
            whatsapp: "",
            endereco: "",
            placa: "",
            marca: "",
            modelo: "",
            ano: "",
            cor: "",
            quilometragem: "",
            problema_relatado: "",
            diagnostico: "",
            observacoes: ""
        });
        setPecasSelecionadas([]);
        setServicosSelecionados([]);
        setNovaPeca({ peca_id: "", quantidade: 1 });
        setNovoServico({ servico_id: "", quantidade: 1 });
        setErroPecas("");
        setErroServicos("");
    };

    const formatarValor = (valor) => {
        return Number(valor || 0).toFixed(2);
    };

    const adicionarPeca = () => {
        if (!novaPeca.peca_id) {
            alert("Selecione uma peça.");
            return;
        }

        const peca = pecasDisponiveis.find(
            (p) => p.id === Number(novaPeca.peca_id)
        );

        if (!peca) return;

        const quantidade = Number(novaPeca.quantidade) || 1;

        setPecasSelecionadas((atual) => [
            ...atual,
            {
                peca_id: peca.id,
                nome: peca.nome,
                quantidade,
                preco: peca.preco_venda
            }
        ]);

        setNovaPeca({ peca_id: "", quantidade: 1 });
    };

    const removerPeca = (index) => {
        setPecasSelecionadas((atual) =>
            atual.filter((_, i) => i !== index)
        );
    };

    const adicionarServico = () => {
        if (!novoServico.servico_id) {
            alert("Selecione um serviço.");
            return;
        }

        const servico = servicosDisponiveis.find(
            (s) => s.id === Number(novoServico.servico_id)
        );

        if (!servico) return;

        const quantidade = Number(novoServico.quantidade) || 1;

        setServicosSelecionados((atual) => [
            ...atual,
            {
                servico_id: servico.id,
                nome: servico.nome,
                quantidade,
                preco: servico.preco
            }
        ]);

        setNovoServico({ servico_id: "", quantidade: 1 });
    };

    const removerServico = (index) => {
        setServicosSelecionados((atual) =>
            atual.filter((_, i) => i !== index)
        );
    };

    const totalEstimado =
        pecasSelecionadas.reduce(
            (total, item) => total + Number(item.preco || 0) * item.quantidade,
            0
        ) +
        servicosSelecionados.reduce(
            (total, item) => total + Number(item.preco || 0) * item.quantidade,
            0
        );

    const criarOrdem = async (event) => {
        event.preventDefault();

        try {
            setSalvando(true);

            const resposta = await api.post("/ordens-servico", {
                oficina_id: 1,

                nome: formulario.nome,
                telefone: formulario.telefone,
                whatsapp: formulario.whatsapp,
                endereco: formulario.endereco,

                placa: formulario.placa,
                marca: formulario.marca,
                modelo: formulario.modelo,
                ano: formulario.ano
                    ? Number(formulario.ano)
                    : null,
                cor: formulario.cor || null,
                quilometragem: formulario.quilometragem
                    ? Number(formulario.quilometragem)
                    : 0,

                problema_relatado: formulario.problema_relatado || null,
                diagnostico: formulario.diagnostico || null,
                observacoes: formulario.observacoes || null,

                pecas: pecasSelecionadas.map(p => ({
                    peca_id: p.peca_id,
                    quantidade: p.quantidade
                })),

                servicos: servicosSelecionados.map(s => ({
                    servico_id: s.servico_id,
                    quantidade: s.quantidade
                }))
            });

            limparFormulario();
            setMostrarFormulario(false);

            await buscarOrdens();

            alert("Ordem de serviço criada com sucesso!");

            navigate(`/ordens-servico/${resposta.id}`);

        } catch (error) {
            console.error("Erro ao criar OS:", error);

            const mensagem =
                error?.message ||
                error?.response?.data?.mensagem ||
                "Erro ao criar ordem de serviço (verifique o estoque das peças).";

            alert(mensagem);
        } finally {
            setSalvando(false);
        }
    };

    const excluirOrdem = async (id) => {
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
            await buscarOrdens();
            alert("Ordem de serviço excluída com sucesso!");
        } catch (error) {
            console.error("Erro ao excluir ordem:", error);
            alert("Erro ao excluir ordem de serviço.");
        }
    };

    const finalizarOrdem = async (id) => {
        const confirmar = await confirmAction({
            title: "Finalizar ordem de serviço?",
            message: "A ordem será marcada como finalizada e cobrança gerada.",
            confirmLabel: "Finalizar OS",
            variant: "primary"
        });

        if (!confirmar) {
            return;
        }

        try {
            // Primeiro busca a ordem atual para pegar os dados
            const ordemAtual = ordens.find(o => o.id === id);

            await api.put(`/ordens-servico/${id}`, {
                problema_relatado: ordemAtual.problema_relatado,
                diagnostico: ordemAtual.diagnostico,
                observacoes: ordemAtual.observacoes,
                quilometragem: ordemAtual.quilometragem,
                status: "finalizada",
                valor_total: ordemAtual.valor_total
            });

            await buscarOrdens();

            // Abrir modal de pagamento para o lançamento gerado
            setOrdemPagamentoId(id);
            setMostrarModalPagamento(true);

            alert("Ordem de serviço finalizada com sucesso! Cobrança gerada.");
        } catch (error) {
            console.error("Erro ao finalizar ordem:", error);
            alert("Erro ao finalizar ordem de serviço.");
        }
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
            aberta: "Aguardando avaliação",
            em_andamento: "Em execução"
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

    const confirmarPagamentoConcluida = async () => {
        if (!ordemPagamentoId) return;

        try {
            setSalvandoPagamento(true);

            // Buscar o lançamento gerado para esta OS
            const [lancamentos] = await api.financeiro.listarLancamentos({
                ordem_servico_id: ordemPagamentoId
            });

            if (!lancamentos || lancamentos.length === 0) {
                alert("Nenhum lançamento encontrado para esta ordem de serviço.");
                return;
            }

            const lancamento = lancamentos[0];

            // Registrar pagamento usando o novo sistema
            await api.financeiro.registrarPagamento(lancamento.id, {
                valor: dadosPagamento.valor || lancamento.valor,
                forma_pagamento: dadosPagamento.forma_pagamento,
                data_pagamento: dadosPagamento.data_primeira_parcela
            });

            setMostrarModalPagamento(false);
            setOrdemPagamentoId(null);
            setDadosPagamento({
                forma_pagamento: "pix",
                valor: "",
                data_pagamento: new Date().toISOString().split('T')[0]
            });
            await buscarOrdens();
            alert("Pagamento registrado com sucesso!");
        } catch (error) {
            console.error("Erro ao registrar pagamento:", error);
            alert(error.message || "Erro ao registrar o pagamento.");
        } finally {
            setSalvandoPagamento(false);
        }
    };

    const atualizarStatus = async (id, novoStatus) => {
        const ordemAtual = ordens.find(o => o.id === id);

        try {
            await api.put(`/ordens-servico/${id}`, {
                problema_relatado: ordemAtual.problema_relatado,
                diagnostico: ordemAtual.diagnostico,
                observacoes: ordemAtual.observacoes,
                quilometragem: ordemAtual.quilometragem,
                status: novoStatus,
                valor_total: ordemAtual.valor_total
            });

            await buscarOrdens();
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            alert("Erro ao atualizar status da ordem de serviço.");
        }
    };

    const abrirModalDetalhes = async (ordem) => {
        setOrdemSelecionada(ordem);
        setMostrarModalDetalhes(true);
        setCarregandoDetalhes(true);

        try {
            const [pecasData, servicosData] = await Promise.all([
                api.get(`/ordens-servico/${ordem.id}/pecas`),
                api.get(`/ordens-servico/${ordem.id}/servicos`)
            ]);
            setPecasOS(pecasData);
            setServicosOS(servicosData);
        } catch (error) {
            console.error("Erro ao carregar detalhes:", error);
        } finally {
            setCarregandoDetalhes(false);
        }
    };

    const fecharModalDetalhes = () => {
        setMostrarModalDetalhes(false);
        setOrdemSelecionada(null);
        setPecasOS([]);
        setServicosOS([]);
    };

    return (
        <div className="dashboard">

            <div className="dashboard-header">

                <div>
                    <h1>Ordens de Serviço</h1>

                    <p>
                        Gerencie os serviços da sua oficina
                    </p>
                </div>

                <button
                    className="primary-button"
                    onClick={() => setMostrarFormulario(true)}
                >
                    + Nova OS
                </button>

            </div>

            {mostrarModalPagamento && (
                <div className="modal-overlay" onClick={() => !salvandoPagamento && setMostrarModalPagamento(false)}>
                    <div className="modal-content payment-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>Registrar pagamento</h2>
                                <p>Registro de pagamento da ordem de serviço finalizada.</p>
                            </div>
                            <button
                                className="close-button"
                                onClick={() => setMostrarModalPagamento(false)}
                                disabled={salvandoPagamento}
                            >
                                ×
                            </button>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Forma de pagamento</label>
                                <select
                                    value={dadosPagamento.forma_pagamento}
                                    onChange={(event) => setDadosPagamento((estado) => ({ ...estado, forma_pagamento: event.target.value }))}
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
                                <label>Valor</label>
                                <input
                                    type="number"
                                    value={dadosPagamento.valor}
                                    onChange={(event) => setDadosPagamento((estado) => ({ ...estado, valor: event.target.value }))}
                                />
                            </div>

                            <div className="form-group">
                                <label>Data do pagamento</label>
                                <input
                                    type="date"
                                    value={dadosPagamento.data_pagamento}
                                    onChange={(event) => setDadosPagamento((estado) => ({ ...estado, data_pagamento: event.target.value }))}
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
                            <button
                                type="button"
                                className="primary-button"
                                onClick={confirmarPagamentoConcluida}
                                disabled={salvandoPagamento}
                            >
                                {salvandoPagamento ? "Registrando..." : "Confirmar pagamento"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {mostrarFormulario && (

                <div className="form-container modal-nova-os">

                    <div className="form-header">

                        <div>
                            <h2>Nova Ordem de Serviço</h2>

                            <p>
                                Cadastre o cliente, veículo, manutenção, peças e serviços.
                            </p>
                        </div>

                        <button
                            className="close-button"
                            onClick={() => {
                                limparFormulario();
                                setMostrarFormulario(false);
                            }}
                        >
                            ×
                        </button>

                    </div>

                    <form onSubmit={criarOrdem}>

                        <h3 className="form-section-title">
                            Dados do cliente
                        </h3>

                        <div className="form-row">

                            <div className="form-group">

                                <label>Nome</label>

                                <input
                                    type="text"
                                    name="nome"
                                    value={formulario.nome}
                                    onChange={handleChange}
                                    placeholder="Nome completo"
                                    required
                                />

                            </div>

                            <div className="form-group">

                                <label>Telefone</label>

                                <input
                                    type="text"
                                    name="telefone"
                                    value={formulario.telefone}
                                    onChange={handleChange}
                                    placeholder="(79) 99999-9999"
                                    required
                                />

                            </div>

                            <div className="form-group">

                                <label>WhatsApp</label>

                                <input
                                    type="text"
                                    name="whatsapp"
                                    value={formulario.whatsapp}
                                    onChange={handleChange}
                                    placeholder="(79) 99999-9999"
                                />

                            </div>

                            <div className="form-group">

                                <label>Endereço</label>

                                <input
                                    type="text"
                                    name="endereco"
                                    value={formulario.endereco}
                                    onChange={handleChange}
                                    placeholder="Endereço do cliente"
                                />

                            </div>

                        </div>

                        <h3 className="form-section-title">
                            Dados do veículo
                        </h3>

                        <div className="form-row">

                            <div className="form-group">

                                <label>Placa</label>

                                <input
                                    type="text"
                                    name="placa"
                                    value={formulario.placa}
                                    onChange={handleChange}
                                    placeholder="ABC1D23"
                                    required
                                />

                            </div>

                            <div className="form-group">

                                <label>Marca</label>

                                <input
                                    type="text"
                                    name="marca"
                                    value={formulario.marca}
                                    onChange={handleChange}
                                    placeholder="Toyota"
                                    required
                                />

                            </div>

                            <div className="form-group">

                                <label>Modelo</label>

                                <input
                                    type="text"
                                    name="modelo"
                                    value={formulario.modelo}
                                    onChange={handleChange}
                                    placeholder="Corolla"
                                    required
                                />

                            </div>

                        </div>

                        <div className="form-row">

                            <div className="form-group">

                                <label>Ano</label>

                                <input
                                    type="number"
                                    name="ano"
                                    value={formulario.ano}
                                    onChange={handleChange}
                                    placeholder="2022"
                                />

                            </div>

                            <div className="form-group">

                                <label>Cor</label>

                                <input
                                    type="text"
                                    name="cor"
                                    value={formulario.cor}
                                    onChange={handleChange}
                                    placeholder="Prata"
                                />

                            </div>

                            <div className="form-group">

                                <label>Quilometragem</label>

                                <input
                                    type="number"
                                    name="quilometragem"
                                    value={formulario.quilometragem}
                                    onChange={handleChange}
                                    placeholder="45000"
                                />

                            </div>

                        </div>

                        <h3 className="form-section-title">
                            Manutenção
                        </h3>

                        <div className="form-group">

                            <label>
                                Problema relatado pelo cliente
                            </label>

                            <textarea
                                name="problema_relatado"
                                value={formulario.problema_relatado}
                                onChange={handleChange}
                                placeholder="Descreva o problema relatado pelo cliente..."
                                rows="3"
                            />

                        </div>

                        <div className="form-group">

                            <label>
                                Diagnóstico
                            </label>

                            <textarea
                                name="diagnostico"
                                value={formulario.diagnostico}
                                onChange={handleChange}
                                placeholder="Informe o diagnóstico..."
                                rows="3"
                            />

                        </div>

                        <div className="form-group">

                            <label>
                                Observações
                            </label>

                            <textarea
                                name="observacoes"
                                value={formulario.observacoes}
                                onChange={handleChange}
                                placeholder="Observações adicionais..."
                                rows="3"
                            />

                        </div>

                        <h3 className="form-section-title">
                            Peças
                        </h3>

                        {erroPecas && (
                            <div className="erro-api">
                                <strong>⚠️ {erroPecas}</strong>
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={carregarListas}
                                >
                                    Tentar novamente
                                </button>
                            </div>
                        )}

                        {!erroPecas && !carregandoPecas && pecasDisponiveis.length === 0 && (
                            <p className="mensagem-vazia">
                                ⚠️ Nenhuma peça cadastrada no sistema.
                                <button
                                    type="button"
                                    className="link-button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        navigate("/pecas");
                                    }}
                                >
                                    Cadastrar peças
                                </button>
                            </p>
                        )}

                        <div className="form-row adicionar-item-row">

                            <div className="form-group">

                                <label>Selecionar Peça</label>

                                <select
                                    value={novaPeca.peca_id}
                                    onChange={(e) =>
                                        setNovaPeca((estado) => ({
                                            ...estado,
                                            peca_id: e.target.value
                                        }))
                                    }
                                    disabled={carregandoPecas || erroPecas || pecasDisponiveis.length === 0}
                                >
                                    <option value="">
                                        {carregandoPecas ? "Carregando peças..." :
                                            erroPecas ? "Erro ao carregar peças" :
                                                pecasDisponiveis.length === 0 ? "Nenhuma peça cadastrada" :
                                                    "Selecione uma peça..."}
                                    </option>

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
                                        setNovaPeca((estado) => ({
                                            ...estado,
                                            quantidade: e.target.value
                                        }))
                                    }
                                />

                            </div>

                            <div className="form-group form-group-botao">

                                <label>&nbsp;</label>

                                <button
                                    type="button"
                                    className="primary-button"
                                    onClick={adicionarPeca}
                                    disabled={carregandoPecas || erroPecas || pecasDisponiveis.length === 0 || !novaPeca.peca_id}
                                >
                                    + Adicionar Peça
                                </button>

                            </div>

                        </div>

                        {pecasSelecionadas.length === 0 ? (
                            <p className="mensagem-vazia">Nenhuma peça adicionada ainda.</p>
                        ) : (

                            <div className="itens-lista">

                                {pecasSelecionadas.map((item, index) => (

                                    <div key={index} className="item-card">

                                        <div className="item-info">
                                            <strong>{item.nome}</strong>
                                            <small>Qtd: {item.quantidade} × R$ {formatarValor(item.preco)}</small>
                                        </div>

                                        <div className="item-acoes">
                                            <span className="item-subtotal">
                                                R$ {formatarValor(item.preco * item.quantidade)}
                                            </span>
                                            <button
                                                type="button"
                                                className="table-button delete"
                                                onClick={() => removerPeca(index)}
                                            >
                                                Remover
                                            </button>
                                        </div>

                                    </div>

                                ))}

                            </div>
                        )}

                        <h3 className="form-section-title">
                            Serviços
                        </h3>

                        {erroServicos && (
                            <div className="erro-api">
                                <strong>⚠️ {erroServicos}</strong>
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={carregarListas}
                                >
                                    Tentar novamente
                                </button>
                            </div>
                        )}

                        {!erroServicos && !carregandoServicos && servicosDisponiveis.length === 0 && (
                            <p className="mensagem-vazia">
                                ⚠️ Nenhum serviço cadastrado no sistema.
                                <button
                                    type="button"
                                    className="link-button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        navigate("/servicos");
                                    }}
                                >
                                    Cadastrar serviços
                                </button>
                            </p>
                        )}

                        <div className="form-row adicionar-item-row">

                            <div className="form-group">

                                <label>Selecionar Serviço</label>

                                <select
                                    value={novoServico.servico_id}
                                    onChange={(e) =>
                                        setNovoServico((estado) => ({
                                            ...estado,
                                            servico_id: e.target.value
                                        }))
                                    }
                                    disabled={carregandoServicos || erroServicos || servicosDisponiveis.length === 0}
                                >
                                    <option value="">
                                        {carregandoServicos ? "Carregando serviços..." :
                                            erroServicos ? "Erro ao carregar serviços" :
                                                servicosDisponiveis.length === 0 ? "Nenhum serviço cadastrado" :
                                                    "Selecione um serviço..."}
                                    </option>

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
                                        setNovoServico((estado) => ({
                                            ...estado,
                                            quantidade: e.target.value
                                        }))
                                    }
                                />

                            </div>

                            <div className="form-group form-group-botao">

                                <label>&nbsp;</label>

                                <button
                                    type="button"
                                    className="primary-button"
                                    onClick={adicionarServico}
                                    disabled={carregandoServicos || erroServicos || servicosDisponiveis.length === 0 || !novoServico.servico_id}
                                >
                                    + Adicionar Serviço
                                </button>

                            </div>

                        </div>

                        {servicosSelecionados.length === 0 ? (
                            <p className="mensagem-vazia">Nenhum serviço adicionado ainda.</p>
                        ) : (

                            <div className="itens-lista">

                                {servicosSelecionados.map((item, index) => (

                                    <div key={index} className="item-card">

                                        <div className="item-info">
                                            <strong>{item.nome}</strong>
                                            <small>Qtd: {item.quantidade} × R$ {formatarValor(item.preco)}</small>
                                        </div>

                                        <div className="item-acoes">
                                            <span className="item-subtotal">
                                                R$ {formatarValor(item.preco * item.quantidade)}
                                            </span>
                                            <button
                                                type="button"
                                                className="table-button delete"
                                                onClick={() => removerServico(index)}
                                            >
                                                Remover
                                            </button>
                                        </div>

                                    </div>

                                ))}

                            </div>
                        )}

                        <div className="financial-summary">

                            <div>
                                <span>Total estimado</span>
                                <strong>R$ {formatarValor(totalEstimado)}</strong>
                            </div>

                            <div className="contadores-itens">
                                <span>Peças: {pecasSelecionadas.length}</span>
                                <span>Serviços: {servicosSelecionados.length}</span>
                            </div>

                        </div>

                        <div className="form-actions">

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => {
                                    limparFormulario();
                                    setMostrarFormulario(false);
                                }}
                                disabled={salvando}
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                className="primary-button"
                                disabled={salvando}
                            >
                                {salvando ? "Salvando..." : "Criar ordem de serviço"}
                            </button>

                        </div>

                    </form>

                </div>
            )}

            <div className="table-container">

                {carregando && (
                    <p>Carregando ordens de serviço...</p>
                )}

                {erro && (
                    <p>
                        Não foi possível carregar as ordens de serviço.
                    </p>
                )}

                {!carregando &&
                    !erro &&
                    ordens.length === 0 && (
                        <p>
                            Nenhuma ordem de serviço cadastrada.
                        </p>
                    )}

                {!carregando &&
                    !erro &&
                    ordens.length > 0 && (

                    <div className="ordens-grid">

                        {ordens.map((ordem) => {

                            const statusLabel = getStatusLabel(ordem.status);
                            const statusColor = getStatusColor(ordem.status);

                            return (
                                <div key={ordem.id} className="ordem-card" style={{ borderTopColor: statusColor }} onClick={() => abrirModalDetalhes(ordem)}>

                                    <div className="ordem-card-header">
                                        <div className="ordem-card-status">
                                            <strong>#{ordem.id}</strong>
                                            <div className="status-selector">
                                                <select
                                                    value={ordem.status}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onFocus={(e) => e.stopPropagation()}
                                                    onChange={(e) => { e.stopPropagation(); atualizarStatus(ordem.id, e.target.value); }}
                                                    className="status-dropdown"
                                                    style={{ backgroundColor: statusColor }}
                                                >
                                                    <option value="aguardando_avaliacao">Aguardando avaliação</option>
                                                    <option value="em_avaliacao">Em avaliação</option>
                                                    <option value="aguardando_aprovacao">Aguardando aprovação</option>
                                                    <option value="aguardando_peca">Aguardando peça</option>
                                                    <option value="em_execucao">Em execução</option>
                                                    <option value="concluida">Concluído / Aguardando retirada</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="ordem-card-actions">
                                            <button
                                                className="table-button edit"
                                                onClick={(e) => { e.stopPropagation(); navigate(`/ordens-servico/${ordem.id}?edit=true`); }}
                                            >
                                                Editar
                                            </button>
                                            {ordem.status !== "finalizada" && (
                                                <button
                                                    className="table-button finalize"
                                                    onClick={(e) => { e.stopPropagation(); finalizarOrdem(ordem.id); }}
                                                >
                                                    Finalizar
                                                </button>
                                            )}
                                            <button
                                                className="table-button delete"
                                                onClick={(e) => { e.stopPropagation(); excluirOrdem(ordem.id); }}
                                            >
                                                Excluir
                                            </button>
                                        </div>
                                    </div>

                                    <div className="ordem-card-cliente">
                                        <strong>{ordem.cliente_nome}</strong>
                                        <small>{ordem.cliente_telefone}</small>
                                    </div>

                                    <div className="ordem-card-veiculo">
                                        <span>{ordem.marca} {ordem.modelo}</span>
                                        <small>{ordem.placa}</small>
                                    </div>

                                    <div className="ordem-card-detalhes">
                                        <div>
                                            <span>Problema:</span>
                                            <strong>{ordem.problema_relatado || "-"}</strong>
                                        </div>
                                        <div>
                                            <span>Valor:</span>
                                            <strong>R$ {Number(ordem.valor_total || 0).toFixed(2)}</strong>
                                        </div>
                                        <div>
                                            <span>Data:</span>
                                            <strong>{formatarData(ordem.data_abertura)}</strong>
                                        </div>
                                    </div>

                                </div>
                            );
                        })}

                    </div>
                )}

            </div>

            {/* MODAL DE DETALHES DA OS */}
            {mostrarModalDetalhes && ordemSelecionada && (
                <div className="modal-overlay" onClick={fecharModalDetalhes}>
                    <div className="modal-content modal-detalhes-os" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h2>Ordem de Serviço #{ordemSelecionada.id}</h2>
                                <p>{formatarData(ordemSelecionada.data_abertura)}</p>
                            </div>
                            <button className="close-button" onClick={fecharModalDetalhes}>×</button>
                        </div>

                        <div className="modal-detalhes-grid">
                            <div className="detalhe-section">
                                <h3>Cliente</h3>
                                <p><strong>Nome:</strong> {ordemSelecionada.cliente_nome}</p>
                                <p><strong>Telefone:</strong> {ordemSelecionada.cliente_telefone || "-"}</p>
                            </div>

                            <div className="detalhe-section">
                                <h3>Veículo</h3>
                                <p><strong>Marca/Modelo:</strong> {ordemSelecionada.marca} {ordemSelecionada.modelo}</p>
                                <p><strong>Placa:</strong> {ordemSelecionada.placa}</p>
                                <p><strong>Ano:</strong> {ordemSelecionada.ano || "-"}</p>
                                <p><strong>Cor:</strong> {ordemSelecionada.cor || "-"}</p>
                                <p><strong>Quilometragem:</strong> {Number(ordemSelecionada.quilometragem || 0).toLocaleString("pt-BR")} km</p>
                            </div>

                            <div className="detalhe-section">
                                <h3>Status</h3>
                                <p style={{ color: getStatusColor(ordemSelecionada.status), fontWeight: 'bold' }}>
                                    {getStatusLabel(ordemSelecionada.status)}
                                </p>
                            </div>

                            <div className="detalhe-section full-width">
                                <h3>Problema Relatado</h3>
                                <p>{ordemSelecionada.problema_relatado || "-"}</p>
                            </div>

                            <div className="detalhe-section full-width">
                                <h3>Diagnóstico</h3>
                                <p>{ordemSelecionada.diagnostico || "-"}</p>
                            </div>

                            <div className="detalhe-section full-width">
                                <h3>Observações</h3>
                                <p>{ordemSelecionada.observacoes || "-"}</p>
                            </div>

                            <div className="detalhe-section full-width">
                                <h3>Peças</h3>
                                {carregandoDetalhes ? (
                                    <p>Carregando...</p>
                                ) : pecasOS.length === 0 ? (
                                    <p>Nenhuma peça</p>
                                ) : (
                                    <ul>
                                        {pecasOS.map((peca, index) => (
                                            <li key={index}>
                                                {peca.nome} - Qtd: {peca.quantidade} - R$ {Number(peca.preco || 0).toFixed(2)}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="detalhe-section full-width">
                                <h3>Serviços</h3>
                                {carregandoDetalhes ? (
                                    <p>Carregando...</p>
                                ) : servicosOS.length === 0 ? (
                                    <p>Nenhum serviço</p>
                                ) : (
                                    <ul>
                                        {servicosOS.map((servico, index) => (
                                            <li key={index}>
                                                {servico.nome} - Qtd: {servico.quantidade} - R$ {Number(servico.preco || 0).toFixed(2)}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="detalhe-section">
                                <h3>Valor Total</h3>
                                <p><strong>R$ {Number(ordemSelecionada.valor_total || 0).toFixed(2)}</strong></p>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="secondary-button" onClick={fecharModalDetalhes}>Fechar</button>
                            <button className="primary-button" onClick={() => { fecharModalDetalhes(); navigate(`/ordens-servico/${ordemSelecionada.id}?edit=true`); }}>Editar</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default OrdensServico;
