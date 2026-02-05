'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { UserCircle, Mail, Shield } from 'lucide-react';

const roleLabels: Record<string, { label: string; color: string }> = {
  ADMIN: { label: 'Administrador', color: 'bg-red-100 text-red-700' },
  GESTOR: { label: 'Gestor', color: 'bg-orange-100 text-orange-700' },
  RH: { label: 'Recursos Humanos', color: 'bg-blue-100 text-blue-700' },
  OPERADOR: { label: 'Operador', color: 'bg-green-100 text-green-700' },
  LEITOR: { label: 'Leitor', color: 'bg-gray-100 text-gray-700' },
};

export default function UsuariosPage() {
  const { profile } = useAuth();

  const roleInfo = profile ? roleLabels[profile.role] : null;

  return (
    <MainLayout title="Usuários">
      <div className="mb-6">
        <p className="text-gray-600">Gerenciamento de usuários do sistema</p>
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

      {/* Permissões do papel */}
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
                { role: 'ADMIN', desc: 'Acesso total ao sistema', criar: true, editar: true, excluir: true },
                { role: 'GESTOR', desc: 'Gerencia áreas e colaboradores', criar: true, editar: true, excluir: true },
                { role: 'RH', desc: 'Gerencia recursos humanos', criar: true, editar: true, excluir: true },
                { role: 'OPERADOR', desc: 'Realiza lançamentos e registros', criar: true, editar: true, excluir: false },
                { role: 'LEITOR', desc: 'Apenas visualização', criar: false, editar: false, excluir: false },
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
                    <td className="px-6 py-4 text-sm text-gray-600">{item.desc}</td>
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
    </MainLayout>
  );
}
