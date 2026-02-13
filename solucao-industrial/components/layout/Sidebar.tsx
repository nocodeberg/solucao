'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Settings,
  ChevronDown,
  ChevronRight,
  UserCircle,
  Factory,
  Wrench,
  Droplets,
  Clock,
  FileText,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: MenuItem[];
  roles?: string[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>(['gestao-areas', 'rh']);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('Solução Industrial');

  // Buscar logo e nome da empresa
  React.useEffect(() => {
    async function fetchCompanyInfo() {
      if (!profile?.company_id) return;

      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        const { data, error } = await supabase
          .from('companies')
          .select('name, logo_url')
          .eq('id', profile.company_id)
          .single();

        if (!error && data) {
          setCompanyName(data.name || 'Solução Industrial');
          setCompanyLogo(data.logo_url);
        }
      } catch (error) {
        console.error('Erro ao buscar info da empresa:', error);
      }
    }

    fetchCompanyInfo();
  }, [profile?.company_id]);

  const menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      href: '/dashboard',
    },
    {
      id: 'gestao-areas',
      label: 'Gestão Áreas',
      icon: <Factory className="w-5 h-5" />,
      children: [
        {
          id: 'cadastro-processo',
          label: 'Cadastro Processo',
          icon: <FileText className="w-4 h-4" />,
          href: '/gestao-areas/linhas',
        },
        {
          id: 'cadastro-grupos',
          label: 'Cadastro Grupos',
          icon: <FileText className="w-4 h-4" />,
          href: '/gestao-areas/grupos',
        },
        {
          id: 'manutencao',
          label: 'Manutenção',
          icon: <Wrench className="w-4 h-4" />,
          href: '/manutencao',
        },
        {
          id: 'consumo-agua',
          label: 'Consumo água',
          icon: <Droplets className="w-4 h-4" />,
          href: '/consumo-agua',
        },
        {
          id: 'peca-por-hora',
          label: 'Peça por hora',
          icon: <Clock className="w-4 h-4" />,
          href: '/gestao-areas/pecas',
        },
      ],
    },
    {
      id: 'gestao-colaboradores',
      label: 'Gestão Colaboradores',
      icon: <Users className="w-5 h-5" />,
      children: [
        {
          id: 'funcionarios',
          label: 'Funcionários',
          icon: <UserCircle className="w-4 h-4" />,
          href: '/rh/funcionarios',
          roles: ['ADMIN', 'RH', 'GESTOR'],
        },
        {
          id: 'lancamento-mo',
          label: 'Lançamento M.O',
          icon: <FileText className="w-4 h-4" />,
          href: '/rh/lancamento-mo',
          roles: ['ADMIN', 'RH', 'GESTOR', 'OPERADOR'],
        },
      ],
    },
    {
      id: 'rh',
      label: 'RH',
      icon: <Briefcase className="w-5 h-5" />,
      roles: ['ADMIN', 'RH'],
      children: [
        {
          id: 'configuracoes-rh',
          label: 'Configurações',
          icon: <Settings className="w-4 h-4" />,
          href: '/configuracoes/encargos',
        },
        {
          id: 'cargos',
          label: 'Cadastro Cargos',
          icon: <FileText className="w-4 h-4" />,
          href: '/configuracoes/cargos',
        },
      ],
    },
    {
      id: 'usuarios',
      label: 'Usuários',
      icon: <Users className="w-5 h-5" />,
      href: '/usuarios',
      roles: ['ADMIN'],
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: <Settings className="w-5 h-5" />,
      href: '/configuracoes',
      roles: ['ADMIN'],
    },
    {
      id: 'resumo',
      label: 'Resumo',
      icon: <FileText className="w-5 h-5" />,
      href: '/resumo',
    },
  ];

  const toggleExpanded = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const hasAccess = (roles?: string[]) => {
    if (!roles || roles.length === 0) return true;
    return profile && roles.includes(profile.role);
  };

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    if (!hasAccess(item.roles)) return null;

    const isExpanded = expandedItems.includes(item.id);
    const isActive = item.href ? pathname === item.href : false;
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      return (
        <div key={item.id} className="mb-1">
          <button
            onClick={() => toggleExpanded(item.id)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-colors',
              level === 0 ? 'text-gray-300 hover:bg-dark-800' : 'text-gray-400 hover:bg-dark-800 ml-4'
            )}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              <span>{item.label}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children?.map((child) => renderMenuItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.href || '#'}
        className={cn(
          'flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors mb-1',
          level > 0 && 'ml-4',
          isActive
            ? 'bg-primary-600 text-white'
            : 'text-gray-300 hover:bg-dark-800'
        )}
      >
        {item.icon}
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-dark-900 border-r border-dark-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-dark-700">
        <div className="flex items-center justify-center">
          {companyLogo ? (
            <div className="w-32 h-24 relative">
              <Image
                src={companyLogo}
                alt={companyName}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
              <span className="text-white font-bold text-3xl">
                {companyName.substring(0, 2).toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <h1 className="text-center text-white font-semibold mt-3">
          {companyName}
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {menuItems.map((item) => renderMenuItem(item))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-dark-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center">
            <UserCircle className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {profile?.full_name}
            </p>
            <p className="text-xs text-gray-400">{profile?.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="w-full px-4 py-2 text-sm font-medium text-red-400 hover:bg-dark-800 rounded-lg transition-colors"
        >
          Sair
        </button>
      </div>
    </aside>
  );
}
