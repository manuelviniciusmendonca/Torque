const express = require("express");

const {
    listarTransacoes,
    criarTransacao,
    buscarTransacao,
    atualizarTransacao,
    resumoFinanceiro,
    dashboardFinanceiro,
    criarTransacaoParcelada,
    listarTransacoesVencidas
} = require("../controllers/transacaoController");

const router = express.Router();

router.get("/", listarTransacoes);

router.get("/resumo/:oficina_id", resumoFinanceiro);

router.get("/dashboard/:oficina_id", dashboardFinanceiro);
router.get("/vencidas/:oficina_id", listarTransacoesVencidas);

router.get("/:id", buscarTransacao);

router.post("/", criarTransacao);
router.post("/parcelada", criarTransacaoParcelada);

router.put("/:id", atualizarTransacao);

// DELETE removido conforme nova especificação financeira

module.exports = router;