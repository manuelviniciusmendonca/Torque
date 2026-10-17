const express = require("express");

const {
    listarHistorico
} = require("../controllers/historicoController");

const router = express.Router();

router.get("/", listarHistorico);

module.exports = router;