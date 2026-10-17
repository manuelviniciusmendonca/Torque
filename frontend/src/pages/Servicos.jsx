import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useConfirm } from "../components/ConfirmContext";

function Servicos() {
    const confirmAction = useConfirm();
    const [servicos, setServicos] = useState([]);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(false);
    const [alternandoLembreteId, setAlternandoLembreteId] = useState(null);

    const [formulario, setFormulario] = useState({
        nome: "",
        descricao: "",
        preco: "",
        precisa_lembrete: false,
        lembrete_intervalo_tipo: "mes",
        lembrete_intervalo_quantidade: "6",
        lembrete_antecedencia_dias: "7"
    });

    const [editandoId, setEditandoId] = useState(null);

    const buscarServicos = async () => {
        try {
            const dados = await api.get("/servicos");

            setServicos(dados);
            setErro(false);
        } catch (error) {
            console.error(error);
            setErro(true);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        buscarServicos();
    }, []);

    const handleChange = (event) => {
        const { name, value, type, checked } = event.target;

        setFormulario((anterior) => ({
            ...anterior,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const limparFormulario = () => {
        setFormulario({
            nome: "",
            descricao: "",
            preco: "",
            precisa_lembrete: false,
            lembrete_intervalo_tipo: "mes",
            lembrete_intervalo_quantidade: "6",
            lembrete_antecedencia_dias: "7"
        });

        setEditandoId(null);
        setMostrarFormulario(false);
    };

    const salvarServico = async (event) => {
        event.preventDefault();

        try {
            const dados = {
                oficina_id: 1,
                nome: formulario.nome,
                descricao: formulario.descricao,
                preco: Number(formulario.preco),
                precisa_lembrete: formulario.precisa_lembrete,
                lembrete_intervalo_tipo: formulario.lembrete_intervalo_tipo,
                lembrete_intervalo_quantidade: Number(formulario.lembrete_intervalo_quantidade),
                lembrete_antecedencia_dias: Number(formulario.lembrete_antecedencia_dias)
            };

            if (editandoId) {
                await api.put(`/servicos/${editandoId}`, dados);

                alert("Serviço atualizado com sucesso!");
            } else {
                await api.post("/servicos", dados);

                alert("Serviço criado com sucesso!");
            }

            limparFormulario();
            await buscarServicos();

        } catch (error) {
            console.error("Erro ao salvar serviço:", error);

            alert("Erro ao salvar serviço.");
        }
    };

    const editarServico = (servico) => {
        setFormulario({
            nome: servico.nome,
            descricao: servico.descricao || "",
            preco: servico.preco,
            precisa_lembrete: Number(servico.precisa_lembrete) === 1,
            lembrete_intervalo_tipo: servico.lembrete_intervalo_tipo || "mes",
            lembrete_intervalo_quantidade: servico.lembrete_intervalo_quantidade || "6",
            lembrete_antecedencia_dias: servico.lembrete_antecedencia_dias ?? "7"
        });

        setEditandoId(servico.id);
        setMostrarFormulario(true);
    };

    const excluirServico = async (id) => {
        const confirmar = await confirmAction({
            title: "Excluir serviço?",
            message: "Este serviço será removido permanentemente.",
            confirmLabel: "Excluir serviço",
            variant: "danger"
        });

        if (!confirmar) {
            return;
        }

        try {
            await api.delete(`/servicos/${id}`);

            alert("Serviço excluído com sucesso!");

            await buscarServicos();

        } catch (error) {
            console.error("Erro ao excluir serviço:", error);

            alert("Erro ao excluir serviço.");
        }
    };

    const alternarLembreteServico = async (servico) => {
        const precisaLembrete = Number(servico.precisa_lembrete) !== 1;
        setAlternandoLembreteId(servico.id);

        try {
            await api.patch(`/servicos/${servico.id}/lembrete`, {
                precisa_lembrete: precisaLembrete
            });

            setServicos((atuais) => atuais.map((item) => (
                item.id === servico.id
                    ? { ...item, precisa_lembrete: precisaLembrete }
                    : item
            )));
        } catch (error) {
            console.error("Erro ao alternar lembrete do serviço:", error);
            alert("Erro ao atualizar a configuração do lembrete.");
        } finally {
            setAlternandoLembreteId(null);
        }
    };

    return (
        <div className="dashboard">

            <div className="dashboard-header">

                <div>
                    <h1>Serviços</h1>

                    <p>
                        Cadastre e gerencie os serviços da sua oficina
                    </p>
                </div>

                <button
                    className="primary-button"
                    onClick={() => {
                        limparFormulario();
                        setMostrarFormulario(true);
                    }}
                >
                    + Novo serviço
                </button>

            </div>

            {mostrarFormulario && (

                <div className="form-container">

                    <div className="form-header">

                        <div>
                            <h2>
                                {editandoId
                                    ? "Editar serviço"
                                    : "Novo serviço"
                                }
                            </h2>

                            <p>
                                Informe os dados do serviço
                            </p>
                        </div>

                        <button
                            className="close-button"
                            onClick={limparFormulario}
                        >
                            ×
                        </button>

                    </div>

                    <form onSubmit={salvarServico}>

                        <div className="form-group">

                            <label>Nome do serviço</label>

                            <input
                                type="text"
                                name="nome"
                                value={formulario.nome}
                                onChange={handleChange}
                                placeholder="Ex: Troca de óleo"
                                required
                            />

                        </div>

                        <div className="form-group">

                            <label>Descrição</label>

                            <textarea
                                name="descricao"
                                value={formulario.descricao}
                                onChange={handleChange}
                                placeholder="Descreva o serviço..."
                                rows="4"
                            />

                        </div>

                        <div className="form-group">

                            <label>Preço</label>

                            <input
                                type="number"
                                name="preco"
                                value={formulario.preco}
                                onChange={handleChange}
                                placeholder="150.00"
                                step="0.01"
                                min="0"
                                required
                            />

                        </div>

                        <h3 className="form-section-title">
                            Configuração de Lembrete de Retorno
                        </h3>

                        <div className="form-group">
                            <label>
                                <input
                                    type="checkbox"
                                    name="precisa_lembrete"
                                    checked={formulario.precisa_lembrete}
                                    onChange={handleChange}
                                />
                                Este serviço precisa de lembrete de retorno
                            </label>
                        </div>

                        {formulario.precisa_lembrete && (
                            <>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Intervalo</label>
                                        <select
                                            name="lembrete_intervalo_tipo"
                                            value={formulario.lembrete_intervalo_tipo}
                                            onChange={handleChange}
                                        >
                                            <option value="dia">Dias</option>
                                            <option value="mes">Meses</option>
                                            <option value="ano">Anos</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label>Quantidade</label>
                                        <input
                                            type="number"
                                            name="lembrete_intervalo_quantidade"
                                            value={formulario.lembrete_intervalo_quantidade}
                                            onChange={handleChange}
                                            min="1"
                                            placeholder="6"
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label>Antecedência do lembrete (dias antes)</label>
                                    <input
                                        type="number"
                                        name="lembrete_antecedencia_dias"
                                        value={formulario.lembrete_antecedencia_dias}
                                        onChange={handleChange}
                                        min="0"
                                        placeholder="7"
                                    />
                                </div>
                            </>
                        )}

                        <div className="form-actions">

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={limparFormulario}
                            >
                                Cancelar
                            </button>

                            <button
                                type="submit"
                                className="primary-button"
                            >
                                {editandoId
                                    ? "Salvar alterações"
                                    : "Cadastrar serviço"
                                }
                            </button>

                        </div>

                    </form>

                </div>
            )}

            <div className="table-container">

                {carregando && (
                    <p>Carregando serviços...</p>
                )}

                {erro && (
                    <p>
                        Não foi possível carregar os serviços.
                    </p>
                )}

                {!carregando &&
                    !erro &&
                    servicos.length === 0 && (
                        <p>
                            Nenhum serviço cadastrado.
                        </p>
                    )}

                {!carregando &&
                    !erro &&
                    servicos.length > 0 && (

                    <div className="servicos-grid">

                        {servicos.map((servico) => {
                            const lembreteAtivo = Number(servico.precisa_lembrete) === 1;

                            return (
                                <div key={servico.id} className="servico-card">
                                    <div className="servico-card-header">
                                        <div>
                                            <span className="servico-card-label">
                                                Serviço
                                            </span>
                                            <h3>{servico.nome}</h3>
                                        </div>

                                        <strong className="servico-preco">
                                            R$ {Number(servico.preco || 0).toFixed(2)}
                                        </strong>
                                    </div>

                                    <p className="servico-descricao">
                                        {servico.descricao || "Sem descrição cadastrada."}
                                    </p>

                                    <div className="servico-meta">
                                        {lembreteAtivo ? (
                                            <span className="lembrete-badge">
                                                ✓ {servico.lembrete_intervalo_quantidade} {servico.lembrete_intervalo_tipo}(s)
                                            </span>
                                        ) : (
                                            <span className="sem-lembrete">Lembrete desativado</span>
                                        )}
                                    </div>

                                    <div className="servico-actions">
                                        <button
                                            className={lembreteAtivo ? "table-button delete" : "table-button"}
                                            onClick={() => alternarLembreteServico(servico)}
                                            disabled={alternandoLembreteId === servico.id}
                                        >
                                            {alternandoLembreteId === servico.id
                                                ? "Salvando..."
                                                : lembreteAtivo
                                                    ? "Desativar lembrete"
                                                    : "Ativar lembrete"
                                            }
                                        </button>

                                        <button
                                            className="table-button"
                                            onClick={() => editarServico(servico)}
                                        >
                                            Editar
                                        </button>

                                        <button
                                            className="table-button delete"
                                            onClick={() => excluirServico(servico.id)}
                                        >
                                            Excluir
                                        </button>
                                    </div>

                                </div>
                            );
                        })}

                    </div>
                )}

            </div>

        </div>
    );
}

export default Servicos;