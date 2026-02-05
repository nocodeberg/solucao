'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Button from '@/components/ui/Button';
import DataTable, { Column } from '@/components/ui/DataTable';
import { FormModal } from '@/components/ui/Modal';
import Select, { SelectOption } from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import CurrencyInput from '@/components/ui/CurrencyInput';
import FileUpload from '@/components/ui/FileUpload';
import { Plus, Pencil, Trash2, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api/client';
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
}

export default function FuncionariosPage() {
  const { canCreate, canEdit, canDelete } = useAuth();
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
    data_admissao: new Date().toISOString().split('T')[0],
    telefone: '',
    email: '',
    foto_url: null,
    active: true,
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof EmployeeFormData, string>>>({});
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [employeesData, cargosData] = await Promise.all([
        api.employees.list(),
        api.cargos.list(),
      ]);
      setEmployees(employeesData);
      setCargos(cargosData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingEmployee(null);
    setFormData({
      nome: '',
      cpf: '',
      cargo_id: '',
      salario_base: 0,
      data_admissao: new Date().toISOString().split('T')[0],
      telefone: '',
      email: '',
      foto_url: null,
      active: true,
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
      salario_base: parseFloat(employee.salario_base.toString()),
      data_admissao: employee.data_admissao || new Date().toISOString().split('T')[0],
      telefone: employee.telefone || '',
      email: employee.email || '',
      foto_url: employee.foto_url || null,
      active: employee.active,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = async (employee: Employee) => {
    if (!confirm(`Tem certeza que deseja excluir o funcionário "${employee.nome}"?`)) {
      return;
    }

    try {
      await api.employees.delete(employee.id);
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

    if (!formData.cpf.trim()) {
      errors.cpf = 'CPF é obrigatório';
    } else if (!validateCPF(formData.cpf)) {
      errors.cpf = 'CPF inválido';
    }

    if (!formData.cargo_id) {
      errors.cargo_id = 'Cargo é obrigatório';
    }

    if (formData.salario_base <= 0) {
      errors.salario_base = 'Salário deve ser maior que zero';
    }

    if (!formData.data_admissao) {
      errors.data_admissao = 'Data de admissão é obrigatória';
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
        await api.employees.update(editingEmployee.id, dataToSubmit);
      } else {
        await api.employees.create(dataToSubmit);
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
      render: (employee) => formatCurrency(parseFloat(employee.salario_base.toString())),
    },
    {
      key: 'data_admissao',
      label: 'Admissão',
      sortable: true,
      render: (employee) =>
        employee.data_admissao ? new Date(employee.data_admissao).toLocaleDateString('pt-BR') : '-',
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
                CPF <span className="text-red-500">*</span>
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
              <Select
                options={cargoOptions}
                value={formData.cargo_id}
                onChange={(value) => setFormData({ ...formData, cargo_id: value })}
                label="Cargo"
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
                required
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
