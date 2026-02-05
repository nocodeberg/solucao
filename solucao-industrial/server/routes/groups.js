const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, canWrite, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { data } = await supabase.from('groups').select('*').eq('company_id', company_id).order('name');
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar grupos' });
  }
});

router.post('/', canWrite, authorize('ADMIN', 'GESTOR'), async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { data } = await supabase.from('groups').insert({ ...req.body, company_id }).select().single();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar grupo' });
  }
});

router.put('/:id', canWrite, authorize('ADMIN', 'GESTOR'), async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { id } = req.params;
    const { data } = await supabase.from('groups').update(req.body).eq('id', id).eq('company_id', company_id).select().single();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar grupo' });
  }
});

router.delete('/:id', authorize('ADMIN', 'GESTOR'), async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { id } = req.params;
    await supabase.from('groups').delete().eq('id', id).eq('company_id', company_id);
    res.json({ message: 'Deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar grupo' });
  }
});

module.exports = router;
