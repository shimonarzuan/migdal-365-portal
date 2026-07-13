import type { MailMessage } from '@/types';
import { makeEntityService, type EntityService } from './entityService';
import { logger } from './logger';

/**
 * ─── Mail Service — Outbox בלבד, אין שליחה מ-React ──────────────────────────
 * queue() רושם שורת MailMessage באוסף mailQueue (mock: localStorage · ייצור:
 * רשימת MailQueue ב-SharePoint). תהליך Power Automate / Azure Function מרוקן
 * את התור ושולח בפועל (Exchange). ההפרדה מבטיחה שאין תלות דוא"ל בדפדפן.
 */
export interface IMailService {
  queue(msg: Omit<MailMessage, 'id' | 'queuedAt' | 'status'>): MailMessage;
}

export const mailQueueService: EntityService<MailMessage> =
  makeEntityService<MailMessage>('mailQueue', 'MailQueue');

export function createMailService(persistQueue: (msg: MailMessage) => void): IMailService {
  return {
    queue(msg) {
      const full: MailMessage = {
        ...msg,
        id: `mail-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        queuedAt: new Date().toISOString(),
        status: 'queued',
      };
      persistQueue(full);
      logger.info('mailService: הודעה נוספה לתור (תישלח ע"י Power Automate)', { to: full.to, subject: full.subject });
      return full;
    },
  };
}
