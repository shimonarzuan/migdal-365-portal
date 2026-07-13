import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { AnimatePresence, LazyMotion, domAnimation, m, motionTokens } from './motion';
import { Icon, Check, X, AlertTriangle, Info, type LucideIcon } from './icons';

/** ─── Toast notifications — משוב לא-חוסם לפעולות ולשגיאות ─── */

type ToastKind = 'success' | 'error' | 'info' | 'warning';
interface Toast { id: number; kind: ToastKind; text: string }

interface ToastApi {
  success: (text: string) => void;
  error: (text: string) => void;
  info: (text: string) => void;
  warning: (text: string) => void;
}

const Ctx = createContext<ToastApi | null>(null);
const DISMISS_MS = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((kind: ToastKind, text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), DISMISS_MS);
  }, []);

  const api: ToastApi = {
    success: (t) => push('success', t),
    error: (t) => push('error', t),
    info: (t) => push('info', t),
    warning: (t) => push('warning', t),
  };

  const styles: Record<ToastKind, string> = {
    success: 'bg-[var(--success)]',
    error: 'bg-[var(--danger)]',
    warning: 'bg-[var(--warning)]',
    info: 'bg-[var(--primary)]',
  };
  const icons: Record<ToastKind, LucideIcon> = { success: Check, error: X, warning: AlertTriangle, info: Info };

  return (
    <Ctx.Provider value={api}>
      {children}
      <LazyMotion features={domAnimation}>
        <div className="fixed bottom-20 md:bottom-6 inset-x-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4" aria-live="polite">
          <AnimatePresence>
            {toasts.map((t) => (
              <m.div
                key={t.id}
                initial={{ opacity: 0, y: -16, scale: 0.96 }}
                animate={t.kind === 'error'
                  ? { opacity: 1, y: 0, scale: 1, x: [0, -6, 6, -4, 0] }
                  : { opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={t.kind === 'success'
                  ? { type: 'spring', stiffness: 480, damping: 16 }
                  : { duration: motionTokens.duration.base, ease: motionTokens.ease.out }}
                className={`${styles[t.kind]} relative overflow-hidden text-white text-sm rounded-xl px-4 py-2.5 shadow-lg flex items-center gap-2 max-w-md`}
              >
                <Icon icon={icons[t.kind]} size={16} />{t.text}
                <m.span
                  aria-hidden
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: DISMISS_MS / 1000, ease: 'linear' }}
                  style={{ transformOrigin: 'right' }}
                  className="absolute bottom-0 inset-x-0 h-0.5 bg-white/50"
                />
              </m.div>
            ))}
          </AnimatePresence>
        </div>
      </LazyMotion>
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
