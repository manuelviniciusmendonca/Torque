CREATE TABLE IF NOT EXISTS ordem_servico_adicionais (
    id INT NOT NULL AUTO_INCREMENT,
    ordem_servico_id INT NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY ordem_servico_id (ordem_servico_id),
    CONSTRAINT ordem_servico_adicionais_ibfk_1
        FOREIGN KEY (ordem_servico_id)
        REFERENCES ordens_servico (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
