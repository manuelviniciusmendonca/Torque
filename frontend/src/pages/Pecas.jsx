import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useConfirm } from "../components/ConfirmContext";

function Pecas() {
    const confirmAction = useConfirm();
    const [pecas, setPecas] = useState([]);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState(false);

    const [formulario, setFormulario] = useState({
        nome: "",
        codigo: "",
        descricao: "",
        quantidade: "",
        estoque_minimo: "",
        preco_custo: "",
        preco_venda: "",
        fornecedor: ""
    });

    const [editandoId, setEditandoId] = useState(null);

    const buscarPecas = async () => {
        try {
            const dados = await api.get("/pecas");

            setPecas(dados);
            setErro(false);
        } catch (error) {
            console.error(error);
            setErro(true);
        } finally {
            setCarregando(false);
        }
    };

    useEffect(() => {
        buscarPecas();
    }, []);

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
            codigo: "",
            descricao: "",
            quantidade: "",
            estoque_minimo: "",
            preco_custo: "",
            preco_venda: "",
            fornecedor: ""
        });

        setEditandoId(null);
        setMostrarFormulario(false);
    };

    const salvarPeca = async (event) => {
        event.preventDefault();

        try {
            const dados = {
                oficina_id: 1,
                nome: formulario.nome,
                codigo: formulario.codigo || null,
                descricao: formulario.descricao || null,
                quantidade: formulario.quantidade
                    ? Number(formulario.quantidade)
                    : 0,
                estoque_minimo: formulario.estoque_minimo
                    ? Number(formulario.estoque_minimo)
                    : 0,
                preco_custo: formulario.preco_custo
                    ? Number(formulario.preco_custo)
                    : 0,
                preco_venda: formulario.preco_venda
                    ? Number(formulario.preco_venda)
                    : 0,
                fornecedor: formulario.fornecedor || null
            };

            if (editandoId) {
                await api.put(`/pecas/${editandoId}`, dados);

                alert("Peça atualizada com sucesso!");
            } else {
                await api.post("/pecas", dados);

                alert("Peça cadastrada com sucesso!");
            }

            limparFormulario();
            await buscarPecas();

        } catch (error) {
            console.error("Erro ao salvar peça:", error);

            alert("Erro ao salvar peça.");
        }
    };

    const editarPeca = (peca) => {
        setFormulario({
            nome: peca.nome,
            codigo: peca.codigo || "",
            descricao: peca.descricao || "",
            quantidade: peca.quantidade,
            estoque_minimo: peca.estoque_minimo,
            preco_custo: peca.preco_custo,
            preco_venda: peca.preco_venda,
            fornecedor: peca.fornecedor || ""
        });

        setEditandoId(peca.id);
        setMostrarFormulario(true);
    };

    const excluirPeca = async (id) => {
        const confirmar = await confirmAction({
            title: "Excluir peça?",
            message: "Esta peça será removida permanentemente.",
            confirmLabel: "Excluir peça",
            variant: "danger"
        });

        if (!confirmar) {
            return;
        }

        try {
            await api.delete(`/pecas/${id}`);

            alert("Peça excluída com sucesso!");

            await buscarPecas();

        } catch (error) {
            console.error("Erro ao excluir peça:", error);

            alert("Erro ao excluir peça.");
        }
    };

    const estoqueBaixo = (peca) => {
        return Number(peca.quantidade) <= Number(peca.estoque_minimo || 0);
    };

    const valorTotalCompra = Math.round(Number(formulario.preco_custo || 0) * 100) *
        Number(formulario.quantidade || 0) / 100;

    const formatarMoeda = (valor) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL"
        }).format(valor);
    };

    return (
        <div className="dashboard">

            <div className="dashboard-header">

                <div>
                    <h1>Peças</h1>

                    <p>
                        Cadastre e gerencie as peças em estoque
                    </p>
                </div>

                <button
                    className="primary-button"
                    onClick={() => {
                        limparFormulario();
                        setMostrarFormulario(true);
                    }}
                >
                    + Nova peça
                </button>

            </div>

            {mostrarFormulario && (

                <div className="form-container">

                    <div className="form-header">

                        <div>
                            <h2>
                                {editandoId
                                    ? "Editar peça"
                                    : "Nova peça"
                                }
                            </h2>

                            <p>
                                Informe os dados da peça
                            </p>
                        </div>

                        <button
                            className="close-button"
                            onClick={limparFormulario}
                        >
                            ×
                        </button>

                    </div>

                    <form onSubmit={salvarPeca}>

                        <div className="form-row">

                            <div className="form-group">

                                <label>Nome da peça</label>

                                <input
                                    type="text"
                                    name="nome"
                                    value={formulario.nome}
                                    onChange={handleChange}
                                    placeholder="Ex: Filtro de óleo"
                                    required
                                />

                            </div>

                            <div className="form-group">

                                <label>Código</label>

                                <input
                                    type="text"
                                    name="codigo"
                                    value={formulario.codigo}
                                    onChange={handleChange}
                                    placeholder="Ex: FO-1234"
                                />

                            </div>

                        </div>

                        <div className="form-group">

                            <label>Descrição</label>

                            <textarea
                                name="descricao"
                                value={formulario.descricao}
                                onChange={handleChange}
                                placeholder="Descreva a peça..."
                                rows="3"
                            />

                        </div>

                        <div className="form-row">

                            <div className="form-group">

                                <label>Quantidade em estoque</label>

                                <input
                                    type="number"
                                    name="quantidade"
                                    value={formulario.quantidade}
                                    onChange={handleChange}
                                    placeholder="0"
                                    min="0"
                                />

                            </div>

                            <div className="form-group">

                                <label>{editandoId ? "Preço de custo" : "Preço de custo unitário"}</label>

                                <input
                                    type="number"
                                    name="preco_custo"
                                    value={formulario.preco_custo}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                />

                            </div>

                        </div>

                        <div className="form-group">

                            <label>Preço de venda</label>

                            <input
                                type="number"
                                name="preco_venda"
                                value={formulario.preco_venda}
                                onChange={handleChange}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                required
                            />

                        </div>

                        {!editandoId && (
                            <div className="dashboard-card dashboard-card-blue" style={{ marginBottom: "16px" }}>
                                <span>Total do estoque inicial</span>
                                <strong>{formatarMoeda(valorTotalCompra)}</strong>
                                <small>Preço de custo unitário × quantidade</small>
                            </div>
                        )}

                        <div className="form-group">

                            <label>Fornecedor</label>

                            <input
                                type="text"
                                name="fornecedor"
                                value={formulario.fornecedor}
                                onChange={handleChange}
                                placeholder="Ex: Distribuidora ABC"
                            />

                        </div>

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
                                    : "Cadastrar peça"
                                }
                            </button>

                        </div>

                    </form>

                </div>
            )}

            <div className="table-container">

                {carregando && (
                    <p>Carregando peças...</p>
                )}

                {erro && (
                    <p>
                        Não foi possível carregar as peças.
                    </p>
                )}

                {!carregando &&
                    !erro &&
                    pecas.length === 0 && (
                        <p>
                            Nenhuma peça cadastrada.
                        </p>
                    )}

                {!carregando &&
                    !erro &&
                    pecas.length > 0 && (

                    <table>

                        <thead>

                            <tr>
                                <th>Nome</th>
                                <th>Código</th>
                                <th>Estoque</th>
                                <th>Preço de custo</th>
                                <th>Preço de venda</th>
                                <th>Fornecedor</th>
                                <th>Ações</th>
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

                                    <td
                                        style={
                                            estoqueBaixo(peca)
                                                ? { color: "#e53935", fontWeight: "bold" }
                                                : undefined
                                        }
                                    >
                                        {peca.quantidade}
                                        {estoqueBaixo(peca) && " (baixo)"}
                                    </td>

                                    <td>
                                        R$ {Number(
                                            peca.preco_custo || 0
                                        ).toFixed(2)}
                                    </td>

                                    <td>
                                        R$ {Number(
                                            peca.preco_venda || 0
                                        ).toFixed(2)}
                                    </td>

                                    <td>
                                        {peca.fornecedor || "-"}
                                    </td>

                                    <td>

                                        <button
                                            className="table-button"
                                            onClick={() =>
                                                editarPeca(peca)
                                            }
                                        >
                                            Editar
                                        </button>

                                        <button
                                            className="table-button delete"
                                            onClick={() =>
                                                excluirPeca(peca.id)
                                            }
                                        >
                                            Excluir
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

export default Pecas;