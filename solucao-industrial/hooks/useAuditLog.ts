/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { logAudit, AuditAction, AuditEntity } from '@/lib/audit';

export function useAuditLog() {
  const { profile } = useAuth();

  const log = useCallback(
    async (
      action: AuditAction,
      entity: AuditEntity,
      description: string,
      entityId?: string,
      details?: Record<string, any>
    ) => {
      if (!profile?.company_id) return;
      await logAudit({
        companyId: profile.company_id,
        userId: profile.id,
        userName: profile.full_name || profile.email || 'Desconhecido',
        action,
        entity,
        entityId,
        description,
        details,
      });
    },
    [profile]
  );

  return { log };
}
