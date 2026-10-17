const API_URL = "http://localhost:3000";

export const api = {
    get: async (rota) => {
        const resposta = await fetch(`${API_URL}${rota}`, {
            cache: "no-store",
        });

        if (!resposta.ok) {
            let mensagem = `Erro ${resposta.status} na requisição GET ${rota}`;
            try {
                const err = await resposta.json();
                if (err && err.mensagem) mensagem = err.mensagem;
            } catch (e) {}
            throw new Error(mensagem);
        }

        return resposta.json();
    },

    post: async (rota, dados) => {
        const resposta = await fetch(`${API_URL}${rota}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dados),
        });

        if (!resposta.ok) {
            let mensagem = `Erro ${resposta.status} na requisição POST ${rota}`;
            try {
                const err = await resposta.json();
                if (err && err.mensagem) mensagem = err.mensagem;
            } catch (e) {}
            throw new Error(mensagem);
        }

        return resposta.json();
    },

    put: async (rota, dados) => {
        const resposta = await fetch(`${API_URL}${rota}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dados),
        });

        if (!resposta.ok) {
            let mensagem = `Erro ${resposta.status} na requisição PUT ${rota}`;
            try {
                const err = await resposta.json();
                if (err && err.mensagem) mensagem = err.mensagem;
            } catch (e) {}
            throw new Error(mensagem);
        }

        return resposta.json();
    },

    patch: async (rota, dados) => {
        const resposta = await fetch(`${API_URL}${rota}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dados),
        });

        if (!resposta.ok) {
            let mensagem = `Erro ${resposta.status} na requisição PATCH ${rota}`;
            try {
                const err = await resposta.json();
                if (err && err.mensagem) mensagem = err.mensagem;
            } catch {}
            throw new Error(mensagem);
        }

        return resposta.json();
    },

    delete: async (rota) => {
        const resposta = await fetch(`${API_URL}${rota}`, {
            method: "DELETE",
        });

        if (!resposta.ok) {
            let mensagem = `Erro ${resposta.status} na requisição DELETE ${rota}`;
            try {
                const err = await resposta.json();
                if (err && err.mensagem) mensagem = err.mensagem;
            } catch (e) {}
            throw new Error(mensagem);
        }

        return resposta.json();
    },

    // API Financeira
    financeiro: {
        listarCategorias: async (tipo) => {
            const params = tipo ? `?tipo=${tipo}` : '';
            return api.get(`/categorias-financeiras${params}`);
        },

        criarCategoria: async (dados) => {
            return api.post('/categorias-financeiras', dados);
        },

        listarLancamentos: async (filtros = {}) => {
            const params = new URLSearchParams(filtros).toString();
            return api.get(`/lancamentos${params ? '?' + params : ''}`);
        },

        criarLancamento: async (dados) => {
            return api.post('/lancamentos', dados);
        },

        obterLancamento: async (id) => {
            return api.get(`/lancamentos/${id}`);
        },

        atualizarLancamento: async (id, dados) => {
            return api.put(`/lancamentos/${id}`, dados);
        },

        cancelarLancamento: async (id, motivo) => {
            return api.post(`/lancamentos/${id}/cancelar`, { motivo });
        },

        adicionarPagamentos: async (id, pagamentos) => {
            return api.post(`/lancamentos/${id}/pagamentos`, pagamentos);
        },

        registrarPagamento: async (lancamentoId, dados) => {
            return api.post(`/lancamentos/${lancamentoId}/pagamentos`, [dados]);
        },

        estornarPagamento: async (id, motivo) => {
            return api.post(`/pagamentos/${id}/estornar`, { motivo });
        },

        listarPagamentos: async (lancamentoId) => {
            return api.get(`/lancamentos/${lancamentoId}/pagamentos`);
        }
    }
};