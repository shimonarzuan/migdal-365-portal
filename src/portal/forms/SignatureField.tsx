import { useEffect, useRef, useState } from 'react';
import { Button } from '@fluentui/react-components';
import { Icon, Pencil } from '@/shared/icons';

/**
 * שדה חתימה — ציור חופשי על Canvas (ללא ספרייה). הערך נשמר כ-Data URL (PNG).
 * בנוסף לחתימה הוויזואלית, ההגשה כולה מזוהה בזהות המאומתת של המגיש.
 */
export default function SignatureField({ value, onChange }: {
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [isEmpty, setIsEmpty] = useState(!value);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = value;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- טעינת חתימה קיימת פעם אחת

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setIsEmpty(false);
  };

  const end = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(e.currentTarget.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange('');
  };

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <canvas
          ref={canvasRef} width={400} height={120}
          className="w-full max-w-md rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] cursor-crosshair touch-none"
          onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerLeave={end}
          aria-label="אזור חתימה — ציירו את חתימתכם"
        />
        {isEmpty && (
          <span className="absolute inset-0 flex items-center justify-center gap-1.5 text-xs text-[var(--text-muted)] pointer-events-none">
            <Icon icon={Pencil} size={14} /> חתמו כאן (עכבר או מגע)
          </span>
        )}
      </div>
      <Button size="small" appearance="subtle" onClick={clear}>נקה חתימה</Button>
    </div>
  );
}
