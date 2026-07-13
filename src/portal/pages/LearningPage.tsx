import { useMemo, useState } from 'react';
import type { LearningModule } from '@/types';
import { useData } from '@/shared/DataContext';
import { useToast } from '@/shared/Toast';
import { Badge, Btn, Empty, Panel, PageHeader } from '@/shared/ui';
import { Icon, GraduationCap, PlayCircle, Check, Clock, ExternalLink } from '@/shared/icons';
import { isModuleForEmployee, startCompletion, finishCompletion } from '@/services/learningService';

const fmt = (d: string) => (d ? `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}` : '');

/**
 * מסך לומדה — תוכן הדרכה שפורסם ומיועד לעובד, עם מבחן אופציונלי.
 * כל התחלה/סיום נרשם ב-LearningCompletion (מי + מתי + ציון) — זהו מקור
 * האמת לדוח "מי ביצע מה ומתי" שנראה גם בפאנל הניהול.
 */
export default function LearningPage() {
  const { data, user, upsert, audit } = useData();
  const toast = useToast();
  const [openId, setOpenId] = useState<string | null>(null);

  const modules = useMemo(
    () => data.learningModules.filter((m) => isModuleForEmployee(m, user)),
    [data.learningModules, user],
  );
  const myCompletions = data.learningCompletions.filter((c) => c.employeeId === user.id);
  const completionOf = (moduleId: string) => myCompletions.find((c) => c.moduleId === moduleId && c.completedAt);

  const openModule = data.learningModules.find((m) => m.id === openId);

  const startModule = (m: LearningModule) => {
    const existing = myCompletions.find((c) => c.moduleId === m.id && !c.completedAt);
    if (!existing) {
      const c = startCompletion(m.id, user.id);
      upsert('learningCompletions', c);
      audit('started', 'learningModule', m.id, null, { by: user.id });
    }
    setOpenId(m.id);
  };

  const finish = (m: LearningModule, answers: Record<string, number>) => {
    const inProgress = myCompletions.find((c) => c.moduleId === m.id && !c.completedAt) ?? startCompletion(m.id, user.id);
    const done = finishCompletion(inProgress, m, answers);
    upsert('learningCompletions', done);
    audit('completed', 'learningModule', m.id, null, { by: user.id, score: done.score, passed: done.passed });
    toast[done.passed === false ? 'error' : 'success'](
      m.quiz.length ? `${done.passed ? 'עברת' : 'לא עברת'} את המבחן — ציון ${done.score}%` : 'הלומדה הושלמה',
    );
    setOpenId(null);
  };

  const completedCount = modules.filter((m) => completionOf(m.id)).length;

  return (
    <div className="space-y-4">
      <PageHeader title="לומדה" icon={<Icon icon={GraduationCap} size={20} />}
        subtitle={`תוכן הדרכה והכשרה המיועד לך · הושלמו ${completedCount} מתוך ${modules.length}`} />

      {openModule ? (
        <ModuleViewer module={openModule} onClose={() => setOpenId(null)} onFinish={(answers) => finish(openModule, answers)} />
      ) : (
        <Panel title="מודולים זמינים" icon={<Icon icon={GraduationCap} size={15} />}>
          {modules.length === 0 && <Empty text="אין כרגע לומדות המיועדות לך." />}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {modules.map((m) => {
              const c = completionOf(m.id);
              return (
                <article key={m.id} className="bg-[var(--surface)] rounded-[var(--radius-lg)] border border-[var(--border)] shadow-[var(--shadow-sm)] p-4 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <strong className="text-sm text-[var(--text)]">{m.title}</strong>
                    {c
                      ? <Badge tone={c.passed === false ? 'danger' : 'success'}>{m.quiz.length ? `${c.score}%` : '✓ הושלם'}</Badge>
                      : m.dueDate && <Badge tone="warning">עד {fmt(m.dueDate)}</Badge>}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] flex-1">{m.description}</p>
                  {c?.completedAt && (
                    <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                      <Icon icon={Clock} size={12} /> הושלם ב-{fmt(c.completedAt)}
                    </p>
                  )}
                  <Btn small onClick={() => startModule(m)}>
                    <Icon icon={PlayCircle} size={14} /> {c ? 'צפייה חוזרת' : 'התחלה'}
                  </Btn>
                </article>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}

function ModuleViewer({ module: m, onClose, onFinish }: {
  module: LearningModule; onClose: () => void; onFinish: (answers: Record<string, number>) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const allAnswered = m.quiz.every((q) => answers[q.id] !== undefined);

  return (
    <Panel title={m.title} icon={<Icon icon={GraduationCap} size={15} />}
           action={<Btn small variant="ghost" onClick={onClose}>סגירה</Btn>}>
      <div className="space-y-4">
        <p className="text-sm text-[var(--text-secondary)]">{m.description}</p>

        {m.contentType === 'richText' && m.contentBody && (
          <div className="text-sm text-[var(--text)] whitespace-pre-line bg-[var(--surface-sunken)] rounded-[var(--radius-md)] p-3">{m.contentBody}</div>
        )}
        {m.contentType === 'video' && m.contentUrl && (
          <div className="aspect-video rounded-[var(--radius-md)] overflow-hidden border border-[var(--border)]">
            <iframe src={m.contentUrl} title={m.title} className="w-full h-full" allowFullScreen />
          </div>
        )}
        {(m.contentType === 'pdf' || m.contentType === 'link') && m.contentUrl && (
          <a href={m.contentUrl} target="_blank" rel="noreferrer"
             className="inline-flex items-center gap-1.5 text-sm border border-[var(--primary)] text-[var(--primary-dark)] bg-[var(--accent)] rounded-[var(--radius-md)] px-3 py-2">
            <Icon icon={ExternalLink} size={14} /> פתיחת {m.contentType === 'pdf' ? 'המסמך' : 'הקישור'}
          </a>
        )}

        {m.quiz.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-[var(--border)]">
            <h3 className="text-xs font-bold text-[var(--text-muted)]">מבחן קצר ({m.quiz.length} שאלות · ציון עובר: {m.passScore}%)</h3>
            {m.quiz.map((q, qi) => (
              <fieldset key={q.id} className="space-y-1.5">
                <legend className="text-sm text-[var(--text)] font-medium">{qi + 1}. {q.question}</legend>
                {q.options.map((opt, oi) => (
                  <label key={oi} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
                    <input type="radio" name={q.id} checked={answers[q.id] === oi}
                           onChange={() => setAnswers((a) => ({ ...a, [q.id]: oi }))} />
                    {opt}
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Btn onClick={() => onFinish(answers)} disabled={m.quiz.length > 0 && !allAnswered}>
            <Icon icon={Check} size={14} /> {m.quiz.length ? 'הגשת המבחן' : 'סיימתי'}
          </Btn>
        </div>
      </div>
    </Panel>
  );
}
