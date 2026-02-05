const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, authorize, canWrite } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { data } = await supabase.from('cargos').select('*').eq('company_id', company_id).order('name');
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar cargos' });
  }
});

router.post('/', canWrite, authorize('ADMIN', 'RH'), async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { data } = await supabase.from('cargos').insert({ ...req.body, company_id }).select().single();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar cargo' });
  }
});

router.put('/:id', canWrite, authorize('ADMIN', 'RH'), async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { id } = req.params;
    const { data } = await supabase.from('cargos').update(req.body).eq('id', id).eq('company_id', company_id).select().single();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar cargo' });
  }
});

router.delete('/:id', authorize('ADMIN', 'RH'), async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { id } = req.params;
    await supabase.from('cargos').delete().eq('id', id).eq('company_id', company_id);
    res.json({ message: 'Deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar cargo' });
  }
});

module.exports = router;
