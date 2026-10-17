CREATE TABLE IF NOT EXISTS compras_pecas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    oficina_id INT NOT NULL,
    peca_id INT NULL,
    peca_nome VARCHAR(150) NOT NULL,
    peca_codigo VARCHAR(100) NULL,
    fornecedor VARCHAR(150) NULL,
    quantidade INT NOT NULL,
    valor_unitario DECIMAL(10,2) NOT NULL,
    valor_total DECIMAL(12,2) NOT NULL,
    vencimento DATE NOT NULL,
    lancamento_id INT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_compras_oficina_data (oficina_id, criado_em),
    INDEX idx_compras_peca (peca_id),
    CONSTRAINT fk_compra_peca_oficina FOREIGN KEY (oficina_id) REFERENCES oficinas(id) ON DELETE CASCADE,
    CONSTRAINT fk_compra_peca_item FOREIGN KEY (peca_id) REFERENCES pecas(id) ON DELETE SET NULL,
    CONSTRAINT fk_compra_peca_lancamento FOREIGN KEY (lancamento_id) REFERENCES lancamentos(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
