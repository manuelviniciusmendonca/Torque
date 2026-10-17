const pool = require("../config/db");

// Helper para obter oficina_id
const getOficinaId = (req) => {
    // Por enquanto, como não há autenticação, retorna 1
    // Depois pode ser substituído por req.oficina_id de um middleware
    return 1;
};

module.exports = { getOficinaId };
