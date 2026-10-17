-- Migration 001: Sistema Financeiro
-- Cria tabelas de lançamentos, pagamentos e categorias financeiras
-- Migra dados de transacoes para o novo modelo
-- Adiciona preco_custo em ordem_servico_pecas

-- ROLLBACK: 
-- DELETE FROM pagamentos WHERE lancamento_id IN (SELECT id FROM lancamentos WHERE migrado_de_transacoes = 1);
-- DELETE FROM lancamentos WHERE migrado_de_transacoes = 1;
-- ALTER TABLE ordem_servico_pecas DROP COLUMN preco_custo;
-- DROP TABLE IF EXISTS pagamentos;
-- DROP TABLE IF EXISTS lancamentos;
-- DROP TABLE IF EXISTS categorias_financeiras;

-- Tabela de categorias financeiras
CREATE TABLE IF NOT EXISTS categorias_financeiras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    oficina_id INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    tipo ENUM('entrada', 'saida') NOT NULL,
    ativa BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_oficina_tipo (oficina_id, tipo, ativa),
    CONSTRAINT fk_categoria_oficina FOREIGN KEY (oficina_id) REFERENCES oficinas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela de lançamentos
CREATE TABLE IF NOT EXISTS lancamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    oficina_id INT NOT NULL,
    tipo ENUM('entrada', 'saida') NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    categoria_id INT NULL,
    ordem_servico_id INT NULL,
    cliente_id INT NULL,
    fornecedor VARCHAR(150) NULL,
    valor DECIMAL(12,2) NOT NULL,
    vencimento DATE NOT NULL,
    status ENUM('aberto', 'parcial', 'pago', 'cancelado') NOT NULL DEFAULT 'aberto',
    parcela_numero INT DEFAULT 1,
    parcela_total INT DEFAULT 1,
    grupo_parcelas CHAR(36) NULL,
    cancelado_em DATETIME NULL,
    motivo_cancelamento TEXT NULL,
    migrado_de_transacoes BOOLEAN DEFAULT FALSE,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_oficina_status_vencimento (oficina_id, status, vencimento),
    INDEX idx_oficina_os (oficina_id, ordem_servico_id),
    INDEX idx_categoria (categoria_id),
    INDEX idx_grupo_parcelas (grupo_parcelas),
    CONSTRAINT fk_lancamento_oficina FOREIGN KEY (oficina_id) REFERENCES oficinas(id) ON DELETE CASCADE,
    CONSTRAINT fk_lancamento_categoria FOREIGN KEY (categoria_id) REFERENCES categorias_financeiras(id) ON DELETE SET NULL,
    CONSTRAINT fk_lancamento_os FOREIGN KEY (ordem_servico_id) REFERENCES ordens_servico(id) ON DELETE SET NULL,
    CONSTRAINT fk_lancamento_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS pagamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    oficina_id INT NOT NULL,
    lancamento_id INT NOT NULL,
    valor DECIMAL(12,2) NOT NULL,
    forma_pagamento ENUM('dinheiro', 'pix', 'debito', 'credito', 'boleto', 'transferencia', 'outro') NOT NULL,
    data_pagamento DATE NOT NULL,
    observacao TEXT NULL,
    estornado BOOLEAN DEFAULT FALSE,
    estornado_em DATETIME NULL,
    motivo_estorno TEXT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_lancamento (lancamento_id),
    INDEX idx_oficina (oficina_id),
    INDEX idx_data_pagamento (data_pagamento),
    CONSTRAINT fk_pagamento_oficina FOREIGN KEY (oficina_id) REFERENCES oficinas(id) ON DELETE CASCADE,
    CONSTRAINT fk_pagamento_lancamento FOREIGN KEY (lancamento_id) REFERENCES lancamentos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Adicionar preco_custo em ordem_servico_pecas
ALTER TABLE ordem_servico_pecas 
ADD COLUMN preco_custo DECIMAL(10,2) DEFAULT 0.00 AFTER preco;

-- Seed de categorias financeiras por oficina
INSERT INTO categorias_financeiras (oficina_id, nome, tipo) VALUES
(1, 'Serviços', 'entrada'),
(1, 'Peças', 'entrada'),
(1, 'Aluguel', 'saida'),
(1, 'Energia/Água', 'saida'),
(1, 'Fornecedores', 'saida'),
(1, 'Salários', 'saida'),
(1, 'Impostos', 'saida'),
(1, 'Outros', 'saida');

-- Migração de dados de transacoes para lancamentos
INSERT INTO lancamentos (
    oficina_id, tipo, descricao, categoria_id, ordem_servico_id, cliente_id, 
    fornecedor, valor, vencimento, status, parcela_numero, parcela_total, 
    grupo_parcelas, migrado_de_transacoes, criado_em
)
SELECT 
    t.oficina_id,
    t.tipo,
    t.descricao,
    CASE t.tipo
        WHEN 'entrada' THEN (SELECT id FROM categorias_financeiras WHERE oficina_id = t.oficina_id AND nome = 'Serviços' LIMIT 1)
        WHEN 'saida' THEN (SELECT id FROM categorias_financeiras WHERE oficina_id = t.oficina_id AND nome = 'Outros' LIMIT 1)
    END as categoria_id,
    t.ordem_servico_id,
    t.cliente_id,
    NULL as fornecedor,
    t.valor,
    COALESCE(t.data_vencimento, DATE(t.data)) as vencimento,
    CASE t.status
        WHEN 'pendente' THEN 'aberto'
        WHEN 'pago' THEN 'pago'
        ELSE t.status
    END as status,
    COALESCE(t.parcela, 1) as parcela_numero,
    COALESCE(t.total_parcelas, 1) as parcela_total,
    NULL as grupo_parcelas,
    TRUE as migrado_de_transacoes,
    t.created_at
FROM transacoes t;

-- Migrar pagamentos de transacoes pagas para a tabela pagamentos
INSERT INTO pagamentos (
    oficina_id, lancamento_id, valor, forma_pagamento, data_pagamento, observacao, criado_em
)
SELECT 
    t.oficina_id,
    l.id as lancamento_id,
    t.valor,
    COALESCE(t.forma_pagamento, 'outro') as forma_pagamento,
    COALESCE(t.data_vencimento, DATE(t.data)) as data_pagamento,
    'Migrado de transacoes' as observacao,
    t.data as criado_em
FROM transacoes t
INNER JOIN lancamentos l ON l.ordem_servico_id = t.ordem_servico_id AND l.migrado_de_transacoes = TRUE
WHERE t.status = 'pago';

-- Backfill de preco_custo em ordem_servico_pecas
UPDATE ordem_servico_pecas osp
SET preco_custo = (
    SELECT p.preco_custo 
    FROM pecas p 
    WHERE p.id = osp.peca_id
)
WHERE osp.preco_custo = 0;

-- Marcar transacoes como deprecated (mantém tabela para referência)
ALTER TABLE transacoes COMMENT = 'DEPRECATED: Esta tabela foi substituída por lancamentos e pagamentos. Não use mais esta tabela.';
