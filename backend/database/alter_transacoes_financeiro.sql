ALTER TABLE transacoes
ADD COLUMN cliente_id INT DEFAULT NULL,
ADD COLUMN forma_pagamento ENUM('dinheiro', 'pix', 'debito', 'credito', 'boleto') DEFAULT NULL,
ADD COLUMN data_vencimento DATE DEFAULT NULL,
ADD COLUMN parcela INT DEFAULT NULL,
ADD COLUMN total_parcelas INT DEFAULT NULL;
