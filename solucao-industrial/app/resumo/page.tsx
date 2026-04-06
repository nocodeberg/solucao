'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { StatsCard } from '@/components/ui/Card';
import {
  Users,
  DollarSign,
  Wrench,
  Factory,
  FileText,
  Zap,
  Receipt,
  Truck,
  TrendingDown,
  Clock,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency, MONTHS, getYearsList } from '@/lib/utils';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const HORAS_TRABALHADAS = 220;

type MoRow = { tipo: string; custo_mensal: number; mes: number; production_line_id: string };
type ValorDateRow = { valor: number; data: string };
type ValorMesRow = { valor: number; mes: number };
type ProductLaunchRow = { custo_total: number; mes: number; production_line_id: string };
type InvRow = { valor_mensal: number; production_line_id: string | null };

type ResumoData = {
  totalFuncionarios: number;
  totalLinhas: number;
  totalGrupos: number;
  totalMOD: number;
  totalMOI: number;
  totalManutencao: number;
  totalAgua: number;
  totalProdutosLancados: number;
  totalCustosVariaveis: number;
  totalOutrosCustos: number;
  totalTransporte: number;
  totalInvestimentos: number;
  totalGeral: number;
  custoHoraPorLinha: { nome: string; custoTotal: number; custoHora: number }[];
  chartData: {
    mes: string;
    ProdQuimico: number;
    MOD: number;
    MOI: number;
    CustosVar: number;
    OutrosCustos: number;
    Transporte: number;
    Manutencao: number;
    Investimentos: number;
  }[];
};

export default function ResumoPage() {
  const { profile } = useAuth();
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<ResumoData>({
    totalFuncionarios: 0, totalLinhas: 0, totalGrupos: 0,
    totalMOD: 0, totalMOI: 0, totalManutencao: 0, totalAgua: 0,
    totalProdutosLancados: 0, totalCustosVariaveis: 0, totalOutrosCustos: 0,
    totalTransporte: 0, totalInvestimentos: 0, totalGeral: 0,
    custoHoraPorLinha: [], chartData: [],
  });
  const [loading, setLoading] = useState(true);

  const loadResumo = useCallback(async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    try {
      const cid = profile.company_id;

      // Contadores
      const { count: funcionariosCount } = await supabase.from('employees').select('*', { count: 'exact', head: true }).eq('company_id', cid).eq('active', true);
      const { count: linhasCount } = await supabase.from('production_lines').select('*', { count: 'exact', head: true }).eq('company_id', cid).eq('active', true);
      const { count: gruposCount } = await supabase.from('groups').select('*', { count: 'exact', head: true }).eq('company_id', cid);

      // Linhas
      const { data: linhas } = await supabase.from('production_lines').select('id, name').eq('company_id', cid).eq('active', true) as { data: any[] | null };

      // M.O. do ano
      const { data: moData } = await supabase.from('lancamento_mo').select('tipo, custo_mensal, mes, production_line_id').eq('company_id', cid).eq('ano', selectedYear).returns<MoRow[]>();
      let totalMOD = 0, totalMOI = 0;
      moData?.forEach((i) => { if (i.tipo === 'MOD') totalMOD += parseFloat(String(i.custo_mensal ?? 0)); else totalMOI += parseFloat(String(i.custo_mensal ?? 0)); });

      // Manutenção do ano
      const { data: manutData } = await supabase.from('manutencao').select('valor, data').eq('company_id', cid).gte('data', `${selectedYear}-01-01`).lte('data', `${selectedYear}-12-31`).returns<ValorDateRow[]>();
      const totalManutencao = manutData?.reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0) || 0;

      // Água do ano
      const { data: aguaData } = await supabase.from('consumo_agua').select('valor, data').eq('company_id', cid).gte('data', `${selectedYear}-01-01`).lte('data', `${selectedYear}-12-31`).returns<ValorDateRow[]>();
      const totalAgua = aguaData?.reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0) || 0;

      // Produtos lançados do ano
      const { data: launchData } = await supabase.from('product_launches').select('custo_total, mes, production_line_id').eq('company_id', cid).eq('ano', selectedYear).returns<ProductLaunchRow[]>();
      const totalProdutosLancados = launchData?.reduce((s, i) => s + parseFloat(String(i.custo_total ?? 0)), 0) || 0;

      // Custos variáveis do ano (energia + telefone)
      const { data: cvData } = await supabase.from('custos_variaveis').select('valor, data').eq('company_id', cid).gte('data', `${selectedYear}-01-01`).lte('data', `${selectedYear}-12-31`).returns<ValorDateRow[]>();
      const totalCustosVariaveis = (cvData?.reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0) || 0) + totalAgua;

      // Outros custos do ano
      const { data: ocData } = await supabase.from('outros_custos').select('valor, mes').eq('company_id', cid).eq('ano', selectedYear).returns<ValorMesRow[]>();
      const totalOutrosCustos = ocData?.reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0) || 0;

      // Transporte do ano
      const { data: tpData } = await supabase.from('transporte').select('valor, mes').eq('company_id', cid).eq('ano', selectedYear).returns<ValorMesRow[]>();
      const totalTransporte = tpData?.reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0) || 0;

      // Investimentos (depreciação mensal * 12 para total anual)
      const { data: invData } = await supabase.from('investimentos').select('valor_mensal, production_line_id').eq('company_id', cid).returns<InvRow[]>();
      const totalInvestimentos = (invData?.reduce((s, i) => s + parseFloat(String(i.valor_mensal ?? 0)), 0) || 0) * 12;

      const totalGeral = totalProdutosLancados + totalMOD + totalMOI + totalCustosVariaveis + totalOutrosCustos + totalTransporte + totalManutencao + totalInvestimentos;

      // Custo Hora por linha (mensal)
      const nLinhas = (linhas || []).length || 1;
      const moiMensal = totalMOI / 12;
      const cvMensal = totalCustosVariaveis / 12;
      const ocMensal = totalOutrosCustos / 12;
      const tpMensal = totalTransporte / 12;
      const manutMensal = totalManutencao / 12;
      const custoHoraPorLinha = (linhas || []).map((l: any) => {
        const modLinha = moData?.filter(m => m.tipo === 'MOD' && m.production_line_id === l.id).reduce((s, m) => s + parseFloat(String(m.custo_mensal ?? 0)), 0) || 0;
        const pqLinha = launchData?.filter(p => p.production_line_id === l.id).reduce((s, p) => s + parseFloat(String(p.custo_total ?? 0)), 0) || 0;
        const invLinha = invData?.filter(i => i.production_line_id === l.id).reduce((s, i) => s + parseFloat(String(i.valor_mensal ?? 0)), 0) || 0;
        const invGeral = invData?.filter(i => !i.production_line_id).reduce((s, i) => s + parseFloat(String(i.valor_mensal ?? 0)), 0) || 0;

        const custoMensal = (pqLinha / 12) + (modLinha / 12) + (moiMensal / nLinhas) + (cvMensal / nLinhas) + (ocMensal / nLinhas) + (tpMensal / nLinhas) + (manutMensal / nLinhas) + invLinha + (invGeral / nLinhas);
        const custoHora = HORAS_TRABALHADAS > 0 ? custoMensal / HORAS_TRABALHADAS : 0;

        return { nome: l.name, custoTotal: custoMensal, custoHora };
      });

      // Chart data por mês
      const chartData = MONTHS.map((month) => {
        const mod = moData?.filter(i => i.mes === month.value && i.tipo === 'MOD').reduce((s, i) => s + parseFloat(String(i.custo_mensal ?? 0)), 0) || 0;
        const moi = moData?.filter(i => i.mes === month.value && i.tipo === 'MOI').reduce((s, i) => s + parseFloat(String(i.custo_mensal ?? 0)), 0) || 0;
        const manut = manutData?.filter(i => parseInt(i.data.split('-')[1]) === month.value).reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0) || 0;
        const agua = aguaData?.filter(i => parseInt(i.data.split('-')[1]) === month.value).reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0) || 0;
        const cv = cvData?.filter(i => parseInt(i.data.split('-')[1]) === month.value).reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0) || 0;
        const oc = ocData?.filter(i => i.mes === month.value).reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0) || 0;
        const tp = tpData?.filter(i => i.mes === month.value).reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0) || 0;
        const pq = launchData?.filter(i => i.mes === month.value).reduce((s, i) => s + parseFloat(String(i.custo_total ?? 0)), 0) || 0;
        const inv = (invData?.reduce((s, i) => s + parseFloat(String(i.valor_mensal ?? 0)), 0) || 0);

        return {
          mes: month.label,
          ProdQuimico: pq,
          MOD: mod,
          MOI: moi,
          CustosVar: agua + cv,
          OutrosCustos: oc,
          Transporte: tp,
          Manutencao: manut,
          Investimentos: inv,
        };
      });

      setData({
        totalFuncionarios: funcionariosCount || 0,
        totalLinhas: linhasCount || 0,
        totalGrupos: gruposCount || 0,
        totalMOD, totalMOI, totalManutencao, totalAgua,
        totalProdutosLancados, totalCustosVariaveis, totalOutrosCustos,
        totalTransporte, totalInvestimentos, totalGeral,
        custoHoraPorLinha, chartData,
      });
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.company_id, selectedYear, supabase]);

  useEffect(() => {
    if (profile?.company_id) { void loadResumo(); }
  }, [loadResumo, profile?.company_id]);

  return (
    <MainLayout title="Resumo de Custo">
      {/* Filtro de Ano */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-gray-600">Consolidado mensal por linha — conforme planilha original</p>
        <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
          {getYearsList(selectedYear - 3, selectedYear + 1).map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-gray-600 mb-4">Carregando...</p>}

      {/* Cards de Estrutura */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard title="Funcionários Ativos" value={data.totalFuncionarios} icon={<Users className="w-6 h-6" />} color="blue" />
        <StatsCard title="Linhas de Produção" value={data.totalLinhas} icon={<Factory className="w-6 h-6" />} color="green" />
        <StatsCard title="Grupos" value={data.totalGrupos} icon={<FileText className="w-6 h-6" />} color="purple" />
      </div>

      {/* Cards de Custos - 8 categorias conforme planilha */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard title="Produto Químico" value={formatCurrency(data.totalProdutosLancados)} icon={<Factory className="w-6 h-6" />} color="green" />
        <StatsCard title="M.O.D" value={formatCurrency(data.totalMOD)} icon={<DollarSign className="w-6 h-6" />} color="blue" />
        <StatsCard title="M.O.I" value={formatCurrency(data.totalMOI)} icon={<DollarSign className="w-6 h-6" />} color="purple" />
        <StatsCard title="Custos Variáveis" value={formatCurrency(data.totalCustosVariaveis)} icon={<Zap className="w-6 h-6" />} color="orange" />
        <StatsCard title="Outros Custos" value={formatCurrency(data.totalOutrosCustos)} icon={<Receipt className="w-6 h-6" />} color="purple" />
        <StatsCard title="Transporte" value={formatCurrency(data.totalTransporte)} icon={<Truck className="w-6 h-6" />} color="blue" />
        <StatsCard title="Manutenção" value={formatCurrency(data.totalManutencao)} icon={<Wrench className="w-6 h-6" />} color="orange" />
        <StatsCard title="Investimentos" value={formatCurrency(data.totalInvestimentos)} icon={<TrendingDown className="w-6 h-6" />} color="green" />
      </div>

      {/* Card Total Geral */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl shadow-sm p-6 mb-6">
        <p className="text-primary-100 text-sm font-medium">Total Geral de Custos - {selectedYear}</p>
        <p className="text-white text-4xl font-bold mt-1">{formatCurrency(data.totalGeral)}</p>
      </div>

      {/* Custo Hora por Linha */}
      {data.custoHoraPorLinha.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary-500" /> Custo Hora por Linha (média mensal)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 text-gray-500">Linha</th>
                  <th className="text-right py-2 px-3 text-gray-500">Custo Mensal</th>
                  <th className="text-right py-2 px-3 text-gray-500">Custo Hora ({HORAS_TRABALHADAS}h)</th>
                </tr>
              </thead>
              <tbody>
                {data.custoHoraPorLinha.map((l, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 px-3 text-gray-700 font-medium">{l.nome}</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(l.custoTotal)}</td>
                    <td className="py-2 px-3 text-right font-bold text-primary-600">{formatCurrency(l.custoHora)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gráfico de Barras Comparativo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Comparativo Mensal - {selectedYear}</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis tickFormatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
              <Tooltip
                formatter={(value: unknown) => typeof value === 'number' || typeof value === 'string' ? formatCurrency(value) : formatCurrency(0)}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="ProdQuimico" stackId="a" fill="#10b981" name="Prod. Químico" />
              <Bar dataKey="MOD" stackId="a" fill="#6366f1" name="M.O.D" />
              <Bar dataKey="MOI" stackId="a" fill="#a855f7" name="M.O.I" />
              <Bar dataKey="CustosVar" stackId="a" fill="#f59e0b" name="Custos Variáveis" />
              <Bar dataKey="OutrosCustos" stackId="a" fill="#8b5cf6" name="Outros Custos" />
              <Bar dataKey="Transporte" stackId="a" fill="#0ea5e9" name="Transporte" />
              <Bar dataKey="Manutencao" stackId="a" fill="#f97316" name="Manutenção" />
              <Bar dataKey="Investimentos" stackId="a" fill="#14b8a6" name="Investimentos" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </MainLayout>
  );
}
