# PR A: Modelo de dados e API financeira - Documentação de Testes

## Descrição da PR

Esta PR cria o modelo de dados financeiro (categorias, lançamentos e pagamentos) e a API correspondente, migrando os dados existentes da tabela `transacoes` para o novo modelo.

## O que mudou

### Banco de Dados
- **Nova tabela `categorias_financeiras`**: Categorização de lançamentos por tipo (entrada/saída)
- **Nova tabela `lancamentos`**: Títulos (o que se deve ou se espera receber)
- **Nova tabela `pagamentos`**: Baixas de lançamentos (um lançamento pode ter vários pagamentos)
- **Nova coluna `preco_custo` em `ordem_servico_pecas`**: Snapshot do custo no momento da adição
- **Migração de dados**: Transações existentes migradas para o novo modelo
- **Índices**: Criados para performance em consultas frequentes

### Backend
- **Novo helper `helpers/oficinaHelper.js`**: Obter `oficina_id` de forma centralizada
- **Novo controller `categoriaFinanceiraController.js`**: CRUD de categorias
- **Novo controller `lancamentoController.js`**: CRUD de lançamentos com suporte a parcelamento
- **Novo controller `pagamentoController.js`**: Adicionar pagamentos e estornos
- **Novas rotas**: `/categorias-financeiras`, `/lancamentos`, `/pagamentos`
- **Removido DELETE de transacoes**: Dinheiro só pode ser cancelado ou estornado

### Migration
- **Arquivo `migrations/001_financeiro.sql`**: Migration idempotente com rollback documentado
- **Arquivo `migrations/000_schema_atual.sql`**: Schema atual antes da migration

## Como testar

### 1. Executar migration
```bash
cd backend
node run_migration_v2.js
```

### 2. Verificar migration
```bash
node test_migration.js
```

### 3. Iniciar servidor
```bash
node server.js
```

### 4. Testar API
```bash
node test_api.js
```

## Testes manuais documentados

### Teste 1: Concluir a OS duas vezes gera só um lançamento
**Objetivo**: Verificar idempotência na criação de lançamento de OS

**Pré-requisitos**: Ter uma OS criada

**Passos**:
1. Mudar status da OS para `concluida` duas vezes
2. Verificar que só existe um lançamento não cancelado para essa OS

**Resultado esperado**: Apenas um lançamento criado

**Status**: ⏳ Será implementado na PR B (integração OS → Financeiro)

---

### Teste 2: Pagar 300 + 200 em um lançamento de 500 deixa `pago`
**Objetivo**: Verificar pagamentos parciais e atualização de status

**Passos**:
```bash
# Criar lançamento de 500
curl -X POST http://localhost:3000/lancamentos \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "entrada",
    "descricao": "Teste pagamento parcial",
    "valor": 500,
    "vencimento": "2026-10-10"
  }'

# Adicionar pagamento de 300
curl -X POST http://localhost:3000/lancamentos/ID/pagamentos \
  -H "Content-Type: application/json" \
  -d '[
    {"valor": 300, "forma_pagamento": "dinheiro", "data_pagamento": "2026-10-05"}
  ]'

# Adicionar pagamento de 200
curl -X POST http://localhost:3000/lancamentos/ID/pagamentos \
  -H "Content-Type: application/json" \
  -d '[
    {"valor": 200, "forma_pagamento": "pix", "data_pagamento": "2026-10-05"}
  ]'

# Verificar status
curl http://localhost:3000/lancamentos/ID
```

**Resultado esperado**: Status do lançamento muda para `pago`

**Status**: ✅ Implementado

---

### Teste 3: Estornar o de 200 deixa `parcial`
**Objetivo**: Verificar estorno de pagamento e recálculo de status

**Passos**:
```bash
# Estornar pagamento de 200
curl -X POST http://localhost:3000/pagamentos/PAGAMENTO_ID/estornar \
  -H "Content-Type: application/json" \
  -d '{"motivo": "Teste de estorno"}'

# Verificar status
curl http://localhost:3000/lancamentos/ID
```

**Resultado esperado**: Status do lançamento muda para `parcial`

**Status**: ✅ Implementado

---

### Teste 4: Pagar mais que o saldo retorna 400
**Objetivo**: Verificar validação de saldo

**Passos**:
```bash
# Tentar pagar mais que o valor restante
curl -X POST http://localhost:3000/lancamentos/ID/pagamentos \
  -H "Content-Type: application/json" \
  -d '[
    {"valor": 1000, "forma_pagamento": "dinheiro", "data_pagamento": "2026-10-05"}
  ]'
```

**Resultado esperado**: Erro 400 com mensagem "A soma dos pagamentos excede o valor do lançamento"

**Status**: ✅ Implementado

---

### Teste 5: Duas requisições simultâneas adicionando a última peça em estoque
**Objetivo**: Verificar tratamento de race condition no estoque

**Pré-requisitos**: Ter uma peça com quantidade 1

**Passos**:
1. Enviar duas requisições simultâneas adicionando essa peça a uma OS
2. Verificar que apenas uma passou

**Resultado esperado**: Apenas uma requisição adiciona a peça, a outra falha

**Status**: ⏳ Será implementado na PR B (integração OS → Financeiro)

---

### Teste 6: Lançamento com vencimento ontem aparece como atrasado
**Objetivo**: Verificar filtro virtual de atrasado

**Passos**:
```bash
# Criar lançamento com vencimento ontem
curl -X POST http://localhost:3000/lancamentos \
  -H "Content-Type: application/json" \
  -d '{
    "tipo": "entrada",
    "descricao": "Teste atrasado",
    "valor": 100,
    "vencimento": "2026-10-02"
  }'

# Buscar lançamentos atrasados
curl "http://localhost:3000/lancamentos?status=atrasado"
```

**Resultado esperado**: Lançamento aparece no filtro `atrasado`

**Status**: ✅ Implementado

---

### Teste 7: Alterar o valor de uma OS já paga retorna 409
**Objetivo**: Verificar bloqueio de edição de OS com lançamento pago

**Pré-requisitos**: Ter uma OS com lançamento pago

**Passos**:
1. Tentar alterar o valor_total da OS
2. Verificar erro 409

**Resultado esperado**: Erro 409 com mensagem orientando estorno

**Status**: ⏳ Será implementado na PR B (integração OS → Financeiro)

---

### Teste 8: Um lançamento de uma oficina não aparece em consultas de outra
**Objetivo**: Verificar isolamento por oficina

**Pré-requisitos**: Ter duas oficinas (só oficina_id 1 existe no seed atual)

**Passos**:
1. Criar lançamento na oficina 1
2. Buscar lançamentos simulando oficina 2 (quando autenticação for implementada)

**Resultado esperado**: Lançamento da oficina 1 não aparece na consulta da oficina 2

**Status**: ✅ Implementado (isolação por oficina_id em todas as queries)

---

## Rollback da migration

Para rollback da migration 001_financeiro:

```sql
DELETE FROM pagamentos WHERE lancamento_id IN (SELECT id FROM lancamentos WHERE migrado_de_transacoes = 1);
DELETE FROM lancamentos WHERE migrado_de_transacoes = 1;
ALTER TABLE ordem_servico_pecas DROP COLUMN preco_custo;
DROP TABLE IF EXISTS pagamentos;
DROP TABLE IF EXISTS lancamentos;
DROP TABLE IF EXISTS categorias_financeiras;
```

## Arquivos criados/modificados

### Criados
- `backend/migrations/000_schema_atual.sql`
- `backend/migrations/001_financeiro.sql`
- `backend/helpers/oficinaHelper.js`
- `backend/controllers/categoriaFinanceiraController.js`
- `backend/controllers/lancamentoController.js`
- `backend/controllers/pagamentoController.js`
- `backend/routes/categoriaFinanceiraRoutes.js`
- `backend/routes/lancamentoRoutes.js`
- `backend/routes/pagamentoRoutes.js`
- `backend/run_migration_v2.js`
- `backend/test_migration.js`
- `backend/test_api.js`

### Modificados
- `backend/server.js` (registradas novas rotas)
- `backend/routes/transacaoRoutes.js` (removido DELETE)
- `backend/controllers/transacaoController.js` (removido excluirTransacao)

## Próximos passos

- **PR B**: Integração OS → Financeiro (geração automática de lançamentos ao concluir OS)
- **PR C**: Dashboard e relatórios financeiros
- **PR D**: Frontend Financeiro
