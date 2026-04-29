'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import {
  Building2, Users, Factory, Plus, Pencil, Eye, X,
  Search, ToggleLeft, ToggleRight, ChevronUp,
  UserCheck, AlertCircle, Upload, FileImage, UserPlus,
} from 'lucide-react';

interface Company {
  id: string;
  name: string;
  cnpj: string;
  email?: string;
  phone?: string;
  address?: any;
  logo_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  _users_count: number;
  _lines_count: number;
}

interface CompanyUser {
  id: string;
  full_name: string;
  email: string;
  role: string;
  active: boolean;
  created_at: string;
}

interface Stats {
  companies: number;
  users: number;
  lines: number;
  employees: number;
}

function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})/, '$1.')
    .replace(/^(\d{2})\.(\d{3})/, '$1.$2.')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})/, '$1.$2.$3/')
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})/, '$1.$2.$3/$4-');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export default function AdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [stats, setStats] = useState<Stats>({ companies: 0, users: 0, lines: 0, employees: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({ name: '', cnpj: '', email: '', phone: '' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const [formError, setFormError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);

  // Expandir empresa para ver usuários
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null);
  const [companyUsers, setCompanyUsers] = useState<CompanyUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Modal novo usuário
  const [showUserModal, setShowUserModal] = useState(false);
  const [userCompanyId, setUserCompanyId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({ full_name: '', email: '', password: '', role: 'LEITOR' });
  const [userFormError, setUserFormError] = useState('');
  const [userSubmitLoading, setUserSubmitLoading] = useState(false);

  // Verificar se é master
  useEffect(() => {
    fetch('/api/admin/check')
      .then(res => res.json())
      .then(data => {
        if (!data.isMaster) {
          router.push('/dashboard');
        } else {
          setAuthorized(true);
        }
      })
      .catch(() => router.push('/dashboard'))
      .finally(() => setChecking(false));
  }, [router]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [companiesRes, statsRes] = await Promise.all([
        fetch('/api/admin/companies').then(r => r.json()),
        fetch('/api/admin/stats').then(r => r.json()),
      ]);
      if (Array.isArray(companiesRes)) setCompanies(companiesRes);
      if (statsRes.companies !== undefined) setStats(statsRes);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authorized) loadData();
  }, [authorized, loadData]);

  const handleOpenNew = () => {
    setEditingCompany(null);
    setFormData({ name: '', cnpj: '', email: '', phone: '' });
    setLogoFile(null);
    setLogoPreview(null);
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (company: Company) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      cnpj: company.cnpj,
      email: company.email || '',
      phone: company.phone || '',
    });
    setLogoFile(null);
    setLogoPreview(company.logo_url || null);
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.cnpj.trim()) {
      setFormError('Nome e CNPJ são obrigatórios');
      return;
    }

    setSubmitLoading(true);
    setFormError('');
    try {
      const method = editingCompany ? 'PUT' : 'POST';
      const body = editingCompany
        ? { id: editingCompany.id, ...formData }
        : formData;

      const res = await fetch('/api/admin/companies', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar');

      const savedCompany = data;

      // Upload logo se houver arquivo novo
      if (logoFile && savedCompany?.id) {
        const fd = new FormData();
        fd.append('file', logoFile);
        fd.append('company_id', savedCompany.id);
        await fetch('/api/admin/upload-logo', { method: 'POST', body: fd });
      }

      setShowModal(false);
      await loadData();
    } catch (error: any) {
      setFormError(error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleOpenUserModal = (companyId: string) => {
    setUserCompanyId(companyId);
    setUserForm({ full_name: '', email: '', password: '', role: 'LEITOR' });
    setUserFormError('');
    setShowUserModal(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.full_name.trim() || !userForm.email.trim() || !userForm.password.trim()) {
      setUserFormError('Nome, e-mail e senha são obrigatórios');
      return;
    }
    if (userForm.password.length < 6) {
      setUserFormError('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    setUserSubmitLoading(true);
    setUserFormError('');
    try {
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...userForm, company_id: userCompanyId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar usuário');
      setShowUserModal(false);
      // Recarregar usuários da empresa expandida
      if (userCompanyId && expandedCompanyId === userCompanyId) {
        handleExpandCompany(userCompanyId);
        // Forçar re-expand
        setExpandedCompanyId(null);
        setTimeout(() => handleExpandCompany(userCompanyId), 100);
      }
      await loadData();
    } catch (error: any) {
      setUserFormError(error.message);
    } finally {
      setUserSubmitLoading(false);
    }
  };

  const handleToggleActive = async (company: Company) => {
    try {
      await fetch('/api/admin/companies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: company.id, active: !company.active }),
      });
      await loadData();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const handleExpandCompany = async (companyId: string) => {
    if (expandedCompanyId === companyId) {
      setExpandedCompanyId(null);
      return;
    }

    setExpandedCompanyId(companyId);
    setUsersLoading(true);
    try {
      const res = await fetch(`/api/admin/companies/${companyId}/users`);
      const data = await res.json();
      setCompanyUsers(Array.isArray(data) ? data : []);
    } catch {
      setCompanyUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const filteredCompanies = companies.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return c.name.toLowerCase().includes(term) || c.cnpj.includes(term) || (c.email || '').toLowerCase().includes(term);
  });

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!authorized) return null;

  return (
    <MainLayout title="Painel Admin Master">
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<Building2 className="w-6 h-6" />} label="Empresas" value={stats.companies} color="purple" />
          <StatCard icon={<Users className="w-6 h-6" />} label="Usuários" value={stats.users} color="blue" />
          <StatCard icon={<Factory className="w-6 h-6" />} label="Linhas de Produção" value={stats.lines} color="green" />
          <StatCard icon={<UserCheck className="w-6 h-6" />} label="Funcionários" value={stats.employees} color="orange" />
        </div>

        {/* Empresas */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Empresas Cadastradas</h2>
              <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">{companies.length}</span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar empresa..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-full sm:w-64 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              <button
                onClick={handleOpenNew}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                Nova Empresa
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Building2 className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p>{searchTerm ? 'Nenhuma empresa encontrada' : 'Nenhuma empresa cadastrada'}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredCompanies.map((company) => (
                <div key={company.id}>
                  <div className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Logo/Avatar */}
                      <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-purple-600" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">{company.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            company.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {company.active ? 'Ativa' : 'Inativa'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          CNPJ: {company.cnpj} {company.email ? `• ${company.email}` : ''}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="hidden sm:flex items-center gap-6 text-xs text-gray-500">
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{company._users_count}</p>
                          <p>Usuários</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-900">{company._lines_count}</p>
                          <p>Linhas</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-400">{formatDate(company.created_at)}</p>
                          <p>Criada em</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleExpandCompany(company.id)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver usuários"
                        >
                          {expandedCompanyId === company.id ? <ChevronUp className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(company)}
                          className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(company)}
                          className={`p-2 rounded-lg transition-colors ${
                            company.active
                              ? 'text-green-500 hover:text-red-500 hover:bg-red-50'
                              : 'text-red-400 hover:text-green-500 hover:bg-green-50'
                          }`}
                          title={company.active ? 'Desativar' : 'Ativar'}
                        >
                          {company.active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Users */}
                  {expandedCompanyId === company.id && (
                    <div className="px-6 pb-6 bg-gray-50 border-t border-gray-100">
                      <div className="flex items-center justify-between mt-4 mb-3">
                        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Usuários de {company.name}
                        </h4>
                        <button
                          onClick={() => handleOpenUserModal(company.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Novo Usuário
                        </button>
                      </div>
                      {usersLoading ? (
                        <div className="flex items-center justify-center py-6">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
                        </div>
                      ) : companyUsers.length === 0 ? (
                        <p className="text-sm text-gray-400 py-4">Nenhum usuário cadastrado</p>
                      ) : (
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left font-medium text-gray-600">Nome</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-600">E-mail</th>
                                <th className="px-4 py-2 text-center font-medium text-gray-600">Perfil</th>
                                <th className="px-4 py-2 text-center font-medium text-gray-600">Status</th>
                                <th className="px-4 py-2 text-center font-medium text-gray-600">Desde</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {companyUsers.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-2.5 font-medium text-gray-900">{u.full_name}</td>
                                  <td className="px-4 py-2.5 text-gray-500">{u.email}</td>
                                  <td className="px-4 py-2.5 text-center">
                                    <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                      {u.role}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                      u.active ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                    }`}>
                                      {u.active ? 'Ativo' : 'Inativo'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-center text-gray-400">{formatDate(u.created_at)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      {/* Modal Criar/Editar Empresa */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">
                {editingCompany ? 'Editar Empresa' : 'Nova Empresa'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logotipo</label>
                <div className="flex items-center gap-4">
                  {(logoPreview || logoFile) ? (
                    <div className="relative w-20 h-20 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
                      <img
                        src={logoFile ? URL.createObjectURL(logoFile) : logoPreview!}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => { setLogoFile(null); setLogoPreview(null); }}
                        className="absolute top-0.5 right-0.5 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors flex-shrink-0"
                    >
                      <FileImage className="w-6 h-6 text-gray-400" />
                      <span className="text-[10px] text-gray-400 mt-1">Logo</span>
                    </div>
                  )}
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) { setFormError('Imagem deve ter no máximo 2MB'); return; }
                        setLogoFile(file);
                        setLogoPreview(null);
                      }
                    }}
                  />
                  {!logoPreview && !logoFile && (
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                    >
                      <Upload className="w-4 h-4 inline mr-1" />Selecionar imagem
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Empresa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Razão Social da Empresa"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CNPJ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.cnpj}
                  onChange={e => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="00.000.000/0000-00"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="contato@empresa.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              {formError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {formError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                >
                  {submitLoading ? 'Salvando...' : editingCompany ? 'Salvar Alterações' : 'Criar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Usuário */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowUserModal(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Novo Usuário</h3>
              <button onClick={() => setShowUserModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={userForm.full_name}
                  onChange={e => setUserForm({ ...userForm, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Nome do usuário"
                  required
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  E-mail <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="email@exemplo.com"
                  required
                  autoComplete="new-email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Mínimo 6 caracteres"
                  required
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
                <select
                  value={userForm.role}
                  onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                >
                  <option value="ADMIN">Administrador</option>
                  <option value="GESTOR">Gestor</option>
                  <option value="LEITOR">Leitor</option>
                </select>
              </div>

              {userFormError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {userFormError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={userSubmitLoading}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                >
                  {userSubmitLoading ? 'Criando...' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </MainLayout>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colors[color] || colors.purple}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
