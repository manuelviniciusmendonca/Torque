ALTER TABLE ordens_servico
    ADD COLUMN descricao_adicional VARCHAR(255) NULL,
    ADD COLUMN valor_adicional DECIMAL(10,2) NOT NULL DEFAULT 0.00;
