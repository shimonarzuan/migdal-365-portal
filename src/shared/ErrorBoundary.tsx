import { Component, type ReactNode } from 'react';
import { logger } from '@/services/logger';
import { userMessage } from '@/services/errorService';
import { Icon, AlertTriangle } from '@/shared/icons';

/** ─── ErrorBoundary — קריסת רכיב לא מפילה את הפורטל ─── */
export default class ErrorBoundary extends Component<{ children: ReactNode }, { error: unknown | null }> {
  state = { error: null as unknown | null };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidCatch(error: unknown, info: { componentStack?: string | null }) {
    logger.error('ErrorBoundary: קריסת רכיב', { error: String(error), stack: info.componentStack });
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-[50vh] grid place-items-center p-6">
          <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-8 text-center max-w-md">
            <div className="mb-3 flex justify-center text-[var(--danger)]"><Icon icon={AlertTriangle} size={40} /></div>
            <h1 className="text-lg font-bold text-[var(--text)]">משהו השתבש</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{userMessage(this.state.error)}</p>
            <button
              onClick={() => { this.setState({ error: null }); window.location.reload(); }}
              className="mt-4 bg-[var(--primary,#2A9090)] text-white text-sm rounded-xl px-5 py-2.5 cursor-pointer"
            >
              רענון הדף
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
