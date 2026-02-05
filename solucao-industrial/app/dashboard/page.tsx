'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { StatsCard } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  Users,
  DollarSign,
  Wrench,
  Droplets,
  Download,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, MONTHS, getYearsList } from '@/lib/utils';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ConsumoAgua, LancamentoMO, Manutencao } from '@/types/database.types';

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

type DashboardTab = 'MOD' | 'MOI' | 'Manutencao' | 'Materia';

type ChartDataItem = {
  month: string;
  MOD: number;
  MOI: number;
  Manutencao: number;
  Materia: number;
};

type MoRowWithMonth = Pick<LancamentoMO, 'tipo' | 'custo_mensal' | 'mes'>;
type MoRow = Pick<LancamentoMO, 'tipo' | 'custo_mensal'>;
type ManutencaoRow = Pick<Manutencao, 'valor' | 'data'>;
type ManutencaoValueRow = Pick<Manutencao, 'valor'>;
type AguaRow = Pick<ConsumoAgua, 'valor' | 'data'>;

export default function DashboardPage() {
  const { profile } = useAuth();
  const supabase = useMemo(() => createSupabaseClient(), []);

  const [selectedMonths, setSelectedMonths] = useState<number[]>([currentMonth]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showTotal, setShowTotal] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('MOD');

  const [stats, setStats] = useState({
    funcionarios: 0,
    custoMOD: 0,
    custoMOI: 0,
    materiaPrima: 0,
    consumoAgua: 0,
    manutencao: 0,
    totalOperacao: 0,
    totalGeral: 0,
  });

  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChartData = useCallback(async () => {
    if (!profile?.company_id) return;

    const data: ChartDataItem[] = [];

    for (let mes = 1; mes <= 12; mes++) {
      const monthName = MONTHS.find((m) => m.value === mes)?.label || '';

      const { data: moData } = await supabase
        .from('lancamento_mo')
        .select('tipo, custo_mensal')
        .eq('company_id', profile.company_id)
        .eq('ano', selectedYear)
        .eq('mes', mes)
        .returns<MoRow[]>();

      let modTotal = 0;
      let moiTotal = 0;

      moData?.forEach((item) => {
        if (item.tipo === 'MOD') {
          modTotal += parseFloat(item.custo_mensal.toString());
        } else {
          moiTotal += parseFloat(item.custo_mensal.toString());
        }
      });

      const { data: manutencaoData } = await supabase
        .from('manutencao')
        .select('valor')
        .eq('company_id', profile.company_id)
        .gte('data', `${selectedYear}-${String(mes).padStart(2, '0')}-01`)
        .lte('data', `${selectedYear}-${String(mes).padStart(2, '0')}-31`)
        .returns<ManutencaoValueRow[]>();

      const manutencaoTotal =
        manutencaoData?.reduce(
          (sum, item) => sum + parseFloat(item.valor.toString()),
          0
        ) || 0;

      data.push({
        month: monthName,
        MOD: modTotal,
        MOI: moiTotal,
        Manutencao: manutencaoTotal,
        Materia: 0,
      });
    }

    setChartData(data);
  }, [profile?.company_id, selectedYear, supabase]);

  const loadDashboardData = useCallback(async () => {
    if (!profile?.company_id) return;

    setLoading(true);

    try {
      // Carregar dados de funcionários ativos
      const { count: funcionariosCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)
        .eq('active', true);

      // Carregar lançamentos de MO no período
      let moQuery = supabase
        .from('lancamento_mo')
        .select('tipo, custo_mensal, mes')
        .eq('company_id', profile.company_id)
        .eq('ano', selectedYear);

      if (!showTotal && selectedMonths.length > 0) {
        moQuery = moQuery.in('mes', selectedMonths);
      }

      const { data: moData } = await moQuery.returns<MoRowWithMonth[]>();

      // Calcular custos MOD e MOI
      let custoMOD = 0;
      let custoMOI = 0;

      moData?.forEach((item) => {
        if (item.tipo === 'MOD') {
          custoMOD += parseFloat(item.custo_mensal.toString());
        } else {
          custoMOI += parseFloat(item.custo_mensal.toString());
        }
      });

      // Carregar manutenção
      let manutencaoQuery = supabase
        .from('manutencao')
        .select('valor, data')
        .eq('company_id', profile.company_id);

      if (!showTotal && selectedMonths.length > 0) {
        const startDate = `${selectedYear}-${String(Math.min(...selectedMonths)).padStart(2, '0')}-01`;
        const endMonth = Math.max(...selectedMonths);
        const endDate = `${selectedYear}-${String(endMonth).padStart(2, '0')}-31`;
        manutencaoQuery = manutencaoQuery.gte('data', startDate).lte('data', endDate);
      } else {
        manutencaoQuery = manutencaoQuery.gte('data', `${selectedYear}-01-01`).lte('data', `${selectedYear}-12-31`);
      }

      const { data: manutencaoData } = await manutencaoQuery.returns<ManutencaoRow[]>();
      const manutencaoTotal =
        manutencaoData?.reduce(
          (sum, item) => sum + parseFloat(item.valor.toString()),
          0
        ) || 0;

      // Carregar consumo de água
      let aguaQuery = supabase
        .from('consumo_agua')
        .select('valor, data')
        .eq('company_id', profile.company_id);

      if (!showTotal && selectedMonths.length > 0) {
        const startDate = `${selectedYear}-${String(Math.min(...selectedMonths)).padStart(2, '0')}-01`;
        const endMonth = Math.max(...selectedMonths);
        const endDate = `${selectedYear}-${String(endMonth).padStart(2, '0')}-31`;
        aguaQuery = aguaQuery.gte('data', startDate).lte('data', endDate);
      } else {
        aguaQuery = aguaQuery.gte('data', `${selectedYear}-01-01`).lte('data', `${selectedYear}-12-31`);
      }

      const { data: aguaData } = await aguaQuery.returns<AguaRow[]>();
      const aguaTotal =
        aguaData?.reduce(
          (sum, item) => sum + parseFloat(item.valor.toString()),
          0
        ) || 0;

      // Matéria prima (produtos consumidos)
      // TODO: Implementar quando houver lançamento de consumo de produtos
      const materiaPrimaTotal = 0;

      const totalOperacao = custoMOD + custoMOI + materiaPrimaTotal + aguaTotal;
      const totalGeral = totalOperacao + manutencaoTotal;

      setStats({
        funcionarios: funcionariosCount || 0,
        custoMOD,
        custoMOI,
        materiaPrima: materiaPrimaTotal,
        consumoAgua: aguaTotal,
        manutencao: manutencaoTotal,
        totalOperacao,
        totalGeral,
      });

      // Gerar dados do gráfico mensal
      await loadChartData();
    } catch (error: unknown) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [loadChartData, profile?.company_id, selectedMonths, selectedYear, showTotal, supabase]);

  useEffect(() => {
    if (profile?.company_id) {
      void loadDashboardData();
    }
  }, [loadDashboardData, profile?.company_id]);

  const toggleMonth = (month: number) => {
    setShowTotal(false);
    setSelectedMonths((prev) =>
      prev.includes(month)
        ? prev.filter((m) => m !== month)
        : [...prev, month].sort((a, b) => a - b)
    );
  };

  const handleTotalClick = () => {
    setShowTotal(true);
    setSelectedMonths([]);
  };

  const getTotalForActiveTab = () => {
    return chartData.reduce((sum, item) => sum + (item[activeTab] || 0), 0);
  };

  const handleExportExcel = () => {
    alert('Funcionalidade de exportação será implementada');
  };

  return (
    <MainLayout title="Dashboard">
      {loading && (
        <div className="mb-6">
          <p className="text-gray-600">Carregando...</p>
        </div>
      )}
      {/* Filtros de Período */}
      <div className="mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          {MONTHS.map((month) => (
            <button
              key={month.value}
              onClick={() => toggleMonth(month.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedMonths.includes(month.value) && !showTotal
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {month.label}/{selectedYear}
            </button>
          ))}
          <button
            onClick={handleTotalClick}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showTotal
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Total
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {getYearsList(selectedYear - 5, selectedYear + 2).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <Button variant="primary" icon={<Download className="w-4 h-4" />} onClick={handleExportExcel}>
            Gerar Relatório
          </Button>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Funcionários"
          value={stats.funcionarios}
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        <StatsCard
          title="Custo M.O.D"
          value={formatCurrency(stats.custoMOD)}
          icon={<DollarSign className="w-6 h-6" />}
          color="purple"
        />
        <StatsCard
          title="Custo M.O.I"
          value={formatCurrency(stats.custoMOI)}
          icon={<DollarSign className="w-6 h-6" />}
          color="blue"
        />
        <StatsCard
          title="Matéria prima"
          value={formatCurrency(stats.materiaPrima)}
          icon={<DollarSign className="w-6 h-6" />}
          color="gray"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Consumo água"
          value={formatCurrency(stats.consumoAgua)}
          icon={<Droplets className="w-6 h-6" />}
          color="blue"
        />
        <StatsCard
          title="Manutenção"
          value={formatCurrency(stats.manutencao)}
          icon={<Wrench className="w-6 h-6" />}
          color="purple"
        />
        <StatsCard
          title="Total operação"
          value={formatCurrency(stats.totalOperacao)}
          icon={<DollarSign className="w-6 h-6" />}
          color="orange"
        />
        <StatsCard
          title="Total de geral"
          value={formatCurrency(stats.totalGeral)}
          icon={<DollarSign className="w-6 h-6" />}
          color="orange"
        />
      </div>

      {/* Abas e Gráfico */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('MOD')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'MOD'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custo M.O.D
            </button>
            <button
              onClick={() => setActiveTab('MOI')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'MOI'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custo M.O.I
            </button>
            <button
              onClick={() => setActiveTab('Manutencao')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'Manutencao'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Manutenção
            </button>
            <button
              onClick={() => setActiveTab('Materia')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'Materia'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Matéria prima
            </button>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-3xl font-bold text-primary-600">
              {formatCurrency(getTotalForActiveTab())}
            </p>
          </div>
        </div>

        {/* Gráfico de Linha */}
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
              <Tooltip
                formatter={(value: unknown) =>
                  typeof value === 'number' || typeof value === 'string'
                    ? formatCurrency(value)
                    : formatCurrency(0)}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Line
                type="monotone"
                dataKey={activeTab}
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ fill: '#6366f1', r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </MainLayout>
  );
}
