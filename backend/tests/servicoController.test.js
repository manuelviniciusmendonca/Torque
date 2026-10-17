const assert = require("node:assert/strict");
const Module = require("node:module");
const { beforeEach, test } = require("node:test");

const dbPath = require.resolve("../config/db");
let estado;
let chamadasQuery;

const poolMock = {
    async query(sql, params) {
        chamadasQuery += 1;
        const query = sql.replace(/\s+/g, " ").trim().toLowerCase();

        if (query.includes("set precisa_lembrete = false")) {
            if (!estado.existe) return [{ affectedRows: 0 }];
            const alterou = estado.precisa_lembrete !== false;
            estado.precisa_lembrete = false;
            return [{ affectedRows: alterou ? 1 : 0 }];
        }

        if (query.includes("set precisa_lembrete = true")) {
            if (!estado.existe) return [{ affectedRows: 0 }];
            const alterou = estado.precisa_lembrete !== true;
            estado.precisa_lembrete = true;
            estado.lembrete_intervalo_tipo ??= "mes";
            estado.lembrete_intervalo_quantidade ??= 6;
            estado.lembrete_antecedencia_dias ??= 7;
            return [{ affectedRows: alterou ? 1 : 0 }];
        }

        if (query === "select id from servicos where id = ?") {
            return [estado.existe && Number(params[0]) === 1 ? [{ id: 1 }] : []];
        }

        throw new Error(`Consulta inesperada: ${query}`);
    }
};

const dbModule = new Module(dbPath);
dbModule.filename = dbPath;
dbModule.loaded = true;
dbModule.exports = poolMock;
require.cache[dbPath] = dbModule;

const { alternarLembreteServico } = require("../controllers/servicoController");

beforeEach(() => {
    estado = {
        existe: true,
        precisa_lembrete: true,
        lembrete_intervalo_tipo: "ano",
        lembrete_intervalo_quantidade: 2,
        lembrete_antecedencia_dias: 15
    };
    chamadasQuery = 0;
});

const chamarController = async (precisa_lembrete, id = "1") => {
    const resposta = {
        statusCode: 200,
        body: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(body) {
            this.body = body;
            return this;
        }
    };

    await alternarLembreteServico({
        params: { id },
        body: { precisa_lembrete }
    }, resposta);

    return resposta;
};

test("desativar mantém a configuração para permitir reativação", async () => {
    const desativado = await chamarController(false);

    assert.equal(desativado.statusCode, 200);
    assert.equal(estado.precisa_lembrete, false);
    assert.equal(estado.lembrete_intervalo_tipo, "ano");
    assert.equal(estado.lembrete_intervalo_quantidade, 2);
    assert.equal(estado.lembrete_antecedencia_dias, 15);

    const reativado = await chamarController(true);

    assert.equal(reativado.statusCode, 200);
    assert.equal(estado.precisa_lembrete, true);
    assert.equal(estado.lembrete_intervalo_tipo, "ano");
    assert.equal(estado.lembrete_intervalo_quantidade, 2);
    assert.equal(estado.lembrete_antecedencia_dias, 15);
});

test("reativar preenche padrões somente quando não há configuração salva", async () => {
    estado.precisa_lembrete = false;
    estado.lembrete_intervalo_tipo = null;
    estado.lembrete_intervalo_quantidade = null;
    estado.lembrete_antecedencia_dias = null;

    const resposta = await chamarController(true);

    assert.equal(resposta.statusCode, 200);
    assert.equal(estado.lembrete_intervalo_tipo, "mes");
    assert.equal(estado.lembrete_intervalo_quantidade, 6);
    assert.equal(estado.lembrete_antecedencia_dias, 7);
});

test("rejeitar valor de ativação que não seja booleano", async () => {
    const resposta = await chamarController("false");

    assert.equal(resposta.statusCode, 400);
    assert.equal(chamadasQuery, 0);
    assert.equal(estado.precisa_lembrete, true);
});
