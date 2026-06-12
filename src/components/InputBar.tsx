import { useRef, useEffect } from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  isSending: boolean;
  onToggle: () => void;
}

export function InputBar({ value, onChange, onSend, onStop, isSending, onToggle }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
    if (e.key === 'Escape') onToggle();
  };

  return (
    <div className="dz-input-wrap">
      <button className="dz-bb-btn" onClick={onToggle} style={{ fontSize: 14 }}>✕</button>
      <input
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="写下你的行动…"
        disabled={isSending}
      />
      {isSending ? (
        <button className="dz-send-btn stop" onClick={onStop}>停</button>
      ) : (
        <button className="dz-send-btn" onClick={onSend} disabled={!value.trim()}>发</button>
      )}
    </div>
  );
}
