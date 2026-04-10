-- =====================================================
-- Atualizar dados da empresa atual
-- =====================================================

UPDATE companies
SET
  name = 'Gutemberg Santos',
  cnpj = '03.435.139/0001-51',
  email = 'bergnocode@gmail.com1',
  phone = '43243344',
  address = '{
    "cep": "13.347-6131",
    "street": "Avenida Vitoria Rossi Martini1",
    "number": "8391",
    "neighborhood": "Dist. Industrial Vitória Martini1",
    "complement": "1",
    "city": "Indaiatuba",
    "state": "SP"
  }'::jsonb,
  updated_at = NOW()
WHERE id = (SELECT company_id FROM profiles WHERE email = 'admin@teste.com' LIMIT 1);
