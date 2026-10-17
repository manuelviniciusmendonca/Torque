const express = require("express");
const router = express.Router();
const {
    listarCategorias,
    criarCategoria,
    atualizarCategoria,
    deletarCategoria
} = require("../controllers/categoriaFinanceiraController");

// Listar categorias
router.get("/", listarCategorias);

// Criar categoria
router.post("/", criarCategoria);

// Atualizar categoria
router.put("/:id", atualizarCategoria);

// Deletar categoria
router.delete("/:id", deletarCategoria);

module.exports = router;
