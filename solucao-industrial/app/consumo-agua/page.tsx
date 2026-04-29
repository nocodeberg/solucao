'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import DataTable, { Column } from '@/components/ui/DataTable';
import { FormModal } from '@/components/ui/Modal';
import DatePicker from '@/components/ui/DatePicker';
import CurrencyInput from '@/components/ui/CurrencyInput';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiComplete } from '@/lib/api/supabase-complete';
import { useAuditLog } from '@/hooks/useAuditLog';
import { ConsumoAgua } from '@/types/database.types';
import { formatCurrency } from '@/lib/utils';

interface ConsumoAguaFormData {
  descricao: string;
  valor: number;
  data: string;
  observacao: string;
}

export default function ConsumoAguaPage() {
  const { canCreate, user, loading: authLoading } = useAuth();
  const audit = useAuditLog();
  const [registros, setRegistros] = useState<ConsumoAgua[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<ConsumoAguaFormData>({
    descricao: '',
    valor: 0,
    data: new Date().toISOString().split('T')[0],
    observacao: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ConsumoAguaFormData, string>>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await apiComplete.consumoAgua.list();
      setRegistros(data);
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
    setEditingId(null);
    setFormData({
      descricao: '',
      valor: 0,
      data: new Date().toISOString().split('T')[0],
      observacao: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = (reg: ConsumoAgua) => {
    setEditingId(reg.id);
    setFormData({
      descricao: reg.descricao || '',
      valor: parseFloat(String(reg.valor ?? 0)),
      data: reg.data || new Date().toISOString().split('T')[0],
      observacao: reg.observacao || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (reg: ConsumoAgua) => {
    if (!confirm(`Tem certeza que deseja excluir "${reg.descricao}"?`)) return;
    try {
      await apiComplete.consumoAgua.delete(reg.id);
      await audit.log('DELETE', 'Custo Variável', `Excluiu custo variável "${reg.descricao}"`, reg.id);
      await loadData();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir';
      alert(message);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ConsumoAguaFormData, string>> = {};
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
      if (editingId) {
        await apiComplete.consumoAgua.update(editingId, formData);
        await audit.log('UPDATE', 'Custo Variável', `Editou custo variável "${formData.descricao}"`, editingId);
      } else {
        const result = await apiComplete.consumoAgua.create(formData);
        await audit.log('CREATE', 'Custo Variável', `Criou custo variável "${formData.descricao}"`, result?.id);
      }
      setEditingId(null);
      setIsModalOpen(false);
      await loadData();
    } catch (error: unknown) {
      console.error('Erro ao salvar custo variável:', error);
      const message = error instanceof Error ? error.message : 'Erro ao salvar custo variável';
      alert(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns: Column<ConsumoAgua>[] = [
    {
      key: 'data',
      label: 'Data',
      sortable: true,
      render: (reg) => new Date(reg.data + 'T00:00:00').toLocaleDateString('pt-BR'),
    },
    { key: 'descricao', label: 'Descrição', sortable: true },
    {
      key: 'valor',
      label: 'Valor',
      sortable: true,
      render: (reg) => formatCurrency(parseFloat(String(reg.valor ?? 0))),
    },
    {
      key: 'observacao',
      label: 'Observação',
      render: (reg) => reg.observacao || '-',
    },
  ];

  return (
    <MainLayout title="Custo Variável">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">Registre e acompanhe os custos variáveis</p>
          {canCreate && (
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleCreate}>
              Novo Registro
            </Button>
          )}
        </div>

      </div>

      {loading ? (
        <p className="text-gray-600">Carregando...</p>
      ) : (
        <DataTable
          data={registros}
          columns={columns}
          keyExtractor={(reg) => reg.id}
          searchKeys={['descricao', 'observacao']}
          emptyMessage="Nenhum registro de custo variável"
          actions={(reg) => (
            <div className="flex items-center justify-end gap-1">
              <button onClick={() => handleEdit(reg)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(reg)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Excluir">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      )}

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingId ? 'Editar Custo Variável' : 'Novo Custo Variável'}
        submitText={editingId ? 'Salvar' : 'Criar'}
        isLoading={submitLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                formErrors.descricao ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: Conta de água - Janeiro"
            />
            {formErrors.descricao && <p className="mt-1 text-sm text-red-500">{formErrors.descricao}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <CurrencyInput
                value={formData.valor}
                onChange={(value) => setFormData({ ...formData, valor: value })}
                label="Valor"
                required
                min={0}
                error={formErrors.valor}
              />
            </div>

            <div>
              <DatePicker
                value={formData.data}
                onChange={(date) => setFormData({ ...formData, data: date })}
                label="Data"
                required
                error={formErrors.data}
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
