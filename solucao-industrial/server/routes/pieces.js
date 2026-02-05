const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, canWrite, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { data } = await supabase.from('pieces').select('*, group:groups(name)').eq('company_id', company_id).order('id');
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar peças' });
  }
});

router.post('/', canWrite, authorize('ADMIN', 'GESTOR'), async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { data } = await supabase.from('pieces').insert({ ...req.body, company_id }).select().single();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar peça' });
  }
});

module.exports = router;
