const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, canWrite, authorize } = require('../middleware/auth');

router.use(authenticate);

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', company_id)
      .order('name');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// POST /api/products
router.post('/', canWrite, authorize('ADMIN', 'GESTOR'), async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { data, error } = await supabase
      .from('products')
      .insert({ ...req.body, company_id })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
});

// PUT /api/products/:id
router.put('/:id', canWrite, authorize('ADMIN', 'GESTOR'), async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { id } = req.params;
    const { data, error } = await supabase
      .from('products')
      .update(req.body)
      .eq('id', id)
      .eq('company_id', company_id)
      .select()
      .single();

    if (error || !data) return res.status(404).json({ error: 'Não encontrado' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', authorize('ADMIN', 'GESTOR'), async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { id } = req.params;
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('company_id', company_id);

    if (error) throw error;
    res.json({ message: 'Produto deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar produto' });
  }
});

module.exports = router;
