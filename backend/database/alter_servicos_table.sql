-- Adicionar campos de configuração de lembrete à tabela de serviços
ALTER TABLE servicos 
ADD COLUMN precisa_lembrete BOOLEAN DEFAULT FALSE,
ADD COLUMN lembrete_intervalo_tipo ENUM('dia', 'mes', 'ano') DEFAULT NULL,
ADD COLUMN lembrete_intervalo_quantidade INT DEFAULT NULL,
ADD COLUMN lembrete_antecedencia_dias INT DEFAULT 7;