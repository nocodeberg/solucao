-- =====================================================
-- VERIFICAR SE HÁ EMPRESAS NO SISTEMA
-- =====================================================
SELECT id, name, cnpj FROM companies;

-- =====================================================
-- VERIFICAR SE HÁ PRODUTOS QUÍMICOS CADASTRADOS
-- =====================================================
SELECT * FROM chemical_products;

-- =====================================================
-- SE NÃO HOUVER PRODUTOS, EXECUTE ESTE INSERT:
-- =====================================================
-- Copie o ID da sua empresa da primeira query acima
-- e substitua 'SEU-COMPANY-ID-AQUI' pelo ID real

INSERT INTO chemical_products (company_id, name, unit_price, unit, active)
VALUES
  ('SEU-COMPANY-ID-AQUI', 'SODA', 10.00, 'kg', true),
  ('SEU-COMPANY-ID-AQUI', 'ACTIVE ZMC', 10.00, 'kg', true),
  ('SEU-COMPANY-ID-AQUI', 'COMPOSTO C-10', 10.00, 'kg', true),
  ('SEU-COMPANY-ID-AQUI', 'METAL CLEAN FE 05', 10.00, 'kg', true),
  ('SEU-COMPANY-ID-AQUI', 'METAL CLEAN 7E_F', 10.00, 'kg', true);
