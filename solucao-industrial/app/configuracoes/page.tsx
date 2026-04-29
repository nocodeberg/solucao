'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { Briefcase, Percent, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createSupabaseClient } from '@/lib/supabase/client';
import { Company } from '@/types/database.types';

type Tab = 'empresa' | 'pessoais' | 'seguranca';

export default function ConfiguracoesPage() {
  const { user, profile } = useAuth();
  const supabase = createSupabaseClient();
  const [activeTab, setActiveTab] = useState<Tab>(profile?.company_id ? 'empresa' : 'pessoais');

  // Dados da Empresa
  const [company, setCompany] = useState<Company | null>(null);
  const [companyLoading, setCompanyLoading] = useState(true);

  // Dados Pessoais
  const [pessoaisForm, setPessoaisForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    cpf: '',
  });
  const [pessoaisLoading, setPessoaisLoading] = useState(false);
  const [pessoaisMsg, setPessoaisMsg] = useState('');

  // Segurança - Alterar Email
  const [emailForm, setEmailForm] = useState({
    novo_email: '',
    senha_atual: '',
  });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState('');

  // Segurança - Alterar Senha
  const [senhaForm, setSenhaForm] = useState({
    senha_atual: '',
    nova_senha: '',
    confirmar_senha: '',
  });
  const [senhaLoading, setSenhaLoading] = useState(false);
  const [senhaMsg, setSenhaMsg] = useState('');

  // Visibilidade de senha
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const togglePassword = (field: string) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Carregar dados da empresa
  const loadCompany = useCallback(async () => {
    if (!profile?.company_id) return;
    try {
      setCompanyLoading(true);
      const { data } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();
      if (data) setCompany(data as Company);
    } catch (error) {
      console.error('Erro ao carregar empresa:', error);
    } finally {
      setCompanyLoading(false);
    }
  }, [profile?.company_id, supabase]);

  // Carregar dados pessoais
  const loadPessoais = useCallback(async () => {
    if (!profile) return;
    // Buscar campos extras do profile (phone, cpf podem não existir)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile.id)
      .single();

    const raw = data as Record<string, unknown> | null;
    setPessoaisForm({
      full_name: String(raw?.full_name ?? profile.full_name ?? ''),
      email: String(raw?.email ?? profile.email ?? ''),
      phone: String(raw?.phone ?? ''),
      cpf: String(raw?.cpf ?? ''),
    });
  }, [profile, supabase]);

  useEffect(() => {
    loadCompany();
    loadPessoais();
  }, [loadCompany, loadPessoais]);

  // Salvar Dados Pessoais
  const handleSavePessoais = async () => {
    if (!profile) return;
    setPessoaisLoading(true);
    setPessoaisMsg('');
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('profiles') as any)
        .update({
          full_name: pessoaisForm.full_name,
          phone: pessoaisForm.phone,
          cpf: pessoaisForm.cpf,
        })
        .eq('id', profile.id);

      if (error) throw error;
      setPessoaisMsg('Dados salvos com sucesso!');
      setTimeout(() => setPessoaisMsg(''), 3000);
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      setPessoaisMsg('Erro ao salvar dados pessoais');
    } finally {
      setPessoaisLoading(false);
    }
  };

  // Alterar Email
  const handleChangeEmail = async () => {
    if (!emailForm.novo_email || !emailForm.senha_atual) {
      setEmailMsg('Preencha todos os campos');
      return;
    }
    setEmailLoading(true);
    setEmailMsg('');
    try {
      const response = await fetch('/api/users/change-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          new_email: emailForm.novo_email,
          current_password: emailForm.senha_atual,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setEmailMsg(data.error || 'Erro ao alterar email');
        return;
      }

      setEmailMsg('Email alterado com sucesso!');
      setEmailForm({ novo_email: '', senha_atual: '' });
      // Atualizar dados pessoais para refletir novo email
      setPessoaisForm((prev) => ({ ...prev, email: emailForm.novo_email }));
      setTimeout(() => setEmailMsg(''), 3000);
    } catch (error) {
      console.error('Erro ao alterar email:', error);
      setEmailMsg('Erro ao alterar email');
    } finally {
      setEmailLoading(false);
    }
  };

  // Alterar Senha
  const handleChangeSenha = async () => {
    if (!senhaForm.senha_atual || !senhaForm.nova_senha || !senhaForm.confirmar_senha) {
      setSenhaMsg('Preencha todos os campos');
      return;
    }
    if (senhaForm.nova_senha !== senhaForm.confirmar_senha) {
      setSenhaMsg('Nova senha e confirmação não coincidem');
      return;
    }
    if (senhaForm.nova_senha.length < 6) {
      setSenhaMsg('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    setSenhaLoading(true);
    setSenhaMsg('');
    try {
      // Verificar senha atual fazendo login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: senhaForm.senha_atual,
      });
      if (signInError) {
        setSenhaMsg('Senha atual incorreta');
        setSenhaLoading(false);
        return;
      }

      // Usar API admin para alterar senha
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          new_password: senhaForm.nova_senha,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setSenhaMsg(data.error || 'Erro ao alterar senha');
        return;
      }

      setSenhaMsg('Senha alterada com sucesso!');
      setSenhaForm({ senha_atual: '', nova_senha: '', confirmar_senha: '' });
      setTimeout(() => setSenhaMsg(''), 3000);
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      setSenhaMsg('Erro ao alterar senha');
    } finally {
      setSenhaLoading(false);
    }
  };

  const address = company?.address as Record<string, string> | undefined;

  const tabs: { key: Tab; label: string }[] = [
    ...(profile?.company_id ? [{ key: 'empresa' as Tab, label: 'Dados da Empresa' }] : []),
    { key: 'pessoais', label: 'Dados Pessoais' },
    { key: 'seguranca', label: 'Segurança' },
  ];

  const inputReadOnly = 'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 cursor-not-allowed';
  const inputEditable = 'w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500';

  return (
    <MainLayout title="Configurações">
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Dados da Empresa - Somente Leitura */}
      {activeTab === 'empresa' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-4xl">
          {companyLoading ? (
            <div className="text-center py-8 text-gray-500">Carregando...</div>
          ) : company ? (
            <div className="space-y-6">
              {/* Logotipo */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Logotipo</label>
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt="Logo"
                    className="w-20 h-20 rounded-lg border border-gray-200 object-contain"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                    Sem logo
                  </div>
                )}
              </div>

              {/* CNPJ e Razão Social */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">CNPJ</label>
                  <input type="text" value={company.cnpj || ''} readOnly className={inputReadOnly} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Razão Social</label>
                  <input type="text" value={company.name || ''} readOnly className={inputReadOnly} />
                </div>
              </div>

              {/* Email e Celular */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Email Para contato</label>
                  <input type="text" value={company.email || ''} readOnly className={inputReadOnly} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Celular</label>
                  <input type="text" value={company.phone || ''} readOnly className={inputReadOnly} />
                </div>
              </div>

              {/* Endereço */}
              {address && (
                <>
                  <h3 className="text-sm font-semibold text-gray-700 pt-2">Endereço</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">CEP</label>
                      <input type="text" value={address.cep || ''} readOnly className={inputReadOnly} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Rua/Endereço</label>
                      <input type="text" value={address.street || ''} readOnly className={inputReadOnly} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Número</label>
                      <input type="text" value={address.number || ''} readOnly className={inputReadOnly} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Bairro</label>
                      <input type="text" value={address.neighborhood || ''} readOnly className={inputReadOnly} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Complemento</label>
                      <input type="text" value={address.complement || ''} readOnly className={inputReadOnly} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Cidade - UF</label>
                      <input
                        type="text"
                        value={[address.city, address.state].filter(Boolean).join(' ')}
                        readOnly
                        className={inputReadOnly}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">Empresa não encontrada</div>
          )}
        </div>
      )}

      {/* Dados Pessoais */}
      {activeTab === 'pessoais' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-4xl">
          <div className="space-y-6">
            {/* Foto */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Foto</label>
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-16 h-16 rounded-lg border border-gray-200 object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 font-bold text-xl">
                  {pessoaisForm.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>

            {/* Nome e Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nome</label>
                <input
                  type="text"
                  value={pessoaisForm.full_name}
                  onChange={(e) => setPessoaisForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  className={inputEditable}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                <input type="text" value={pessoaisForm.email} readOnly className={inputReadOnly} />
              </div>
            </div>

            {/* Telefone e CPF */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Telefone</label>
                <input
                  type="text"
                  value={pessoaisForm.phone}
                  onChange={(e) => setPessoaisForm((prev) => ({ ...prev, phone: e.target.value }))}
                  className={inputEditable}
                  placeholder="(00) 0 0000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">CPF</label>
                <input
                  type="text"
                  value={pessoaisForm.cpf}
                  onChange={(e) => setPessoaisForm((prev) => ({ ...prev, cpf: e.target.value }))}
                  className={inputEditable}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            {/* Botão Salvar */}
            <div className="flex items-center justify-end gap-4">
              {pessoaisMsg && (
                <span className={`text-sm ${pessoaisMsg.includes('Erro') ? 'text-red-600' : 'text-green-600'}`}>
                  {pessoaisMsg}
                </span>
              )}
              <button
                onClick={handleSavePessoais}
                disabled={pessoaisLoading}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {pessoaisLoading ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Segurança */}
      {activeTab === 'seguranca' && (
        <div className="space-y-8 max-w-4xl">
          {/* Alterar Email */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Alterar Email</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Email Atual</label>
                <input type="text" value={user?.email || ''} readOnly className={inputReadOnly} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Novo Email</label>
                <input
                  type="email"
                  value={emailForm.novo_email}
                  onChange={(e) => setEmailForm((prev) => ({ ...prev, novo_email: e.target.value }))}
                  className={inputEditable}
                  placeholder="Digite seu email"
                  autoComplete="new-email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Senha Atual</label>
                <div className="relative">
                  <input
                    type={showPasswords['email_senha'] ? 'text' : 'password'}
                    value={emailForm.senha_atual}
                    onChange={(e) => setEmailForm((prev) => ({ ...prev, senha_atual: e.target.value }))}
                    className={inputEditable + ' pr-10'}
                    placeholder="******"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePassword('email_senha')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords['email_senha'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-4 mt-6">
              {emailMsg && (
                <span className={`text-sm ${emailMsg.includes('Erro') || emailMsg.includes('incorreta') ? 'text-red-600' : 'text-green-600'}`}>
                  {emailMsg}
                </span>
              )}
              <button
                onClick={handleChangeEmail}
                disabled={emailLoading}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {emailLoading ? 'Alterando...' : 'Alterar Email'}
              </button>
            </div>
          </div>

          {/* Alterar Senha */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Alterar Senha</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Senha Atual</label>
                <div className="relative">
                  <input
                    type={showPasswords['senha_atual'] ? 'text' : 'password'}
                    value={senhaForm.senha_atual}
                    onChange={(e) => setSenhaForm((prev) => ({ ...prev, senha_atual: e.target.value }))}
                    className={inputEditable + ' pr-10'}
                    placeholder="******"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePassword('senha_atual')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords['senha_atual'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nova Senha</label>
                <div className="relative">
                  <input
                    type={showPasswords['nova_senha'] ? 'text' : 'password'}
                    value={senhaForm.nova_senha}
                    onChange={(e) => setSenhaForm((prev) => ({ ...prev, nova_senha: e.target.value }))}
                    className={inputEditable + ' pr-10'}
                    placeholder="******"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePassword('nova_senha')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords['nova_senha'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Confirmar Senha</label>
                <div className="relative">
                  <input
                    type={showPasswords['confirmar_senha'] ? 'text' : 'password'}
                    value={senhaForm.confirmar_senha}
                    onChange={(e) => setSenhaForm((prev) => ({ ...prev, confirmar_senha: e.target.value }))}
                    className={inputEditable + ' pr-10'}
                    placeholder="******"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => togglePassword('confirmar_senha')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswords['confirmar_senha'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-4 mt-6">
              {senhaMsg && (
                <span className={`text-sm ${senhaMsg.includes('Erro') || senhaMsg.includes('incorreta') || senhaMsg.includes('coincidem') || senhaMsg.includes('pelo menos') ? 'text-red-600' : 'text-green-600'}`}>
                  {senhaMsg}
                </span>
              )}
              <button
                onClick={handleChangeSenha}
                disabled={senhaLoading}
                className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {senhaLoading ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Links para sub-páginas (Encargos e Cargos) */}
      <div className="mt-10 pt-8 border-t border-gray-200 max-w-4xl">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Configurações Adicionais</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/configuracoes/encargos"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-primary-200 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                <Percent className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600">Encargos Trabalhistas</h4>
                <p className="text-xs text-gray-500">Percentuais de encargos</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
          </Link>
          <Link
            href="/configuracoes/cargos"
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-primary-200 transition-all group flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600">Cadastro de Cargos</h4>
                <p className="text-xs text-gray-500">Cargos da empresa</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600" />
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
