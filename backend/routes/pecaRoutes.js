const express = require("express");

const {
    listarPecas,
    criarPeca,
    buscarPeca,
    atualizarPeca,
    excluirPeca
} = require("../controllers/pecaController");

const router = express.Router();

router.get("/", listarPecas);

router.get("/:id", buscarPeca);

router.post("/", criarPeca);

router.put("/:id", atualizarPeca);

router.delete("/:id", excluirPeca);

module.exports = router;