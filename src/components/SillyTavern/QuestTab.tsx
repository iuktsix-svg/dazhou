import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useSillytavern } from '../../hooks/useSillytavern';
import { ScrollText, ChevronDown } from 'lucide-react';

interface QuestEntry { name: string; status: string; description?: string; }

function parseQuests(variables: Record<string, string | number>): QuestEntry[] {
  const raw = variables['任务与目标'] || variables['主角状态.任务与目标'];
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((q: unknown) => {
      if (typeof q === 'object' && q) {
        const obj = q as Record<string, unknown>;
        return {
          name: String(obj.名称 || obj.name || '未知任务'),
          status: String(obj.状态 || obj.status || '进行中'),
          description: obj.描述 || obj.description ? String(obj.描述 || obj.description) : undefined,
        };
      }
      return { name: String(q), status: '进行中' };
    });
  }
  return [];
}

const STATUS_COLORS: Record<string, string> = { '进行中': 'var(--gold)', '已完成': 'var(--jade)', '失败': 'var(--vermillion)' };

export function QuestTab() {
  const { activeChat } = useSillytavern();
  const vars = activeChat?.variables || {};
  const quests = useMemo(() => parseQuests(vars), [vars]);
  const [archivedOpen, setArchivedOpen] = useState(false);

  const active = quests.filter(q => q.status === '进行中');
  const archived = quests.filter(q => q.status !== '进行中');

  return (
    <div>
      <div className="panel-section-title">进行中</div>
      {active.length === 0 ? (
        <div className="empty-state"><div className="empty-state-text">暂无进行中的任务</div></div>
      ) : (
        active.map((q, i) => (
          <motion.div key={`${q.name}-${i}`} className="quest-card" style={{ borderLeftColor: STATUS_COLORS[q.status] || 'var(--gold)' }}
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <div className="quest-header">
              <ScrollText size={14} style={{ color: STATUS_COLORS[q.status] }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', color: 'var(--moon)', fontWeight: 500 }}>{q.name}</span>
              <span className="quest-status-badge" style={{ background: `${STATUS_COLORS[q.status]}20`, color: STATUS_COLORS[q.status] }}>{q.status}</span>
            </div>
            {q.description && <div className="quest-desc">{q.description}</div>}
          </motion.div>
        ))
      )}

      {archived.length > 0 && (
        <>
          <button onClick={() => setArchivedOpen(!archivedOpen)} className="stat-attrs-toggle" style={{ marginTop: 12 }}>
            已完成 / 失败 ({archived.length})
            <ChevronDown size={14} style={{ transform: archivedOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {archivedOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ overflow: 'hidden', paddingTop: 8 }}>
              {archived.map((q, i) => (
                <div key={`${q.name}-${i}`} className="quest-card" style={{ borderLeftColor: STATUS_COLORS[q.status] || 'var(--moon-dim)', opacity: 0.55 }}>
                  <div className="quest-header">
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xs)', color: 'var(--moon-dim)' }}>{q.name}</span>
                    <span className="quest-status-badge" style={{ background: `${STATUS_COLORS[q.status]}20`, color: STATUS_COLORS[q.status] }}>{q.status}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
