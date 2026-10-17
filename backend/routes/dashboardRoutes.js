const express = require("express");

const { obterDadosDashboard } = require("../controllers/dashboardController");

const router = express.Router();

router.get("/:oficina_id", obterDadosDashboard);

module.exports = router;
