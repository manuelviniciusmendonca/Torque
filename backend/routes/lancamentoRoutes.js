const express = require("express");
const router = express.Router();
const {
    listarLancamentos,
    criarLancamento,
    obterLancamento,
    atualizarLancamento,
    cancelarLancamento
} = require("../controllers/lancamentoController");
const {
    adicionarPagamentos,
    estornarPagamento,
    listarPagamentos
} = require("../controllers/pagamentoController");

// Listar lançamentos
router.get("/", listarLancamentos);

// Criar lançamento avulso
router.post("/", criarLancamento);

// Obter lançamento por ID
router.get("/:id", obterLancamento);

// Atualizar lançamento
router.put("/:id", atualizarLancamento);

// Cancelar lançamento
router.post("/:id/cancelar", cancelarLancamento);

// Adicionar pagamentos a um lançamento
router.post("/:id/pagamentos", adicionarPagamentos);

// Listar pagamentos de um lançamento
router.get("/:id/pagamentos", listarPagamentos);

module.exports = router;
