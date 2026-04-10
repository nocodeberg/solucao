'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import Image from 'next/image';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      const redirect = searchParams?.get('redirect') || '/dashboard';
      router.push(redirect);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao fazer login. Verifique suas credenciais.';
      setError(message);
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
              <a
                href="#"
                className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Esqueci a senha
              </a>
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
            <a href="#" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
              Solicitar acesso
            </a>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-500">
            © 2026 Solução Industrial. Todos os direitos reservados.
          </div>
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
