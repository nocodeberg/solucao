/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSupabaseClient } from '@/lib/supabase/client';

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export type AuditEntity =
  | 'Funcionário'
  | 'Linha de Produção'
  | 'Produto'
  | 'Grupo'
  | 'Cargo'
  | 'Encargo'
  | 'Lançamento M.O.'
  | 'Manutenção'
  | 'Consumo Água'
  | 'Custos Variáveis'
  | 'Outros Custos'
  | 'Transporte'
  | 'Investimento'
  | 'Peça'
  | 'Lançamento Peças'
  | 'Peças/Hora'
  | 'Usuário'
  | 'Empresa';

interface AuditLogParams {
  companyId: string;
  userId: string;
  userName: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string;
  description: string;
  details?: Record<string, any>;
}

export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const supabase = createSupabaseClient();
    await (supabase.from('audit_logs') as any).insert({
      company_id: params.companyId,
      user_id: params.userId,
      user_name: params.userName,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId || null,
      description: params.description,
      details: params.details || null,
    });
  } catch (error) {
    console.error('Erro ao registrar log de auditoria:', error);
  }
}
