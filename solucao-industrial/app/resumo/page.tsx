'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency, MONTHS, getYearsList } from '@/lib/utils';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const HORAS_TRABALHADAS = 220;

type MoRow = { tipo: string; custo_mensal: number; mes: number; production_line_id: string; production_line_ids?: string[] };
type ManutRow = { valor: number; data: string; production_line_id: string | null };
type AguaRow = { valor: number; data: string };
type ProductLaunchRow = { custo_total: number; mes: number; production_line_id: string };
type CvRow = { valor: number; data: string };
type OcRow = { valor: number; mes: number };
type TpRow = { valor: number; mes: number };
type InvRow = { valor_mensal: number; production_line_id: string | null };

interface LinhaResumo {
  id: string;
  nome: string;
  prodQuimico: number;
  mod: number;
  moi: number;
  custosVariaveis: number;
  outrosCustos: number;
  transporte: number;
  manutencao: number;
  investimentos: number;
  total: number;
  custoHora: number;
}

interface RawData {
  linhas: { id: string; name: string }[];
  moData: MoRow[];
  manutData: ManutRow[];
  aguaData: AguaRow[];
  launchData: ProductLaunchRow[];
  cvData: CvRow[];
  ocData: OcRow[];
  tpData: TpRow[];
  invData: InvRow[];
}

export default function ResumoPage() {
  const { profile } = useAuth();
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [rawData, setRawData] = useState<RawData | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar todos os dados brutos do ano
  const loadRawData = useCallback(async () => {
    if (!profile?.company_id) return;
    setLoading(true);
    try {
      const cid = profile.company_id;

      const [
        { data: linhas },
        { data: moData },
        { data: manutData },
        { data: aguaData },
        { data: launchData },
        { data: cvData },
        { data: ocData },
        { data: tpData },
        { data: invData },
      ] = await Promise.all([
        supabase.from('production_lines').select('id, name').eq('company_id', cid).eq('active', true).order('name'),
        supabase.from('lancamento_mo').select('tipo, custo_mensal, mes, production_line_id, production_line_ids').eq('company_id', cid).eq('ano', selectedYear),
        supabase.from('manutencao').select('valor, data, production_line_id').eq('company_id', cid).gte('data', `${selectedYear}-01-01`).lte('data', `${selectedYear}-12-31`),
        supabase.from('consumo_agua').select('valor, data').eq('company_id', cid).gte('data', `${selectedYear}-01-01`).lte('data', `${selectedYear}-12-31`),
        supabase.from('product_launches').select('custo_total, mes, production_line_id').eq('company_id', cid).eq('ano', selectedYear),
        supabase.from('custos_variaveis').select('valor, data').eq('company_id', cid).gte('data', `${selectedYear}-01-01`).lte('data', `${selectedYear}-12-31`),
        supabase.from('outros_custos').select('valor, mes').eq('company_id', cid).eq('ano', selectedYear),
        supabase.from('transporte').select('valor, mes').eq('company_id', cid).eq('ano', selectedYear),
        supabase.from('investimentos').select('valor_mensal, production_line_id').eq('company_id', cid),
      ]);

      setRawData({
        linhas: (linhas || []) as any[],
        moData: (moData || []) as any[],
        manutData: (manutData || []) as any[],
        aguaData: (aguaData || []) as any[],
        launchData: (launchData || []) as any[],
        cvData: (cvData || []) as any[],
        ocData: (ocData || []) as any[],
        tpData: (tpData || []) as any[],
        invData: (invData || []) as any[],
      });
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.company_id, selectedYear, supabase]);

  useEffect(() => {
    if (profile?.company_id) { void loadRawData(); }
  }, [loadRawData, profile?.company_id]);

  // Helpers para verificar se um lancamento_mo pertence a uma linha
  const moMatchesLine = (mo: MoRow, lineId: string): boolean => {
    if (mo.production_line_ids && mo.production_line_ids.length > 0) {
      return mo.production_line_ids.includes(lineId);
    }
    return mo.production_line_id === lineId;
  };

  // Calcular tabela de resumo por linha para o mês selecionado
  const linhasResumo: LinhaResumo[] = useMemo(() => {
    if (!rawData) return [];
    const { linhas, moData, manutData, aguaData, launchData, cvData, ocData, tpData, invData } = rawData;
    const nLinhas = linhas.length || 1;

    // Custos rateados (divididos igualmente entre linhas) para o mês
    const aguaMes = aguaData.filter(i => parseInt(i.data.split('-')[1]) === selectedMonth).reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0);
    const cvMes = cvData.filter(i => parseInt(i.data.split('-')[1]) === selectedMonth).reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0);
    const ocMes = ocData.filter(i => i.mes === selectedMonth).reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0);
    const tpMes = tpData.filter(i => i.mes === selectedMonth).reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0);
    const custosVarMes = aguaMes + cvMes;

    // MOI total do mês (rateado entre linhas)
    const moiTotalMes = moData.filter(i => i.mes === selectedMonth && i.tipo === 'MOI').reduce((s, i) => s + parseFloat(String(i.custo_mensal ?? 0)), 0);

    // Investimentos sem linha (rateado)
    const invGeral = invData.filter(i => !i.production_line_id).reduce((s, i) => s + parseFloat(String(i.valor_mensal ?? 0)), 0);

    return linhas.map((l) => {
      // Produto Químico da linha no mês
      const prodQuimico = launchData.filter(p => p.production_line_id === l.id && p.mes === selectedMonth)
        .reduce((s, p) => s + parseFloat(String(p.custo_total ?? 0)), 0);

      // MOD da linha no mês
      const mod = moData.filter(m => m.mes === selectedMonth && m.tipo === 'MOD' && moMatchesLine(m, l.id))
        .reduce((s, m) => s + parseFloat(String(m.custo_mensal ?? 0)), 0);

      // MOI rateado
      const moi = moiTotalMes / nLinhas;

      // Custos variáveis rateados
      const custosVariaveis = custosVarMes / nLinhas;

      // Outros custos rateados
      const outrosCustos = ocMes / nLinhas;

      // Transporte rateado
      const transporte = tpMes / nLinhas;

      // Manutenção da linha no mês
      const manutLinha = manutData.filter(m => m.production_line_id === l.id && parseInt(m.data.split('-')[1]) === selectedMonth)
        .reduce((s, m) => s + parseFloat(String(m.valor ?? 0)), 0);
      const manutSemLinha = manutData.filter(m => !m.production_line_id && parseInt(m.data.split('-')[1]) === selectedMonth)
        .reduce((s, m) => s + parseFloat(String(m.valor ?? 0)), 0);
      const manutencao = manutLinha + (manutSemLinha / nLinhas);

      // Investimentos da linha + rateio geral
      const invLinha = invData.filter(i => i.production_line_id === l.id).reduce((s, i) => s + parseFloat(String(i.valor_mensal ?? 0)), 0);
      const investimentos = invLinha + (invGeral / nLinhas);

      const total = prodQuimico + mod + moi + custosVariaveis + outrosCustos + transporte + manutencao + investimentos;
      const custoHora = HORAS_TRABALHADAS > 0 ? total / HORAS_TRABALHADAS : 0;

      return {
        id: l.id,
        nome: l.name,
        prodQuimico,
        mod,
        moi,
        custosVariaveis,
        outrosCustos,
        transporte,
        manutencao,
        investimentos,
        total,
        custoHora,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawData, selectedMonth]);

  // Totais da tabela
  const totais = useMemo(() => {
    return linhasResumo.reduce(
      (acc, l) => ({
        prodQuimico: acc.prodQuimico + l.prodQuimico,
        mod: acc.mod + l.mod,
        moi: acc.moi + l.moi,
        custosVariaveis: acc.custosVariaveis + l.custosVariaveis,
        outrosCustos: acc.outrosCustos + l.outrosCustos,
        transporte: acc.transporte + l.transporte,
        manutencao: acc.manutencao + l.manutencao,
        investimentos: acc.investimentos + l.investimentos,
        total: acc.total + l.total,
        custoHora: acc.custoHora + l.custoHora,
      }),
      { prodQuimico: 0, mod: 0, moi: 0, custosVariaveis: 0, outrosCustos: 0, transporte: 0, manutencao: 0, investimentos: 0, total: 0, custoHora: 0 }
    );
  }, [linhasResumo]);

  // Chart data por mês (ano inteiro)
  const chartData = useMemo(() => {
    if (!rawData) return [];
    const { moData, manutData, aguaData, launchData, cvData, ocData, tpData, invData } = rawData;

    return MONTHS.map((month) => {
      const mod = moData.filter(i => i.mes === month.value && i.tipo === 'MOD').reduce((s, i) => s + parseFloat(String(i.custo_mensal ?? 0)), 0);
      const moi = moData.filter(i => i.mes === month.value && i.tipo === 'MOI').reduce((s, i) => s + parseFloat(String(i.custo_mensal ?? 0)), 0);
      const manut = manutData.filter(i => parseInt(i.data.split('-')[1]) === month.value).reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0);
      const agua = aguaData.filter(i => parseInt(i.data.split('-')[1]) === month.value).reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0);
      const cv = cvData.filter(i => parseInt(i.data.split('-')[1]) === month.value).reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0);
      const oc = ocData.filter(i => i.mes === month.value).reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0);
      const tp = tpData.filter(i => i.mes === month.value).reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0);
      const pq = launchData.filter(i => i.mes === month.value).reduce((s, i) => s + parseFloat(String(i.custo_total ?? 0)), 0);
      const inv = invData.reduce((s, i) => s + parseFloat(String(i.valor_mensal ?? 0)), 0);

      return { mes: month.label, ProdQuimico: pq, MOD: mod, MOI: moi, CustosVar: agua + cv, OutrosCustos: oc, Transporte: tp, Manutencao: manut, Investimentos: inv };
    });
  }, [rawData]);

  const mesLabel = MONTHS.find(m => m.value === selectedMonth)?.fullLabel || '';

  return (
    <MainLayout title="Resumo de Custo">
      {/* Header com ano */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm font-semibold">Resumo de custo</span>
          <span className="text-lg font-semibold text-gray-700">Horas Trabalhadas: {HORAS_TRABALHADAS}</span>
        </div>
        <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
          {getYearsList(selectedYear - 3, selectedYear + 1).map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {/* Tabs de meses */}
      <div className="flex items-center gap-1 flex-wrap mb-6">
        {MONTHS.map((month) => (
          <button
            key={month.value}
            onClick={() => setSelectedMonth(month.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedMonth === month.value
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {month.fullLabel}/{selectedYear}
          </button>
        ))}
      </div>

      {loading && <p className="text-gray-600 mb-4">Carregando...</p>}

      {/* Tabela principal - Resumo de Custo por Linha */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">
              {mesLabel} / {selectedYear}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-600 font-semibold whitespace-nowrap">Linha</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold whitespace-nowrap">Produto Químico</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold whitespace-nowrap">M.O.D</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold whitespace-nowrap">M.O.I</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold whitespace-nowrap">Custos Variáveis</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold whitespace-nowrap">Outros Custos</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold whitespace-nowrap">Transporte</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold whitespace-nowrap">Manutenção</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold whitespace-nowrap">Investimentos</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold whitespace-nowrap">Total</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold whitespace-nowrap">Custo Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {linhasResumo.map((l) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-800 font-medium whitespace-nowrap">{l.nome}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(l.prodQuimico)}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(l.mod)}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(l.moi)}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(l.custosVariaveis)}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(l.outrosCustos)}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(l.transporte)}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(l.manutencao)}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(l.investimentos)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(l.total)}</td>
                    <td className="py-3 px-4 text-right font-bold text-primary-600">{formatCurrency(l.custoHora)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 border-t-2 border-gray-300">
                  <td className="py-3 px-4 font-bold text-gray-900">Total</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(totais.prodQuimico)}</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(totais.mod)}</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(totais.moi)}</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(totais.custosVariaveis)}</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(totais.outrosCustos)}</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(totais.transporte)}</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(totais.manutencao)}</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(totais.investimentos)}</td>
                  <td className="py-3 px-4 text-right font-bold text-primary-700 text-lg">{formatCurrency(totais.total)}</td>
                  <td className="py-3 px-4 text-right font-bold text-primary-700">{formatCurrency(totais.custoHora)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Gráfico de Barras Comparativo */}
      {!loading && chartData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Comparativo Mensal - {selectedYear}</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
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
      )}
    </MainLayout>
  );
}
