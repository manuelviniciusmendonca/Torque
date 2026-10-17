-- Schema atual antes da migration 001_financeiro
-- Gerado em 2026-10-03

-- TRANSACOES (deprecated após migration 001_financeiro)
CREATE TABLE `transacoes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `oficina_id` int NOT NULL,
  `ordem_servico_id` int DEFAULT NULL,
  `tipo` varchar(20) NOT NULL,
  `descricao` varchar(255) NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pendente',
  `data` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `forma_pagamento` enum('dinheiro','pix','debito','credito','boleto') DEFAULT NULL,
  `data_vencimento` date DEFAULT NULL,
  `parcela` int DEFAULT NULL,
  `total_parcelas` int DEFAULT NULL,
  `cliente_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `oficina_id` (`oficina_id`),
  KEY `ordem_servico_id` (`ordem_servico_id`),
  CONSTRAINT `transacoes_ibfk_1` REFERENCES `oficinas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `transacoes_ibfk_2` REFERENCES `ordens_servico` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ORDENS_SERVICO
CREATE TABLE `ordens_servico` (
  `id` int NOT NULL AUTO_INCREMENT,
  `oficina_id` int NOT NULL,
  `cliente_id` int NOT NULL,
  `veiculo_id` int NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'aberta',
  `problema_relatado` text,
  `diagnostico` text,
  `observacoes` text,
  `quilometragem` int DEFAULT NULL,
  `valor_total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `data_abertura` datetime DEFAULT CURRENT_TIMESTAMP,
  `data_conclusao` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `oficina_id` (`oficina_id`),
  KEY `cliente_id` (`cliente_id`),
  KEY `veiculo_id` (`veiculo_id`),
  CONSTRAINT `ordens_servico_ibfk_1` REFERENCES `oficinas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ordens_servico_ibfk_2` REFERENCES `clientes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ordens_servico_ibfk_3` REFERENCES `veiculos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ORDEM_SERVICO_SERVICOS
CREATE TABLE `ordem_servico_servicos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ordem_servico_id` int NOT NULL,
  `servico_id` int NOT NULL,
  `quantidade` int NOT NULL DEFAULT '1',
  `preco` decimal(10,2) NOT NULL DEFAULT '0.00',
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `ordem_servico_id` (`ordem_servico_id`),
  KEY `servico_id` (`servico_id`),
  CONSTRAINT `ordem_servico_servicos_ibfk_1` REFERENCES `ordens_servico` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ordem_servico_servicos_ibfk_2` REFERENCES `servicos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ORDEM_SERVICO_PECAS
CREATE TABLE `ordem_servico_pecas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ordem_servico_id` int NOT NULL,
  `peca_id` int NOT NULL,
  `quantidade` int NOT NULL DEFAULT '1',
  `preco` decimal(10,2) NOT NULL DEFAULT '0.00',
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `ordem_servico_id` (`ordem_servico_id`),
  KEY `peca_id` (`peca_id`),
  CONSTRAINT `ordem_servico_pecas_ibfk_1` REFERENCES `ordens_servico` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ordem_servico_pecas_ibfk_2` REFERENCES `pecas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- PECAS
CREATE TABLE `pecas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `oficina_id` int NOT NULL,
  `nome` varchar(150) NOT NULL,
  `codigo` varchar(100) DEFAULT NULL,
  `descricao` text,
  `quantidade` int NOT NULL DEFAULT '0',
  `estoque_minimo` int NOT NULL DEFAULT '0',
  `preco_custo` decimal(10,2) NOT NULL DEFAULT '0.00',
  `preco_venda` decimal(10,2) NOT NULL DEFAULT '0.00',
  `fornecedor` varchar(150) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `estoque` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `oficina_id` (`oficina_id`),
  CONSTRAINT `pecas_ibfk_1` REFERENCES `oficinas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
