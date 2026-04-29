'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';

function ResetPasswordContent() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase envia o token via hash fragment, o client JS processa automaticamente
    const supabase = createSupabaseClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    // Verificar se já existe sessão de recovery
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      const supabase = createSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao redefinir senha';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Redefinir Senha</h1>
          <p className="text-sm text-gray-500 mt-1">Digite sua nova senha abaixo</p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="flex items-center gap-2 text-green-700 bg-green-50 p-4 rounded-lg justify-center">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Senha redefinida com sucesso!</span>
            </div>
            <p className="text-sm text-gray-500">Redirecionando para o login...</p>
          </div>
        ) : !sessionReady ? (
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
            <p className="text-sm text-gray-500">Verificando link de recuperação...</p>
            <p className="text-xs text-gray-400">Se a página não carregar, solicite um novo link de recuperação.</p>
            <Button variant="secondary" onClick={() => router.push('/login')} className="mt-4">
              Voltar ao login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nova Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              icon={<Lock className="w-5 h-5" />}
              required
            />
            <Input
              label="Confirmar Senha"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              icon={<Lock className="w-5 h-5" />}
              required
            />

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? 'Redefinindo...' : 'Redefinir Senha'}
            </Button>

            <button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full text-sm text-gray-500 hover:text-gray-700 mt-2"
            >
              Voltar ao login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
