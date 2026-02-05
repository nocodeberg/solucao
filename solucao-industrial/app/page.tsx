'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-secondary-600">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-lg mb-4 animate-pulse">
          <span className="text-4xl font-bold bg-gradient-to-br from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            SI
          </span>
        </div>
        <p className="text-white text-lg">Carregando...</p>
      </div>
    </div>
  );
}
