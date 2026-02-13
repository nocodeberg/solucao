const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, canWrite, authorize } = require('../middleware/auth');

router.use(authenticate);

// Helper: Verificar se line_type existe no banco e preparar dados
const prepareLineData = (data) => {
  // Por enquanto, manter line_type - será necessário executar a migration SQL
  // Se houver erro, o Supabase vai indicar que a coluna não existe
  return data;
};

// GET /api/production-lines
router.get('/', async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { data, error } = await supabase
      .from('production_lines')
      .select('*')
      .eq('company_id', company_id)
      .order('name');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar linhas de produção' });
  }
});

// POST /api/production-lines
router.post('/', canWrite, authorize('ADMIN', 'GESTOR'), async (req, res) => {
  try {
    const { company_id } = req.profile;
    const insertData = prepareLineData({ ...req.body, company_id });

    const { data, error } = await supabase
      .from('production_lines')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar linha:', error);

      // Se o erro for sobre coluna não existir, retornar mensagem específica
      if (error.message && error.message.includes('line_type')) {
        return res.status(500).json({
          error: 'É necessário executar a migration SQL primeiro. Consulte EXECUTAR-MIGRATION-AGORA.md'
        });
      }

      throw error;
    }

    console.log('✅ Linha criada com sucesso:', data.name);
    res.status(201).json(data);
  } catch (error) {
    console.error('❌ Erro detalhado:', error);
    const message = error.message || 'Erro ao criar linha de produção';
    res.status(500).json({ error: message });
  }
});

// PUT /api/production-lines/:id
router.put('/:id', canWrite, authorize('ADMIN', 'GESTOR'), async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { id } = req.params;
    const updateData = prepareLineData({ ...req.body });

    const { data, error } = await supabase
      .from('production_lines')
      .update(updateData)
      .eq('id', id)
      .eq('company_id', company_id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar linha:', error);

      // Se o erro for sobre coluna não existir, retornar mensagem específica
      if (error.message && error.message.includes('line_type')) {
        return res.status(500).json({
          error: 'É necessário executar a migration SQL primeiro. Consulte EXECUTAR-MIGRATION-AGORA.md'
        });
      }

      return res.status(500).json({ error: error.message || 'Erro ao atualizar' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Linha não encontrada' });
    }

    console.log('✅ Linha atualizada com sucesso:', data.name);
    res.json(data);
  } catch (error) {
    console.error('❌ Erro detalhado:', error);
    res.status(500).json({ error: error.message || 'Erro ao atualizar' });
  }
});

// DELETE /api/production-lines/:id
router.delete('/:id', authorize('ADMIN', 'GESTOR'), async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { id } = req.params;
    const { error } = await supabase
      .from('production_lines')
      .delete()
      .eq('id', id)
      .eq('company_id', company_id);

    if (error) throw error;
    res.json({ message: 'Deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar' });
  }
});

module.exports = router;
