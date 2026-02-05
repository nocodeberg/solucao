'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import DataTable, { Column } from '@/components/ui/DataTable';
import { FormModal } from '@/components/ui/Modal';
import Select, { SelectOption } from '@/components/ui/Select';
import CurrencyInput from '@/components/ui/CurrencyInput';
import { Plus, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api/client';
import { LancamentoMO, Employee, ProductionLine } from '@/types/database.types';
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
  observacao: string;
}

export default function LancamentoMOPage() {
  const { canCreate } = useAuth();
  const [lancamentos, setLancamentos] = useState<LancamentoMO[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [linhas, setLinhas] = useState<ProductionLine[]>([]);
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
    horas_trabalhadas: 0,
    salario_base: 0,
    custo_mensal: 0,
    observacao: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof LancamentoFormData, string>>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lancamentosData, employeesData, linhasData] = await Promise.all([
        api.lancamentoMO.list(),
        api.employees.list(),
        api.productionLines.list(),
      ]);
      setLancamentos(lancamentosData);
      setEmployees(employeesData);
      setLinhas(linhasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      employee_id: '',
      production_line_id: '',
      tipo: 'MOD',
      mes: currentMonth,
      ano: currentYear,
      horas_trabalhadas: 0,
      salario_base: 0,
      custo_mensal: 0,
      observacao: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Quando seleciona funcionário, preenche salario_base automaticamente
  const handleEmployeeChange = (employeeId: string) => {
    setFormData((prev) => {
      const employee = employees.find((e) => e.id === employeeId);
      const salario = employee ? parseFloat(employee.salario_base.toString()) : 0;
      return {
        ...prev,
        employee_id: employeeId,
        salario_base: salario,
        custo_mensal: salario,
      };
    });
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
      const submitData = {
        ...formData,
        data_lancamento: `${formData.ano}-${String(formData.mes).padStart(2, '0')}-01`,
      };
      await api.lancamentoMO.create(submitData);
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
    .reduce((sum, l) => sum + parseFloat(l.custo_mensal.toString()), 0);

  const totalMOI = lancamentos
    .filter((l) => l.tipo === 'MOI')
    .reduce((sum, l) => sum + parseFloat(l.custo_mensal.toString()), 0);

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
      render: (reg) => formatCurrency(parseFloat(reg.salario_base.toString())),
    },
    {
      key: 'custo_mensal',
      label: 'Custo Mensal',
      sortable: true,
      render: (reg) => formatCurrency(parseFloat(reg.custo_mensal.toString())),
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
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
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
            </div>

            <div>
              <Select
                options={linhaOptions}
                value={formData.production_line_id}
                onChange={(value) => setFormData({ ...formData, production_line_id: value })}
                label="Linha de Produção"
                required
                searchable
                error={formErrors.production_line_id}
                placeholder="Selecione a linha"
              />
            </div>

            <div>
              <Select
                options={tipoOptions}
                value={formData.tipo}
                onChange={(value) => setFormData({ ...formData, tipo: value as 'MOD' | 'MOI' })}
                label="Tipo"
                required
              />
            </div>

            <div>
              <Select
                options={mesOptions}
                value={String(formData.mes)}
                onChange={(value) => setFormData({ ...formData, mes: parseInt(value) })}
                label="Mês"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
              <input
                type="number"
                value={formData.ano}
                onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) || currentYear })}
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
                onChange={(e) => setFormData({ ...formData, horas_trabalhadas: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0"
              />
            </div>

            <div>
              <CurrencyInput
                value={formData.salario_base}
                onChange={(value) => setFormData({ ...formData, salario_base: value })}
                label="Salário Base"
                required
                min={0}
                error={formErrors.salario_base}
              />
            </div>

            <div className="col-span-2">
              <CurrencyInput
                value={formData.custo_mensal}
                onChange={(value) => setFormData({ ...formData, custo_mensal: value })}
                label="Custo Mensal"
                required
                min={0}
                error={formErrors.custo_mensal}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
            <textarea
              value={formData.observacao}
              onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Observações adicionais (opcional)"
            />
          </div>
        </div>
      </FormModal>
    </MainLayout>
  );
}
