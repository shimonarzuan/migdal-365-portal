import { Suspense, lazy, useState } from 'react';
import { DataProvider, useData } from '@/shared/DataContext';
import { isMsalMode, assertProductionConfig } from '@/services/config';
import ErrorBoundary from '@/shared/ErrorBoundary';
import { ToastProvider } from '@/shared/Toast';
import PageTransition from '@/shared/PageTransition';
import { PageSkeleton } from '@/shared/Skeleton';
import AppShell from '@/portal/layout/AppShell';
import type { PageId } from '@/portal/layout/Sidebar';
import Home from '@/portal/pages/Home';

// ולידציית קונפיגורציה — נכשל מוקדם וברור אם חסרות הגדרות בייצור
assertProductionConfig();

// ספריות Microsoft נטענות רק במצב ייצור (msal) — הפיתוח נשאר קל ומהיר
const AuthGate = lazy(() => import('@/shared/AuthGate'));

// עמודים נטענים בשיטת Lazy Loading — כל עמוד כ-Chunk נפרד
const Departments = lazy(() => import('@/portal/pages/Departments'));
const DepartmentPage = lazy(() => import('@/portal/pages/DepartmentPage'));
const ProceduresPage = lazy(() => import('@/portal/pages/ProceduresPage'));
const EmployeeRightsPage = lazy(() => import('@/portal/pages/EmployeeRightsPage'));
const ReceptionHoursPage = lazy(() => import('@/portal/pages/ReceptionHoursPage'));
const FormsPage = lazy(() => import('@/portal/pages/FormsPage'));
const ReadSignPage = lazy(() => import('@/portal/pages/ReadSignPage'));
const LearningPage = lazy(() => import('@/portal/pages/LearningPage'));
const ContactsPage = lazy(() => import('@/portal/pages/ContactsPage'));
const EmployeePage = lazy(() => import('@/portal/pages/EmployeePage'));
const OrgTreePage = lazy(() => import('@/portal/pages/OrgTreePage'));
const SystemsPage = lazy(() => import('@/portal/pages/SystemsPage'));
const ReportsPage = lazy(() => import('@/portal/pages/ReportsPage'));
const AdminPage = lazy(() => import('@/admin/AdminPage'));

function Router() {
  const { data } = useData();
  const [page, setPage] = useState<PageId>('home');
  const [deptId, setDeptId] = useState<string | null>(null);
  const [empId, setEmpId] = useState<string | null>(null);
  const [formId, setFormId] = useState<string | null>(null);
  const [empBackPage, setEmpBackPage] = useState<PageId>('contacts');

  const navigate = (p: PageId) => { setPage(p); setDeptId(null); setEmpId(null); setFormId(null); window.scrollTo(0, 0); };
  const openDept = (id: string) => { setDeptId(id); setEmpId(null); setPage('departments'); window.scrollTo(0, 0); };
  const openEmployee = (id: string) => { setEmpBackPage(page); setEmpId(id); window.scrollTo(0, 0); };
  const openForm = (id: string) => { setFormId(id); setEmpId(null); setDeptId(null); setPage('forms'); window.scrollTo(0, 0); };

  const dept = deptId ? data.departments.find((d) => d.id === deptId) : null;
  const pageKey = empId ? `emp-${empId}` : dept ? `dept-${deptId}` : page;

  return (
    <AppShell page={page} onNavigate={navigate} onOpenDept={openDept}>
      <Suspense fallback={<PageSkeleton />}>
        <PageTransition pageKey={pageKey}>
          {empId ? (
            <EmployeePage empId={empId} onBack={() => { setEmpId(null); setPage(empBackPage); }}
                          onOpenEmployee={openEmployee} onOpenDept={openDept} />
          ) : (
            <>
              {page === 'home' && <Home onNavigate={navigate} onOpenDept={openDept} />}
              {page === 'departments' && (dept
                ? <DepartmentPage department={dept} onBack={() => setDeptId(null)} />
                : <Departments onOpen={openDept} />)}
              {page === 'procedures' && <ProceduresPage onOpenDept={openDept} onOpenForm={openForm} />}
              {page === 'rights' && <EmployeeRightsPage onOpenForm={openForm} />}
              {page === 'reception' && <ReceptionHoursPage />}
              {page === 'forms' && <FormsPage initialFormId={formId} />}
              {page === 'readsign' && <ReadSignPage />}
              {page === 'learning' && <LearningPage />}
              {page === 'contacts' && <ContactsPage onOpenEmployee={openEmployee} />}
              {page === 'orgtree' && <OrgTreePage onOpenEmployee={openEmployee} />}
              {page === 'systems' && <SystemsPage onOpenDept={openDept} />}
              {page === 'reports' && <ReportsPage />}
              {page === 'admin' && <AdminPage onOpenEmployee={openEmployee} />}
            </>
          )}
        </PageTransition>
      </Suspense>
    </AppShell>
  );
}

export default function AppRoot() {
  const app = (
    <DataProvider>
      <Router />
    </DataProvider>
  );
  // ErrorBoundary + Toasts עוטפים את כל המערכת
  const wrapped = (
    <ErrorBoundary>
      <ToastProvider>{app}</ToastProvider>
    </ErrorBoundary>
  );
  // ייצור: SSO מלא דרך Entra ID · פיתוח: ישירות עם נתוני Mock
  return isMsalMode
    ? <Suspense fallback={null}><AuthGate>{wrapped}</AuthGate></Suspense>
    : wrapped;
}
