import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useConfirm } from "../components/ConfirmContext";

function NovaOrdemServico() {
    const navigate = useNavigate();
    const confirmAction = useConfirm();

    const [formulario, setFormulario] = useState({
        oficina_id: 1,

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

    const [salvando, setSalvando] = useState(false);

    const [pecasDisponiveis, setPecasDisponiveis] = useState([]);
    const [servicosDisponiveis, setServicosDisponiveis] = useState([]);

    const [novaPeca, setNovaPeca] = useState({ peca_id: "", quantidade: 1 });
    const [novoServico, setNovoServico] = useState({ servico_id: "", quantidade: 1 });

    const [pecasSelecionadas, setPecasSelecionadas] = useState([]);
    const [servicosSelecionados, setServicosSelecionados] = useState([]);
    const [status, setStatus] = useState("aberta");
    const [servicosAdicionais, setServicosAdicionais] = useState([]);
    const [novoServicoAdicional, setNovoServicoAdicional] = useState({
        descricao: "",
        valor: ""
    });

    const [carregandoPecas, setCarregandoPecas] = useState(true);
    const [carregandoServicos, setCarregandoServicos] = useState(true);

    const [erroPecas, setErroPecas] = useState("");
    const [erroServicos, setErroServicos] = useState("");

    const carregarDados = async () => {
        setErroPecas("");
        setErroServicos("");

        setCarregandoPecas(true);
        try {
            const pecas = await api.get("/pecas");
            setPecasDisponiveis(Array.isArray(pecas) ? pecas : []);
        } catch (error) {
            console.error("Erro ao carregar peças:", error);
            setErroPecas(error.message || "Erro ao carregar peças. Verifique se o backend está rodando.");
        } finally {
            setCarregandoPecas(false);
        }

        setCarregandoServicos(true);
        try {
            const servicos = await api.get("/servicos");
            setServicosDisponiveis(Array.isArray(servicos) ? servicos : []);
        } catch (error) {
            console.error("Erro ao carregar serviços:", error);
            setErroServicos(error.message || "Erro ao carregar serviços. Verifique se o backend está rodando.");
        } finally {
            setCarregandoServicos(false);
        }
    };

    useEffect(() => {
        carregarDados();
    }, []);

    const alterarCampo = (e) => {
        const { name, value } = e.target;

        setFormulario((estadoAnterior) => ({
            ...estadoAnterior,
            [name]: value
        }));
    };

    const formatarValor = (valor) => {
        return Number(valor || 0).toFixed(2);
    };

    const calcularSubtotalCentavos = (item) => {
        const precoCentavos = Math.round(Number(item.preco || 0) * 100);
        const quantidade = Number(item.quantidade) || 0;
        return precoCentavos * quantidade;
    };

    const adicionarPeca = () => {
        if (!novaPeca.peca_id) {
            alert("Selecione uma peça.");
            return;
        }

        const peca = pecasDisponiveis.find(
            (p) => p.id === Number(novaPeca.peca_id)
        );

        if (!peca) {
            alert("Peça não encontrada. Tente recarregar a página.");
            return;
        }

        const quantidade = Number(novaPeca.quantidade);
        if (!Number.isInteger(quantidade) || quantidade < 1) {
            alert("Informe uma quantidade válida de peças.");
            return;
        }

        setPecasSelecionadas((atual) => [
            ...atual,
            {
                peca_id: peca.id,
                nome: peca.nome,
                codigo: peca.codigo,
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

        if (!servico) {
            alert("Serviço não encontrado. Tente recarregar a página.");
            return;
        }

        const quantidade = Number(novoServico.quantidade);
        if (!Number.isInteger(quantidade) || quantidade < 1) {
            alert("Informe uma quantidade válida de serviços.");
            return;
        }

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

    const adicionarServicoAdicional = () => {
        const descricao = novoServicoAdicional.descricao.trim();
        const valorCentavos = Math.round(Number(novoServicoAdicional.valor || 0) * 100);

        if (!descricao || !Number.isFinite(valorCentavos) || valorCentavos <= 0) {
            alert("Informe a descrição e um valor maior que zero para o serviço adicional.");
            return;
        }

        setServicosAdicionais((atuais) => [
            ...atuais,
            { descricao, valor: valorCentavos / 100 }
        ]);
        setNovoServicoAdicional({ descricao: "", valor: "" });
    };

    const removerServicoAdicional = (index) => {
        setServicosAdicionais((atuais) => atuais.filter((_, i) => i !== index));
    };

    const servicosAdicionaisCentavos = servicosAdicionais.reduce(
        (total, item) => total + Math.round(Number(item.valor || 0) * 100),
        0
    );
    const pecaEmSelecao = pecasDisponiveis.find(
        (peca) => peca.id === Number(novaPeca.peca_id)
    );
    const servicoEmSelecao = servicosDisponiveis.find(
        (servico) => servico.id === Number(novoServico.servico_id)
    );
    const quantidadePecaEmSelecao = Number.isInteger(Number(novaPeca.quantidade)) &&
        Number(novaPeca.quantidade) > 0
        ? Number(novaPeca.quantidade)
        : 0;
    const quantidadeServicoEmSelecao = Number.isInteger(Number(novoServico.quantidade)) &&
        Number(novoServico.quantidade) > 0
        ? Number(novoServico.quantidade)
        : 0;
    const subtotalPecaEmSelecaoCentavos = pecaEmSelecao
        ? Math.round(Number(pecaEmSelecao.preco_venda || 0) * 100) * quantidadePecaEmSelecao
        : 0;
    const subtotalServicoEmSelecaoCentavos = servicoEmSelecao
        ? Math.round(Number(servicoEmSelecao.preco || 0) * 100) * quantidadeServicoEmSelecao
        : 0;
    const totalEstimadoCentavos = [
        ...pecasSelecionadas,
        ...servicosSelecionados
    ].reduce((total, item) => total + calcularSubtotalCentavos(item), servicosAdicionaisCentavos)
        + subtotalPecaEmSelecaoCentavos
        + subtotalServicoEmSelecaoCentavos;
    const totalEstimado = totalEstimadoCentavos / 100;

    const salvarOS = async (e) => {
        e.preventDefault();

        try {
            setSalvando(true);

            const resposta = await api.post(
                "/ordens-servico",
                {
                    ...formulario,
                    oficina_id: Number(formulario.oficina_id),
                    ano: formulario.ano
                        ? Number(formulario.ano)
                        : null,
                    quilometragem: formulario.quilometragem
                        ? Number(formulario.quilometragem)
                        : 0,
                    pecas: pecasSelecionadas.map(p => ({
                        peca_id: p.peca_id,
                        quantidade: p.quantidade
                    })),
                    servicos: servicosSelecionados.map(s => ({
                        servico_id: s.servico_id,
                        quantidade: s.quantidade
                    })),
                    servicos_adicionais: servicosAdicionais,
                    status,
                }
            );

            const ordemId = resposta.id;

            alert("Ordem de serviço criada com sucesso!");

            navigate(`/ordens-servico/${ordemId}`);

        } catch (error) {
            console.error("Erro ao criar OS:", error);
            alert(`Erro ao criar ordem de serviço: ${error.message || "Verifique o estoque das peças selecionadas."}`);
        } finally {
            setSalvando(false);
        }
    };

    const cancelar = async () => {
        const confirmar = await confirmAction({
            title: "Descartar nova ordem de serviço?",
            message: "Os dados preenchidos serão perdidos.",
            confirmLabel: "Descartar dados",
            variant: "danger"
        });

        if (confirmar) {
            navigate("/ordens-servico");
        }
    };

    return (
        <div className="dashboard">

            <div className="dashboard-header">

                <div>
                    <h1>Nova Ordem de Serviço</h1>

                    <p>
                        Cadastre o cliente, veículo, manutenção, peças e serviços.
                    </p>
                </div>

            </div>

            <form onSubmit={salvarOS}>

                <div className="dashboard-section">

                    <h2>Cliente</h2>

                    <div className="form-row">

                        <div className="form-group">

                            <label>Nome</label>

                            <input
                                type="text"
                                name="nome"
                                value={formulario.nome}
                                onChange={alterarCampo}
                                placeholder="Nome do cliente"
                                required
                            />

                        </div>

                        <div className="form-group">

                            <label>Telefone</label>

                            <input
                                type="text"
                                name="telefone"
                                value={formulario.telefone}
                                onChange={alterarCampo}
                                placeholder="Telefone"
                                required
                            />

                        </div>

                        <div className="form-group">

                            <label>WhatsApp</label>

                            <input
                                type="text"
                                name="whatsapp"
                                value={formulario.whatsapp}
                                onChange={alterarCampo}
                                placeholder="(79) 99999-9999"
                            />

                        </div>

                        <div className="form-group">

                            <label>Endereço</label>

                            <input
                                type="text"
                                name="endereco"
                                value={formulario.endereco}
                                onChange={alterarCampo}
                                placeholder="Endereço do cliente"
                            />

                        </div>

                    </div>

                </div>

                <div className="dashboard-section">

                    <h2>Veículo</h2>

                    <div className="form-row">

                        <div className="form-group">

                            <label>Placa</label>

                            <input
                                type="text"
                                name="placa"
                                value={formulario.placa}
                                onChange={alterarCampo}
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
                                onChange={alterarCampo}
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
                                onChange={alterarCampo}
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
                                onChange={alterarCampo}
                                placeholder="2026"
                            />

                        </div>

                        <div className="form-group">

                            <label>Cor</label>

                            <input
                                type="text"
                                name="cor"
                                value={formulario.cor}
                                onChange={alterarCampo}
                                placeholder="Preto"
                            />

                        </div>

                        <div className="form-group">

                            <label>Quilometragem</label>

                            <input
                                type="number"
                                name="quilometragem"
                                value={formulario.quilometragem}
                                onChange={alterarCampo}
                                placeholder="32000"
                            />

                        </div>

                    </div>

                    <div className="form-group">
                        <label>Status inicial da ordem</label>
                        <select value={status} onChange={(event) => setStatus(event.target.value)}>
                            <option value="aberta">Aberta</option>
                            <option value="aguardando_avaliacao">Aguardando avaliação</option>
                            <option value="em_avaliacao">Em avaliação</option>
                            <option value="aguardando_aprovacao">Aguardando aprovação</option>
                            <option value="aguardando_peca">Aguardando peça</option>
                            <option value="em_execucao">Em execução</option>
                        </select>
                        <small>Para concluir a OS e registrar o pagamento, use a ação de conclusão nos detalhes.</small>
                    </div>

                </div>

                <div className="dashboard-section">

                    <h2>Manutenção</h2>

                    <div className="form-group">

                        <label>Problema relatado</label>

                        <textarea
                            name="problema_relatado"
                            value={formulario.problema_relatado}
                            onChange={alterarCampo}
                            placeholder="Descreva o problema relatado pelo cliente"
                            rows="3"
                        />

                    </div>

                    <div className="form-group">

                        <label>Diagnóstico</label>

                        <textarea
                            name="diagnostico"
                            value={formulario.diagnostico}
                            onChange={alterarCampo}
                            placeholder="Diagnóstico do mecânico"
                            rows="3"
                        />

                    </div>

                    <div className="form-group">

                        <label>Observações</label>

                        <textarea
                            name="observacoes"
                            value={formulario.observacoes}
                            onChange={alterarCampo}
                            placeholder="Observações adicionais"
                            rows="3"
                        />

                    </div>

                </div>

                <div className="dashboard-section">

                    <h2>Peças</h2>

                    {erroPecas && (
                        <div className="erro-api">
                            <strong>⚠️ {erroPecas}</strong>
                            <button type="button" className="secondary-button" onClick={carregarDados}>
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
                                onClick={() => navigate("/pecas")}
                            >
                                Cadastrar peças primeiro
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

                    {novaPeca.peca_id && (() => {
                        const pecaSelecionada = pecasDisponiveis.find(
                            peca => peca.id === Number(novaPeca.peca_id)
                        );
                        if (!pecaSelecionada) return null;
                        const quantidade = quantidadePecaEmSelecao;
                        const subtotal = Math.round(Number(pecaSelecionada.preco_venda || 0) * 100) * quantidade / 100;
                        return (
                            <p className="info-message">
                                Preço de venda: {formatarValor(pecaSelecionada.preco_venda)} × {quantidade} = {formatarValor(subtotal)}
                            </p>
                        );
                    })()}

                    {pecasSelecionadas.length === 0 &&
                        !novaPeca.peca_id &&
                        !carregandoPecas &&
                        !erroPecas &&
                        pecasDisponiveis.length > 0 ? (
                        <p className="mensagem-vazia">Nenhuma peça adicionada ainda.</p>
                    ) : pecasSelecionadas.length > 0 && (

                        <div className="itens-lista">

                            {pecasSelecionadas.map((item, index) => (

                                <div key={index} className="item-card">

                                    <div className="item-info">
                                        <strong>{item.nome}</strong>
                                        <small>Qtd: {item.quantidade} × R$ {formatarValor(item.preco)}</small>
                                    </div>

                                    <div className="item-acoes">
                                        <span className="item-subtotal">
                                            R$ {formatarValor(calcularSubtotalCentavos(item) / 100)}
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

                </div>

                <div className="dashboard-section">

                    <h2>Serviços</h2>

                    {erroServicos && (
                        <div className="erro-api">
                            <strong>⚠️ {erroServicos}</strong>
                            <button type="button" className="secondary-button" onClick={carregarDados}>
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
                                onClick={() => navigate("/servicos")}
                            >
                                Cadastrar serviços primeiro
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

                    {novoServico.servico_id && (() => {
                        const servicoSelecionado = servicosDisponiveis.find(
                            servico => servico.id === Number(novoServico.servico_id)
                        );
                        if (!servicoSelecionado) return null;
                        const quantidade = quantidadeServicoEmSelecao;
                        const subtotal = Math.round(Number(servicoSelecionado.preco || 0) * 100) * quantidade / 100;
                        return (
                            <p className="info-message">
                                Preço do serviço: {formatarValor(servicoSelecionado.preco)} × {quantidade} = {formatarValor(subtotal)}
                            </p>
                        );
                    })()}

                    {servicosSelecionados.length === 0 &&
                        !novoServico.servico_id &&
                        !carregandoServicos &&
                        !erroServicos &&
                        servicosDisponiveis.length > 0 ? (
                        <p className="mensagem-vazia">Nenhum serviço adicionado ainda.</p>
                    ) : servicosSelecionados.length > 0 && (

                        <div className="itens-lista">

                            {servicosSelecionados.map((item, index) => (

                                <div key={index} className="item-card">

                                    <div className="item-info">
                                        <strong>{item.nome}</strong>
                                        <small>Qtd: {item.quantidade} × R$ {formatarValor(item.preco)}</small>
                                    </div>

                                    <div className="item-acoes">
                                        <span className="item-subtotal">
                                            R$ {formatarValor(calcularSubtotalCentavos(item) / 100)}
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

                </div>

                <div className="dashboard-section">
                    <h2>Serviços adicionais</h2>
                    <p>
                        Adicione serviços fora do catálogo, informando a descrição e o valor de cada item.
                    </p>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Descrição do serviço adicional</label>
                            <input
                                type="text"
                                value={novoServicoAdicional.descricao}
                                onChange={(event) => setNovoServicoAdicional({ ...novoServicoAdicional, descricao: event.target.value })}
                                placeholder="Ex.: Diagnóstico"
                                maxLength="255"
                            />
                        </div>
                        <div className="form-group">
                            <label>Valor</label>
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={novoServicoAdicional.valor}
                                onChange={(event) => setNovoServicoAdicional({ ...novoServicoAdicional, valor: event.target.value })}
                                placeholder="0,00"
                            />
                        </div>
                        <div className="form-group form-group-botao">
                            <label>&nbsp;</label>
                            <button
                                type="button"
                                className="primary-button"
                                onClick={adicionarServicoAdicional}
                            >
                                + Adicionar serviço adicional
                            </button>
                        </div>
                    </div>
                    {servicosAdicionais.length === 0 ? (
                        <p className="mensagem-vazia">Nenhum serviço adicional adicionado ainda.</p>
                    ) : (
                        <div className="itens-lista">
                            {servicosAdicionais.map((item, index) => (
                                <div key={`${item.descricao}-${index}`} className="item-card">
                                    <div className="item-info">
                                        <strong>{item.descricao}</strong>
                                    </div>
                                    <div className="item-acoes">
                                        <span className="item-subtotal">
                                            R$ {formatarValor(item.valor)}
                                        </span>
                                        <button
                                            type="button"
                                            className="table-button delete"
                                            onClick={() => removerServicoAdicional(index)}
                                        >
                                            Remover
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="dashboard-section">

                    <div className="financial-summary os-estimate-summary">

                        <div className="os-estimate-total">
                            <span>Total estimado</span>
                            <strong>{formatarValor(totalEstimado)}</strong>
                            <small>Peças + serviços + serviços adicionais</small>
                        </div>

                        <div className="contadores-itens">
                            <span>Peças adicionadas: {pecasSelecionadas.length}</span>
                            <span>Serviços adicionados: {servicosSelecionados.length}</span>
                        </div>

                    </div>

                </div>

                <div className="dashboard-section">

                    <div className="form-actions">

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={cancelar}
                            disabled={salvando}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="primary-button"
                            disabled={salvando}
                        >
                            {salvando
                                ? "Salvando..."
                                : "Criar Ordem de Serviço"}
                        </button>

                    </div>

                </div>

            </form>

        </div>
    );
}

export default NovaOrdemServico;
