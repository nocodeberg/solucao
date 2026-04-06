'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import DataTable, { Column } from '@/components/ui/DataTable';
import { FormModal } from '@/components/ui/Modal';
import CurrencyInput from '@/components/ui/CurrencyInput';
import DatePicker from '@/components/ui/DatePicker';
import { Plus, TrendingDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiComplete } from '@/lib/api/supabase-complete';
import { Investimento, ProductionLine } from '@/types/database.types';
import { formatCurrency } from '@/lib/utils';

interface FormData {
  production_line_id: string;
  equipamento: string;
  descricao: string;
  valor_investimento: number;
  depreciacao_meses: number;
  data_aquisicao: string;
  observacao: string;
}

export default function InvestimentosPage() {
  const { canCreate, user, loading: authLoading } = useAuth();
  const [registros, setRegistros] = useState<Investimento[]>([]);
  const [linhas, setLinhas] = useState<ProductionLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    production_line_id: '', equipamento: '', descricao: '', valor_investimento: 0, depreciacao_meses: 12,
    data_aquisicao: new Date().toISOString().split('T')[0], observacao: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (authLoading || !user) { setLoading(false); return; }
    try {
      setLoading(true);
      const [inv, lines] = await Promise.all([
        apiComplete.investimentos.list(),
        apiComplete.productionLines.list(),
      ]);
      setRegistros(inv);
      setLinhas(lines);
    } catch (error: unknown) {
      console.error('Erro ao carregar dados:', error);
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('Usuário não autenticado')) return;
      alert('Erro ao carregar investimentos');
    } finally {
      setLoading(false);
    }
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    loadData();
  }, [authLoading, user, loadData]);

  const handleCreate = () => {
    setFormData({
      production_line_id: '', equipamento: '', descricao: '', valor_investimento: 0,
      depreciacao_meses: 12, data_aquisicao: new Date().toISOString().split('T')[0], observacao: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.equipamento.trim()) errors.equipamento = 'Equipamento é obrigatório';
    if (formData.valor_investimento <= 0) errors.valor_investimento = 'Valor deve ser maior que zero';
    if (formData.depreciacao_meses <= 0) errors.depreciacao_meses = 'Depreciação deve ser maior que zero';
    if (!formData.data_aquisicao) errors.data_aquisicao = 'Data é obrigatória';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setSubmitLoading(true);
      const payload: any = { ...formData };
      if (!payload.production_line_id) delete payload.production_line_id;
      await apiComplete.investimentos.create(payload);
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
    if (!confirm('Deseja excluir este investimento?')) return;
    try {
      await apiComplete.investimentos.delete(id);
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir investimento');
    }
  };

  const totalInvestimento = registros.reduce((s, r) => s + parseFloat(String(r.valor_investimento ?? 0)), 0);
  const totalMensal = registros.reduce((s, r) => s + parseFloat(String(r.valor_mensal ?? 0)), 0);

  // Verificar status: vencido ou ativo
  const hoje = new Date().toISOString().split('T')[0];
  const getStatus = (r: Investimento) => {
    if (!r.data_vencimento) return 'ativo';
    return r.data_vencimento < hoje ? 'vencido' : 'ativo';
  };

  const columns: Column<Investimento>[] = [
    {
      key: 'equipamento',
      label: 'Equipamento',
      sortable: true,
    },
    {
      key: 'production_line_id',
      label: 'Linha',
      render: (r: any) => r.production_line?.name || '-',
    },
    {
      key: 'valor_investimento',
      label: 'Investimento',
      sortable: true,
      render: (r) => formatCurrency(parseFloat(String(r.valor_investimento ?? 0))),
    },
    {
      key: 'depreciacao_meses',
      label: 'Depreciação',
      render: (r) => `${r.depreciacao_meses} meses`,
    },
    {
      key: 'valor_mensal',
      label: 'Valor/Mês',
      sortable: true,
      render: (r) => formatCurrency(parseFloat(String(r.valor_mensal ?? 0))),
    },
    {
      key: 'data_aquisicao',
      label: 'Aquisição',
      sortable: true,
      render: (r) => new Date(r.data_aquisicao + 'T00:00:00').toLocaleDateString('pt-BR'),
    },
    {
      key: 'data_vencimento',
      label: 'Vencimento',
      render: (r) => r.data_vencimento ? new Date(r.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR') : '-',
    },
    {
      key: 'id',
      label: 'Status',
      render: (r) => {
        const status = getStatus(r);
        return (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status === 'vencido' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {status === 'vencido' ? 'Vencido' : 'Ativo'}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      label: 'Ações',
      render: (r) => (
        <button onClick={() => handleDelete(r.id)} className="text-red-500 hover:text-red-700 text-sm">Excluir</button>
      ),
    },
  ];

  // Valor mensal calc preview
  const previewValorMensal = formData.valor_investimento > 0 && formData.depreciacao_meses > 0
    ? formData.valor_investimento / formData.depreciacao_meses
    : 0;

  return (
    <MainLayout title="Investimentos">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">Equipamentos e depreciação por linha</p>
          {canCreate && (
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleCreate}>Novo Investimento</Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Investido</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalInvestimento)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Depreciação Total Mensal</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalMensal)}</p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Carregando...</p>
      ) : (
        <DataTable data={registros} columns={columns} keyExtractor={(r) => r.id} searchKeys={['equipamento', 'descricao']} emptyMessage="Nenhum investimento cadastrado" />
      )}

      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSubmit} title="Novo Investimento" submitText="Criar" isLoading={submitLoading}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Linha de Produção</label>
            <select value={formData.production_line_id} onChange={(e) => setFormData({ ...formData, production_line_id: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Geral (sem linha)</option>
              {linhas.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipamento <span className="text-red-500">*</span></label>
            <input type="text" value={formData.equipamento} onChange={(e) => setFormData({ ...formData, equipamento: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${formErrors.equipamento ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Ex: Retificador" />
            {formErrors.equipamento && <p className="mt-1 text-sm text-red-500">{formErrors.equipamento}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <CurrencyInput value={formData.valor_investimento} onChange={(v) => setFormData({ ...formData, valor_investimento: v })} label="Valor Investimento" required min={0} error={formErrors.valor_investimento} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Depreciação (meses) <span className="text-red-500">*</span></label>
              <input type="number" value={formData.depreciacao_meses} onChange={(e) => setFormData({ ...formData, depreciacao_meses: parseInt(e.target.value) || 0 })}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${formErrors.depreciacao_meses ? 'border-red-500' : 'border-gray-300'}`}
                min={1} />
              {formErrors.depreciacao_meses && <p className="mt-1 text-sm text-red-500">{formErrors.depreciacao_meses}</p>}
            </div>
          </div>
          {previewValorMensal > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                Valor mensal calculado: <strong>{formatCurrency(previewValorMensal)}</strong>
              </p>
            </div>
          )}
          <DatePicker value={formData.data_aquisicao} onChange={(d) => setFormData({ ...formData, data_aquisicao: d })} label="Data de Aquisição" required error={formErrors.data_aquisicao} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input type="text" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Descrição (opcional)" />
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
