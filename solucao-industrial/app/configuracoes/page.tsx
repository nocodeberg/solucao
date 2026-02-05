'use client';

import React from 'react';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import { Settings, Briefcase, Percent, ChevronRight } from 'lucide-react';

interface ConfigItem {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const configItems: ConfigItem[] = [
  {
    href: '/configuracoes/encargos',
    icon: <Percent className="w-6 h-6" />,
    title: 'Encargos Trabalhistas',
    description: 'Configure os percentuais de encargos aplicados sobre o salário base dos funcionários',
    color: 'from-blue-500 to-blue-600',
  },
  {
    href: '/configuracoes/cargos',
    icon: <Briefcase className="w-6 h-6" />,
    title: 'Cadastro de Cargos',
    description: 'Gerencie os cargos disponíveis na empresa para atribuição aos funcionários',
    color: 'from-purple-500 to-purple-600',
  },
];

export default function ConfiguracoesPage() {
  return (
    <MainLayout title="Configurações">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center text-white">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Configurações do Sistema</h2>
            <p className="text-gray-600">Acesse as opções de configuração abaixo</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {configItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-primary-200 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white flex-shrink-0`}>
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors mt-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </MainLayout>
  );
}
