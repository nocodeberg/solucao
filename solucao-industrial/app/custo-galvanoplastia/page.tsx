'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { Calculator } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, MONTHS } from '@/lib/utils';
import { createSupabaseClient } from '@/lib/supabase/client';

const HORAS_TRABALHADAS = 220;
const IMPOSTO_UNICO = 0.15;

interface LinhaResumo {
  linhaId: string;
  linhaNome: string;
  custoQuimico: number;
  custoMOD: number;
  custoMOI: number;
  custosVariaveis: number;
  outrosCustos: number;
  transporte: number;
  manutencao: number;
  investimentos: number;
  custoTotal: number;
  pecasHora: number;
  kgHora: number;
  custoPeca: number;
  custoKilo: number;
  custoPecaPQ: number;
  custoKiloPQ: number;
  custoLiquido: number;
  custoLiquidoKg: number;
}

export default function CustoGalvanoplastiaPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [linhasResumo, setLinhasResumo] = useState<LinhaResumo[]>([]);
  const [, setNumLinhas] = useState(1);

  const loadData = useCallback(async () => {
    if (authLoading || !user) { setLoading(false); return; }
    try {
      setLoading(true);
      const supabase = createSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      // Buscar profile
      const { data: profileRows } = await supabase.from('profiles').select('company_id').eq('id', session.user.id).limit(1) as { data: any[] | null };
      const companyId = profileRows?.[0]?.company_id;
      if (!companyId) { setLoading(false); return; }

      // Buscar todas as linhas
      const { data: linhas } = await supabase.from('production_lines').select('*').eq('company_id', companyId).order('name') as { data: any[] | null };
      if (!linhas || linhas.length === 0) { setLinhasResumo([]); setLoading(false); return; }
      setNumLinhas(linhas.length || 1);

      // Buscar dados de peças/hora
      const { data: pecasHoraData } = await supabase.from('pecas_hora').select('*').eq('company_id', companyId) as { data: any[] | null };

      // Buscar lançamentos de M.O. do mês
      const { data: moData } = await supabase.from('lancamento_mo').select('*')
        .eq('company_id', companyId).eq('mes', selectedMonth).eq('ano', selectedYear) as { data: any[] | null };

      // Manutenção do mês
      const mesStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
      const { data: manutData } = await supabase.from('manutencao').select('*')
        .eq('company_id', companyId)
        .gte('data', `${mesStr}-01`)
        .lte('data', `${mesStr}-31`) as { data: any[] | null };

      // Consumo água do mês
      const { data: aguaData } = await supabase.from('consumo_agua').select('*')
        .eq('company_id', companyId)
        .gte('data', `${mesStr}-01`)
        .lte('data', `${mesStr}-31`) as { data: any[] | null };

      // Custos variáveis do mês
      const { data: cvData } = await supabase.from('custos_variaveis').select('*')
        .eq('company_id', companyId)
        .gte('data', `${mesStr}-01`)
        .lte('data', `${mesStr}-31`) as { data: any[] | null };

      // Outros custos do mês
      const { data: ocData } = await supabase.from('outros_custos').select('*')
        .eq('company_id', companyId).eq('mes', selectedMonth).eq('ano', selectedYear) as { data: any[] | null };

      // Transporte do mês
      const { data: tpData } = await supabase.from('transporte').select('*')
        .eq('company_id', companyId).eq('mes', selectedMonth).eq('ano', selectedYear) as { data: any[] | null };

      // Investimentos ativos
      const { data: invData } = await supabase.from('investimentos').select('*')
        .eq('company_id', companyId) as { data: any[] | null };

      // Product launches (produtos químicos)
      const { data: plData } = await supabase.from('product_launches').select('*')
        .eq('company_id', companyId).eq('mes', selectedMonth).eq('ano', selectedYear) as { data: any[] | null };

      // Calcular totais rateados
      const nLinhas = linhas.length || 1;
      const totalAgua = (aguaData || []).reduce((s: number, r: any) => s + parseFloat(r.valor), 0);
      const totalCV = (cvData || []).reduce((s: number, r: any) => s + parseFloat(r.valor), 0);
      const totalOC = (ocData || []).reduce((s: number, r: any) => s + parseFloat(r.valor), 0);
      const totalTP = (tpData || []).reduce((s: number, r: any) => s + parseFloat(r.valor), 0);

      // M.O.I total (rateado)
      const totalMOI = (moData || []).filter((m: any) => m.tipo === 'MOI')
        .reduce((s: number, r: any) => s + parseFloat(r.custo_mensal), 0);
      const moiPorLinha = totalMOI / nLinhas;

      // Custos variáveis rateados (água + energia + telefone)
      const cvRateado = (totalAgua + totalCV) / nLinhas;

      // Outros custos rateados
      const ocRateado = totalOC / nLinhas;

      // Transporte rateado
      const tpRateado = totalTP / nLinhas;

      // Montar resumo por linha
      const resumo: LinhaResumo[] = linhas.map((linha: any) => {
        // M.O.D da linha
        const modLinha = (moData || [])
          .filter((m: any) => m.tipo === 'MOD' && m.production_line_id === linha.id)
          .reduce((s: number, r: any) => s + parseFloat(r.custo_mensal), 0);

        // Manutenção da linha
        const manutLinha = (manutData || [])
          .filter((m: any) => m.production_line_id === linha.id)
          .reduce((s: number, r: any) => s + parseFloat(r.valor), 0);
        const manutGeral = (manutData || [])
          .filter((m: any) => !m.production_line_id)
          .reduce((s: number, r: any) => s + parseFloat(r.valor), 0);
        const manutTotal = manutLinha + (manutGeral / nLinhas);

        // Investimentos da linha (valor mensal)
        const invLinha = (invData || [])
          .filter((i: any) => i.production_line_id === linha.id)
          .reduce((s: number, r: any) => s + parseFloat(r.valor_mensal), 0);
        const invGeral = (invData || [])
          .filter((i: any) => !i.production_line_id)
          .reduce((s: number, r: any) => s + parseFloat(r.valor_mensal), 0);
        const invTotal = invLinha + (invGeral / nLinhas);

        // Produto químico da linha
        const pqLinha = (plData || [])
          .filter((p: any) => p.production_line_id === linha.id)
          .reduce((s: number, r: any) => s + parseFloat(r.custo_total), 0);

        const custoTotal = pqLinha + modLinha + moiPorLinha + cvRateado + ocRateado + tpRateado + manutTotal + invTotal;

        // Peças/hora da linha
        const ph = (pecasHoraData || []).find((p: any) => p.production_line_id === linha.id);
        const pecasHora = ph ? parseFloat(ph.pecas_por_hora) : 0;
        const kgHora = ph ? parseFloat(ph.kg_por_hora) : 0;

        const producaoMensal = pecasHora * HORAS_TRABALHADAS;
        const producaoKg = kgHora * HORAS_TRABALHADAS;

        const custoPeca = producaoMensal > 0 ? custoTotal / producaoMensal : 0;
        const custoKilo = producaoKg > 0 ? custoTotal / producaoKg : 0;

        const custoPecaPQ = producaoMensal > 0 ? pqLinha / producaoMensal : 0;
        const custoKiloPQ = producaoKg > 0 ? pqLinha / producaoKg : 0;

        const custoLiquido = custoPeca * (1 + IMPOSTO_UNICO);
        const custoLiquidoKg = custoKilo * (1 + IMPOSTO_UNICO);

        return {
          linhaId: linha.id,
          linhaNome: linha.name,
          custoQuimico: pqLinha,
          custoMOD: modLinha,
          custoMOI: moiPorLinha,
          custosVariaveis: cvRateado,
          outrosCustos: ocRateado,
          transporte: tpRateado,
          manutencao: manutTotal,
          investimentos: invTotal,
          custoTotal,
          pecasHora,
          kgHora,
          custoPeca,
          custoKilo,
          custoPecaPQ,
          custoKiloPQ,
          custoLiquido,
          custoLiquidoKg,
        };
      });

      setLinhasResumo(resumo);
    } catch (error) {
      console.error('Erro ao carregar custo galvanoplastia:', error);
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, selectedYear, selectedMonth]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    loadData();
  }, [authLoading, user, loadData]);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
  const fmt = (v: number) => formatCurrency(v);
  const fmt4 = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });

  return (
    <MainLayout title="Custo Por Peça - Galvanoplastia">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">Custo por peça e por kilo de cada linha</p>
          <div className="flex items-center gap-3">
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.fullLabel}</option>)}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Carregando...</p>
      ) : linhasResumo.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          <Calculator className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Nenhuma linha de produção cadastrada</p>
        </div>
      ) : (
        <div className="space-y-6">
          {linhasResumo.map((l) => (
            <div key={l.linhaId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{l.linhaNome}</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Prod. Químico</p>
                  <p className="font-semibold">{fmt(l.custoQuimico)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">M.O.D</p>
                  <p className="font-semibold">{fmt(l.custoMOD)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">M.O.I (rateado)</p>
                  <p className="font-semibold">{fmt(l.custoMOI)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Custos Variáveis</p>
                  <p className="font-semibold">{fmt(l.custosVariaveis)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Outros Custos</p>
                  <p className="font-semibold">{fmt(l.outrosCustos)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Transporte</p>
                  <p className="font-semibold">{fmt(l.transporte)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Manutenção</p>
                  <p className="font-semibold">{fmt(l.manutencao)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-500 text-xs">Investimentos</p>
                  <p className="font-semibold">{fmt(l.investimentos)}</p>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-blue-700 font-medium">Custo Total da Linha</span>
                  <span className="text-xl font-bold text-blue-900">{fmt(l.custoTotal)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-blue-600">Peças/Hora: {fmt4(l.pecasHora)} | Kg/Hora: {fmt4(l.kgHora)}</span>
                  <span className="text-blue-600">Horas: {HORAS_TRABALHADAS}h/mês</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-green-600 text-xs font-medium">Custo / Peça</p>
                  <p className="text-lg font-bold text-green-900">{l.custoPeca > 0 ? fmt4(l.custoPeca) : '-'}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-green-600 text-xs font-medium">Custo / Kilo</p>
                  <p className="text-lg font-bold text-green-900">{l.custoKilo > 0 ? fmt4(l.custoKilo) : '-'}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <p className="text-amber-600 text-xs font-medium">C/ Imposto ({(IMPOSTO_UNICO * 100).toFixed(0)}%) / Peça</p>
                  <p className="text-lg font-bold text-amber-900">{l.custoLiquido > 0 ? fmt4(l.custoLiquido) : '-'}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                  <p className="text-amber-600 text-xs font-medium">C/ Imposto ({(IMPOSTO_UNICO * 100).toFixed(0)}%) / Kilo</p>
                  <p className="text-lg font-bold text-amber-900">{l.custoLiquidoKg > 0 ? fmt4(l.custoLiquidoKg) : '-'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </MainLayout>
  );
}
