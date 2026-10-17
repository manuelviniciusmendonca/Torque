const express = require("express");
const { listarCompras, registrarCompra } = require("../controllers/compraPecasController");

const router = express.Router();

router.get("/", listarCompras);
router.post("/", registrarCompra);

module.exports = router;
