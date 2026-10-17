const express = require("express");

const {
    listarServicos,
    criarServico,
    buscarServico,
    atualizarServico,
    alternarLembreteServico,
    excluirServico
} = require("../controllers/servicoController");

const router = express.Router();

router.get("/", listarServicos);
router.get("/:id", buscarServico);
router.post("/", criarServico);
router.put("/:id", atualizarServico);
router.patch("/:id/lembrete", alternarLembreteServico);
router.delete("/:id", excluirServico);

module.exports = router;