import type { PdfRenderRequest, PdfRenderResult } from '@/types';
import { logger } from './logger';

/**
 * ─── PDF Service Interface ───────────────────────────────────────────────────
 * חוזה בלבד בשלב זה — אין יצירת PDF בדפדפן. המימוש העתידי: Azure Function
 * שמקבלת form+submission, מרנדרת לפי תבנית (form.pdf.templateId), שומרת בשם
 * הקובץ שנגזר מ-form.pdf.fileName ומחזירה URL לספריית הארכיון (form.archive).
 * ה-UI קורא רק את הממשק הזה, כך שהחלפת המימוש לא תדרוש שינוי בקומפוננטות.
 */
export interface IPdfService {
  generateSubmissionPdf(req: PdfRenderRequest): Promise<PdfRenderResult>;
}

const DEFAULT_FILE_NAME_PATTERN = '{formTitle}-{employeeName}-{date}';

/** מחליף placeholders בדפוס שם הקובץ בערכי ההגשה בפועל */
export function resolveFileName(pattern: string | undefined, req: PdfRenderRequest): string {
  const base = (pattern || DEFAULT_FILE_NAME_PATTERN)
    .replace('{employeeName}', req.submission.employeeName)
    .replace('{formTitle}', req.form.title)
    .replace('{date}', req.submission.submittedAt.slice(0, 10))
    .replace('{submissionId}', req.submission.id);
  return `${base}.pdf`;
}

export const pdfService: IPdfService = {
  async generateSubmissionPdf(req) {
    if (!req.form.pdf.enabled) {
      logger.info('pdfService: הפקת PDF כבויה עבור טופס זה', { formId: req.form.id });
      return { status: 'disabled' };
    }
    const fileName = resolveFileName(req.form.pdf.fileName, req);
    logger.info('pdfService: בקשת PDF (טרם מומש — ימומש כ-Azure Function)', {
      formId: req.form.id, submissionId: req.submission.id,
      templateId: req.form.pdf.templateId ?? null, fileName,
      archiveLibrary: req.form.archive.enabled ? req.form.archive.libraryName : null,
    });
    return { status: 'notImplemented', fileName };
  },
};
