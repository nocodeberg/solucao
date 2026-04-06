'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import DataTable, { Column } from '@/components/ui/DataTable';
import { FormModal } from '@/components/ui/Modal';
import CurrencyInput from '@/components/ui/CurrencyInput';
import { Plus, Receipt } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiComplete } from '@/lib/api/supabase-complete';
import { OutroCusto } from '@/types/database.types';
import { formatCurrency, MONTHS } from '@/lib/utils';

const CATEGORIAS = [
  { value: 'EPI', label: 'EPI' },
  { value: 'MANUT_CORRETIVA', label: 'Prod. Manutenção Corretiva' },
  { value: 'VALE_REFEICAO', label: 'Vale Refeição' },
  { value: 'MATERIAL_ESCRITORIO', label: 'Material de Escritório' },
  { value: 'REAGENTES_LAB', label: 'Equip. para Lab. (Reagentes, Vidrarias)' },
  { value: 'CUSTO_ADM', label: 'Custo ADM' },
  { value: 'ALIMENTACAO', label: 'Alimentação' },
  { value: 'OUTROS', label: 'Outros' },
] as const;

const getCategoriaLabel = (val: string) => CATEGORIAS.find(c => c.value === val)?.label || val;

interface FormData {
  categoria: string;
  descricao: string;
  valor: number;
  mes: number;
  ano: number;
  observacao: string;
}

export default function OutrosCustosPage() {
  const { canCreate, user, loading: authLoading } = useAuth();
  const [registros, setRegistros] = useState<OutroCusto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const currentMonth = new Date().getMonth() + 1;
  const [formData, setFormData] = useState<FormData>({
    categoria: 'EPI', descricao: '', valor: 0, mes: currentMonth, ano: selectedYear, observacao: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (authLoading || !user) { setLoading(false); return; }
    try {
      setLoading(true);
      const data = await apiComplete.outrosCustos.list(selectedYear);
      setRegistros(data);
    } catch (error: unknown) {
      console.error('Erro ao carregar dados:', error);
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('Usuário não autenticado')) return;
      alert('Erro ao carregar outros custos');
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
    setFormData({ categoria: 'EPI', descricao: '', valor: 0, mes: currentMonth, ano: selectedYear, observacao: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.categoria) errors.categoria = 'Categoria é obrigatória';
    if (!formData.descricao.trim()) errors.descricao = 'Descrição é obrigatória';
    if (formData.valor <= 0) errors.valor = 'Valor deve ser maior que zero';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setSubmitLoading(true);
      await apiComplete.outrosCustos.create(formData);
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
      await apiComplete.outrosCustos.delete(id);
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir registro');
    }
  };

  const totalGeral = registros.reduce((s, r) => s + parseFloat(String(r.valor ?? 0)), 0);

  // Resumo por categoria
  const resumoCategoria = CATEGORIAS.map(cat => ({
    categoria: cat.label,
    total: registros.filter(r => r.categoria === cat.value).reduce((s, r) => s + parseFloat(String(r.valor ?? 0)), 0),
  })).filter(r => r.total > 0);

  const columns: Column<OutroCusto>[] = [
    {
      key: 'mes',
      label: 'Mês',
      sortable: true,
      render: (r) => MONTHS.find(m => m.value === r.mes)?.label || `${r.mes}`,
    },
    {
      key: 'categoria',
      label: 'Categoria',
      sortable: true,
      render: (r) => getCategoriaLabel(r.categoria),
    },
    { key: 'descricao', label: 'Descrição', sortable: true },
    {
      key: 'valor',
      label: 'Valor',
      sortable: true,
      render: (r) => formatCurrency(parseFloat(String(r.valor ?? 0))),
    },
    {
      key: 'id',
      label: 'Ações',
      render: (r) => (
        <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700 text-sm">Excluir</button>
      ),
    },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <MainLayout title="Outros Custos">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <p className="text-gray-600">EPI, Manutenção Corretiva, Vale Refeição, etc.</p>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {canCreate && (
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleCreate}>Novo Registro</Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Outros Custos - {selectedYear}</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalGeral)}</p>
            </div>
          </div>
          {resumoCategoria.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <p className="text-sm font-medium text-gray-600 mb-2">Por Categoria</p>
              <div className="space-y-1">
                {resumoCategoria.map((r, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-gray-600">{r.categoria}</span>
                    <span className="font-medium">{formatCurrency(r.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Carregando...</p>
      ) : (
        <DataTable data={registros} columns={columns} keyExtractor={(r) => r.id} searchKeys={['descricao', 'categoria']} emptyMessage="Nenhum registro de outros custos" />
      )}

      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} title="Novo Custo" submitText="Criar" isLoading={submitLoading}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria <span className="text-red-500">*</span></label>
            <select value={formData.categoria} onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${formErrors.categoria ? 'border-red-500' : 'border-gray-300'}`}>
              {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição <span className="text-red-500">*</span></label>
            <input type="text" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${formErrors.descricao ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Ex: EPI - Luvas descartáveis" />
            {formErrors.descricao && <p className="mt-1 text-sm text-red-500">{formErrors.descricao}</p>}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <CurrencyInput value={formData.valor} onChange={(v) => setFormData({ ...formData, valor: v })} label="Valor" required min={0} error={formErrors.valor} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
              <select value={formData.mes} onChange={(e) => setFormData({ ...formData, mes: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
              <input type="number" value={formData.ano} onChange={(e) => setFormData({ ...formData, ano: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
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
