const express = require("express");

const {
    adicionarServico,
    listarServicos,
    removerServico
} = require("../controllers/ordemServicoServicoController");

const router = express.Router();

router.post("/:ordem_servico_id/servicos", adicionarServico);

router.get("/:ordem_servico_id/servicos", listarServicos);

router.delete("/servicos/:id", removerServico);

module.exports = router;