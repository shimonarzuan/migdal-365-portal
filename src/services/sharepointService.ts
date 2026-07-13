import { graphClient } from './graphService';
import { envConfig } from './config';

/**
 * ─── sharepointService — SharePoint Online דרך Microsoft Graph בלבד ─────────
 * ללא Username/Password; אותו Token של Graph (הרשאת Sites.Read.All).
 * VITE_SHAREPOINT_SITE בפורמט: contoso.sharepoint.com:/sites/portal
 */

export interface SpDriveItem {
  id: string;
  name: string;
  size: number;
  webUrl: string;
  lastModifiedDateTime: string;
}

let _siteId: string | null = null;

/** מזהה האתר — נמשך פעם אחת ונשמר בזיכרון */
export async function getSiteId(): Promise<string> {
  if (_siteId) return _siteId;
  if (!envConfig.sharepointSite) throw new Error('VITE_SHAREPOINT_SITE אינו מוגדר');
  const site = await graphClient().api(`/sites/${envConfig.sharepointSite}`).select('id').get();
  _siteId = site.id as string;
  return _siteId;
}

/** קובצי ספריית המסמכים הראשית (למשל: מאגר הנהלים) */
export async function listDocuments(folderPath = ''): Promise<SpDriveItem[]> {
  const siteId = await getSiteId();
  const path = folderPath ? `/sites/${siteId}/drive/root:/${folderPath}:/children` : `/sites/${siteId}/drive/root/children`;
  const res = await graphClient().api(path).select('id,name,size,webUrl,lastModifiedDateTime').get();
  return res.value ?? [];
}

/** קישור צפייה לקובץ */
export async function getDocumentUrl(itemId: string): Promise<string> {
  const siteId = await getSiteId();
  const item = await graphClient().api(`/sites/${siteId}/drive/items/${itemId}`).select('webUrl').get();
  return item.webUrl;
}

/**
 * פריטי רשימת SharePoint (לרישום חתימות "קרא וחתום" בייצור).
 * הרשימה מנוהלת באתר ה-SharePoint של הפורטל.
 */
export async function getListItems(listName: string): Promise<Record<string, unknown>[]> {
  const siteId = await getSiteId();
  const res = await graphClient().api(`/sites/${siteId}/lists/${listName}/items`).expand('fields').get();
  return (res.value ?? []).map((it: { fields: Record<string, unknown> }) => it.fields);
}

export async function addListItem(listName: string, fields: Record<string, unknown>): Promise<void> {
  const siteId = await getSiteId();
  await graphClient().api(`/sites/${siteId}/lists/${listName}/items`).post({ fields });
}
