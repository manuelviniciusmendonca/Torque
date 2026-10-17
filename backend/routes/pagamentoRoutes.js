const express = require("express");
const router = express.Router();
const {
    estornarPagamento
} = require("../controllers/pagamentoController");

// Estornar pagamento
router.post("/:id/estornar", estornarPagamento);

module.exports = router;
