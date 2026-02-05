const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, canWrite, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { data } = await supabase.from('consumo_agua').select('*').eq('company_id', company_id).order('data', { ascending: false });
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar consumo de água' });
  }
});

router.post('/', canWrite, authorize('ADMIN', 'GESTOR', 'OPERADOR'), async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { data } = await supabase.from('consumo_agua').insert({ ...req.body, company_id, created_by: req.user.id }).select().single();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar lançamento' });
  }
});

module.exports = router;
