import { useEffect, useState } from 'react';
import { getChats } from '../../sillytavern/database';
import { Crosshair, MapPin, ChevronDown } from 'lucide-react';

interface Props { isOpen: boolean; onClose: () => void; onSend: (text: string) => void; }
interface BountyEntry { 排名或赏金?: string; 上榜理由与罪状?: string; 最后出没地点?: string; 赏金?: number; 姓名?: string; 身份?: string; 罪状?: string; 最后出没?: string; 评语?: string; }

export function BountyModal({ isOpen, onClose, onSend }: Props) {
  const [bounties, setBounties] = useState<BountyEntry[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) return;
    getChats().then(chats => { 
      const vars = (chats[0]?.variables || {}) as Record<string, unknown>;
      let raw: BountyEntry[] = [];
      // Flat key
      const bountyKey = Object.keys(vars).find(k => (k.includes('悬赏榜') || k === '武林榜单与悬赏.悬赏榜' || (k.includes('悬赏') && !k.includes('定海') && !k.includes('太阿') && !k.includes('惊蛰') && !k.includes('群芳') && !k.includes('名锋')))); console.log('[BountyModal] key:', bountyKey, '| arrLen:', ((bountyKey ? vars[bountyKey] : undefined) as any)?.length); const arr = bountyKey ? (vars[bountyKey] as BountyEntry[]) : undefined;
      if (arr && Array.isArray(arr)) raw = arr;
      // Nested
      if (raw.length === 0) {
        const nested = vars['武林榜单与悬赏'] as Record<string, BountyEntry[]> | undefined;
        if (nested) raw = nested['悬赏榜'] || nested['追杀榜'] || [];
      }
      setBounties(raw);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const toggle = (name: string) => {
    const next = new Set(expanded);
    next.has(name) ? next.delete(name) : next.add(name);
    setExpanded(next);
  };

  return (
    <div className="dz-modal-shell" onClick={onClose}>
      <div className="cm-box" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div className="cm-head">
          <Crosshair size={18} style={{ color: 'var(--wx-vermillion)' }} />
          <span>悬赏令</span>
          {bounties.length > 0 && <span className="cm-count">{bounties.length}份</span>}
          <button className="cm-close" onClick={onClose}>×</button>
        </div>

        <div className="cm-body">
          {bounties.length === 0 ? (
            <div className="cm-empty">暂无悬赏令</div>
          ) : (
            bounties.map((b, i) => {
              const name = b['姓名'] || '';
              const bounty = b['赏金'] || 0;
              const crime = b['罪状'] || b['上榜理由与罪状'] || '';
              const loc = b['最后出没'] || b['最后出没地点'] || '';
              const comment = b['评语'] || '';
              const isOpen = expanded.has(name);

              return (
                <div key={`${name}-${i}`} className={`lb-card ${isOpen ? 'open' : ''}`} onClick={() => toggle(name)}>
                  <div className="lb-rank" style={{ color: 'var(--wx-vermillion)' }}>
                    {bounty.toLocaleString()}两
                  </div>
                  <div className="lb-body">
                    <div className="lb-name-row">
                      <span className="lb-name">{name}</span>
                      {b['身份'] && <span className="lb-identity">{b['身份']}</span>}
                    </div>
                    <div className="lb-reason">{crime}</div>
                    {loc && <div className="lb-location"><MapPin size={11} />{loc}</div>}
                    {comment && isOpen && (
                      <div className="lb-comment">
                        <div className="lb-comment-label">大理寺按</div>
                        <div className="lb-comment-text">{comment}</div>
                      </div>
                    )}
                  </div>
                  <button className="cm-track-btn" onClick={e => { e.stopPropagation(); onSend(`前往追踪悬赏目标「${name}」，${loc ? `最后出没于${loc}。` : '搜寻其下落。'}`); onClose(); }}>
                    追踪
                  </button>
                  {comment && (
                    <div className={`lb-expand ${isOpen ? 'open' : ''}`}><ChevronDown size={14} /></div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
