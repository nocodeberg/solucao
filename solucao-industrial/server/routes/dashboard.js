const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// Todas as rotas precisam de autenticação
router.use(authenticate);

/**
 * GET /api/dashboard/stats
 * Obter estatísticas do dashboard
 */
router.get('/stats', async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { ano, mes, showTotal } = req.query;

    // Proteção contra SQL injection: validar parâmetros
    const year = parseInt(ano) || new Date().getFullYear();
    const month = mes ? parseInt(mes) : null;

    if (year < 2020 || year > 2100) {
      return res.status(400).json({ error: 'Ano inválido' });
    }

    if (month && (month < 1 || month > 12)) {
      return res.status(400).json({ error: 'Mês inválido' });
    }

    // Funcionários ativos
    const { count: funcionariosCount } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company_id)
      .eq('active', true);

    // Lançamentos de MO
    let moQuery = supabase
      .from('lancamento_mo')
      .select('tipo, custo_mensal')
      .eq('company_id', company_id)
      .eq('ano', year);

    if (!showTotal && month) {
      moQuery = moQuery.eq('mes', month);
    }

    const { data: moData } = await moQuery;

    let custoMOD = 0;
    let custoMOI = 0;

    moData?.forEach((item) => {
      if (item.tipo === 'MOD') {
        custoMOD += parseFloat(item.custo_mensal);
      } else {
        custoMOI += parseFloat(item.custo_mensal);
      }
    });

    // Manutenção
    let manutencaoQuery = supabase
      .from('manutencao')
      .select('valor')
      .eq('company_id', company_id);

    if (!showTotal && month) {
      manutencaoQuery = manutencaoQuery
        .gte('data', `${year}-${String(month).padStart(2, '0')}-01`)
        .lte('data', `${year}-${String(month).padStart(2, '0')}-31`);
    } else {
      manutencaoQuery = manutencaoQuery
        .gte('data', `${year}-01-01`)
        .lte('data', `${year}-12-31`);
    }

    const { data: manutencaoData } = await manutencaoQuery;
    const manutencaoTotal = manutencaoData?.reduce((sum, item) => sum + parseFloat(item.valor), 0) || 0;

    // Consumo de água
    let aguaQuery = supabase
      .from('consumo_agua')
      .select('valor')
      .eq('company_id', company_id);

    if (!showTotal && month) {
      aguaQuery = aguaQuery
        .gte('data', `${year}-${String(month).padStart(2, '0')}-01`)
        .lte('data', `${year}-${String(month).padStart(2, '0')}-31`);
    } else {
      aguaQuery = aguaQuery
        .gte('data', `${year}-01-01`)
        .lte('data', `${year}-12-31`);
    }

    const { data: aguaData } = await aguaQuery;
    const aguaTotal = aguaData?.reduce((sum, item) => sum + parseFloat(item.valor), 0) || 0;

    const materiaPrimaTotal = 0; // TODO

    const totalOperacao = custoMOD + custoMOI + materiaPrimaTotal + aguaTotal;
    const totalGeral = totalOperacao + manutencaoTotal;

    res.json({
      funcionarios: funcionariosCount || 0,
      custoMOD,
      custoMOI,
      materiaPrima: materiaPrimaTotal,
      consumoAgua: aguaTotal,
      manutencao: manutencaoTotal,
      totalOperacao,
      totalGeral
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

/**
 * GET /api/dashboard/chart-data
 * Obter dados para o gráfico
 */
router.get('/chart-data', async (req, res) => {
  try {
    const { company_id } = req.profile;
    const { ano } = req.query;
    const year = parseInt(ano) || new Date().getFullYear();

    const chartData = [];
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    for (let mes = 1; mes <= 12; mes++) {
      // MO do mês
      const { data: moData } = await supabase
        .from('lancamento_mo')
        .select('tipo, custo_mensal')
        .eq('company_id', company_id)
        .eq('ano', year)
        .eq('mes', mes);

      let modTotal = 0;
      let moiTotal = 0;

      moData?.forEach((item) => {
        if (item.tipo === 'MOD') {
          modTotal += parseFloat(item.custo_mensal);
        } else {
          moiTotal += parseFloat(item.custo_mensal);
        }
      });

      // Manutenção do mês
      const { data: manutencaoData } = await supabase
        .from('manutencao')
        .select('valor')
        .eq('company_id', company_id)
        .gte('data', `${year}-${String(mes).padStart(2, '0')}-01`)
        .lte('data', `${year}-${String(mes).padStart(2, '0')}-31`);

      const manutencaoTotal = manutencaoData?.reduce((sum, item) => sum + parseFloat(item.valor), 0) || 0;

      chartData.push({
        month: monthNames[mes - 1],
        MOD: modTotal,
        MOI: moiTotal,
        Manutencao: manutencaoTotal,
        Materia: 0
      });
    }

    res.json(chartData);
  } catch (error) {
    console.error('Chart data error:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do gráfico' });
  }
});

module.exports = router;
