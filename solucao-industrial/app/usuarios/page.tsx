'use client';

import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { FormModal } from '@/components/ui/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api/client';
import { Profile, UserRole } from '@/types/database.types';
import { UserCircle, Mail, Shield, Pencil, Trash2, Key, Plus } from 'lucide-react';
import Toggle from '@/components/ui/Toggle';

const roleLabels: Record<UserRole, { label: string; color: string; description: string }> = {
  ADMIN: {
    label: 'Administrador',
    color: 'bg-red-100 text-red-700',
    description: 'Acesso total ao sistema'
  },
  GESTOR: {
    label: 'Gestor',
    color: 'bg-orange-100 text-orange-700',
    description: 'Gerencia áreas e colaboradores'
  },
  RH: {
    label: 'Recursos Humanos',
    color: 'bg-blue-100 text-blue-700',
    description: 'Gerencia recursos humanos'
  },
  OPERADOR: {
    label: 'Operador',
    color: 'bg-green-100 text-green-700',
    description: 'Realiza lançamentos e registros'
  },
  LEITOR: {
    label: 'Leitor',
    color: 'bg-gray-100 text-gray-700',
    description: 'Apenas visualização'
  },
};

interface UserFormData {
  full_name: string;
  email: string;
  password?: string;
  role: UserRole;
  active: boolean;
}

interface ResetPasswordFormData {
  new_password: string;
  confirm_password: string;
}

export default function UsuariosPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // User modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [userForm, setUserForm] = useState<UserFormData>({
    full_name: '',
    email: '',
    password: '',
    role: 'LEITOR',
    active: true,
  });
  const [userFormErrors, setUserFormErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});
  const [userSubmitLoading, setUserSubmitLoading] = useState(false);

  // Reset password modal
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<Profile | null>(null);
  const [resetPasswordForm, setResetPasswordForm] = useState<ResetPasswordFormData>({
    new_password: '',
    confirm_password: '',
  });
  const [resetPasswordErrors, setResetPasswordErrors] = useState<Partial<Record<keyof ResetPasswordFormData, string>>>({});
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.users.list();
      setUsers(data);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      alert('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setUserFormErrors({});
    setUserForm({
      full_name: '',
      email: '',
      password: '',
      role: 'LEITOR',
      active: true,
    });
    setIsUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
    setEditingUser(null);
    setUserFormErrors({});
    setUserForm({
      full_name: '',
      email: '',
      password: '',
      role: 'LEITOR',
      active: true,
    });
  };

  const handleEditUser = (user: Profile) => {
    setEditingUser(user);
    setUserForm({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      active: user.active,
    });
    setUserFormErrors({});
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = async (user: Profile) => {
    if (profile?.id === user.id) {
      alert('Você não pode deletar seu próprio usuário');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o usuário "${user.full_name}"?`)) return;

    try {
      await api.users.delete(user.id);
      await loadUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao excluir usuário';
      alert(message);
    }
  };

  const validateUserForm = (): boolean => {
    const errors: Partial<Record<keyof UserFormData, string>> = {};

    if (!userForm.full_name.trim()) errors.full_name = 'Nome completo é obrigatório';
    if (!userForm.email.trim()) errors.email = 'Email é obrigatório';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (userForm.email && !emailRegex.test(userForm.email)) {
      errors.email = 'Email inválido';
    }

    if (!editingUser) {
      if (!userForm.password) {
        errors.password = 'Senha é obrigatória para novos usuários';
      } else if (userForm.password.length < 6) {
        errors.password = 'Senha deve ter no mínimo 6 caracteres';
      }
    }

    setUserFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUserSubmit = async () => {
    if (!validateUserForm()) return;

    try {
      setUserSubmitLoading(true);
      if (editingUser) {
        await api.users.update(editingUser.id, {
          full_name: userForm.full_name,
          role: userForm.role,
          active: userForm.active,
        });
      } else {
        await api.users.create(userForm);
      }
      handleCloseUserModal();
      await loadUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar usuário';
      alert(message);
    } finally {
      setUserSubmitLoading(false);
    }
  };

  const handleToggleActive = async (user: Profile) => {
    if (profile?.id === user.id) {
      alert('Você não pode desativar seu próprio usuário');
      return;
    }

    try {
      await api.users.update(user.id, { active: !user.active });
      await loadUsers();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar usuário';
      alert(message);
    }
  };

  const handleOpenResetPassword = (user: Profile) => {
    setResetPasswordUser(user);
    setResetPasswordErrors({});
    setResetPasswordForm({
      new_password: '',
      confirm_password: '',
    });
    setIsResetPasswordModalOpen(true);
  };

  const handleCloseResetPasswordModal = () => {
    setIsResetPasswordModalOpen(false);
    setResetPasswordUser(null);
    setResetPasswordErrors({});
    setResetPasswordForm({
      new_password: '',
      confirm_password: '',
    });
  };

  const validateResetPasswordForm = (): boolean => {
    const errors: Partial<Record<keyof ResetPasswordFormData, string>> = {};

    if (!resetPasswordForm.new_password) {
      errors.new_password = 'Nova senha é obrigatória';
    } else if (resetPasswordForm.new_password.length < 6) {
      errors.new_password = 'Senha deve ter no mínimo 6 caracteres';
    }

    if (!resetPasswordForm.confirm_password) {
      errors.confirm_password = 'Confirme a nova senha';
    } else if (resetPasswordForm.new_password !== resetPasswordForm.confirm_password) {
      errors.confirm_password = 'Senhas não conferem';
    }

    setResetPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleResetPasswordSubmit = async () => {
    if (!validateResetPasswordForm() || !resetPasswordUser) return;

    try {
      setResetPasswordLoading(true);
      await api.users.resetPassword(resetPasswordUser.id, resetPasswordForm.new_password);
      handleCloseResetPasswordModal();
      alert('Senha resetada com sucesso');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro ao resetar senha';
      alert(message);
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const roleInfo = profile ? roleLabels[profile.role] : null;

  return (
    <MainLayout title="Usuários">
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">Gerenciamento de usuários do sistema</p>
        <button
          onClick={handleCreateUser}
          className="flex items-center gap-2 px-4 py-2 border-2 border-primary-600 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      {/* Perfil do usuário atual */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Usuário Atual</h3>
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
            <UserCircle className="w-12 h-12 text-primary-600" />
          </div>
          <div className="flex-1">
            <h4 className="text-xl font-semibold text-gray-900">{profile?.full_name || '-'}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">{profile?.email || '-'}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Shield className="w-4 h-4 text-gray-400" />
              {roleInfo && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${roleInfo.color}`}>
                  {roleInfo.label}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de usuários */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Todos os Usuários</h3>

        {loading ? (
          <p className="text-gray-600">Carregando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Papel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => {
                  const info = roleLabels[user.role];
                  const isCurrent = profile?.id === user.id;
                  return (
                    <tr key={user.id} className={isCurrent ? 'bg-primary-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{user.full_name}</span>
                          {isCurrent && <span className="text-xs text-primary-600 font-medium">(você)</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.color}`}>
                          {info.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Toggle
                          checked={user.active}
                          onChange={() => handleToggleActive(user)}
                          disabled={isCurrent}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Editar usuário"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenResetPassword(user)}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                            title="Resetar senha"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Deletar usuário"
                            disabled={isCurrent}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Nenhum usuário encontrado
              </div>
            )}
          </div>
        )}
      </div>

      {/* Permissões por papel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Permissões por Papel</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Papel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Criar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Editar</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Excluir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[
                { role: 'ADMIN' as UserRole, criar: true, editar: true, excluir: true },
                { role: 'GESTOR' as UserRole, criar: true, editar: true, excluir: true },
                { role: 'RH' as UserRole, criar: true, editar: true, excluir: true },
                { role: 'OPERADOR' as UserRole, criar: true, editar: true, excluir: false },
                { role: 'LEITOR' as UserRole, criar: false, editar: false, excluir: false },
              ].map((item) => {
                const info = roleLabels[item.role];
                const isCurrent = profile?.role === item.role;
                return (
                  <tr key={item.role} className={isCurrent ? 'bg-primary-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${info.color}`}>
                          {info.label}
                        </span>
                        {isCurrent && <span className="text-xs text-primary-600 font-medium">(atual)</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{info.description}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${item.criar ? 'text-green-600' : 'text-red-500'}`}>
                        {item.criar ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${item.editar ? 'text-green-600' : 'text-red-500'}`}>
                        {item.editar ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${item.excluir ? 'text-green-600' : 'text-red-500'}`}>
                        {item.excluir ? 'Sim' : 'Não'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Criar/Editar Usuário */}
      <FormModal
        isOpen={isUserModalOpen}
        onClose={handleCloseUserModal}
        onSubmit={handleUserSubmit}
        title={editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        submitText={editingUser ? 'Salvar' : 'Criar'}
        isLoading={userSubmitLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={userForm.full_name}
              onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                userFormErrors.full_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Ex: João Silva"
            />
            {userFormErrors.full_name && <p className="mt-1 text-sm text-red-500">{userFormErrors.full_name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              disabled={!!editingUser}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                userFormErrors.email ? 'border-red-500' : 'border-gray-300'
              } ${editingUser ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="usuario@exemplo.com"
            />
            {userFormErrors.email && <p className="mt-1 text-sm text-red-500">{userFormErrors.email}</p>}
          </div>

          {!editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  userFormErrors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Mínimo 6 caracteres"
              />
              {userFormErrors.password && <p className="mt-1 text-sm text-red-500">{userFormErrors.password}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Papel <span className="text-red-500">*</span>
            </label>
            <select
              value={userForm.role}
              onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
              disabled={editingUser?.id === profile?.id}
              className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                editingUser?.id === profile?.id ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            >
              {Object.entries(roleLabels).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.label} - {value.description}
                </option>
              ))}
            </select>
          </div>

          <Toggle
            checked={userForm.active}
            onChange={(checked) => setUserForm({ ...userForm, active: checked })}
            label="Usuário ativo"
            disabled={editingUser?.id === profile?.id}
          />
        </div>
      </FormModal>

      {/* Modal: Resetar Senha */}
      <FormModal
        isOpen={isResetPasswordModalOpen}
        onClose={handleCloseResetPasswordModal}
        onSubmit={handleResetPasswordSubmit}
        title={`Resetar Senha - ${resetPasswordUser?.full_name}`}
        submitText="Resetar Senha"
        isLoading={resetPasswordLoading}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nova Senha <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={resetPasswordForm.new_password}
              onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, new_password: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                resetPasswordErrors.new_password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Mínimo 6 caracteres"
            />
            {resetPasswordErrors.new_password && (
              <p className="mt-1 text-sm text-red-500">{resetPasswordErrors.new_password}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Nova Senha <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={resetPasswordForm.confirm_password}
              onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, confirm_password: e.target.value })}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                resetPasswordErrors.confirm_password ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Digite a senha novamente"
            />
            {resetPasswordErrors.confirm_password && (
              <p className="mt-1 text-sm text-red-500">{resetPasswordErrors.confirm_password}</p>
            )}
          </div>
        </div>
      </FormModal>
    </MainLayout>
  );
}
