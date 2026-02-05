const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, authorize, canWrite } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { data } = await supabase.from('encargos').select('*').eq('company_id', company_id).order('name');
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar encargos' });
  }
});

router.post('/', canWrite, authorize('ADMIN'), async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { data } = await supabase.from('encargos').insert({ ...req.body, company_id }).select().single();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar encargo' });
  }
});

router.put('/:id', canWrite, authorize('ADMIN'), async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { id } = req.params;
    const { data } = await supabase.from('encargos').update(req.body).eq('id', id).eq('company_id', company_id).select().single();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar encargo' });
  }
});

router.delete('/:id', authorize('ADMIN'), async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { id } = req.params;
    await supabase.from('encargos').delete().eq('id', id).eq('company_id', company_id);
    res.json({ message: 'Deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar encargo' });
  }
});

module.exports = router;
