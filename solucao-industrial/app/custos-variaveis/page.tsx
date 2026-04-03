'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import DataTable, { Column } from '@/components/ui/DataTable';
import { FormModal } from '@/components/ui/Modal';
import DatePicker from '@/components/ui/DatePicker';
import CurrencyInput from '@/components/ui/CurrencyInput';
import { Plus, Zap, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiComplete } from '@/lib/api/supabase-complete';
import { CustoVariavel } from '@/types/database.types';
import { formatCurrency, MONTHS } from '@/lib/utils';

const CATEGORIAS = [
  { value: 'ENERGIA', label: 'Energia Elétrica', icon: Zap },
  { value: 'TELEFONE', label: 'Telefonia', icon: Phone },
] as const;

interface FormData {
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  observacao: string;
}

export default function CustosVariaveisPage() {
  const { canCreate, user, loading: authLoading } = useAuth();
  const [registros, setRegistros] = useState<CustoVariavel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState<FormData>({
    categoria: 'ENERGIA',
    descricao: '',
    valor: 0,
    data: new Date().toISOString().split('T')[0],
    observacao: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (authLoading || !user) { setLoading(false); return; }
    try {
      setLoading(true);
      const data = await apiComplete.custosVariaveis.list(selectedYear);
      setRegistros(data);
    } catch (error: unknown) {
      console.error('Erro ao carregar dados:', error);
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('Usuário não autenticado')) return;
      alert('Erro ao carregar custos variáveis');
    } finally {
      setLoading(false);
    }
  }, [authLoading, user, selectedYear]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    loadData();
  }, [authLoading, user, loadData]);

  const handleCreate = () => {
    setFormData({ categoria: 'ENERGIA', descricao: '', valor: 0, data: new Date().toISOString().split('T')[0], observacao: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.categoria) errors.categoria = 'Categoria é obrigatória';
    if (!formData.descricao.trim()) errors.descricao = 'Descrição é obrigatória';
    if (formData.valor <= 0) errors.valor = 'Valor deve ser maior que zero';
    if (!formData.data) errors.data = 'Data é obrigatória';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setSubmitLoading(true);
      await apiComplete.custosVariaveis.create(formData);
      setIsModalOpen(false);
      await loadData();
    } catch (error: unknown) {
      console.error('Erro ao salvar:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este registro?')) return;
    try {
      await apiComplete.custosVariaveis.delete(id);
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir registro');
    }
  };

  // Totais por categoria
  const totalEnergia = registros.filter(r => r.categoria === 'ENERGIA').reduce((s, r) => s + parseFloat(r.valor.toString()), 0);
  const totalTelefone = registros.filter(r => r.categoria === 'TELEFONE').reduce((s, r) => s + parseFloat(r.valor.toString()), 0);
  const totalGeral = totalEnergia + totalTelefone;

  // Resumo mensal
  const resumoMensal = MONTHS.map(m => {
    const mesRegistros = registros.filter(r => {
      const d = new Date(r.data + 'T00:00:00');
      return d.getMonth() + 1 === m.value;
    });
    return {
      mes: m.label,
      energia: mesRegistros.filter(r => r.categoria === 'ENERGIA').reduce((s, r) => s + parseFloat(r.valor.toString()), 0),
      telefone: mesRegistros.filter(r => r.categoria === 'TELEFONE').reduce((s, r) => s + parseFloat(r.valor.toString()), 0),
    };
  });

  const columns: Column<CustoVariavel>[] = [
    {
      key: 'data',
      label: 'Data',
      sortable: true,
      render: (r) => new Date(r.data + 'T00:00:00').toLocaleDateString('pt-BR'),
    },
    {
      key: 'categoria',
      label: 'Categoria',
      sortable: true,
      render: (r) => CATEGORIAS.find(c => c.value === r.categoria)?.label || r.categoria,
    },
    { key: 'descricao', label: 'Descrição', sortable: true },
    {
      key: 'valor',
      label: 'Valor',
      sortable: true,
      render: (r) => formatCurrency(parseFloat(r.valor.toString())),
    },
    {
      key: 'id',
      label: 'Ações',
      render: (r) => (
        <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700 text-sm">
          Excluir
        </button>
      ),
    },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <MainLayout title="Custos Variáveis">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <p className="text-gray-600">Energia Elétrica e Telefonia</p>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {canCreate && (
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleCreate}>
              Novo Registro
            </Button>
          )}
        </div>

        {/* Cards de Total */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-white">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Energia</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalEnergia)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
              <Phone className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Telefonia</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalTelefone)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Geral</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalGeral)}</p>
            </div>
          </div>
        </div>

        {/* Resumo Mensal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6 overflow-x-auto">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumo Mensal - {selectedYear}</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2 text-gray-500">Mês</th>
                <th className="text-right py-2 px-2 text-gray-500">Energia</th>
                <th className="text-right py-2 px-2 text-gray-500">Telefone</th>
                <th className="text-right py-2 px-2 text-gray-500 font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {resumoMensal.map((m, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-1.5 px-2 text-gray-700">{m.mes}</td>
                  <td className="py-1.5 px-2 text-right">{formatCurrency(m.energia)}</td>
                  <td className="py-1.5 px-2 text-right">{formatCurrency(m.telefone)}</td>
                  <td className="py-1.5 px-2 text-right font-semibold">{formatCurrency(m.energia + m.telefone)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Carregando...</p>
      ) : (
        <DataTable data={registros} columns={columns} keyExtractor={(r) => r.id} searchKeys={['descricao', 'categoria']} emptyMessage="Nenhum registro de custo variável" />
      )}

      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} title="Novo Custo Variável" submitText="Criar" isLoading={submitLoading}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria <span className="text-red-500">*</span></label>
            <select
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${formErrors.categoria ? 'border-red-500' : 'border-gray-300'}`}
            >
              {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição <span className="text-red-500">*</span></label>
            <input type="text" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${formErrors.descricao ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Ex: Conta de luz - Janeiro" />
            {formErrors.descricao && <p className="mt-1 text-sm text-red-500">{formErrors.descricao}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <CurrencyInput value={formData.valor} onChange={(v) => setFormData({ ...formData, valor: v })} label="Valor" required min={0} error={formErrors.valor} />
            <DatePicker value={formData.data} onChange={(d) => setFormData({ ...formData, data: d })} label="Data" required error={formErrors.data} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
            <textarea value={formData.observacao} onChange={(e) => setFormData({ ...formData, observacao: e.target.value })} rows={2}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Observações (opcional)" />
          </div>
        </div>
      </FormModal>
    </MainLayout>
  );
}
