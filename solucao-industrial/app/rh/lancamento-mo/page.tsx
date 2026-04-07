'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import DataTable, { Column } from '@/components/ui/DataTable';
import { FormModal } from '@/components/ui/Modal';
import Select, { SelectOption } from '@/components/ui/Select';
import CurrencyInput from '@/components/ui/CurrencyInput';
import { Plus, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiComplete } from '@/lib/api/supabase-complete';
import { LancamentoMO, Employee, ProductionLine, Encargo } from '@/types/database.types';
import { formatCurrency, MONTHS } from '@/lib/utils';

interface LancamentoFormData {
  employee_id: string;
  production_line_id: string;
  tipo: 'MOD' | 'MOI';
  mes: number;
  ano: number;
  horas_trabalhadas: number;
  salario_base: number;
  custo_mensal: number;
  horas_extra_50: number;
  horas_extra_100: number;
  por_fora: number;
  insalubridade: boolean;
  observacao: string;
}

export default function LancamentoMOPage() {
  const { canCreate, user, loading: authLoading } = useAuth();
  const [lancamentos, setLancamentos] = useState<LancamentoMO[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [linhas, setLinhas] = useState<ProductionLine[]>([]);
  const [encargos, setEncargos] = useState<Encargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState<LancamentoFormData>({
    employee_id: '',
    production_line_id: '',
    tipo: 'MOD',
    mes: currentMonth,
    ano: currentYear,
    horas_trabalhadas: 220,
    salario_base: 0,
    custo_mensal: 0,
    horas_extra_50: 0,
    horas_extra_100: 0,
    por_fora: 0,
    insalubridade: false,
    observacao: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof LancamentoFormData, string>>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [lancamentosData, employeesData, linhasData, encargosData] = await Promise.all([
        apiComplete.lancamentoMO.list(),
        apiComplete.employees.list(),
        apiComplete.productionLines.list(),
        apiComplete.encargos.list(),
      ]);
      setLancamentos(lancamentosData);
      setEmployees(employeesData);
      setLinhas(linhasData);
      setEncargos(encargosData);
    } catch (error: unknown) {
      console.error('Erro ao carregar dados:', error);
      const message = error instanceof Error ? error.message : 'Erro ao carregar dados';
      if (message.includes('Usuário não autenticado')) return;
      alert('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    loadData();
  }, [authLoading, user, loadData]);

  const handleCreate = () => {
    setFormData({
      employee_id: '',
      production_line_id: '',
      tipo: 'MOD',
      mes: currentMonth,
      ano: currentYear,
      horas_trabalhadas: 220,
      salario_base: 0,
      custo_mensal: 0,
      horas_extra_50: 0,
      horas_extra_100: 0,
      por_fora: 0,
      insalubridade: false,
      observacao: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Busca percentual de um encargo pelo nome (exact first, then partial)
  const getEncargo = (nome: string): number => {
    const lower = nome.toLowerCase();
    const exact = encargos.find(e => e.nome.toLowerCase() === lower);
    if (exact) return exact.percentual / 100;
    const partial = encargos.find(e => e.nome.toLowerCase().includes(lower));
    return partial ? (partial.percentual / 100) : 0;
  };

  // Cálculos automáticos de encargos e hora extra
  const calcularCustos = (data: LancamentoFormData) => {
    const salario = data.salario_base;
    const horas = data.horas_trabalhadas || 220;
    const salHora = horas > 0 ? salario / horas : 0;

    // Percentuais dinâmicos da tabela encargos (configuráveis em RH > Encargos)
    const pctInss = getEncargo('INSS') || 0.10;
    const pctFgts = getEncargo('FGTS') || 0.08;
    const pctFerias = getEncargo('Férias') || getEncargo('Ferias') || (1/12);
    const pctTercoFerias = getEncargo('1/3 Férias') || (pctFerias / 3);
    const pctDecimoTerceiro = getEncargo('13º Salário') || getEncargo('13') || (1/12);
    const pctInsalubridade = getEncargo('Insalubridade') || 0.20;

    // Encargos / Provisões (custos adicionais da empresa)
    const fgts = salario * pctFgts;
    const ferias = salario * pctFerias;
    const tercoFerias = salario * pctTercoFerias;
    const decimoTerceiro = salario * pctDecimoTerceiro;
    const valorInsalubridade = data.insalubridade ? salario * pctInsalubridade : 0;

    // Desconto do holerite (retido do funcionário)
    const inss = salario * pctInss;

    // Total Geral (líquido do funcionário) = Salário - INSS + Insalubridade
    const totalGeral = salario - inss + valorInsalubridade;

    // Horas extras
    const valorHoraExtra50 = data.horas_extra_50 * salHora * 1.5;
    const valorHoraExtra100 = data.horas_extra_100 * salHora * 2.0;
    const totalHoraExtra = valorHoraExtra50 + valorHoraExtra100;

    // Custo Total (custo da empresa) = Salário + FGTS + Férias + 1/3 Férias + 13° + Insalubridade + Hora Extra + Por Fora
    const totalEncargosEmpresa = fgts + ferias + tercoFerias + decimoTerceiro + valorInsalubridade;
    const custoTotal = salario + totalEncargosEmpresa + totalHoraExtra + data.por_fora;

    return {
      salHora,
      inss,
      fgts,
      ferias,
      tercoFerias,
      decimoTerceiro,
      valorInsalubridade,
      totalEncargosEmpresa,
      totalGeral,
      valorHoraExtra50,
      valorHoraExtra100,
      totalHoraExtra,
      custoTotal,
      pctInss: pctInss * 100,
      pctFgts: pctFgts * 100,
      pctFerias: pctFerias * 100,
      pctInsalubridade: pctInsalubridade * 100,
    };
  };

  const custos = calcularCustos(formData);

  // Atualiza formData e recalcula custo_mensal
  const updateForm = (partial: Partial<LancamentoFormData>) => {
    setFormData((prev) => {
      const next = { ...prev, ...partial };
      const calc = calcularCustos(next);
      next.custo_mensal = Math.round(calc.custoTotal * 100) / 100;
      return next;
    });
  };

  // Quando seleciona funcionário, preenche salario_base automaticamente
  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    const salario = employee ? parseFloat(String(employee.salario_base ?? 0)) : 0;
    updateForm({ employee_id: employeeId, salario_base: salario });
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof LancamentoFormData, string>> = {};
    if (!formData.employee_id) errors.employee_id = 'Funcionário é obrigatório';
    if (!formData.production_line_id) errors.production_line_id = 'Linha é obrigatória';
    if (formData.salario_base <= 0) errors.salario_base = 'Salário deve ser maior que zero';
    if (formData.custo_mensal <= 0) errors.custo_mensal = 'Custo mensal deve ser maior que zero';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitLoading(true);
      const calc = calcularCustos(formData);
      const submitData = {
        ...formData,
        data_lancamento: `${formData.ano}-${String(formData.mes).padStart(2, '0')}-01`,
        valor_hora_extra: Math.round(calc.totalHoraExtra * 100) / 100,
        valor_insalubridade: Math.round(calc.valorInsalubridade * 100) / 100,
        total_encargos: Math.round(calc.totalEncargosEmpresa * 100) / 100,
        custo_mensal: Math.round(calc.custoTotal * 100) / 100,
      };
      await apiComplete.lancamentoMO.create(submitData);
      setIsModalOpen(false);
      await loadData();
    } catch (error: unknown) {
      console.error('Erro ao salvar lançamento:', error);
      const message = error instanceof Error ? error.message : 'Erro ao salvar lançamento';
      alert(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const employeeOptions: SelectOption[] = employees.map((emp) => ({
    value: emp.id,
    label: emp.nome,
  }));

  const linhaOptions: SelectOption[] = linhas.map((linha) => ({
    value: linha.id,
    label: linha.name,
  }));

  const tipoOptions: SelectOption[] = [
    { value: 'MOD', label: 'M.O.D - Mão de Obra Direta' },
    { value: 'MOI', label: 'M.O.I - Mão de Obra Indireta' },
  ];

  const mesOptions: SelectOption[] = MONTHS.map((m) => ({
    value: String(m.value),
    label: m.fullLabel,
  }));

  // Totais por tipo
  const totalMOD = lancamentos
    .filter((l) => l.tipo === 'MOD')
    .reduce((sum, l) => sum + parseFloat(String(l.custo_mensal ?? 0)), 0);

  const totalMOI = lancamentos
    .filter((l) => l.tipo === 'MOI')
    .reduce((sum, l) => sum + parseFloat(String(l.custo_mensal ?? 0)), 0);

  const columns: Column<LancamentoMO>[] = [
    {
      key: 'employee_id',
      label: 'Funcionário',
      sortable: true,
      render: (reg) => {
        const emp = employees.find((e) => e.id === reg.employee_id);
        return emp?.nome || '-';
      },
    },
    {
      key: 'production_line_id',
      label: 'Linha',
      render: (reg) => {
        const linha = linhas.find((l) => l.id === reg.production_line_id);
        return linha?.name || '-';
      },
    },
    {
      key: 'tipo',
      label: 'Tipo',
      sortable: true,
      render: (reg) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            reg.tipo === 'MOD' ? 'bg-primary-100 text-primary-700' : 'bg-secondary-100 text-secondary-700'
          }`}
        >
          {reg.tipo}
        </span>
      ),
    },
    {
      key: 'mes',
      label: 'Período',
      sortable: true,
      render: (reg) => {
        const mes = MONTHS.find((m) => m.value === reg.mes);
        return `${mes?.fullLabel || ''} / ${reg.ano}`;
      },
    },
    {
      key: 'salario_base',
      label: 'Salário Base',
      sortable: true,
      render: (reg) => formatCurrency(parseFloat(String(reg.salario_base ?? 0))),
    },
    {
      key: 'custo_mensal',
      label: 'Custo Mensal',
      sortable: true,
      render: (reg) => formatCurrency(parseFloat(String(reg.custo_mensal ?? 0))),
    },
    {
      key: 'observacao',
      label: 'Observação',
      render: (reg) => reg.observacao || '-',
    },
  ];

  return (
    <MainLayout title="Lançamento M.O">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">Registre os lançamentos de mão de obra</p>
          {canCreate && (
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleCreate}>
              Novo Lançamento
            </Button>
          )}
        </div>

        {/* Cards de Totais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total M.O.D</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalMOD)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total M.O.I</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalMOI)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Geral</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalMOD + totalMOI)}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Carregando...</p>
      ) : (
        <DataTable
          data={lancamentos}
          columns={columns}
          keyExtractor={(reg) => reg.id}
          searchKeys={['observacao']}
          emptyMessage="Nenhum lançamento registrado"
        />
      )}

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        title="Novo Lançamento M.O"
        submitText="Criar"
        isLoading={submitLoading}
        size="xl"
      >
        <div className="space-y-4">
          {/* Linha 1: Funcionário + Linha */}
          <div className="grid grid-cols-2 gap-4">
            <Select
              options={employeeOptions}
              value={formData.employee_id}
              onChange={handleEmployeeChange}
              label="Funcionário"
              required
              searchable
              error={formErrors.employee_id}
              placeholder="Selecione o funcionário"
            />
            <Select
              options={linhaOptions}
              value={formData.production_line_id}
              onChange={(value) => updateForm({ production_line_id: value })}
              label="Linha de Produção"
              required
              searchable
              error={formErrors.production_line_id}
              placeholder="Selecione a linha"
            />
          </div>

          {/* Linha 2: Tipo + Mês + Ano + Horas */}
          <div className="grid grid-cols-4 gap-4">
            <Select
              options={tipoOptions}
              value={formData.tipo}
              onChange={(value) => updateForm({ tipo: value as 'MOD' | 'MOI' })}
              label="Tipo"
              required
            />
            <Select
              options={mesOptions}
              value={String(formData.mes)}
              onChange={(value) => updateForm({ mes: parseInt(value) })}
              label="Mês"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
              <input
                type="number"
                value={formData.ano}
                onChange={(e) => updateForm({ ano: parseInt(e.target.value) || currentYear })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horas Trabalhadas</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.horas_trabalhadas}
                onChange={(e) => updateForm({ horas_trabalhadas: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Linha 3: Salário + Hora Extra + Por Fora + Insalubridade */}
          <div className="grid grid-cols-5 gap-4 items-end">
            <CurrencyInput
              value={formData.salario_base}
              onChange={(value) => updateForm({ salario_base: value })}
              label="Salário Base"
              required
              min={0}
              error={formErrors.salario_base}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora Extra 50%</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.horas_extra_50}
                onChange={(e) => updateForm({ horas_extra_50: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora Extra 100%</label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={formData.horas_extra_100}
                onChange={(e) => updateForm({ horas_extra_100: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0"
              />
            </div>
            <CurrencyInput
              value={formData.por_fora}
              onChange={(value) => updateForm({ por_fora: value })}
              label="Por Fora"
              min={0}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Insalubridade</label>
              <button
                type="button"
                onClick={() => updateForm({ insalubridade: !formData.insalubridade })}
                className={`w-14 h-8 rounded-full transition-colors ${formData.insalubridade ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`block w-6 h-6 bg-white rounded-full shadow transform transition-transform ${formData.insalubridade ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Painel de Cálculos */}
          {formData.salario_base > 0 && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-4">
              {/* Holerite - Líquido do Funcionário */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Holerite do Funcionário</h4>
                <div className="grid grid-cols-5 gap-3 text-center">
                  <div className="bg-white rounded-lg p-2 border">
                    <p className="text-[10px] text-gray-500">Horas Trab.</p>
                    <p className="text-sm font-bold">{formData.horas_trabalhadas}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border">
                    <p className="text-[10px] text-gray-500">Salário Bruto</p>
                    <p className="text-sm font-bold">{formatCurrency(formData.salario_base)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border">
                    <p className="text-[10px] text-gray-500">Sal/Hora</p>
                    <p className="text-sm font-bold">{formatCurrency(custos.salHora)}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-2 border border-red-200">
                    <p className="text-[10px] text-red-500 font-semibold">INSS ({custos.pctInss.toFixed(0)}%)</p>
                    <p className="text-sm font-bold text-red-600">-{formatCurrency(custos.inss)}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                    <p className="text-[10px] text-blue-600 font-semibold">Total Geral</p>
                    <p className="text-sm font-bold text-blue-700">{formatCurrency(custos.totalGeral)}</p>
                  </div>
                </div>
              </div>

              {/* Custo Empresa */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Custo para Empresa</h4>
                <div className="grid grid-cols-5 gap-3 text-center">
                  <div className="bg-white rounded-lg p-2 border">
                    <p className="text-[10px] text-gray-500">Salário</p>
                    <p className="text-sm font-bold">{formatCurrency(formData.salario_base)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border">
                    <p className="text-[10px] text-gray-500">FGTS ({custos.pctFgts.toFixed(0)}%)</p>
                    <p className="text-sm font-bold">{formatCurrency(custos.fgts)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border">
                    <p className="text-[10px] text-gray-500">Férias ({custos.pctFerias.toFixed(1)}%)</p>
                    <p className="text-sm font-bold">{formatCurrency(custos.ferias)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border">
                    <p className="text-[10px] text-gray-500">1/3 Férias</p>
                    <p className="text-sm font-bold">{formatCurrency(custos.tercoFerias)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border">
                    <p className="text-[10px] text-gray-500">13° (1/12)</p>
                    <p className="text-sm font-bold">{formatCurrency(custos.decimoTerceiro)}</p>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-3 text-center mt-2">
                  <div className="bg-white rounded-lg p-2 border">
                    <p className="text-[10px] text-gray-500">Insalubridade ({custos.pctInsalubridade.toFixed(0)}%)</p>
                    <p className="text-sm font-bold">{formatCurrency(custos.valorInsalubridade)}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                    <p className="text-[10px] text-green-600 font-semibold">Total Encargos</p>
                    <p className="text-sm font-bold text-green-700">+{formatCurrency(custos.totalEncargosEmpresa)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 border" />
                  <div className="bg-white rounded-lg p-2 border" />
                  <div className="bg-white rounded-lg p-2 border" />
                </div>
              </div>

              {/* Hora Extra */}
              {(formData.horas_extra_50 > 0 || formData.horas_extra_100 > 0) && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Horas Extras</h4>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div className="bg-white rounded-lg p-2 border">
                      <p className="text-[10px] text-gray-500">Horas Trab.</p>
                      <p className="text-sm font-bold">{formData.horas_trabalhadas}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                      <p className="text-[10px] text-green-600 font-semibold">Valor Hora 50%</p>
                      <p className="text-sm font-bold text-green-700">{formatCurrency(custos.valorHoraExtra50)}</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                      <p className="text-[10px] text-green-600 font-semibold">Valor Hora 100%</p>
                      <p className="text-sm font-bold text-green-700">{formatCurrency(custos.valorHoraExtra100)}</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-2 border border-orange-200">
                      <p className="text-[10px] text-orange-600 font-semibold">Total Hora Extra</p>
                      <p className="text-sm font-bold text-orange-700">{formatCurrency(custos.totalHoraExtra)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Custo Total */}
              <div className="bg-primary-50 rounded-lg p-3 border border-primary-200 flex items-center justify-between">
                <span className="text-sm font-semibold text-primary-700">Custo Total</span>
                <span className="text-xl font-bold text-primary-800">{formatCurrency(custos.custoTotal)}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
            <textarea
              value={formData.observacao}
              onChange={(e) => updateForm({ observacao: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Observações adicionais (opcional)"
            />
          </div>
        </div>
      </FormModal>
    </MainLayout>
  );
}
