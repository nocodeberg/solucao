-- =====================================================
-- INSERIR PRODUTOS QUÍMICOS - PRONTO PARA EXECUTAR
-- =====================================================

INSERT INTO chemical_products (company_id, name, unit_price, unit, active)
VALUES
  ('b3d594a0-2925-41d6-b1b5-b2aec57c4f3b', 'SODA', 10.00, 'kg', true),
  ('b3d594a0-2925-41d6-b1b5-b2aec57c4f3b', 'ACTIVE ZMC', 10.00, 'kg', true),
  ('b3d594a0-2925-41d6-b1b5-b2aec57c4f3b', 'COMPOSTO C-10', 10.00, 'kg', true),
  ('b3d594a0-2925-41d6-b1b5-b2aec57c4f3b', 'METAL CLEAN FE 05', 10.00, 'kg', true),
  ('b3d594a0-2925-41d6-b1b5-b2aec57c4f3b', 'METAL CLEAN 7E_F', 10.00, 'kg', true);

-- =====================================================
-- VERIFICAR SE OS PRODUTOS FORAM INSERIDOS
-- =====================================================
SELECT * FROM chemical_products;
