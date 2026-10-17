const express = require("express");

const {
    listarOrdensServico,
    criarOrdemServico,
    buscarOrdemServico,
    atualizarOrdemServico,
    excluirOrdemServico
} = require("../controllers/ordemServicoController");

const router = express.Router();

router.get("/", listarOrdensServico);
router.get("/:id", buscarOrdemServico);

router.post("/", criarOrdemServico);

router.put("/:id", atualizarOrdemServico);
router.delete("/:id", excluirOrdemServico);

module.exports = router;