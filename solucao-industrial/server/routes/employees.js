const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, authorize, canWrite } = require('../middleware/auth');
const { z } = require('zod');

// Todas as rotas precisam de autenticação
router.use(authenticate);

// Schema de validação
const employeeSchema = z.object({
  full_name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional(),
  cpf: z.string().optional(),
  salary: z.number().min(0, 'Salário não pode ser negativo'),
  cargo_id: z.string().uuid().optional(),
  admission_date: z.string().optional(),
  active: z.boolean().optional()
});

/**
 * GET /api/employees
 * Listar funcionários
 */
router.get('/', async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { active, cargo_id, search } = req.query;

    let query = supabase
      .from('employees')
      .select('*, cargo:cargos(name)')
      .eq('company_id', company_id)
      .order('full_name');

    // Filtros
    if (active !== undefined) {
      query = query.eq('active', active === 'true');
    }

    if (cargo_id) {
      query = query.eq('cargo_id', cargo_id);
    }

    if (search) {
      // Proteção contra SQL injection: usar métodos do Supabase
      query = query.ilike('full_name', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calcular custo do último mês para cada funcionário
    const employeesWithCost = await Promise.all(
      data.map(async (emp) => {
        const { data: lastMO } = await supabase
          .from('lancamento_mo')
          .select('custo_mensal')
          .eq('employee_id', emp.id)
          .order('data_lancamento', { ascending: false })
          .limit(1)
          .single();

        return {
          ...emp,
          ultimo_custo: lastMO?.custo_mensal || null
        };
      })
    );

    res.json(employeesWithCost);
  } catch (error) {
    console.error('List employees error:', error);
    res.status(500).json({ error: 'Erro ao listar funcionários' });
  }
});

/**
 * GET /api/employees/:id
 * Obter funcionário por ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { id } = req.params;

    // Validar UUID
    if (!z.string().uuid().safeParse(id).success) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const { data, error } = await supabase
      .from('employees')
      .select('*, cargo:cargos(name)')
      .eq('id', id)
      .eq('company_id', company_id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    res.json(data);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: 'Erro ao buscar funcionário' });
  }
});

/**
 * POST /api/employees
 * Criar funcionário
 */
router.post('/', canWrite, authorize('ADMIN', 'RH', 'GESTOR'), async (req, res) => {
  try {
    const { company_id } = req.profile;

    // Validar dados
    const employeeData = employeeSchema.parse(req.body);

    // Prevenir SQL injection: usar prepared statements do Supabase
    const { data, error } = await supabase
      .from('employees')
      .insert({
        ...employeeData,
        company_id
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }

    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Erro ao criar funcionário' });
  }
});

/**
 * PUT /api/employees/:id
 * Atualizar funcionário
 */
router.put('/:id', canWrite, authorize('ADMIN', 'RH', 'GESTOR'), async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { id } = req.params;

    // Validar UUID
    if (!z.string().uuid().safeParse(id).success) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Validar dados
    const employeeData = employeeSchema.partial().parse(req.body);

    const { data, error } = await supabase
      .from('employees')
      .update(employeeData)
      .eq('id', id)
      .eq('company_id', company_id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Funcionário não encontrado' });
    }

    res.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors
      });
    }

    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Erro ao atualizar funcionário' });
  }
});

/**
 * DELETE /api/employees/:id
 * Deletar funcionário (soft delete)
 */
router.delete('/:id', authorize('ADMIN', 'RH', 'GESTOR'), async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { id } = req.params;

    // Validar UUID
    if (!z.string().uuid().safeParse(id).success) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Soft delete
    const { error } = await supabase
      .from('employees')
      .update({ active: false })
      .eq('id', id)
      .eq('company_id', company_id);

    if (error) throw error;

    res.json({ message: 'Funcionário desativado com sucesso' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Erro ao deletar funcionário' });
  }
});

module.exports = router;
