-- =====================================================
-- RLS: Permitir leitura da empresa para usuários da mesma empresa
-- =====================================================

CREATE POLICY "Users can view their own company"
  ON companies FOR SELECT
  USING (
    id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );
