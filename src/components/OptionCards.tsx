import { useMemo } from 'react';

interface Props { html: string; onSelect: (text: string) => void; }

export function OptionCards({ html, onSelect }: Props) {
  const options = useMemo(() => {
    const match = html.match(/<w3g>([\s\S]*?)<\/w3g>/i);
    if (!match) return [];
    return match[1]
      .trim()
      .split(/\r?\n/)
      .map(line => { const m = line.trim().match(/^\d+\.\s*(.*)/); return m ? m[1] : ''; })
      .filter(Boolean);
  }, [html]);

  if (options.length === 0) return null;

  return (
    <div className="dz-options-container">
      {options.map((opt, idx) => (
        <div key={idx} className="dz-option-card" onClick={() => onSelect(opt)}>
          <span className="opt-num">选项 {idx + 1}</span>
          <span className="opt-text">{opt}</span>
        </div>
      ))}
    </div>
  );
}
