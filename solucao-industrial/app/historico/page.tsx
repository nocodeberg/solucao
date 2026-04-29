'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { apiComplete } from '@/lib/api/supabase-complete';
import { History, Search, Filter, User, Clock, Plus, Pencil, Trash2, Building2 } from 'lucide-react';

interface AuditLog {
  id: string;
  company_id: string;
  user_id: string;
  user_name: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  entity_id: string | null;
  description: string;
  details: any;
  created_at: string;
}

const ACTION_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  CREATE: { label: 'Criação', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: <Plus className="w-4 h-4" /> },
  UPDATE: { label: 'Edição', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: <Pencil className="w-4 h-4" /> },
  DELETE: { label: 'Exclusão', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: <Trash2 className="w-4 h-4" /> },
};

const ENTITY_OPTIONS = [
  'Funcionário',
  'Linha de Produção',
  'Produto',
  'Grupo',
  'Cargo',
  'Encargo',
  'Lançamento M.O.',
  'Manutenção',
  'Custo Variável',
  'Custos Variáveis',
  'Outros Custos',
  'Transporte',
  'Investimento',
  'Peça',
  'Lançamento Peças',
  'Peças/Hora',
  'Usuário',
];

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function timeAgo(iso: string): string {
  const now = new Date();
  const d = new Date(iso);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}min atrás`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d atrás`;
  return formatDateTime(iso);
}

interface CompanyOption {
  id: string;
  name: string;
}

export default function HistoricoPage() {
  const { user, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [isMaster, setIsMaster] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [filterCompany, setFilterCompany] = useState('');

  useEffect(() => {
    fetch('/api/admin/check').then(r => r.json()).then(d => {
      if (d.isMaster) {
        setIsMaster(true);
        fetch('/api/admin/companies').then(r => r.json()).then(list => {
          if (Array.isArray(list)) setCompanies(list.map((c: any) => ({ id: c.id, name: c.name })));
        });
      }
    }).catch(() => {});
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      if (isMaster) {
        const params = new URLSearchParams();
        if (filterCompany) params.set('company_id', filterCompany);
        if (filterEntity) params.set('entity', filterEntity);
        if (filterAction) params.set('action', filterAction);
        params.set('limit', '500');
        const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      } else {
        const params: any = { limit: 500 };
        if (filterEntity) params.entity = filterEntity;
        if (filterAction) params.action = filterAction;
        const data = await apiComplete.auditLogs.list(params);
        setLogs(data);
      }
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  }, [filterEntity, filterAction, isMaster, filterCompany]);

  useEffect(() => {
    if (user && !authLoading) loadLogs();
  }, [user, authLoading, loadLogs]);

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.description.toLowerCase().includes(term) ||
      log.user_name.toLowerCase().includes(term) ||
      log.entity.toLowerCase().includes(term)
    );
  });

  // Agrupar por data
  const grouped = filteredLogs.reduce<Record<string, AuditLog[]>>((acc, log) => {
    const dateKey = new Date(log.created_at).toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(log);
    return acc;
  }, {});

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <History className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Histórico de Atividades</h1>
              <p className="text-sm text-gray-500">Registro de todas as alterações realizadas no sistema</p>
            </div>
          </div>
          <span className="text-sm text-gray-500">
            {filteredLogs.length} registro{filteredLogs.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por descrição, usuário ou entidade..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            <div className="flex gap-3 flex-wrap">
              {isMaster && (
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={filterCompany}
                    onChange={(e) => setFilterCompany(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white appearance-none"
                  >
                    <option value="">Todas empresas</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={filterEntity}
                  onChange={(e) => setFilterEntity(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white appearance-none"
                >
                  <option value="">Todas entidades</option>
                  {ENTITY_OPTIONS.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
              >
                <option value="">Todas ações</option>
                <option value="CREATE">Criação</option>
                <option value="UPDATE">Edição</option>
                <option value="DELETE">Exclusão</option>
              </select>
              {(searchTerm || filterEntity || filterAction || filterCompany) && (
                <button
                  onClick={() => { setSearchTerm(''); setFilterEntity(''); setFilterAction(''); setFilterCompany(''); }}
                  className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors whitespace-nowrap"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">Nenhum registro encontrado</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchTerm || filterEntity || filterAction
                ? 'Tente ajustar os filtros'
                : 'As atividades do sistema aparecerão aqui'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dateLabel, dayLogs]) => (
              <div key={dateLabel}>
                <div className="sticky top-0 z-10 bg-gray-50 py-2 px-1">
                  <h3 className="text-sm font-semibold text-gray-600 capitalize">{dateLabel}</h3>
                </div>
                <div className="space-y-2 mt-2">
                  {dayLogs.map((log) => {
                    const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.CREATE;
                    return (
                      <div
                        key={log.id}
                        className={`bg-white border rounded-lg px-4 py-3 hover:shadow-sm transition-shadow ${config.bg}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-full ${config.bg} ${config.color} flex-shrink-0`}>
                            {config.icon}
                          </div>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.bg} ${config.color} border w-[72px] text-center flex-shrink-0`}>
                            {config.label}
                          </span>
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full w-[140px] text-center flex-shrink-0 truncate">
                            {log.entity}
                          </span>
                          <p className="text-sm text-gray-900 font-medium truncate flex-1">{log.description}</p>
                          {isMaster && (log as any).companies?.name && (
                            <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full flex-shrink-0 truncate max-w-[120px]">
                              {(log as any).companies.name}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0 w-[130px] justify-end">
                            <User className="w-3 h-3" />
                            {log.user_name}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0 w-[80px] justify-end">
                            <Clock className="w-3 h-3" />
                            {timeAgo(log.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
