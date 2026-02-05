'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import DataTable, { Column } from '@/components/ui/DataTable';
import { FormModal } from '@/components/ui/Modal';
import { Plus, Pencil, Trash2, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api/client';
import { Encargo } from '@/types/database.types';

interface EncargoFormData {
  nome: string;
  percentual: number;
  descricao: string;
}

export default function EncargosPage() {
  const { canCreate, canEdit, canDelete } = useAuth();
  const [encargos, setEncargos] = useState<Encargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEncargo, setEditingEncargo] = useState<Encargo | null>(null);
  const [formData, setFormData] = useState<EncargoFormData>({
    nome: '',
    percentual: 0,
    descricao: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof EncargoFormData, string>>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    loadEncargos();
  }, []);

  const loadEncargos = async () => {
    try {
      setLoading(true);
      const data = await api.encargos.list();
      setEncargos(data);
    } catch (error) {
      console.error('Erro ao carregar encargos:', error);
      alert('Erro ao carregar encargos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingEncargo(null);
    setFormData({ nome: '', percentual: 0, descricao: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = (encargo: Encargo) => {
    setEditingEncargo(encargo);
    setFormData({
      nome: encargo.nome,
      percentual: parseFloat(encargo.percentual.toString()),
      descricao: encargo.descricao || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (encargo: Encargo) => {
    if (!confirm(`Tem certeza que deseja excluir o encargo "${encargo.nome}"?`)) {
      return;
    }

    try {
      await api.encargos.delete(encargo.id);
      await loadEncargos();
    } catch (error: unknown) {
      console.error('Erro ao excluir encargo:', error);
      const message = error instanceof Error ? error.message : 'Erro ao excluir encargo';
      alert(message);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof EncargoFormData, string>> = {};

    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    }

    if (formData.percentual < 0 || formData.percentual > 100) {
      errors.percentual = 'Percentual deve estar entre 0 e 100';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitLoading(true);

      if (editingEncargo) {
        await api.encargos.update(editingEncargo.id, formData);
      } else {
        await api.encargos.create(formData);
      }

      setIsModalOpen(false);
      await loadEncargos();
    } catch (error: unknown) {
      console.error('Erro ao salvar encargo:', error);
      const message = error instanceof Error ? error.message : 'Erro ao salvar encargo';
      alert(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handlePercentualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(',', '.');
    const num = parseFloat(value) || 0;
    setFormData({ ...formData, percentual: num });
  };

  // Calcular percentual total
  const totalPercentual = encargos.reduce(
    (sum, encargo) => sum + parseFloat(encargo.percentual.toString()),
    0
  );

  const columns: Column<Encargo>[] = [
    {
      key: 'nome',
      label: 'Nome',
      sortable: true,
    },
    {
      key: 'percentual',
      label: 'Percentual',
      sortable: true,
      render: (encargo) => `${parseFloat(encargo.percentual.toString()).toFixed(2)}%`,
    },
    {
      key: 'descricao',
      label: 'Descrição',
      render: (encargo) => encargo.descricao || '-',
    },
    {
      key: 'created_at',
      label: 'Criado em',
      sortable: true,
      render: (encargo) => new Date(encargo.created_at).toLocaleDateString('pt-BR'),
    },
  ];

  return (
    <MainLayout title="Encargos Trabalhistas">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">
            Configure os percentuais de encargos trabalhistas
          </p>
          {canCreate && (
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleCreate}
            >
              Novo Encargo
            </Button>
          )}
        </div>

        {/* Card de Informação */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">
              Sobre os encargos trabalhistas
            </h3>
            <p className="text-sm text-blue-700">
              Os encargos são percentuais aplicados sobre o salário base para calcular o custo
              total mensal de cada funcionário. Exemplos: INSS Patronal, FGTS, Férias, 13º Salário,
              Vale Transporte, etc.
            </p>
          </div>
        </div>

        {/* Total de Encargos */}
        {encargos.length > 0 && (
          <div className="mt-4 bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary-900">
                Percentual Total de Encargos:
              </span>
              <span className="text-2xl font-bold text-primary-600">
                {totalPercentual.toFixed(2)}%
              </span>
            </div>
            <p className="text-xs text-primary-700 mt-1">
              Um funcionário com salário de R$ 1.000,00 custará R${' '}
              {(1000 + (1000 * totalPercentual) / 100).toFixed(2)} mensalmente
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <p className="text-gray-600">Carregando...</p>
      ) : (
        <DataTable
          data={encargos}
          columns={columns}
          keyExtractor={(encargo) => encargo.id}
          searchKeys={['nome', 'descricao']}
          emptyMessage="Nenhum encargo cadastrado"
          actions={(encargo) => (
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  onClick={() => handleEdit(encargo)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => handleDelete(encargo)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        />
      )}

      {/* Modal de Criar/Editar */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingEncargo ? 'Editar Encargo' : 'Novo Encargo'}
        submitText={editingEncargo ? 'Salvar' : 'Criar'}
        isLoading={submitLoading}
      >
        <div className="space-y-4">
          {/* Exemplos de Encargos */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              Exemplos de encargos comuns:
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• INSS Patronal: 20%</li>
              <li>• FGTS: 8%</li>
              <li>• Férias + 1/3: 11,11%</li>
              <li>• 13º Salário: 8,33%</li>
              <li>• RAT (Risco Ambiental): 1% a 3%</li>
              <li>• Provisão de Rescisão: 5%</li>
            </ul>
          </div>

          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Encargo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                formErrors.nome ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: INSS Patronal"
            />
            {formErrors.nome && (
              <p className="mt-1 text-sm text-red-500">{formErrors.nome}</p>
            )}
          </div>

          {/* Percentual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Percentual (%) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                value={formData.percentual}
                onChange={handlePercentualChange}
                step="0.01"
                min="0"
                max="100"
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  formErrors.percentual ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: 20.00"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500">
                %
              </span>
            </div>
            {formErrors.percentual && (
              <p className="mt-1 text-sm text-red-500">{formErrors.percentual}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Digite o percentual de 0 a 100. Exemplo: 20 para 20%
            </p>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Descrição do encargo (opcional)"
            />
          </div>

          {/* Preview do Cálculo */}
          {formData.percentual > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-700 mb-2">
                Exemplo de cálculo:
              </p>
              <p className="text-xs text-gray-600">
                Salário base: R$ 1.000,00
                <br />
                {formData.nome || 'Encargo'}: R${' '}
                {((1000 * formData.percentual) / 100).toFixed(2)} ({formData.percentual}%)
                <br />
                <span className="font-semibold">
                  Total: R$ {(1000 + (1000 * formData.percentual) / 100).toFixed(2)}
                </span>
              </p>
            </div>
          )}
        </div>
      </FormModal>
    </MainLayout>
  );
}
