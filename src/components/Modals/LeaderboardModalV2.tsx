import { useEffect, useState } from 'react';
import { getChats } from '../../sillytavern/database';
import { Crown, Swords, Star, Sparkles, BookOpen, MapPin, ChevronDown } from 'lucide-react';

interface Props { isOpen: boolean; onClose: () => void; }
interface LbEntry { 排名?: string; 排名或赏金?: string; 姓名?: string; 身份?: string; 上榜理由?: string; 上榜理由与罪状?: string; 罪状?: string; 最后出没?: string; 最后出没地点?: string; 赏金?: number; 评语?: string; }

const TABS = [
  { key: '定海神针榜', label: '定海神针榜', subtitle: '九位天人', icon: Crown, color: 'var(--wx-gold)' },
  { key: '太阿录', label: '太阿录', subtitle: '绝顶高手', icon: Swords, color: '#c8843a' },
  { key: '惊蛰榜', label: '惊蛰榜', subtitle: '青年才俊', icon: Sparkles, color: 'var(--wx-cyan)' },
  { key: '群芳谱', label: '群芳谱', subtitle: '江湖群芳', icon: Star, color: '#d07090' },
  { key: '名锋卷', label: '名锋卷', subtitle: '名剑锋镝', icon: Swords, color: '#7a9a9a' },
] as const;

export function LeaderboardModal({ isOpen, onClose }: Props) {
  const [boards, setBoards] = useState<Record<string, LbEntry[]>>({});
  const [activeTab, setActiveTab] = useState<string>('定海神针榜');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isOpen) return;
    getChats().then(chats => {
      const vars = (chats[0]?.variables || {}) as Record<string, unknown>;
      const all: Record<string, LbEntry[]> = {};
      const prefix = '武林榜单与悬赏.';
      for (const [key, value] of Object.entries(vars)) {
        if (key.startsWith(prefix) && Array.isArray(value)) {
          all[key.slice(prefix.length)] = value as LbEntry[];
        }
      }
      // Also try nested format
      const nested = vars['武林榜单与悬赏'] as Record<string, LbEntry[]> | undefined;
      if (nested) {
        for (const [k, v] of Object.entries(nested)) {
          if (Array.isArray(v) && !all[k]) all[k] = v as LbEntry[];
        }
      }
      setBoards(all);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const entries = boards[activeTab] || [];
  const toggleExpand = (name: string) => {
    const next = new Set(expanded);
    next.has(name) ? next.delete(name) : next.add(name);
    setExpanded(next);
  };

  return (
    <div className="dz-modal-shell" onClick={onClose}>
      <div className="cm-box" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="cm-head">
          <BookOpen size={18} />
          <span>醉花阴 · 榜单</span>
          <button className="cm-close" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className="lb-tabs">
          {TABS.map(t => (
            <button key={t.key} className={`lb-tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => { setActiveTab(t.key); setExpanded(new Set()); }}
              style={{ '--tab-color': t.color } as React.CSSProperties}>
              <t.icon size={14} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Entries */}
        <div className="cm-body">
          {entries.length === 0 ? (
            <div className="cm-empty">暂无收录</div>
          ) : (
            entries.map((entry, i) => {
              const name = entry['姓名'] || '';
              const rank = entry['排名'] || entry['排名或赏金'] || '';
              const identity = entry['身份'] || '';
              const reason = entry['上榜理由'] || entry['上榜理由与罪状'] || entry['罪状'] || '';
              const bounty = entry['赏金'];
              const location = entry['最后出没'] || entry['最后出没地点'] || '';
              const comment = entry['评语'] || '';
              const isOpen = expanded.has(name);

              return (
                <div key={`${name}-${i}`} className={`lb-card ${isOpen ? 'open' : ''}`} onClick={() => toggleExpand(name)}>
                  {/* Rank badge */}
                  <div className="lb-rank">{rank}</div>

                  {/* Body */}
                  <div className="lb-body">
                    <div className="lb-name-row">
                      <span className="lb-name">{name}</span>
                      {identity && <span className="lb-identity">{identity}</span>}
                      {bounty && <span className="lb-bounty">赏金 {bounty.toLocaleString()} 两</span>}
                    </div>
                    <div className="lb-reason">{reason}</div>
                    {location && (
                      <div className="lb-location"><MapPin size={11} />{location}</div>
                    )}

                    {/* Expand: 评语 */}
                    {comment && isOpen && (
                      <div className="lb-comment">
                        <div className="lb-comment-label">醉花阴评</div>
                        <div className="lb-comment-text">{comment}</div>
                      </div>
                    )}
                  </div>

                  {/* Expand indicator */}
                  {comment && (
                    <div className={`lb-expand ${isOpen ? 'open' : ''}`}>
                      <ChevronDown size={16} />
                    </div>
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
