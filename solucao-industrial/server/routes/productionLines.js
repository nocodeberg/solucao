const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, canWrite, authorize } = require('../middleware/auth');

router.use(authenticate);

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
    const { data, error } = await supabase
      .from('production_lines')
      .insert({ ...req.body, company_id })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar linha de produção' });
  }
});

// PUT /api/production-lines/:id
router.put('/:id', canWrite, authorize('ADMIN', 'GESTOR'), async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { id } = req.params;
    const { data, error } = await supabase
      .from('production_lines')
      .update(req.body)
      .eq('id', id)
      .eq('company_id', company_id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: 'Não encontrado' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar' });
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
