'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import DataTable, { Column } from '@/components/ui/DataTable';
import { FormModal } from '@/components/ui/Modal';
import Select, { SelectOption } from '@/components/ui/Select';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api/client';
import { Piece, Group } from '@/types/database.types';

interface PecaFormData {
  name: string;
  group_id: string;
  area_dm2: number;
  weight_kg: number;
  production_type: string;
}

export default function PecasPage() {
  const { canCreate } = useAuth();
  const [pecas, setPecas] = useState<Piece[]>([]);
  const [grupos, setGrupos] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<PecaFormData>({
    name: '',
    group_id: '',
    area_dm2: 0,
    weight_kg: 0,
    production_type: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof PecaFormData, string>>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pecasData, gruposData] = await Promise.all([
        api.pieces.list(),
        api.groups.list(),
      ]);
      setPecas(pecasData);
      setGrupos(gruposData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({ name: '', group_id: '', area_dm2: 0, weight_kg: 0, production_type: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof PecaFormData, string>> = {};
    if (!formData.name.trim()) errors.name = 'Nome é obrigatório';
    if (formData.area_dm2 <= 0) errors.area_dm2 = 'Área deve ser maior que zero';
    if (formData.weight_kg <= 0) errors.weight_kg = 'Peso deve ser maior que zero';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitLoading(true);
      await api.pieces.create(formData);
      setIsModalOpen(false);
      await loadData();
    } catch (error: unknown) {
      console.error('Erro ao salvar peça:', error);
      const message = error instanceof Error ? error.message : 'Erro ao salvar peça';
      alert(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const grupoOptions: SelectOption[] = grupos.map((grupo) => ({
    value: grupo.id,
    label: grupo.name,
  }));

  const columns: Column<Piece>[] = [
    { key: 'name', label: 'Nome', sortable: true },
    {
      key: 'group_id',
      label: 'Grupo',
      sortable: true,
      render: (peca) => {
        const grupo = grupos.find((g) => g.id === peca.group_id);
        return grupo?.name || '-';
      },
    },
    {
      key: 'area_dm2',
      label: 'Área (dm²)',
      sortable: true,
      render: (peca) => `${parseFloat(peca.area_dm2.toString()).toFixed(2)} dm²`,
    },
    {
      key: 'weight_kg',
      label: 'Peso (kg)',
      sortable: true,
      render: (peca) => `${parseFloat(peca.weight_kg.toString()).toFixed(2)} kg`,
    },
    {
      key: 'production_type',
      label: 'Tipo Produção',
      render: (peca) => peca.production_type || '-',
    },
    {
      key: 'created_at',
      label: 'Criado em',
      sortable: true,
      render: (peca) => new Date(peca.created_at).toLocaleDateString('pt-BR'),
    },
  ];

  return (
    <MainLayout title="Peça por Hora">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-gray-600">Cadastre e gerencie as peças de produção</p>
        {canCreate && (
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleCreate}>
            Nova Peça
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-600">Carregando...</p>
      ) : (
        <DataTable
          data={pecas}
          columns={columns}
          keyExtractor={(peca) => peca.id.toString()}
          searchKeys={['name', 'production_type']}
          emptyMessage="Nenhuma peça cadastrada"
        />
      )}

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        title="Nova Peça"
        submitText="Criar"
        isLoading={submitLoading}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  formErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: Tampa lateral"
              />
              {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
            </div>

            <div>
              <Select
                options={grupoOptions}
                value={formData.group_id}
                onChange={(value) => setFormData({ ...formData, group_id: value })}
                label="Grupo"
                searchable
                placeholder="Selecione o grupo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Produção
              </label>
              <input
                type="text"
                value={formData.production_type}
                onChange={(e) => setFormData({ ...formData, production_type: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ex: Montagem"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Área (dm²) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.area_dm2}
                onChange={(e) => setFormData({ ...formData, area_dm2: parseFloat(e.target.value) || 0 })}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  formErrors.area_dm2 ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {formErrors.area_dm2 && <p className="mt-1 text-sm text-red-500">{formErrors.area_dm2}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.weight_kg}
                onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) || 0 })}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  formErrors.weight_kg ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {formErrors.weight_kg && <p className="mt-1 text-sm text-red-500">{formErrors.weight_kg}</p>}
            </div>
          </div>
        </div>
      </FormModal>
    </MainLayout>
  );
}
