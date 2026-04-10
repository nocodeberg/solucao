'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { StatsCard } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import {
  Users,
  DollarSign,
  Wrench,
  Droplets,
  Download,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency, MONTHS, getYearsList, getMonthName } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ConsumoAgua, LancamentoMO, Manutencao, Employee, ProductionLine } from '@/types/database.types';

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

  // Estados para o modal de lançamentos
  const [isLancamentoModalOpen, setIsLancamentoModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState<'MOD' | 'MOI' | 'Manutencao' | 'Agua'>('MOD');
  const [lancamentosDetalhados, setLancamentosDetalhados] = useState<LancamentoMO[]>([]);
  const [manutencaoDetalhada, setManutencaoDetalhada] = useState<Manutencao[]>([]);
  const [aguaDetalhada, setAguaDetalhada] = useState<ConsumoAgua[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [linhas, setLinhas] = useState<ProductionLine[]>([]);

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
          modTotal += parseFloat(String(item.custo_mensal ?? 0));
        } else {
          moiTotal += parseFloat(String(item.custo_mensal ?? 0));
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
          (sum, item) => sum + parseFloat(String(item.valor ?? 0)),
          0
        ) || 0;

      // Matéria-prima: buscar lançamentos de produtos (product_launches)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: materiaData } = await (supabase.from('product_launches') as any)
        .select('custo_total')
        .eq('company_id', profile.company_id)
        .eq('ano', selectedYear)
        .eq('mes', mes);

      const materiaTotal =
        materiaData?.reduce(
          (sum: number, item: Record<string, unknown>) => sum + parseFloat(String(item.custo_total ?? 0)),
          0
        ) || 0;

      data.push({
        month: monthName,
        MOD: modTotal,
        MOI: moiTotal,
        Manutencao: manutencaoTotal,
        Materia: materiaTotal,
      });
    }

    setChartData(data);
  }, [profile?.company_id, selectedYear, supabase]);

  const loadDashboardData = useCallback(async () => {
    if (!profile?.company_id) return;

    setLoading(true);

    try {
      // Carregar dados de funcionários ativos
      const { count: funcionariosCount, data: employeesData } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('active', true);

      // Carregar linhas de produção
      const { data: linhasData } = await supabase
        .from('production_lines')
        .select('*')
        .eq('company_id', profile.company_id);

      setEmployees(employeesData || []);
      setLinhas(linhasData || []);

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
          custoMOD += parseFloat(String(item.custo_mensal ?? 0));
        } else {
          custoMOI += parseFloat(String(item.custo_mensal ?? 0));
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
          (sum, item) => sum + parseFloat(String(item.valor ?? 0)),
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
          (sum, item) => sum + parseFloat(String(item.valor ?? 0)),
          0
        ) || 0;

      // Matéria prima (produtos consumidos) - buscar de product_launches
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let materiaQuery = (supabase.from('product_launches') as any)
        .select('custo_total')
        .eq('company_id', profile.company_id)
        .eq('ano', selectedYear);

      if (!showTotal && selectedMonths.length > 0) {
        materiaQuery = materiaQuery.in('mes', selectedMonths);
      }

      const { data: materiaData } = await materiaQuery;
      const materiaPrimaTotal =
        materiaData?.reduce(
          (sum: number, item: Record<string, unknown>) => sum + parseFloat(String(item.custo_total ?? 0)),
          0
        ) || 0;

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

  const handleExportExcel = async () => {
    if (!profile?.company_id) return;

    try {
      const wb = XLSX.utils.book_new();
      const periodoLabel = showTotal
        ? `Ano ${selectedYear}`
        : selectedMonths.map(m => getMonthName(m, true)).join(', ') + ` / ${selectedYear}`;

      // === ABA 1: RESUMO ===
      const resumoData = [
        ['RELATÓRIO DASHBOARD - SOLUÇÃO INDUSTRIAL'],
        [`Período: ${periodoLabel}`],
        [`Gerado em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`],
        [],
        ['INDICADOR', 'VALOR (R$)'],
        ['Funcionários Ativos', stats.funcionarios],
        ['Custo M.O.D', stats.custoMOD],
        ['Custo M.O.I', stats.custoMOI],
        ['Matéria Prima', stats.materiaPrima],
        ['Consumo Água', stats.consumoAgua],
        ['Manutenção', stats.manutencao],
        ['Total Operação', stats.totalOperacao],
        ['Total Geral', stats.totalGeral],
      ];
      const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
      wsResumo['!cols'] = [{ wch: 25 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

      // === ABA 2: GRÁFICO MENSAL ===
      const graficoData = [
        ['EVOLUÇÃO MENSAL - ' + selectedYear],
        [],
        ['Mês', 'M.O.D (R$)', 'M.O.I (R$)', 'Manutenção (R$)', 'Matéria Prima (R$)', 'Total (R$)'],
        ...chartData.map(item => [
          item.month,
          item.MOD,
          item.MOI,
          item.Manutencao,
          item.Materia,
          item.MOD + item.MOI + item.Manutencao + item.Materia,
        ]),
        [],
        [
          'TOTAL',
          chartData.reduce((s, i) => s + i.MOD, 0),
          chartData.reduce((s, i) => s + i.MOI, 0),
          chartData.reduce((s, i) => s + i.Manutencao, 0),
          chartData.reduce((s, i) => s + i.Materia, 0),
          chartData.reduce((s, i) => s + i.MOD + i.MOI + i.Manutencao + i.Materia, 0),
        ],
      ];
      const wsGrafico = XLSX.utils.aoa_to_sheet(graficoData);
      wsGrafico['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
      XLSX.utils.book_append_sheet(wb, wsGrafico, 'Evolução Mensal');

      // === ABA 3: M.O.D DETALHADO ===
      const { data: modData } = await supabase
        .from('lancamento_mo')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('tipo', 'MOD')
        .eq('ano', selectedYear)
        .order('mes', { ascending: true })
        .returns<LancamentoMO[]>();

      if (modData && modData.length > 0) {
        const modRows = modData.map(l => {
          const emp = employees.find(e => e.id === l.employee_id);
          const linha = linhas.find(li => li.id === l.production_line_id);
          return [
            emp?.nome || '-',
            linha?.name || '-',
            getMonthName(l.mes, true),
            l.ano,
            parseFloat(String(l.salario_base ?? 0)),
            parseFloat(String(l.horas_trabalhadas ?? 0)),
            parseFloat(String(l.custo_mensal ?? 0)),
            l.observacao || '',
          ];
        });
        const modSheet = [
          ['M.O.D - MÃO DE OBRA DIRETA - ' + selectedYear],
          [],
          ['Funcionário', 'Linha', 'Mês', 'Ano', 'Salário Base (R$)', 'Horas', 'Custo Mensal (R$)', 'Observação'],
          ...modRows,
          [],
          ['', '', '', '', '', 'TOTAL:', modData.reduce((s, l) => s + parseFloat(String(l.custo_mensal ?? 0)), 0), ''],
        ];
        const wsMod = XLSX.utils.aoa_to_sheet(modSheet);
        wsMod['!cols'] = [{ wch: 28 }, { wch: 20 }, { wch: 12 }, { wch: 8 }, { wch: 16 }, { wch: 8 }, { wch: 16 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsMod, 'M.O.D');
      }

      // === ABA 4: M.O.I DETALHADO ===
      const { data: moiData } = await supabase
        .from('lancamento_mo')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('tipo', 'MOI')
        .eq('ano', selectedYear)
        .order('mes', { ascending: true })
        .returns<LancamentoMO[]>();

      if (moiData && moiData.length > 0) {
        const moiRows = moiData.map(l => {
          const emp = employees.find(e => e.id === l.employee_id);
          const linha = linhas.find(li => li.id === l.production_line_id);
          return [
            emp?.nome || '-',
            linha?.name || '-',
            getMonthName(l.mes, true),
            l.ano,
            parseFloat(String(l.salario_base ?? 0)),
            parseFloat(String(l.horas_trabalhadas ?? 0)),
            parseFloat(String(l.custo_mensal ?? 0)),
            l.observacao || '',
          ];
        });
        const moiSheet = [
          ['M.O.I - MÃO DE OBRA INDIRETA - ' + selectedYear],
          [],
          ['Funcionário', 'Linha', 'Mês', 'Ano', 'Salário Base (R$)', 'Horas', 'Custo Mensal (R$)', 'Observação'],
          ...moiRows,
          [],
          ['', '', '', '', '', 'TOTAL:', moiData.reduce((s, l) => s + parseFloat(String(l.custo_mensal ?? 0)), 0), ''],
        ];
        const wsMoi = XLSX.utils.aoa_to_sheet(moiSheet);
        wsMoi['!cols'] = [{ wch: 28 }, { wch: 20 }, { wch: 12 }, { wch: 8 }, { wch: 16 }, { wch: 8 }, { wch: 16 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, wsMoi, 'M.O.I');
      }

      // === ABA 5: MANUTENÇÃO ===
      const { data: manutData } = await supabase
        .from('manutencao')
        .select('*')
        .eq('company_id', profile.company_id)
        .gte('data', `${selectedYear}-01-01`)
        .lte('data', `${selectedYear}-12-31`)
        .order('data', { ascending: true })
        .returns<Manutencao[]>();

      if (manutData && manutData.length > 0) {
        const manutRows = manutData.map(m => [
          new Date(m.data).toLocaleDateString('pt-BR'),
          m.descricao || '-',
          m.observacao || '-',
          parseFloat(String(m.valor ?? 0)),
        ]);
        const manutSheet = [
          ['MANUTENÇÃO - ' + selectedYear],
          [],
          ['Data', 'Descrição', 'Observação', 'Valor (R$)'],
          ...manutRows,
          [],
          ['', '', 'TOTAL:', manutData.reduce((s, m) => s + parseFloat(String(m.valor ?? 0)), 0)],
        ];
        const wsManut = XLSX.utils.aoa_to_sheet(manutSheet);
        wsManut['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 25 }, { wch: 16 }];
        XLSX.utils.book_append_sheet(wb, wsManut, 'Manutenção');
      }

      // === ABA 6: CONSUMO ÁGUA ===
      const { data: aguaData } = await supabase
        .from('consumo_agua')
        .select('*')
        .eq('company_id', profile.company_id)
        .gte('data', `${selectedYear}-01-01`)
        .lte('data', `${selectedYear}-12-31`)
        .order('data', { ascending: true })
        .returns<ConsumoAgua[]>();

      if (aguaData && aguaData.length > 0) {
        const aguaRows = aguaData.map(a => [
          new Date(a.data).toLocaleDateString('pt-BR'),
          a.descricao || '-',
          a.observacao || '-',
          parseFloat(String(a.valor ?? 0)),
        ]);
        const aguaSheet = [
          ['CONSUMO DE ÁGUA - ' + selectedYear],
          [],
          ['Data', 'Descrição', 'Observação', 'Valor (R$)'],
          ...aguaRows,
          [],
          ['', '', 'TOTAL:', aguaData.reduce((s, a) => s + parseFloat(String(a.valor ?? 0)), 0)],
        ];
        const wsAgua = XLSX.utils.aoa_to_sheet(aguaSheet);
        wsAgua['!cols'] = [{ wch: 14 }, { wch: 30 }, { wch: 25 }, { wch: 16 }];
        XLSX.utils.book_append_sheet(wb, wsAgua, 'Consumo Água');
      }

      // Gerar e baixar arquivo
      const fileName = `Relatorio_Dashboard_${selectedYear}${showTotal ? '_Anual' : '_' + selectedMonths.map(m => getMonthName(m)).join('-')}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório');
    }
  };

  const handleOpenLancamentos = async (tipo: 'MOD' | 'MOI' | 'Manutencao' | 'Agua') => {
    if (!profile?.company_id) return;

    setModalTipo(tipo);
    setIsLancamentoModalOpen(true);

    try {
      if (tipo === 'MOD' || tipo === 'MOI') {
        // Buscar lançamentos de MO
        let query = supabase
          .from('lancamento_mo')
          .select('*')
          .eq('company_id', profile.company_id)
          .eq('tipo', tipo)
          .eq('ano', selectedYear);

        if (!showTotal && selectedMonths.length > 0) {
          query = query.in('mes', selectedMonths);
        }

        const { data } = await query.order('mes', { ascending: true });
        setLancamentosDetalhados(data || []);
      } else if (tipo === 'Manutencao') {
        // Buscar manutenções
        let query = supabase
          .from('manutencao')
          .select('*')
          .eq('company_id', profile.company_id);

        if (!showTotal && selectedMonths.length > 0) {
          const startDate = `${selectedYear}-${String(Math.min(...selectedMonths)).padStart(2, '0')}-01`;
          const endMonth = Math.max(...selectedMonths);
          const endDate = `${selectedYear}-${String(endMonth).padStart(2, '0')}-31`;
          query = query.gte('data', startDate).lte('data', endDate);
        } else {
          query = query.gte('data', `${selectedYear}-01-01`).lte('data', `${selectedYear}-12-31`);
        }

        const { data } = await query.order('data', { ascending: false });
        setManutencaoDetalhada(data || []);
      } else if (tipo === 'Agua') {
        // Buscar consumo de água
        let query = supabase
          .from('consumo_agua')
          .select('*')
          .eq('company_id', profile.company_id);

        if (!showTotal && selectedMonths.length > 0) {
          const startDate = `${selectedYear}-${String(Math.min(...selectedMonths)).padStart(2, '0')}-01`;
          const endMonth = Math.max(...selectedMonths);
          const endDate = `${selectedYear}-${String(endMonth).padStart(2, '0')}-31`;
          query = query.gte('data', startDate).lte('data', endDate);
        } else {
          query = query.gte('data', `${selectedYear}-01-01`).lte('data', `${selectedYear}-12-31`);
        }

        const { data } = await query.order('data', { ascending: false });
        setAguaDetalhada(data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      alert('Erro ao carregar detalhes dos lançamentos');
    }
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
          onClick={() => handleOpenLancamentos('MOD')}
        />
        <StatsCard
          title="Custo M.O.I"
          value={formatCurrency(stats.custoMOI)}
          icon={<DollarSign className="w-6 h-6" />}
          color="blue"
          onClick={() => handleOpenLancamentos('MOI')}
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
          onClick={() => handleOpenLancamentos('Agua')}
        />
        <StatsCard
          title="Manutenção"
          value={formatCurrency(stats.manutencao)}
          icon={<Wrench className="w-6 h-6" />}
          color="purple"
          onClick={() => handleOpenLancamentos('Manutencao')}
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

      {/* Modal de Detalhes dos Lançamentos */}
      <Modal
        isOpen={isLancamentoModalOpen}
        onClose={() => setIsLancamentoModalOpen(false)}
        title={`Detalhes - ${
          modalTipo === 'MOD' ? 'M.O.D'
          : modalTipo === 'MOI' ? 'M.O.I'
          : modalTipo === 'Manutencao' ? 'Manutenção'
          : 'Consumo de Água'
        }`}
        description={`${showTotal ? 'Ano completo' : selectedMonths.map(m => MONTHS.find(mon => mon.value === m)?.label).join(', ')} de ${selectedYear}`}
        size="xl"
      >
        <div className="space-y-4">
          {(modalTipo === 'MOD' || modalTipo === 'MOI') && (
            <>
              {lancamentosDetalhados.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum lançamento encontrado</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Funcionário
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Linha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Período
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Salário Base
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Custo Mensal
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Observação
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {lancamentosDetalhados.map((lanc) => {
                        const emp = employees.find((e) => e.id === lanc.employee_id);
                        const linha = linhas.find((l) => l.id === lanc.production_line_id);
                        const mes = MONTHS.find((m) => m.value === lanc.mes);

                        return (
                          <tr key={lanc.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {emp?.nome || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {linha?.name || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {mes?.fullLabel || ''} / {lanc.ano}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                              {formatCurrency(parseFloat(String(lanc.salario_base ?? 0)))}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right font-bold">
                              {formatCurrency(parseFloat(String(lanc.custo_mensal ?? 0)))}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {lanc.observacao || '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                          Total:
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-primary-600 text-right">
                          {formatCurrency(
                            lancamentosDetalhados.reduce(
                              (sum, l) => sum + parseFloat(String(l.custo_mensal ?? 0)),
                              0
                            )
                          )}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </>
          )}

          {modalTipo === 'Manutencao' && (
            <>
              {manutencaoDetalhada.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhuma manutenção encontrada</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descrição
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Observação
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {manutencaoDetalhada.map((manut) => (
                        <tr key={manut.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(manut.data).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {manut.descricao || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {manut.observacao || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right font-bold">
                            {formatCurrency(parseFloat(String(manut.valor ?? 0)))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                          Total:
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-primary-600 text-right">
                          {formatCurrency(
                            manutencaoDetalhada.reduce(
                              (sum, m) => sum + parseFloat(String(m.valor ?? 0)),
                              0
                            )
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </>
          )}

          {modalTipo === 'Agua' && (
            <>
              {aguaDetalhada.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Nenhum consumo de água encontrado</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descrição
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Observação
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {aguaDetalhada.map((agua) => (
                        <tr key={agua.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(agua.data).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {agua.descricao || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {agua.observacao || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right font-bold">
                            {formatCurrency(parseFloat(String(agua.valor ?? 0)))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                          Total:
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-primary-600 text-right">
                          {formatCurrency(
                            aguaDetalhada.reduce(
                              (sum, a) => sum + parseFloat(String(a.valor ?? 0)),
                              0
                            )
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </MainLayout>
  );
}
