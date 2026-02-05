'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import DataTable, { Column } from '@/components/ui/DataTable';
import { FormModal } from '@/components/ui/Modal';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api/client';
import { Cargo } from '@/types/database.types';

interface CargoFormData {
  nome: string;
  descricao: string;
}

export default function CargosPage() {
  const { canCreate, canEdit, canDelete } = useAuth();
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);
  const [formData, setFormData] = useState<CargoFormData>({
    nome: '',
    descricao: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<CargoFormData>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    loadCargos();
  }, []);

  const loadCargos = async () => {
    try {
      setLoading(true);
      const data = await api.cargos.list();
      setCargos(data);
    } catch (error) {
      console.error('Erro ao carregar cargos:', error);
      alert('Erro ao carregar cargos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCargo(null);
    setFormData({ nome: '', descricao: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = (cargo: Cargo) => {
    setEditingCargo(cargo);
    setFormData({
      nome: cargo.nome,
      descricao: cargo.descricao || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (cargo: Cargo) => {
    if (!confirm(`Tem certeza que deseja excluir o cargo "${cargo.nome}"?`)) {
      return;
    }

    try {
      await api.cargos.delete(cargo.id);
      await loadCargos();
    } catch (error: unknown) {
      console.error('Erro ao excluir cargo:', error);
      const message = error instanceof Error ? error.message : 'Erro ao excluir cargo';
      alert(message);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<CargoFormData> = {};

    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitLoading(true);

      if (editingCargo) {
        await api.cargos.update(editingCargo.id, formData);
      } else {
        await api.cargos.create(formData);
      }

      setIsModalOpen(false);
      await loadCargos();
    } catch (error: unknown) {
      console.error('Erro ao salvar cargo:', error);
      const message = error instanceof Error ? error.message : 'Erro ao salvar cargo';
      alert(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns: Column<Cargo>[] = [
    {
      key: 'nome',
      label: 'Nome',
      sortable: true,
    },
    {
      key: 'descricao',
      label: 'Descrição',
      sortable: true,
      render: (cargo) => cargo.descricao || '-',
    },
    {
      key: 'created_at',
      label: 'Criado em',
      sortable: true,
      render: (cargo) => new Date(cargo.created_at).toLocaleDateString('pt-BR'),
    },
  ];

  return (
    <MainLayout title="Cargos">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-gray-600">
          Gerencie os cargos da empresa
        </p>
        {canCreate && (
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleCreate}
          >
            Novo Cargo
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-600">Carregando...</p>
      ) : (
        <DataTable
          data={cargos}
          columns={columns}
          keyExtractor={(cargo) => cargo.id}
          searchKeys={['nome', 'descricao']}
          emptyMessage="Nenhum cargo cadastrado"
          actions={(cargo) => (
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  onClick={() => handleEdit(cargo)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => handleDelete(cargo)}
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
        title={editingCargo ? 'Editar Cargo' : 'Novo Cargo'}
        submitText={editingCargo ? 'Salvar' : 'Criar'}
        isLoading={submitLoading}
      >
        <div className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                formErrors.nome ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: Operador de Máquina"
            />
            {formErrors.nome && (
              <p className="mt-1 text-sm text-red-500">{formErrors.nome}</p>
            )}
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
              placeholder="Descrição do cargo (opcional)"
            />
          </div>
        </div>
      </FormModal>
    </MainLayout>
  );
}
