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
type ProductLaunchRow = { custo_total: number; mes: number; production_line_id: string; product_id?: string };
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
  manutencao: number;
  totalOperacao: number;
  custoHoraOperacao: number;
  custoHoraPQ: number;
  totalGeral: number;
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

  // Custo por Peça (tab inline)
  const [activeTab, setActiveTab] = useState<'resumo' | 'custoPeca'>('resumo');
  const [cpPieces, setCpPieces] = useState<any[]>([]);
  const [cpGroups, setCpGroups] = useState<any[]>([]);
  const [cpProducts, setCpProducts] = useState<any[]>([]);
  const [cpPecasHora, setCpPecasHora] = useState<any[]>([]);
  const [cpLancPecas, setCpLancPecas] = useState<any[]>([]);
  const [cpFilterPiece, setCpFilterPiece] = useState('');
  const [cpFilterGroup, setCpFilterGroup] = useState('');

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
        supabase.from('manutencao').select('valor, data, production_line_id').eq('company_id', cid),
        supabase.from('consumo_agua').select('valor, data').eq('company_id', cid),
        supabase.from('product_launches').select('custo_total, mes, production_line_id, product_id').eq('company_id', cid).eq('ano', selectedYear),
        supabase.from('custos_variaveis').select('valor, data').eq('company_id', cid),
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
    const { linhas, moData, manutData, aguaData, launchData, cvData } = rawData;
    const nLinhas = linhas.length || 1;

    // Custos rateados (divididos igualmente entre linhas) para o mês
    const aguaMes = aguaData.filter(i => { const p = i.data.split('-'); return parseInt(p[0]) === selectedYear && parseInt(p[1]) === selectedMonth; }).reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0);
    const cvMes = cvData.filter(i => { const p = i.data.split('-'); return parseInt(p[0]) === selectedYear && parseInt(p[1]) === selectedMonth; }).reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0);
    const custosVarMes = aguaMes + cvMes;

    return linhas.map((l) => {
      // Produto Químico da linha no mês
      const prodQuimico = launchData.filter(p => p.production_line_id === l.id && p.mes === selectedMonth)
        .reduce((s, p) => s + parseFloat(String(p.custo_total ?? 0)), 0);

      // MOD da linha no mês
      const mod = moData.filter(m => m.mes === selectedMonth && m.tipo === 'MOD' && moMatchesLine(m, l.id))
        .reduce((s, m) => s + parseFloat(String(m.custo_mensal ?? 0)), 0);

      // MOI da linha no mês
      const moi = moData.filter(m => m.mes === selectedMonth && m.tipo === 'MOI' && moMatchesLine(m, l.id))
        .reduce((s, m) => s + parseFloat(String(m.custo_mensal ?? 0)), 0);

      // Custos variáveis rateados
      const custosVariaveis = custosVarMes / nLinhas;

      // Manutenção da linha no mês
      const manutLinha = manutData.filter(m => m.production_line_id === l.id && parseInt(m.data.split('-')[0]) === selectedYear && parseInt(m.data.split('-')[1]) === selectedMonth)
        .reduce((s, m) => s + parseFloat(String(m.valor ?? 0)), 0);
      const manutSemLinha = manutData.filter(m => !m.production_line_id && parseInt(m.data.split('-')[0]) === selectedYear && parseInt(m.data.split('-')[1]) === selectedMonth)
        .reduce((s, m) => s + parseFloat(String(m.valor ?? 0)), 0);
      const manutencao = manutLinha + (manutSemLinha / nLinhas);

      const totalOperacao = prodQuimico + mod + moi + custosVariaveis;
      const custoHoraOperacao = HORAS_TRABALHADAS > 0 ? totalOperacao / HORAS_TRABALHADAS : 0;
      const custoHoraPQ = HORAS_TRABALHADAS > 0 ? prodQuimico / HORAS_TRABALHADAS : 0;
      const totalGeral = totalOperacao + manutencao;

      return {
        id: l.id,
        nome: l.name,
        prodQuimico,
        mod,
        moi,
        custosVariaveis,
        manutencao,
        totalOperacao,
        custoHoraOperacao,
        custoHoraPQ,
        totalGeral,
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
        manutencao: acc.manutencao + l.manutencao,
        totalOperacao: acc.totalOperacao + l.totalOperacao,
        custoHoraOperacao: acc.custoHoraOperacao + l.custoHoraOperacao,
        custoHoraPQ: acc.custoHoraPQ + l.custoHoraPQ,
        totalGeral: acc.totalGeral + l.totalGeral,
      }),
      { prodQuimico: 0, mod: 0, moi: 0, custosVariaveis: 0, manutencao: 0, totalOperacao: 0, custoHoraOperacao: 0, custoHoraPQ: 0, totalGeral: 0 }
    );
  }, [linhasResumo]);

  // Chart data por mês (ano inteiro)
  const chartData = useMemo(() => {
    if (!rawData) return [];
    const { moData, manutData, aguaData, launchData, cvData } = rawData;

    return MONTHS.map((month) => {
      const mod = moData.filter(i => i.mes === month.value && i.tipo === 'MOD').reduce((s, i) => s + parseFloat(String(i.custo_mensal ?? 0)), 0);
      const moi = moData.filter(i => i.mes === month.value && i.tipo === 'MOI').reduce((s, i) => s + parseFloat(String(i.custo_mensal ?? 0)), 0);
      const manut = manutData.filter(i => { const p = i.data.split('-'); return parseInt(p[0]) === selectedYear && parseInt(p[1]) === month.value; }).reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0);
      const agua = aguaData.filter(i => { const p = i.data.split('-'); return parseInt(p[0]) === selectedYear && parseInt(p[1]) === month.value; }).reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0);
      const cv = cvData.filter(i => { const p = i.data.split('-'); return parseInt(p[0]) === selectedYear && parseInt(p[1]) === month.value; }).reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0);
      const pq = launchData.filter(i => i.mes === month.value).reduce((s, i) => s + parseFloat(String(i.custo_total ?? 0)), 0);

      return { mes: month.label, ProdQuimico: pq, MOD: mod, MOI: moi, CustosVar: agua + cv, Manutencao: manut };
    });
  }, [rawData]);

  const mesLabel = MONTHS.find(m => m.value === selectedMonth)?.fullLabel || '';

  // Load data for Custo por Peça (loads alongside raw data)
  const loadCustoPecaData = useCallback(async () => {
    if (!profile?.company_id) return;
    try {
      const cid = profile.company_id;
      const [
        { data: pieces },
        { data: groups },
        { data: products },
        { data: pecasHora },
        { data: lancPecas },
      ] = await Promise.all([
        supabase.from('pieces').select('*').eq('company_id', cid).order('name'),
        supabase.from('groups').select('*').eq('company_id', cid).order('name'),
        supabase.from('products').select('*').eq('company_id', cid).order('name'),
        supabase.from('pecas_hora').select('*').eq('company_id', cid),
        supabase.from('lancamento_pecas').select('*').eq('company_id', cid).eq('ano', selectedYear),
      ]);
      setCpPieces(pieces || []);
      setCpGroups(groups || []);
      setCpProducts(products || []);
      setCpPecasHora(pecasHora || []);
      setCpLancPecas(lancPecas || []);
    } catch (error) {
      console.error('Erro ao carregar custo por peça:', error);
    }
  }, [profile?.company_id, selectedYear, supabase]);

  useEffect(() => {
    if (profile?.company_id) loadCustoPecaData();
  }, [loadCustoPecaData, profile?.company_id]);

  // Custo por peça computed data (mesma lógica do custo-galvanoplastia)
  const custoPecaData = useMemo(() => {
    if (!rawData || !rawData.linhas.length) return [];
    const linhas = rawData.linhas;
    const nLinhas = linhas.length || 1;
    const { moData, manutData, aguaData, launchData, cvData } = rawData;

    // Custos rateados do mês
    const aguaMes = aguaData.filter(i => { const p = i.data.split('-'); return parseInt(p[0]) === selectedYear && parseInt(p[1]) === selectedMonth; }).reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0);
    const cvMes = cvData.filter(i => { const p = i.data.split('-'); return parseInt(p[0]) === selectedYear && parseInt(p[1]) === selectedMonth; }).reduce((s, i) => s + parseFloat(String(i.valor ?? 0)), 0);

    // Peça selecionada (para exibição e filtro de grupo)
    const selectedPiece = cpFilterPiece ? cpPieces.find((p: any) => String(p.id) === cpFilterPiece) : null;
    const pecaLabel = selectedPiece ? selectedPiece.name : 'Todas';

    // IDs dos grupos da peça selecionada (para filtrar linhas)
    const pieceGroupIds: string[] = selectedPiece
      ? (selectedPiece.group_ids || (selectedPiece.group_id ? [selectedPiece.group_id] : []))
      : [];

    // Se grupo filtrado, buscar nomes dos grupos para comparar com linhas
    const groupFilter = cpFilterGroup;
    const groupName = groupFilter ? cpGroups.find((g: any) => g.id === groupFilter)?.name || '' : '';

    return linhas.map((linha) => {
      // Products of this line
      const lineProducts = cpProducts.filter((p: any) => p.production_line_id === linha.id);

      // Peças/hora da linha (mesma lógica do custo-galvanoplastia)
      const ph = cpPecasHora.find((p: any) => p.production_line_id === linha.id);
      const pecasHora = ph ? parseFloat(ph.pecas_por_hora) : 0;
      const producaoTeorica = pecasHora * HORAS_TRABALHADAS;

      // Produção real: se a peça está filtrada e a linha corresponde ao grupo, usar lancamento_pecas
      let producaoReal = 0;
      if (cpFilterPiece) {
        producaoReal = cpLancPecas
          .filter((lp: any) => String(lp.piece_id) === cpFilterPiece && lp.mes === selectedMonth)
          .reduce((s: number, lp: any) => s + parseFloat(String(lp.quantidade ?? 0)), 0);
      }
      const producaoMensal = producaoTeorica > 0 ? producaoTeorica : producaoReal;

      // Custo total da linha
      const pqLinha = launchData.filter(l => l.production_line_id === linha.id && l.mes === selectedMonth)
        .reduce((s, l) => s + parseFloat(String(l.custo_total ?? 0)), 0);
      const modLinha = moData.filter(m => m.mes === selectedMonth && m.tipo === 'MOD' && (m.production_line_ids?.includes(linha.id) || m.production_line_id === linha.id))
        .reduce((s, m) => s + parseFloat(String(m.custo_mensal ?? 0)), 0);
      const moiPorLinha = moData.filter(m => m.mes === selectedMonth && m.tipo === 'MOI' && (m.production_line_ids?.includes(linha.id) || m.production_line_id === linha.id))
        .reduce((s, m) => s + parseFloat(String(m.custo_mensal ?? 0)), 0);
      const manutLinha = manutData.filter(m => m.production_line_id === linha.id && parseInt(m.data.split('-')[0]) === selectedYear && parseInt(m.data.split('-')[1]) === selectedMonth)
        .reduce((s, m) => s + parseFloat(String(m.valor ?? 0)), 0);
      const manutSemLinha = manutData.filter(m => !m.production_line_id && parseInt(m.data.split('-')[0]) === selectedYear && parseInt(m.data.split('-')[1]) === selectedMonth)
        .reduce((s, m) => s + parseFloat(String(m.valor ?? 0)), 0);
      const manutTotal = manutLinha + (manutSemLinha / nLinhas);
      const cvRateado = (aguaMes + cvMes) / nLinhas;

      const custoTotalLinha = pqLinha + modLinha + moiPorLinha + cvRateado + manutTotal;

      // Custo por peça = custo total da linha / produção mensal (peças/hora × 220h)
      const custoPeca = producaoMensal > 0 ? custoTotalLinha / producaoMensal : 0;

      // Per product rows
      const rows = lineProducts.map((prod: any) => {
        const prodCost = launchData
          .filter((l: any) => l.production_line_id === linha.id && l.mes === selectedMonth && l.product_id === prod.id)
          .reduce((s: number, l: any) => s + parseFloat(String(l.custo_total ?? 0)), 0);
        // Custo por peça P.Q. = custo do produto / produção mensal
        const custoPecaPQ = producaoMensal > 0 ? prodCost / producaoMensal : 0;

        return {
          productName: prod.name,
          pecaLabel,
          custoPecaPQ,
        };
      });

      return {
        linhaId: linha.id,
        linhaNome: linha.name,
        custoPeca,
        rows,
        // Para filtrar: verificar se a peça/grupo se relaciona com esta linha
        hasMatch: true,
      };
    }).filter((linha) => {
      // Se nenhum filtro, mostra todas as linhas
      if (!cpFilterGroup && !cpFilterPiece) return true;
      // Se tem grupo selecionado, verificar se o nome do grupo bate com a linha
      if (groupName) {
        const linhaNameNorm = linha.linhaNome.toLowerCase().replace(/[^a-z0-9]/g, '');
        const groupNameNorm = groupName.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (linhaNameNorm.includes(groupNameNorm) || groupNameNorm.includes(linhaNameNorm)) return true;
      }
      // Se tem peça selecionada com grupos, verificar se algum grupo bate com a linha
      if (pieceGroupIds.length > 0) {
        const pieceGroupNames = pieceGroupIds.map(gid => {
          const g = cpGroups.find((gr: any) => gr.id === gid);
          return g ? g.name.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
        }).filter(Boolean);
        const linhaNameNorm = linha.linhaNome.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (pieceGroupNames.some(gn => linhaNameNorm.includes(gn) || gn.includes(linhaNameNorm))) return true;
      }
      // Se tem filtro mas não achou match, não mostra
      return false;
    });
  }, [rawData, cpProducts, cpPecasHora, cpLancPecas, cpPieces, cpGroups, cpFilterPiece, cpFilterGroup, selectedMonth]);

  return (
    <MainLayout title="Resumo de Custo">
      {/* Header com ano */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('resumo')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'resumo' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Resumo de custo
          </button>
          <button
            onClick={() => setActiveTab('custoPeca')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'custoPeca' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Custo por Peça
          </button>
        </div>
        <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
          {getYearsList().map((year) => (
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

      {/* ============ TAB: Resumo de Custo ============ */}
      {activeTab === 'resumo' && !loading && (
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
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold whitespace-nowrap">Custo Variável</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold whitespace-nowrap">Total Operação</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold whitespace-nowrap">Custo p/h Operação</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold whitespace-nowrap">Custo p/h P. Químico</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold whitespace-nowrap">Manutenção</th>
                  <th className="text-right py-3 px-4 text-gray-600 font-semibold whitespace-nowrap">Total Geral</th>
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
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(l.totalOperacao)}</td>
                    <td className="py-3 px-4 text-right font-bold text-primary-600">{formatCurrency(l.custoHoraOperacao)}</td>
                    <td className="py-3 px-4 text-right font-bold text-green-600">{formatCurrency(l.custoHoraPQ)}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{formatCurrency(l.manutencao)}</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(l.totalGeral)}</td>
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
                  <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(totais.totalOperacao)}</td>
                  <td className="py-3 px-4 text-right font-bold text-primary-700">{formatCurrency(totais.custoHoraOperacao)}</td>
                  <td className="py-3 px-4 text-right font-bold text-green-700">{formatCurrency(totais.custoHoraPQ)}</td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">{formatCurrency(totais.manutencao)}</td>
                  <td className="py-3 px-4 text-right font-bold text-primary-700 text-lg">{formatCurrency(totais.totalGeral)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Gráfico de Barras Comparativo */}
      {activeTab === 'resumo' && !loading && chartData.length > 0 && (
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
                <Bar dataKey="CustosVar" stackId="a" fill="#f59e0b" name="Custo Variável" />
                <Bar dataKey="Manutencao" stackId="a" fill="#f97316" name="Manutenção" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      {/* ============ TAB: Custo por Peça ============ */}
      {activeTab === 'custoPeca' && !loading && (
        <>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <select
              value={cpFilterPiece}
              onChange={(e) => setCpFilterPiece(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[200px]"
            >
              <option value="">Selecione a peça</option>
              {cpPieces.map((p: any) => (
                <option key={p.id} value={String(p.id)}>{p.name}</option>
              ))}
            </select>
            <select
              value={cpFilterGroup}
              onChange={(e) => setCpFilterGroup(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-w-[200px]"
            >
              <option value="">Selecione o Grupo</option>
              {cpGroups.map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Content */}
          {custoPecaData.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
              Nenhuma linha de produção encontrada.
            </div>
          ) : (
            <div className="space-y-6">
              {custoPecaData.map((linha: any) => (
                <div key={linha.linhaId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-bold text-gray-900">{linha.linhaNome}</th>
                        <th className="text-left py-3 px-4 font-bold text-gray-900">Peça</th>
                        <th className="text-right py-3 px-4 font-bold text-gray-900">Custo / Peça</th>
                        <th className="text-right py-3 px-4 font-bold text-gray-900">Custo / Peça P.Q</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {linha.rows.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="py-2.5 px-4 text-gray-700">{row.productName}</td>
                          <td className="py-2.5 px-4 text-gray-600">{row.pecaLabel}</td>
                          <td className="py-2.5 px-4 text-right text-gray-700">
                            {linha.custoPeca > 0 ? formatCurrency(linha.custoPeca) : '-'}
                          </td>
                          <td className="py-2.5 px-4 text-right text-gray-700">
                            {row.custoPecaPQ > 0 ? formatCurrency(row.custoPecaPQ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </MainLayout>
  );
}
