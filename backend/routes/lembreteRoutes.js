const express = require("express");

const {
    listarLembretes,
    listarResumoLembretes,
    criarLembrete,
    buscarLembrete,
    atualizarLembrete,
    concluirLembrete,
    cancelarLembrete,
    excluirLembrete
} = require("../controllers/lembreteController");

const router = express.Router();

router.get("/", listarLembretes);

router.get("/resumo", listarResumoLembretes);

router.get("/:id", buscarLembrete);

router.post("/", criarLembrete);

router.put("/:id", atualizarLembrete);

router.put("/:id/concluir", concluirLembrete);

router.put("/:id/cancelar", cancelarLembrete);

router.delete("/:id", excluirLembrete);

module.exports = router;