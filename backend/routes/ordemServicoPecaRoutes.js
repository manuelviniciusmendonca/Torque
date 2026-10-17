const express = require("express");

const {
    adicionarPeca,
    listarPecas,
    removerPeca
} = require("../controllers/ordemServicoPecaController");

const router = express.Router();

router.post("/:ordem_servico_id/pecas", adicionarPeca);

router.get("/:ordem_servico_id/pecas", listarPecas);

router.delete("/pecas/:id", removerPeca);

module.exports = router;