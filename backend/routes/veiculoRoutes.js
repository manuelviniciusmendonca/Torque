const express = require("express");

const {
    listarVeiculos,
    criarVeiculo,
    buscarVeiculo,
    atualizarVeiculo,
    excluirVeiculo,
    listarHistoricoVeiculo
} = require("../controllers/veiculoController");

const router = express.Router();


// Listar veículos
router.get("/", listarVeiculos);


// Histórico de manutenção do veículo
router.get("/:id/historico", listarHistoricoVeiculo);


// Buscar veículo por ID
router.get("/:id", buscarVeiculo);


// Criar veículo
router.post("/", criarVeiculo);


// Atualizar veículo
router.put("/:id", atualizarVeiculo);


// Excluir veículo
router.delete("/:id", excluirVeiculo);


module.exports = router;