const express = require("express");

const {
    entradaEstoque,
    saidaEstoque,
    estoqueBaixo
} = require("../controllers/estoqueController");

const router = express.Router();

router.post("/entrada", entradaEstoque);

router.post("/saida", saidaEstoque);

router.get("/baixo", estoqueBaixo);

module.exports = router;