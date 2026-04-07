-- =====================================================
-- INSERIR LINHAS DE PRODUÇÃO E PRODUTOS DA PLANILHA
-- Company ID: 610563e2-d9ce-4ccc-8aa4-17a6e210cdf9
-- =====================================================

DO $$
DECLARE
  v_company_id UUID := '610563e2-d9ce-4ccc-8aa4-17a6e210cdf9';
  v_line_id UUID;
BEGIN

  -- =====================================================
  -- LINHA 1 - Zn Alcalino Rotativo Aut.
  -- =====================================================
  INSERT INTO production_lines (company_id, name, description, line_type, active)
  VALUES (v_company_id, 'Linha 1 - Zn Alcalino Rotativo Aut.', 'Zn/Alcalino Rotativo Automático', 'GALVANOPLASTIA', true)
  RETURNING id INTO v_line_id;

  INSERT INTO products (company_id, production_line_id, name, price, published) VALUES
    (v_company_id, v_line_id, 'Composto C-40 (soda cáustica)', 0, true),
    (v_company_id, v_line_id, 'Zincoat Plus Carrier', 0, true),
    (v_company_id, v_line_id, 'Zincoat Plus Brightener', 0, true),
    (v_company_id, v_line_id, 'Spectra Matte 255', 0, true),
    (v_company_id, v_line_id, 'Active MC-20', 0, true),
    (v_company_id, v_line_id, 'Metal Clean FE 01', 0, true),
    (v_company_id, v_line_id, 'Anodo', 0, true);

  RAISE NOTICE 'Linha 1 criada com % produtos', 7;

  -- =====================================================
  -- LINHA 2 - Zn Alcalino Rotativo Aut.
  -- =====================================================
  INSERT INTO production_lines (company_id, name, description, line_type, active)
  VALUES (v_company_id, 'Linha 2 - Zn Alcalino Rotativo Aut.', 'Zn/Alcalino Rotativo Automático', 'GALVANOPLASTIA', true)
  RETURNING id INTO v_line_id;

  INSERT INTO products (company_id, production_line_id, name, price, published) VALUES
    (v_company_id, v_line_id, 'Composto C-40 (soda cáustica)', 0, true),
    (v_company_id, v_line_id, 'Zincoat Plus Carrier', 0, true),
    (v_company_id, v_line_id, 'Zincoat Plus Brightener', 0, true),
    (v_company_id, v_line_id, 'Spectra Matte 255', 0, true),
    (v_company_id, v_line_id, 'Active MC-20', 0, true),
    (v_company_id, v_line_id, 'Desengraxante Eletrolitico', 0, true),
    (v_company_id, v_line_id, 'Anodo', 0, true);

  RAISE NOTICE 'Linha 2 criada com % produtos', 7;

  -- =====================================================
  -- LINHA 3 - Zn Alcalino Rotativo Aut.
  -- =====================================================
  INSERT INTO production_lines (company_id, name, description, line_type, active)
  VALUES (v_company_id, 'Linha 3 - Zn Alcalino Rotativo Aut.', 'Zn/Alcalino Rotativo Automático', 'GALVANOPLASTIA', true)
  RETURNING id INTO v_line_id;

  INSERT INTO products (company_id, production_line_id, name, price, published) VALUES
    (v_company_id, v_line_id, 'Composto C-40 (soda cáustica)', 0, true),
    (v_company_id, v_line_id, 'Zincoat Plus Carrier', 0, true),
    (v_company_id, v_line_id, 'Zincoat Plus Brightener', 0, true),
    (v_company_id, v_line_id, 'Metal Clean FE 01', 0, true),
    (v_company_id, v_line_id, 'Desengraxante Eletrolitico', 0, true),
    (v_company_id, v_line_id, 'Ácido Cloridrico', 0, true),
    (v_company_id, v_line_id, 'Spectra Matte 255', 0, true),
    (v_company_id, v_line_id, 'Active MC-20', 0, true),
    (v_company_id, v_line_id, 'Anodo', 0, true);

  RAISE NOTICE 'Linha 3 criada com % produtos', 9;

  -- =====================================================
  -- LINHA 4 - Zn Alcalino Manual
  -- =====================================================
  INSERT INTO production_lines (company_id, name, description, line_type, active)
  VALUES (v_company_id, 'Linha 4 - Zn Alcalino Manual', 'Zn/Alcalino Rotativo Manual', 'GALVANOPLASTIA', true)
  RETURNING id INTO v_line_id;

  INSERT INTO products (company_id, production_line_id, name, price, published) VALUES
    (v_company_id, v_line_id, 'Composto C-40', 0, true),
    (v_company_id, v_line_id, 'Zincoat Premium Make Up', 0, true),
    (v_company_id, v_line_id, 'Zincoat Premium Replenisher', 0, true),
    (v_company_id, v_line_id, 'Spectra Silver ZNI', 0, true),
    (v_company_id, v_line_id, 'Spectra Seal 050', 0, true),
    (v_company_id, v_line_id, 'Anodo', 0, true);

  RAISE NOTICE 'Linha 4 criada com % produtos', 6;

  -- =====================================================
  -- LINHA 5 - Zn Alcalino Semi Aut.
  -- =====================================================
  INSERT INTO production_lines (company_id, name, description, line_type, active)
  VALUES (v_company_id, 'Linha 5 - Zn Alcalino Semi Aut.', 'Zn/Alcalino Parado Semi Automático', 'GALVANOPLASTIA', true)
  RETURNING id INTO v_line_id;

  INSERT INTO products (company_id, production_line_id, name, price, published) VALUES
    (v_company_id, v_line_id, 'Composto C-40', 0, true),
    (v_company_id, v_line_id, 'Zincoat Plus Carrier', 0, true),
    (v_company_id, v_line_id, 'Zincoat Plus Brightener', 0, true),
    (v_company_id, v_line_id, 'Spectra Matte 255', 0, true),
    (v_company_id, v_line_id, 'Ácido Nítrico / Active MC-20', 0, true),
    (v_company_id, v_line_id, 'Metal Clean FE LT', 0, true),
    (v_company_id, v_line_id, 'Metal Clean FE 01', 0, true),
    (v_company_id, v_line_id, 'Anodo', 0, true);

  RAISE NOTICE 'Linha 5 criada com % produtos', 8;

  -- =====================================================
  -- LINHA 6 - Zn/Ni Semi Aut.
  -- =====================================================
  INSERT INTO production_lines (company_id, name, description, line_type, active)
  VALUES (v_company_id, 'Linha 6 - Zn/Ni Semi Aut.', 'Zn/Ní Parado Semi Automático', 'GALVANOPLASTIA', true)
  RETURNING id INTO v_line_id;

  INSERT INTO products (company_id, production_line_id, name, price, published) VALUES
    (v_company_id, v_line_id, 'Composto C-40', 0, true),
    (v_company_id, v_line_id, 'Zincoat Premium Make Up', 0, true),
    (v_company_id, v_line_id, 'Zincoat Premium Replenisher', 0, true),
    (v_company_id, v_line_id, 'Spectra Seal 050', 0, true),
    (v_company_id, v_line_id, 'Spectra Silver ZNI', 0, true),
    (v_company_id, v_line_id, 'Metal Clean FE LT', 0, true),
    (v_company_id, v_line_id, 'Ácido Cloridrico', 0, true),
    (v_company_id, v_line_id, 'Metal Clean FT 13 A', 0, true),
    (v_company_id, v_line_id, 'Anodo', 0, true);

  RAISE NOTICE 'Linha 6 criada com % produtos', 9;

  -- =====================================================
  -- LINHA 9 - Pré Tratamento / Fosfato Aut.
  -- =====================================================
  INSERT INTO production_lines (company_id, name, description, line_type, active)
  VALUES (v_company_id, 'Linha 9 - Pré Tratamento Fosfato Aut.', 'Pré-Tratamento/Fosfato Automático', 'GALVANOPLASTIA', true)
  RETURNING id INTO v_line_id;

  INSERT INTO products (company_id, production_line_id, name, price, published) VALUES
    (v_company_id, v_line_id, 'Metal Clean FE LT', 0, true),
    (v_company_id, v_line_id, 'Ácido Decapante 1', 0, true),
    (v_company_id, v_line_id, 'Ácido Decapante 2', 0, true),
    (v_company_id, v_line_id, 'Refinador 1', 0, true),
    (v_company_id, v_line_id, 'Fosfato 1', 0, true),
    (v_company_id, v_line_id, 'Refinador 2', 0, true),
    (v_company_id, v_line_id, 'Fosfato 2', 0, true),
    (v_company_id, v_line_id, 'Neutralizador', 0, true);

  RAISE NOTICE 'Linha 9 criada com % produtos', 8;

  -- =====================================================
  -- E.T.E - Estação Tratamento Efluentes
  -- =====================================================
  INSERT INTO production_lines (company_id, name, description, line_type, active)
  VALUES (v_company_id, 'E.T.E - Estação Tratamento Efluentes', 'Estação de Tratamento de Efluentes', 'GALVANOPLASTIA', true)
  RETURNING id INTO v_line_id;

  INSERT INTO products (company_id, production_line_id, name, price, published) VALUES
    (v_company_id, v_line_id, 'Soda 50%', 0, true),
    (v_company_id, v_line_id, 'Ácido Cloridrico', 0, true),
    (v_company_id, v_line_id, 'Metabissulfito de Sódio', 0, true),
    (v_company_id, v_line_id, 'Carbonato de Cálcio', 0, true),
    (v_company_id, v_line_id, 'Anti Espumante', 0, true),
    (v_company_id, v_line_id, 'Polieletrólito', 0, true);

  RAISE NOTICE 'E.T.E criada com % produtos', 6;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total: 8 linhas e 60 produtos inseridos';
  RAISE NOTICE '========================================';

END $$;
