import type { AuditEntry } from '@/types';
import { isMsalMode } from './config';
import { loadCollection, saveCollection } from './storageService';
import { logger } from './logger';

/**
 * ─── auditService — יומן ביקורת לכל פעולה ניהולית ───────────────────────────
 * mock: localStorage ('migdal365.audit').
 * production: רשימת SharePoint בשם "AuditLog" (ראו docs/sharepoint-schema.md).
 */

const COLLECTION = 'audit';

export interface AuditInput {
  userId: string;
  userDisplayName: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  source?: 'portal' | 'admin';
}

const snapshot = (v: unknown): string | null => {
  if (v === undefined || v === null) return null;
  try { return JSON.stringify(v).slice(0, 4000); } catch { return String(v); }
};

export function record(input: AuditInput): AuditEntry {
  const entry: AuditEntry = {
    id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    userId: input.userId,
    userDisplayName: input.userDisplayName,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    oldValue: snapshot(input.oldValue),
    newValue: snapshot(input.newValue),
    timestamp: new Date().toISOString(),
    source: input.source ?? 'admin',
    ipAddress: '0.0.0.0', // placeholder — כתובת אמת תתווסף בצד שרת/Proxy
  };

  if (isMsalMode) {
    // production: כתיבה לרשימת SharePoint "AuditLog" (fire-and-forget)
    import('./sharepointService')
      .then(({ addListItem }) => addListItem('AuditLog', { ...entry }))
      .catch((err) => logger.warn('audit: כתיבה ל-SharePoint נכשלה — נשמר מקומית', err));
  }
  const existing = loadCollection<AuditEntry>(COLLECTION) ?? [];
  saveCollection(COLLECTION, [entry, ...existing].slice(0, 1000));
  logger.info(`audit: ${input.action} ${input.entityType}/${input.entityId} ע"י ${input.userDisplayName}`);
  return entry;
}

export function getAuditLog(): AuditEntry[] {
  return loadCollection<AuditEntry>(COLLECTION) ?? [];
}

export function clearAuditLog(): void {
  saveCollection(COLLECTION, []);
}
