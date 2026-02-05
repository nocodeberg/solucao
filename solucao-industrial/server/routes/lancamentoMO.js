const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, canWrite, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { data } = await supabase.from('lancamento_mo').select('*, employee:employees(full_name), production_line:production_lines(name)').eq('company_id', company_id).order('data_lancamento', { ascending: false });
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar lançamentos' });
  }
});

router.post('/', canWrite, authorize('ADMIN', 'RH', 'GESTOR', 'OPERADOR'), async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { data } = await supabase.from('lancamento_mo').insert({ ...req.body, company_id, created_by: req.user.id }).select().single();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar lançamento' });
  }
});

module.exports = router;
