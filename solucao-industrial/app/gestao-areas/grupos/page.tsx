'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import DataTable, { Column } from '@/components/ui/DataTable';
import { FormModal } from '@/components/ui/Modal';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api/client';
import { Group } from '@/types/database.types';

interface GrupoFormData {
  name: string;
  description: string;
}

export default function GruposPage() {
  const { canCreate, canEdit, canDelete } = useAuth();
  const [grupos, setGrupos] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<Group | null>(null);
  const [formData, setFormData] = useState<GrupoFormData>({
    name: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<GrupoFormData>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    loadGrupos();
  }, []);

  const loadGrupos = async () => {
    try {
      setLoading(true);
      const data = await api.groups.list();
      setGrupos(data);
    } catch (error) {
      console.error('Erro ao carregar grupos:', error);
      alert('Erro ao carregar grupos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingGrupo(null);
    setFormData({ name: '', description: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = (grupo: Group) => {
    setEditingGrupo(grupo);
    setFormData({
      name: grupo.name,
      description: grupo.description || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (grupo: Group) => {
    if (!confirm(`Tem certeza que deseja excluir o grupo "${grupo.name}"?`)) return;

    try {
      await api.groups.delete(grupo.id);
      await loadGrupos();
    } catch (error: unknown) {
      console.error('Erro ao excluir grupo:', error);
      const message = error instanceof Error ? error.message : 'Erro ao excluir grupo';
      alert(message);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<GrupoFormData> = {};
    if (!formData.name.trim()) errors.name = 'Nome é obrigatório';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitLoading(true);
      if (editingGrupo) {
        await api.groups.update(editingGrupo.id, formData);
      } else {
        await api.groups.create(formData);
      }
      setIsModalOpen(false);
      await loadGrupos();
    } catch (error: unknown) {
      console.error('Erro ao salvar grupo:', error);
      const message = error instanceof Error ? error.message : 'Erro ao salvar grupo';
      alert(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns: Column<Group>[] = [
    { key: 'name', label: 'Nome', sortable: true },
    {
      key: 'description',
      label: 'Descrição',
      render: (grupo) => grupo.description || '-',
    },
    {
      key: 'created_at',
      label: 'Criado em',
      sortable: true,
      render: (grupo) => new Date(grupo.created_at).toLocaleDateString('pt-BR'),
    },
  ];

  return (
    <MainLayout title="Cadastro Grupos">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-gray-600">Gerencie os grupos de produção</p>
        {canCreate && (
          <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleCreate}>
            Novo Grupo
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-600">Carregando...</p>
      ) : (
        <DataTable
          data={grupos}
          columns={columns}
          keyExtractor={(grupo) => grupo.id}
          searchKeys={['name', 'description']}
          emptyMessage="Nenhum grupo cadastrado"
          actions={(grupo) => (
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  onClick={() => handleEdit(grupo)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => handleDelete(grupo)}
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

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingGrupo ? 'Editar Grupo' : 'Novo Grupo'}
        submitText={editingGrupo ? 'Salvar' : 'Criar'}
        isLoading={submitLoading}
      >
        <div className="space-y-4">
          <div>
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
              placeholder="Ex: Grupo A - Peças grandes"
            />
            {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Descrição do grupo (opcional)"
            />
          </div>
        </div>
      </FormModal>
    </MainLayout>
  );
}
