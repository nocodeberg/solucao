-- =====================================================
-- SCRIPT COMPLETO - EXECUTAR TUDO DE UMA VEZ
-- =====================================================
-- Este script:
-- 1. Corrige as policies RLS (recursão infinita)
-- 2. Insere produtos químicos em todas as linhas
-- 3. Verifica se funcionou
--
-- IMPORTANTE: Execute este script inteiro no Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PARTE 1: CORRIGIR POLICIES RLS
-- =====================================================

-- 1.1 Criar função helper
CREATE OR REPLACE FUNCTION public.user_company_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 1.2 Remover policies problemáticas
DROP POLICY IF EXISTS "Users can view profiles in their company" ON profiles;
DROP POLICY IF EXISTS "Users can view production lines in their company" ON production_lines;
DROP POLICY IF EXISTS "Admins and Gestores can manage production lines" ON production_lines;
DROP POLICY IF EXISTS "Users can view products in their company" ON products;
DROP POLICY IF EXISTS "Admins and Gestores can manage products" ON products;
DROP POLICY IF EXISTS "Users can view groups in their company" ON groups;
DROP POLICY IF EXISTS "Admins and Gestores can manage groups" ON groups;
DROP POLICY IF EXISTS "Users can view pieces in their company" ON pieces;
DROP POLICY IF EXISTS "Admins and Gestores can manage pieces" ON pieces;
DROP POLICY IF EXISTS "Users can view employees in their company" ON employees;
DROP POLICY IF EXISTS "Admins and RH can manage employees" ON employees;
DROP POLICY IF EXISTS "Users can view lancamento_mo in their company" ON lancamento_mo;
DROP POLICY IF EXISTS "Authorized users can create lancamento_mo" ON lancamento_mo;
DROP POLICY IF EXISTS "Admins and RH can update/delete lancamento_mo" ON lancamento_mo;
DROP POLICY IF EXISTS "Users can view manutencao in their company" ON manutencao;
DROP POLICY IF EXISTS "Authorized users can manage manutencao" ON manutencao;
DROP POLICY IF EXISTS "Users can view consumo_agua in their company" ON consumo_agua;
DROP POLICY IF EXISTS "Authorized users can manage consumo_agua" ON consumo_agua;
DROP POLICY IF EXISTS "Users can view cargos in their company" ON cargos;
DROP POLICY IF EXISTS "Admins and RH can manage cargos" ON cargos;
DROP POLICY IF EXISTS "Users can view encargos in their company" ON encargos;
DROP POLICY IF EXISTS "Only Admins can manage encargos" ON encargos;
DROP POLICY IF EXISTS "Users can view chemical products in their company" ON chemical_products;
DROP POLICY IF EXISTS "Admins and Gestores can manage chemical products" ON chemical_products;
DROP POLICY IF EXISTS "Users can view chemical launches in their company" ON chemical_product_launches;
DROP POLICY IF EXISTS "Authorized users can create chemical launches" ON chemical_product_launches;
DROP POLICY IF EXISTS "Authorized users can update/delete chemical launches" ON chemical_product_launches;

-- 1.3 Criar novas policies corrigidas
CREATE POLICY "Users can view profiles in their company" ON profiles FOR SELECT USING (company_id = public.user_company_id());
CREATE POLICY "Users can view production lines in their company" ON production_lines FOR SELECT USING (company_id = public.user_company_id());
CREATE POLICY "Admins and Gestores can manage production lines" ON production_lines FOR ALL USING (company_id = public.user_company_id() AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR')));
CREATE POLICY "Users can view products in their company" ON products FOR SELECT USING (company_id = public.user_company_id());
CREATE POLICY "Admins and Gestores can manage products" ON products FOR ALL USING (company_id = public.user_company_id() AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR')));
CREATE POLICY "Users can view groups in their company" ON groups FOR SELECT USING (company_id = public.user_company_id());
CREATE POLICY "Admins and Gestores can manage groups" ON groups FOR ALL USING (company_id = public.user_company_id() AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR')));
CREATE POLICY "Users can view pieces in their company" ON pieces FOR SELECT USING (company_id = public.user_company_id());
CREATE POLICY "Admins and Gestores can manage pieces" ON pieces FOR ALL USING (company_id = public.user_company_id() AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR')));
CREATE POLICY "Users can view employees in their company" ON employees FOR SELECT USING (company_id = public.user_company_id());
CREATE POLICY "Admins and RH can manage employees" ON employees FOR ALL USING (company_id = public.user_company_id() AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'RH', 'GESTOR')));
CREATE POLICY "Users can view lancamento_mo in their company" ON lancamento_mo FOR SELECT USING (company_id = public.user_company_id());
CREATE POLICY "Authorized users can create lancamento_mo" ON lancamento_mo FOR INSERT WITH CHECK (company_id = public.user_company_id() AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'RH', 'GESTOR', 'OPERADOR')));
CREATE POLICY "Admins and RH can update/delete lancamento_mo" ON lancamento_mo FOR ALL USING (company_id = public.user_company_id() AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'RH', 'GESTOR')));
CREATE POLICY "Users can view manutencao in their company" ON manutencao FOR SELECT USING (company_id = public.user_company_id());
CREATE POLICY "Authorized users can manage manutencao" ON manutencao FOR ALL USING (company_id = public.user_company_id() AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR', 'OPERADOR')));
CREATE POLICY "Users can view consumo_agua in their company" ON consumo_agua FOR SELECT USING (company_id = public.user_company_id());
CREATE POLICY "Authorized users can manage consumo_agua" ON consumo_agua FOR ALL USING (company_id = public.user_company_id() AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR', 'OPERADOR')));
CREATE POLICY "Users can view cargos in their company" ON cargos FOR SELECT USING (company_id = public.user_company_id());
CREATE POLICY "Admins and RH can manage cargos" ON cargos FOR ALL USING (company_id = public.user_company_id() AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'RH')));
CREATE POLICY "Users can view encargos in their company" ON encargos FOR SELECT USING (company_id = public.user_company_id());
CREATE POLICY "Only Admins can manage encargos" ON encargos FOR ALL USING (company_id = public.user_company_id() AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN'));
CREATE POLICY "Users can view chemical products in their company" ON chemical_products FOR SELECT USING (company_id = public.user_company_id());
CREATE POLICY "Admins and Gestores can manage chemical products" ON chemical_products FOR ALL USING (company_id = public.user_company_id() AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR')));
CREATE POLICY "Users can view chemical launches in their company" ON chemical_product_launches FOR SELECT USING (company_id = public.user_company_id());
CREATE POLICY "Authorized users can create chemical launches" ON chemical_product_launches FOR INSERT WITH CHECK (company_id = public.user_company_id() AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR', 'OPERADOR')));
CREATE POLICY "Authorized users can update/delete chemical launches" ON chemical_product_launches FOR ALL USING (company_id = public.user_company_id() AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'GESTOR', 'OPERADOR')));

-- =====================================================
-- PARTE 2: INSERIR PRODUTOS QUÍMICOS
-- =====================================================

INSERT INTO chemical_products (company_id, production_line_id, name, unit_price, unit, active)
SELECT
  pl.company_id,
  pl.id,
  produto.name,
  produto.price,
  produto.unit,
  true
FROM production_lines pl
CROSS JOIN (
  VALUES
    ('SODA', 10.00, 'kg'),
    ('ACTIVE ZMC', 10.00, 'kg'),
    ('COMPOSTO C-10', 10.00, 'kg'),
    ('METAL CLEAN FE 05', 10.00, 'kg'),
    ('METAL CLEAN 7E_F', 10.00, 'kg'),
    ('ÁCIDO SULFÚRICO', 15.00, 'L'),
    ('ANODO DE COBRE', 50.00, 'kg'),
    ('SULFATO DE COBRE', 75.00, 'kg'),
    ('MC COPPER EVOLUTION M.U', 13.00, 'L'),
    ('MC COPPER EVOLUTION PARTE A', 10.00, 'L'),
    ('MC COPPER EVOLUTION PARTE B', 7.00, 'L'),
    ('MC COPPER EVOLUTION UMECTANTE', 10.00, 'L')
) AS produto(name, price, unit)
WHERE pl.line_type = 'GALVANOPLASTIA'
  AND pl.active = true
  AND NOT EXISTS (
    SELECT 1 FROM chemical_products cp
    WHERE cp.production_line_id = pl.id
      AND cp.name = produto.name
  );

-- =====================================================
-- PARTE 3: VERIFICAR SE FUNCIONOU
-- =====================================================

-- Verificar políticas criadas
SELECT 'Policies criadas com sucesso!' as status;

SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'chemical_products', 'chemical_product_launches')
ORDER BY tablename, policyname;

-- Verificar produtos inseridos
SELECT
  pl.name as linha,
  cp.name as produto,
  cp.unit_price as preco,
  cp.unit as unidade,
  cp.active as ativo
FROM chemical_products cp
JOIN production_lines pl ON cp.production_line_id = pl.id
ORDER BY pl.name, cp.name;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- Você deve ver:
-- 1. Mensagem "Policies criadas com sucesso!"
-- 2. Lista de policies por tabela
-- 3. Lista de produtos químicos por linha
--
-- Exemplo:
-- linha         | produto                    | preco | unidade | ativo
-- --------------|----------------------------|-------|---------|------
-- Cobre Ácido   | ACTIVE ZMC                 | 10.00 | kg      | true
-- Cobre Ácido   | ANODO DE COBRE             | 50.00 | kg      | true
-- ...
--
-- PRÓXIMO PASSO:
-- 1. Recarregue a aplicação (F5)
-- 2. Faça logout e login
-- 3. Teste o modal de lançamento
-- =====================================================
