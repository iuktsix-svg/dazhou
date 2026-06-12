import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

interface Props { blocks: string[]; defaultOpen?: boolean; }

export function ThinkingFold({ blocks, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  if (blocks.length === 0) return null;

  return (
    <div className="thinking-fold">
      <button className="thinking-toggle-btn" onClick={() => setOpen(!open)}>
        <ChevronRight size={14} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        思考过程 ({blocks.length})
      </button>
      {open && <div className="thinking-content">{blocks.join('\n---\n')}</div>}
    </div>
  );
}
