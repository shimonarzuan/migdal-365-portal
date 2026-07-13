import { useState } from 'react';
import { useData } from '@/shared/DataContext';
import { Panel } from '@/shared/ui';
import { Icon, Sparkles } from '@/shared/icons';

const SUGGESTIONS = ['איך אני פותח קריאת שירות?', 'מי מנהל אגף הרווחה?', 'איך מזמינים רכב?', 'איפה טופס חופשה?'];

/** העוזר החכם — שלד מוכן לחיבור Microsoft Copilot / Azure OpenAI */
export default function AiAssistant() {
  const { data } = useData();
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);

  const mockAnswer = (text: string): string => {
    const dept = data.departments.find((d) => text.includes(d.name));
    if (dept) return `אגף ${dept.name}: ${dept.managerName ? `מנהל/ת — ${dept.managerName}, ` : ''}טלפון ${dept.phone}.`;
    const proc = data.procedures.find((p) => text.split(' ').some((w) => w.length > 2 && p.title.includes(w)));
    if (proc) return `נמצא: "${proc.title}" — ${proc.description}`;
    return 'בגרסה מלאה אחפש בכל הנהלים, אנשי הקשר והמערכות. נסו: "מי מנהל אגף הרווחה?"';
  };

  const ask = (text: string) => { setQ(text); setAnswer(mockAnswer(text)); };

  return (
    <Panel title="שאל את Migdal AI" icon={<Icon icon={Sparkles} size={15} />}
           action={<span className="text-[11px] text-[var(--text-muted)]">בקרוב: Copilot</span>}>
      <form onSubmit={(e) => { e.preventDefault(); if (q.trim()) ask(q); }} className="flex gap-1.5">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder='שאלו כל דבר: "איפה נוהל רכש?"' aria-label="שאלה לעוזר החכם"
               className="flex-1 min-w-0 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-sunken)] px-3 py-2.5 text-sm focus:outline-2 focus:outline-[var(--focus-ring)] focus:bg-[var(--surface)] focus:border-[var(--primary)] transition-colors" />
        <button type="submit" className="bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white rounded-[var(--radius-md)] px-4 text-sm font-medium transition-colors cursor-pointer">שאל</button>
      </form>
      <div className="flex flex-wrap gap-1.5 mt-2.5">
        {SUGGESTIONS.map((s) => (
          <button key={s} onClick={() => ask(s)}
                  className="text-[11px] bg-[var(--surface-sunken)] hover:bg-[var(--accent)] rounded-full px-2.5 py-1.5 text-[var(--text-secondary)] transition-colors cursor-pointer">{s}</button>
        ))}
      </div>
      {answer && <p className="mt-2.5 text-sm text-[var(--text-secondary)] bg-[var(--accent)] rounded-[var(--radius-md)] p-2.5 leading-relaxed">{answer}</p>}
    </Panel>
  );
}
