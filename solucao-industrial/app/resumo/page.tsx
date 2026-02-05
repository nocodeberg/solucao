'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { StatsCard } from '@/components/ui/Card';
import {
  Users,
  DollarSign,
  Wrench,
  Droplets,
  Factory,
  FileText,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatCurrency, MONTHS, getYearsList } from '@/lib/utils';
import { createSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type MoRow = { tipo: string; custo_mensal: number; mes: number };
type ValorDateRow = { valor: number; data: string };

type ResumoData = {
  totalFuncionarios: number;
  totalLinhas: number;
  totalGrupos: number;
  totalMOD: number;
  totalMOI: number;
  totalManutencao: number;
  totalAgua: number;
  totalGeral: number;
  chartData: { mes: string; MOD: number; MOI: number; Manutencao: number; Agua: number }[];
};

export default function ResumoPage() {
  const { profile } = useAuth();
  const supabase = useMemo(() => createSupabaseClient(), []);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [data, setData] = useState<ResumoData>({
    totalFuncionarios: 0,
    totalLinhas: 0,
    totalGrupos: 0,
    totalMOD: 0,
    totalMOI: 0,
    totalManutencao: 0,
    totalAgua: 0,
    totalGeral: 0,
    chartData: [],
  });
  const [loading, setLoading] = useState(true);

  const loadResumo = useCallback(async () => {
    if (!profile?.company_id) return;

    setLoading(true);
    try {
      // Funcionários ativos
      const { count: funcionariosCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)
        .eq('active', true);

      // Linhas de produção
      const { count: linhasCount } = await supabase
        .from('production_lines')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)
        .eq('active', true);

      // Grupos
      const { count: gruposCount } = await supabase
        .from('groups')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id);

      // Lançamentos MO do ano
      const { data: moData } = await supabase
        .from('lancamento_mo')
        .select('tipo, custo_mensal, mes')
        .eq('company_id', profile.company_id)
        .eq('ano', selectedYear)
        .returns<MoRow[]>();

      let totalMOD = 0;
      let totalMOI = 0;
      moData?.forEach((item) => {
        if (item.tipo === 'MOD') totalMOD += parseFloat(item.custo_mensal.toString());
        else totalMOI += parseFloat(item.custo_mensal.toString());
      });

      // Manutenção do ano
      const { data: manutData } = await supabase
        .from('manutencao')
        .select('valor, data')
        .eq('company_id', profile.company_id)
        .gte('data', `${selectedYear}-01-01`)
        .lte('data', `${selectedYear}-12-31`)
        .returns<ValorDateRow[]>();

      const totalManutencao = manutData?.reduce((sum, item) => sum + parseFloat(item.valor.toString()), 0) || 0;

      // Consumo de água do ano
      const { data: aguaData } = await supabase
        .from('consumo_agua')
        .select('valor, data')
        .eq('company_id', profile.company_id)
        .gte('data', `${selectedYear}-01-01`)
        .lte('data', `${selectedYear}-12-31`)
        .returns<ValorDateRow[]>();

      const totalAgua = aguaData?.reduce((sum, item) => sum + parseFloat(item.valor.toString()), 0) || 0;

      // Chart data por mês
      const chartData = MONTHS.map((month) => {
        let mod = 0;
        let moi = 0;
        moData?.forEach((item) => {
          if (item.mes === month.value) {
            if (item.tipo === 'MOD') mod += parseFloat(item.custo_mensal.toString());
            else moi += parseFloat(item.custo_mensal.toString());
          }
        });

        const manut = manutData
          ?.filter((item) => {
            const itemMonth = parseInt(item.data.split('-')[1]);
            return itemMonth === month.value;
          })
          .reduce((sum, item) => sum + parseFloat(item.valor.toString()), 0) || 0;

        const agua = aguaData
          ?.filter((item) => {
            const itemMonth = parseInt(item.data.split('-')[1]);
            return itemMonth === month.value;
          })
          .reduce((sum, item) => sum + parseFloat(item.valor.toString()), 0) || 0;

        return {
          mes: month.label,
          MOD: mod,
          MOI: moi,
          Manutencao: manut,
          Agua: agua,
        };
      });

      setData({
        totalFuncionarios: funcionariosCount || 0,
        totalLinhas: linhasCount || 0,
        totalGrupos: gruposCount || 0,
        totalMOD,
        totalMOI,
        totalManutencao,
        totalAgua,
        totalGeral: totalMOD + totalMOI + totalManutencao + totalAgua,
        chartData,
      });
    } catch (error) {
      console.error('Erro ao carregar resumo:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.company_id, selectedYear, supabase]);

  useEffect(() => {
    if (profile?.company_id) {
      void loadResumo();
    }
  }, [loadResumo, profile?.company_id]);

  return (
    <MainLayout title="Resumo">
      {/* Filtro de Ano */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-gray-600">Visão geral consolidada do sistema</p>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {getYearsList(selectedYear - 3, selectedYear + 1).map((year) => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>

      {loading && <p className="text-gray-600 mb-4">Carregando...</p>}

      {/* Cards de Estrutura */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatsCard
          title="Funcionários Ativos"
          value={data.totalFuncionarios}
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        <StatsCard
          title="Linhas de Produção"
          value={data.totalLinhas}
          icon={<Factory className="w-6 h-6" />}
          color="green"
        />
        <StatsCard
          title="Grupos"
          value={data.totalGrupos}
          icon={<FileText className="w-6 h-6" />}
          color="purple"
        />
      </div>

      {/* Cards de Custos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total M.O.D"
          value={formatCurrency(data.totalMOD)}
          icon={<DollarSign className="w-6 h-6" />}
          color="blue"
        />
        <StatsCard
          title="Total M.O.I"
          value={formatCurrency(data.totalMOI)}
          icon={<DollarSign className="w-6 h-6" />}
          color="purple"
        />
        <StatsCard
          title="Total Manutenção"
          value={formatCurrency(data.totalManutencao)}
          icon={<Wrench className="w-6 h-6" />}
          color="orange"
        />
        <StatsCard
          title="Total Água"
          value={formatCurrency(data.totalAgua)}
          icon={<Droplets className="w-6 h-6" />}
          color="blue"
        />
      </div>

      {/* Card Total Geral */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl shadow-sm p-6 mb-6">
        <p className="text-primary-100 text-sm font-medium">Total Geral de Custos - {selectedYear}</p>
        <p className="text-white text-4xl font-bold mt-1">{formatCurrency(data.totalGeral)}</p>
      </div>

      {/* Gráfico de Barras Comparativo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Comparativo Mensal - {selectedYear}</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis tickFormatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR')}`} />
              <Tooltip
                formatter={(value: unknown) =>
                  typeof value === 'number' || typeof value === 'string'
                    ? formatCurrency(value)
                    : formatCurrency(0)
                }
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="MOD" stackId="a" fill="#6366f1" name="M.O.D" radius={[0, 0, 0, 0]} />
              <Bar dataKey="MOI" stackId="a" fill="#a855f7" name="M.O.I" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Manutencao" stackId="a" fill="#f97316" name="Manutenção" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Agua" stackId="a" fill="#3b82f6" name="Água" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </MainLayout>
  );
}
