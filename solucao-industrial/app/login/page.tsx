'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Mail, Lock, AlertCircle, ArrowRight, X, Phone } from 'lucide-react';
import { createSupabaseClient } from '@/lib/supabase/client';
import Image from 'next/image';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [showInactiveModal, setShowInactiveModal] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError('Informe seu e-mail');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    setForgotMessage('');
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setForgotMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar e-mail de recuperação';
      setForgotError(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      const explicitRedirect = searchParams?.get('redirect');
      if (explicitRedirect) {
        router.push(explicitRedirect);
      } else {
        // Verificar se é master para redirecionar para /admin
        const checkRes = await fetch('/api/admin/check');
        const checkData = await checkRes.json();
        router.push(checkData.isMaster ? '/admin' : '/dashboard');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login. Verifique suas credenciais.';
      if (message === 'COMPANY_INACTIVE') {
        setShowInactiveModal(true);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Lado Esquerdo - Visual */}
      <div className="hidden lg:flex flex-[1.4] bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 p-12 items-center justify-center relative overflow-hidden">
        {/* Elementos decorativos de fundo */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-primary-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-secondary-500/20 rounded-full blur-3xl"></div>
        </div>

        {/* Conteúdo central */}
        <div className="relative z-10 text-center text-white max-w-lg">
          {/* Logo grande */}
          <div className="mb-8 flex justify-center">
            <div className="relative w-56 h-56">
              <Image
                src="/logos/solucao-industrial-prata.png"
                alt="Solução Industrial"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Texto promocional */}
          <h2 className="text-4xl font-bold mb-4">
            Sistema de Gestão Industrial
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Gerencie sua produção com eficiência e controle total
          </p>

          {/* Features */}
          <div className="space-y-4 text-left">
            <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Controle de Produção</h3>
                <p className="text-sm text-primary-100">Monitore todas as etapas do processo industrial</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Gestão de Áreas</h3>
                <p className="text-sm text-primary-100">Organize e controle diferentes áreas de produção</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-sm">✓</span>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Relatórios Detalhados</h3>
                <p className="text-sm text-primary-100">Análises completas para tomada de decisão</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="flex-[0.6] flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Logo pequeno no topo */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-600 to-secondary-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">SI</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Solução Industrial</span>
            </div>
          </div>

          {/* Título do formulário */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bem-vindo de volta
            </h1>
            <p className="text-gray-600">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>

          {/* Mensagem de erro */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              type="email"
              label="E-mail"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-5 h-5" />}
              required
            />

            <Input
              type="password"
              label="Senha"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-5 h-5" />}
              required
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-gray-600">Lembrar-me</span>
              </label>
              <button
                type="button"
                onClick={() => { setShowForgotModal(true); setForgotEmail(email); setForgotMessage(''); setForgotError(''); }}
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Esqueci a senha
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full group"
              disabled={loading}
            >
              <span>{loading ? 'Entrando...' : 'Entrar no Sistema'}</span>
              {!loading && (
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              )}
            </Button>
          </form>

          {/* Link de cadastro */}
          <div className="mt-8 text-center text-sm text-gray-600">
            Não tem uma conta?{' '}
            <a
              href="https://wa.me/5519982368202?text=Ol%C3%A1%2C%20gostaria%20de%20solicitar%20acesso%20ao%20sistema%20Solu%C3%A7%C3%A3o%20Industrial."
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
            >
              Solicitar acesso
            </a>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-500">
            © 2026 Solução Industrial. Todos os direitos reservados.
          </div>

          {/* Modal Esqueci a Senha */}
          {showForgotModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowForgotModal(false)}>
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Recuperar Senha</h3>
                  <button onClick={() => setShowForgotModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-4">Informe seu e-mail e enviaremos um link para redefinir sua senha.</p>
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <Input
                    label="E-mail"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="seu@email.com"
                    icon={<Mail className="w-5 h-5" />}
                    required
                  />
                  {forgotError && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {forgotError}
                    </div>
                  )}
                  {forgotMessage && (
                    <div className="text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                      {forgotMessage}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowForgotModal(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" variant="primary" className="flex-1" disabled={forgotLoading}>
                      {forgotLoading ? 'Enviando...' : 'Enviar'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal Empresa Inativa */}
          {showInactiveModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowInactiveModal(false)}>
              <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4 text-center" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end mb-2">
                  <button onClick={() => setShowInactiveModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Acesso Suspenso</h3>
                <p className="text-sm text-gray-600 mb-6">
                  Sua empresa está temporariamente inativa. Para mais informações ou reativação, entre em contato conosco.
                </p>
                <a
                  href="https://wa.me/5519982368202?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20com%20o%20acesso%20ao%20sistema.%20Minha%20empresa%20est%C3%A1%20inativa."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  Falar no WhatsApp (19) 98236-8202
                </a>
                <button
                  onClick={() => setShowInactiveModal(false)}
                  className="block mx-auto mt-4 text-sm text-gray-500 hover:text-gray-700"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>}>
      <LoginContent />
    </Suspense>
  );
}
