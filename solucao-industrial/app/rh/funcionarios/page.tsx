'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import DataTable, { Column } from '@/components/ui/DataTable';
import { FormModal } from '@/components/ui/Modal';
import Select, { SelectOption } from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import CurrencyInput from '@/components/ui/CurrencyInput';
import FileUpload from '@/components/ui/FileUpload';
import { useAuditLog } from '@/hooks/useAuditLog';
import { Plus, Pencil, Trash2, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiComplete } from '@/lib/api/supabase-complete';
import { Employee, Cargo } from '@/types/database.types';
import { maskCPF, validateCPF, formatCurrency } from '@/lib/utils';
import Image from 'next/image';

interface EmployeeFormData {
  nome: string;
  cpf: string;
  cargo_id: string;
  salario_base: number;
  data_admissao: string;
  telefone: string;
  email: string;
  foto_url: File | string | null;
  active: boolean;
  tipo_mo: 'MOD' | 'MOI';
}

function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function FuncionariosPage() {
  const { canCreate, canEdit, canDelete, user, loading: authLoading } = useAuth();
  const audit = useAuditLog();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<EmployeeFormData>({
    nome: '',
    cpf: '',
    cargo_id: '',
    salario_base: 0,
    data_admissao: '',
    telefone: '',
    email: '',
    foto_url: null,
    active: true,
    tipo_mo: 'MOD',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof EmployeeFormData, string>>>({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showNewCargo, setShowNewCargo] = useState(false);
  const [newCargoNome, setNewCargoNome] = useState('');
  const [newCargoLoading, setNewCargoLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (authLoading || !user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [employeesData, cargosData] = await Promise.all([
        apiComplete.employees.list(),
        apiComplete.cargos.list(),
      ]);
      setEmployees(employeesData);
      setCargos(cargosData);
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
    setEditingEmployee(null);
    setFormData({
      nome: '',
      cpf: '',
      cargo_id: '',
      salario_base: 0,
      data_admissao: getLocalDateString(),
      telefone: '',
      email: '',
      foto_url: null,
      active: true,
      tipo_mo: 'MOD',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      nome: employee.nome,
      cpf: employee.cpf || '',
      cargo_id: employee.cargo_id || '',
      salario_base: parseFloat(String(employee.salario_base ?? 0)),
      data_admissao: employee.data_admissao || getLocalDateString(),
      telefone: employee.telefone || '',
      email: employee.email || '',
      foto_url: employee.foto_url || null,
      active: employee.active,
      tipo_mo: ((employee as unknown as Record<string, unknown>).tipo_mo as 'MOD' | 'MOI') || 'MOD',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (employee: Employee) => {
    if (!confirm(`Tem certeza que deseja excluir o funcionário "${employee.nome}"?`)) {
      return;
    }

    try {
      await apiComplete.employees.delete(employee.id);
      await audit.log('DELETE', 'Funcionário', `Excluiu funcionário "${employee.nome}"`, employee.id);
      await loadData();
    } catch (error: unknown) {
      console.error('Erro ao excluir funcionário:', error);
      const message = error instanceof Error ? error.message : 'Erro ao excluir funcionário';
      alert(message);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof EmployeeFormData, string>> = {};

    if (!formData.nome.trim()) {
      errors.nome = 'Nome é obrigatório';
    }

    if (formData.cpf.trim() && !validateCPF(formData.cpf)) {
      errors.cpf = 'CPF inválido';
    }

    if (!formData.cargo_id) {
      errors.cargo_id = 'Cargo é obrigatório';
    }

    if (formData.salario_base <= 0) {
      errors.salario_base = 'Salário deve ser maior que zero';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'E-mail inválido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitLoading(true);

      // Preparar dados
      const submitData = {
        ...formData,
        cpf: formData.cpf.replace(/\D/g, ''), // Remove máscaras
        telefone: formData.telefone.replace(/\D/g, ''),
      };

      // TODO: Implementar upload de foto
      // Por enquanto, remover o campo foto_url do submit
      const { foto_url, ...dataToSubmit } = submitData;
      void foto_url;

      if (editingEmployee) {
        await apiComplete.employees.update(editingEmployee.id, dataToSubmit);
        await audit.log('UPDATE', 'Funcionário', `Editou funcionário "${formData.nome}"`, editingEmployee.id);
      } else {
        const result = await apiComplete.employees.create(dataToSubmit);
        await audit.log('CREATE', 'Funcionário', `Criou funcionário "${formData.nome}"`, result?.id);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (error: unknown) {
      console.error('Erro ao salvar funcionário:', error);
      const message = error instanceof Error ? error.message : 'Erro ao salvar funcionário';
      alert(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCPFChange = (value: string) => {
    const masked = maskCPF(value);
    setFormData({ ...formData, cpf: masked });
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');

    // Formato: (11) 98765-4321
    if (value.length > 0) {
      value = value.replace(/^(\d{2})(\d)/g, '($1) $2');
      value = value.replace(/(\d)(\d{4})$/, '$1-$2');
    }

    setFormData({ ...formData, telefone: value });
  };

  const cargoOptions: SelectOption[] = cargos.map((cargo) => ({
    value: cargo.id,
    label: cargo.nome,
  }));

  const columns: Column<Employee>[] = [
    {
      key: 'foto_url',
      label: '',
      width: '60px',
      render: (employee) => (
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
          {employee.foto_url ? (
            <Image
              src={employee.foto_url}
              alt={employee.nome}
              width={40}
              height={40}
              className="object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-gray-400" />
          )}
        </div>
      ),
    },
    {
      key: 'nome',
      label: 'Nome',
      sortable: true,
    },
    {
      key: 'cpf',
      label: 'CPF',
      render: (employee) => maskCPF(employee.cpf || ''),
    },
    {
      key: 'cargo_id',
      label: 'Cargo',
      sortable: true,
      render: (employee) => {
        const cargo = cargos.find((c) => c.id === employee.cargo_id);
        return cargo?.nome || '-';
      },
    },
    {
      key: 'salario_base',
      label: 'Salário Base',
      sortable: true,
      render: (employee) => formatCurrency(parseFloat(String(employee.salario_base ?? 0))),
    },
    {
      key: 'data_admissao',
      label: 'Admissão',
      sortable: true,
      render: (employee) =>
        employee.data_admissao ? new Date(employee.data_admissao + 'T00:00:00').toLocaleDateString('pt-BR') : '-',
    },
    {
      key: 'active',
      label: 'Status',
      sortable: true,
      render: (employee) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            employee.active
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {employee.active ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
  ];

  return (
    <MainLayout title="Funcionários">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-gray-600">
          Gerencie os funcionários da empresa
        </p>
        {canCreate && (
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleCreate}
          >
            Novo Funcionário
          </Button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-600">Carregando...</p>
      ) : (
        <DataTable
          data={employees}
          columns={columns}
          keyExtractor={(employee) => employee.id}
          searchKeys={['nome', 'cpf', 'email']}
          emptyMessage="Nenhum funcionário cadastrado"
          actions={(employee) => (
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  onClick={() => handleEdit(employee)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => handleDelete(employee)}
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
        title={editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
        submitText={editingEmployee ? 'Salvar' : 'Criar'}
        isLoading={submitLoading}
        size="lg"
      >
        <div className="space-y-4">
          {/* Foto */}
          <FileUpload
            value={formData.foto_url}
            onChange={(file) => setFormData({ ...formData, foto_url: file })}
            label="Foto do Funcionário"
            circular
            maxSizeMB={2}
          />

          <div className="grid grid-cols-2 gap-4">
            {/* Nome */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  formErrors.nome ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ex: João Silva Santos"
              />
              {formErrors.nome && (
                <p className="mt-1 text-sm text-red-500">{formErrors.nome}</p>
              )}
            </div>

            {/* CPF */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF
              </label>
              <input
                type="text"
                value={formData.cpf}
                onChange={(e) => handleCPFChange(e.target.value)}
                maxLength={14}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  formErrors.cpf ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="000.000.000-00"
              />
              {formErrors.cpf && (
                <p className="mt-1 text-sm text-red-500">{formErrors.cpf}</p>
              )}
            </div>

            {/* Cargo */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-700">Cargo <span className="text-red-500">*</span></label>
                <button
                  type="button"
                  onClick={() => setShowNewCargo(!showNewCargo)}
                  className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Novo Cargo
                </button>
              </div>
              {showNewCargo && (
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newCargoNome}
                    onChange={(e) => setNewCargoNome(e.target.value)}
                    placeholder="Nome do novo cargo"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <button
                    type="button"
                    disabled={!newCargoNome.trim() || newCargoLoading}
                    onClick={async () => {
                      try {
                        setNewCargoLoading(true);
                        const result = await apiComplete.cargos.create({ nome: newCargoNome.trim(), descricao: '' });
                        await audit.log('CREATE', 'Cargo', `Criou cargo "${newCargoNome.trim()}"`, result?.id);
                        const updatedCargos = await apiComplete.cargos.list();
                        setCargos(updatedCargos);
                        if (result?.id) setFormData({ ...formData, cargo_id: result.id });
                        setNewCargoNome('');
                        setShowNewCargo(false);
                      } catch (error) {
                        alert(error instanceof Error ? error.message : 'Erro ao criar cargo');
                      } finally {
                        setNewCargoLoading(false);
                      }
                    }}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {newCargoLoading ? '...' : 'Criar'}
                  </button>
                </div>
              )}
              <Select
                options={cargoOptions}
                value={formData.cargo_id}
                onChange={(value) => setFormData({ ...formData, cargo_id: value })}
                required
                searchable
                error={formErrors.cargo_id}
                placeholder="Selecione o cargo"
              />
            </div>

            {/* Salário Base */}
            <div>
              <CurrencyInput
                value={formData.salario_base}
                onChange={(value) => setFormData({ ...formData, salario_base: value })}
                label="Salário Base"
                required
                min={0}
                error={formErrors.salario_base}
              />
            </div>

            {/* Data de Admissão */}
            <div>
              <DatePicker
                value={formData.data_admissao}
                onChange={(date) => setFormData({ ...formData, data_admissao: date })}
                label="Data de Admissão"
                error={formErrors.data_admissao}
              />
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={formData.telefone}
                onChange={handleTelefoneChange}
                maxLength={15}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="(11) 98765-4321"
              />
            </div>

            {/* E-mail */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  formErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="funcionario@email.com"
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>
              )}
            </div>

            {/* Tipo de Mão de Obra */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Mão de Obra <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipo_mo"
                    value="MOD"
                    checked={formData.tipo_mo === 'MOD'}
                    onChange={() => setFormData({ ...formData, tipo_mo: 'MOD' })}
                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">M.O.D (Mão de Obra Direta)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="tipo_mo"
                    value="MOI"
                    checked={formData.tipo_mo === 'MOI'}
                    onChange={() => setFormData({ ...formData, tipo_mo: 'MOI' })}
                    className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">M.O.I (Mão de Obra Indireta)</span>
                </label>
              </div>
            </div>

            {/* Status */}
            <div className="col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Funcionário ativo
                </span>
              </label>
            </div>
          </div>
        </div>
      </FormModal>
    </MainLayout>
  );
}
