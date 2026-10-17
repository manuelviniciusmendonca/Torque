const express = require("express");

const {
    listarClientes,
    listarClientesComVeiculos,
    listarHistoricoCliente,
    criarCliente,
    buscarCliente,
    atualizarCliente,
    excluirCliente
} = require("../controllers/clienteController");

const router = express.Router();

router.get("/", listarClientes);

router.get("/com-veiculos", listarClientesComVeiculos);

router.get("/:id/historico", listarHistoricoCliente);

router.get("/:id", buscarCliente);

router.post("/", criarCliente);

router.put("/:id", atualizarCliente);

router.delete("/:id", excluirCliente);

module.exports = router;