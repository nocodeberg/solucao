'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import DataTable, { Column } from '@/components/ui/DataTable';
import { FormModal } from '@/components/ui/Modal';
import DatePicker from '@/components/ui/DatePicker';
import CurrencyInput from '@/components/ui/CurrencyInput';
import { Plus, Droplets } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api/client';
import { ConsumoAgua } from '@/types/database.types';
import { formatCurrency } from '@/lib/utils';

interface ConsumoAguaFormData {
  descricao: string;
  valor: number;
  data: string;
  observacao: string;
}

export default function ConsumoAguaPage() {
  const { canCreate } = useAuth();
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.consumoAgua.list();
      setRegistros(data);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      descricao: '',
      valor: 0,
      data: new Date().toISOString().split('T')[0],
      observacao: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
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
      await api.consumoAgua.create(formData);
      setIsModalOpen(false);
      await loadData();
    } catch (error: unknown) {
      console.error('Erro ao salvar consumo de água:', error);
      const message = error instanceof Error ? error.message : 'Erro ao salvar consumo';
      alert(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Total de custos
  const totalConsumo = registros.reduce(
    (sum, reg) => sum + parseFloat(reg.valor.toString()),
    0
  );

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
      render: (reg) => formatCurrency(parseFloat(reg.valor.toString())),
    },
    {
      key: 'observacao',
      label: 'Observação',
      render: (reg) => reg.observacao || '-',
    },
  ];

  return (
    <MainLayout title="Consumo de Água">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">Registre e acompanhe os custos de consumo de água</p>
          {canCreate && (
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleCreate}>
              Novo Registro
            </Button>
          )}
        </div>

        {/* Card de Total */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Consumo de Água</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalConsumo)}</p>
          </div>
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
          emptyMessage="Nenhum registro de consumo de água"
        />
      )}

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        title="Novo Registro de Consumo"
        submitText="Criar"
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
