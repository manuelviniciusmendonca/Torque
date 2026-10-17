// Carregar variáveis de ambiente primeiro
require('dotenv').config();

const express = require("express");
const cors = require("cors");
const pool = require("./config/db");

const clienteRoutes = require("./routes/clienteRoutes");
const veiculoRoutes = require("./routes/veiculoRoutes");
const servicoRoutes = require("./routes/servicoRoutes");
const pecaRoutes = require("./routes/pecaRoutes");
const ordemServicoRoutes = require("./routes/ordemServicoRoutes");
const ordemServicoServicoRoutes = require("./routes/ordemServicoServicoRoutes");
const ordemServicoPecaRoutes = require("./routes/ordemServicoPecaRoutes");
const estoqueRoutes = require("./routes/estoqueRoutes");
const transacaoRoutes = require("./routes/transacaoRoutes");
const historicoRoutes = require("./routes/historicoRoutes");
const lembreteRoutes = require("./routes/lembreteRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const categoriaFinanceiraRoutes = require("./routes/categoriaFinanceiraRoutes");
const lancamentoRoutes = require("./routes/lancamentoRoutes");
const pagamentoRoutes = require("./routes/pagamentoRoutes");
const compraPecasRoutes = require("./routes/compraPecasRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/clientes", clienteRoutes);
app.use("/veiculos", veiculoRoutes);
app.use("/servicos", servicoRoutes);
app.use("/pecas", pecaRoutes);

app.use("/ordens-servico", ordemServicoRoutes);
app.use("/ordens-servico", ordemServicoServicoRoutes);
app.use("/ordens-servico", ordemServicoPecaRoutes);

app.use("/estoque", estoqueRoutes);
app.use("/estoque/compras", compraPecasRoutes);
app.use("/transacoes", transacaoRoutes);
app.use("/historico", historicoRoutes);
app.use("/lembretes", lembreteRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/categorias-financeiras", categoriaFinanceiraRoutes);
app.use("/lancamentos", lancamentoRoutes);
app.use("/pagamentos", pagamentoRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Torque API funcionando!"
    });
});

app.get("/teste-db", async (req, res) => {
    try {
        const [resultado] = await pool.query("SELECT 1");

        res.json({
            mensagem: "Banco de dados conectado!",
            resultado
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            mensagem: "Erro ao conectar com o banco"
        });
    }
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Servidor Torque rodando na porta ${PORT}`);
});