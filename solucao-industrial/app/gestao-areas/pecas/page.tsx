'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal, { FormModal } from '@/components/ui/Modal';
import { SelectOption } from '@/components/ui/Select';
import { MultiSelect } from '@/components/ui/Select';
import { Plus, Eye, FileText, Check, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiComplete } from '@/lib/api/supabase-complete';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Piece, Group } from '@/types/database.types';

interface PecaFormData {
  codigo: string;
  name: string;
  group_ids: string[];
  area_dm2: number;
  weight_kg: number;
  production_type: string;
}

export default function PecasPage() {
  const { canCreate, user, loading: authLoading } = useAuth();
  const audit = useAuditLog();
  const [pecas, setPecas] = useState<Piece[]>([]);
  const [grupos, setGrupos] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<PecaFormData>({
    codigo: '',
    name: '',
    group_ids: [],
    area_dm2: 0,
    weight_kg: 0,
    production_type: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof PecaFormData, string>>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [gruposModalOpen, setGruposModalOpen] = useState(false);
  const [gruposModalPeca, setGruposModalPeca] = useState<Piece | null>(null);
  const [editingPeca, setEditingPeca] = useState<Piece | null>(null);
  // Lançamento de produção
  const [lancModalOpen, setLancModalOpen] = useState(false);
  const [lancPeca, setLancPeca] = useState<Piece | null>(null);
  const [lancAno, setLancAno] = useState(new Date().getFullYear());
  const [lancMes, setLancMes] = useState(new Date().getMonth() + 1);
  const [lancData, setLancData] = useState<Record<number, number>>({});
  const [lancInput, setLancInput] = useState('');
  const [lancSaving, setLancSaving] = useState(false);
  const [lancLoading, setLancLoading] = useState(false);

  const meses = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ];

  const loadLancamentos = useCallback(async (pieceId: number, ano: number) => {
    try {
      setLancLoading(true);
      const data = await apiComplete.lancamentoPecas.listByPiece(pieceId, ano);
      const map: Record<number, number> = {};
      data.forEach((item: { mes: number; quantidade: number }) => {
        map[item.mes] = item.quantidade;
      });
      setLancData(map);
    } catch (error) {
      console.error('Erro ao carregar lançamentos:', error);
    } finally {
      setLancLoading(false);
    }
  }, []);

  const handleOpenLancamento = (peca: Piece) => {
    const now = new Date();
    const ano = now.getFullYear();
    const mes = now.getMonth() + 1;
    setLancPeca(peca);
    setLancAno(ano);
    setLancMes(mes);
    setLancInput('');
    setLancData({});
    setLancModalOpen(true);
    loadLancamentos(peca.id, ano);
  };

  const handleSaveLancamento = async () => {
    if (!lancPeca || !lancInput) return;
    const qtd = parseInt(lancInput, 10);
    if (isNaN(qtd) || qtd < 0) return;
    try {
      setLancSaving(true);
      const existing = lancData[lancMes] || 0;
      await apiComplete.lancamentoPecas.upsert(lancPeca.id, lancMes, lancAno, existing + qtd);
      await loadLancamentos(lancPeca.id, lancAno);
      setLancInput('');
    } catch (error) {
      console.error('Erro ao salvar lançamento:', error);
      const msg = error instanceof Error ? error.message : String(error);
      alert('Erro ao salvar lançamento: ' + msg);
    } finally {
      setLancSaving(false);
    }
  };

  const getTotalProducao = () => {
    return Object.values(lancData).reduce((sum, v) => sum + v, 0);
  };

  const loadData = useCallback(async () => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [pecasData, gruposData] = await Promise.all([
        apiComplete.pieces.list(),
        apiComplete.groups.list(),
      ]);
      setPecas(pecasData);
      setGrupos(gruposData);
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
    setEditingPeca(null);
    setFormData({ codigo: '', name: '', group_ids: [], area_dm2: 0, weight_kg: 0, production_type: '' });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = (peca: Piece) => {
    setEditingPeca(peca);
    setFormData({
      codigo: peca.codigo || '',
      name: peca.name,
      group_ids: peca.group_ids || (peca.group_id ? [peca.group_id] : []),
      area_dm2: peca.area_dm2,
      weight_kg: peca.weight_kg,
      production_type: peca.production_type || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (peca: Piece) => {
    if (!confirm(`Deseja excluir a peça "${peca.name}"?`)) return;
    try {
      await apiComplete.pieces.delete(peca.id);
      await audit.log('DELETE', 'Peça', `Excluiu peça "${peca.name}"`, String(peca.id));
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir peça:', error);
      const msg = error instanceof Error ? error.message : 'Erro ao excluir';
      alert(msg);
    }
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
      if (editingPeca) {
        await apiComplete.pieces.update(editingPeca.id, formData);
        await audit.log('UPDATE', 'Peça', `Editou peça "${formData.name}"`, String(editingPeca.id));
      } else {
        const result = await apiComplete.pieces.create(formData);
        await audit.log('CREATE', 'Peça', `Criou peça "${formData.name}"`, String(result?.id));
      }
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
    { key: 'codigo', label: 'Id', sortable: true, render: (peca) => peca.codigo || '-' },
    {
      key: 'id' as keyof Piece,
      label: '',
      render: (peca) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); handleOpenLancamento(peca); }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          Lança Produção
        </button>
      ),
    },
    { key: 'name', label: 'Peça', sortable: true },
    {
      key: 'group_ids',
      label: 'Grupos',
      render: (peca) => {
        const ids = peca.group_ids || (peca.group_id ? [peca.group_id] : []);
        if (ids.length === 0) return '-';
        const firstName = grupos.find((g) => g.id === ids[0])?.name || '-';
        return (
          <div className="flex items-center gap-2">
            <span className="truncate max-w-[120px]">{firstName}</span>
            {ids.length > 1 && (
              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                +{ids.length - 1}
              </span>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setGruposModalPeca(peca); setGruposModalOpen(true); }}
              className="text-gray-400 hover:text-primary-600 transition-colors"
              title="Ver todos os grupos"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
    {
      key: 'area_dm2',
      label: 'Área (dm²)',
      sortable: true,
      render: (peca) => `${parseFloat(String(peca.area_dm2 ?? 0)).toFixed(2)} dm²`,
    },
    {
      key: 'weight_kg',
      label: 'Peso (kg)',
      sortable: true,
      render: (peca) => `${parseFloat(String(peca.weight_kg ?? 0)).toFixed(2)} kg`,
    },
  ];

  const tableActions = (peca: Piece) => (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => handleEdit(peca)}
        className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
        title="Editar"
      >
        <Pencil className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => handleDelete(peca)}
        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Excluir"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

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
          keyExtractor={(peca) => String(peca.id)}
          searchKeys={['name', 'production_type']}
          emptyMessage="Nenhuma peça cadastrada"
          actions={tableActions}
        />
      )}

      <FormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingPeca ? 'Editar Peça' : 'Nova Peça'}
        submitText={editingPeca ? 'Salvar' : 'Criar'}
        isLoading={submitLoading}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Id da peça
              </label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Digite o Id da peça"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome da peça <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  formErrors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Digite a peça"
              />
              {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Área em dm² da peça <span className="text-red-500">*</span>
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
                placeholder="Digite a área em dm² da peça"
              />
              {formErrors.area_dm2 && <p className="mt-1 text-sm text-red-500">{formErrors.area_dm2}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso da peça <span className="text-red-500">*</span>
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
                placeholder="Digite o Peso da peça"
              />
              {formErrors.weight_kg && <p className="mt-1 text-sm text-red-500">{formErrors.weight_kg}</p>}
            </div>

            <div>
              <MultiSelect
                options={grupoOptions}
                value={formData.group_ids}
                onChange={(values) => setFormData({ ...formData, group_ids: values })}
                label="Grupo"
                searchable
                placeholder="Selecione os grupos"
              />
            </div>
          </div>
        </div>
      </FormModal>

      {/* Modal de visualização de grupos */}
      <Modal
        isOpen={gruposModalOpen}
        onClose={() => { setGruposModalOpen(false); setGruposModalPeca(null); }}
        title={`Grupos - ${gruposModalPeca?.name || ''}`}
        size="sm"
      >
        <div className="space-y-2">
          {gruposModalPeca && (() => {
            const ids = gruposModalPeca.group_ids || (gruposModalPeca.group_id ? [gruposModalPeca.group_id] : []);
            if (ids.length === 0) return <p className="text-gray-500 text-sm">Nenhum grupo associado</p>;
            return ids.map((gid: string) => {
              const grupo = grupos.find((g) => g.id === gid);
              return (
                <div key={gid} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                  <span className="w-2 h-2 bg-primary-500 rounded-full" />
                  <span className="text-sm text-gray-700">{grupo?.name || gid}</span>
                </div>
              );
            });
          })()}
        </div>
      </Modal>

      {/* Modal de Lançamento de Produção */}
      <Modal
        isOpen={lancModalOpen}
        onClose={() => { setLancModalOpen(false); setLancPeca(null); }}
        title=""
        size="xl"
      >
        {lancPeca && (
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Lançamento de peça {lancPeca.name}</h3>
              <p className="text-sm font-medium text-gray-600">{meses[lancMes - 1]}/{lancAno}</p>
              <p className="text-sm text-gray-500">
                {(() => {
                  const ids = lancPeca.group_ids || (lancPeca.group_id ? [lancPeca.group_id] : []);
                  return ids.map((gid: string) => grupos.find((g) => g.id === gid)?.name).filter(Boolean).join(', ') || '-';
                })()}
              </p>
            </div>

            {/* Abas de meses */}
            <div className="flex flex-wrap gap-1 mb-6">
              {meses.map((nome, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => { setLancMes(i + 1); setLancInput(''); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    lancMes === i + 1
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {nome}/{lancAno}
                </button>
              ))}
            </div>

            {/* Tabela de lançamento */}
            {lancLoading ? (
              <p className="text-gray-500 text-sm">Carregando...</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produtos</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lançamento</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produção</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grupo</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="px-4 py-3 text-sm text-gray-700">{lancPeca.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            value={lancInput}
                            onChange={(e) => setLancInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveLancamento(); }}
                            className="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="0"
                          />
                          <button
                            type="button"
                            onClick={handleSaveLancamento}
                            disabled={lancSaving || !lancInput}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-full transition-colors disabled:opacity-40"
                            title="Salvar lançamento"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-700">{lancData[lancMes] || 0}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {(() => {
                          const ids = lancPeca.group_ids || (lancPeca.group_id ? [lancPeca.group_id] : []);
                          return ids.map((gid: string) => grupos.find((g) => g.id === gid)?.name).filter(Boolean).join(', ') || '-';
                        })()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Resumo */}
            <div className="mt-4 flex justify-between items-center px-4 py-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Total produção {lancAno}:</span>
              <span className="text-lg font-bold text-primary-600">{getTotalProducao()}</span>
            </div>
          </div>
        )}
      </Modal>
    </MainLayout>
  );
}
