-- =====================================================
-- VERIFICAR COMPANY_ID
-- =====================================================
-- Execute primeiro para pegar o ID da sua empresa
SELECT id, name FROM companies;

-- =====================================================
-- INSERIR PRODUTOS QUÍMICOS
-- =====================================================
-- IMPORTANTE: Copie o ID da sua empresa acima e cole abaixo
-- Substitua TODAS as ocorrências de 'SEU-COMPANY-ID-AQUI'

-- Exemplo: se o ID for '123e4567-e89b-12d3-a456-426614174000'
-- substitua por esse valor em todos os lugares abaixo

INSERT INTO chemical_products (company_id, name, unit_price, unit, active)
VALUES
  ('SEU-COMPANY-ID-AQUI', 'SODA', 10.00, 'kg', true),
  ('SEU-COMPANY-ID-AQUI', 'ACTIVE ZMC', 10.00, 'kg', true),
  ('SEU-COMPANY-ID-AQUI', 'COMPOSTO C-10', 10.00, 'kg', true),
  ('SEU-COMPANY-ID-AQUI', 'METAL CLEAN FE 05', 10.00, 'kg', true),
  ('SEU-COMPANY-ID-AQUI', 'METAL CLEAN 7E_F', 10.00, 'kg', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICAR SE OS PRODUTOS FORAM INSERIDOS
-- =====================================================
SELECT * FROM chemical_products;
