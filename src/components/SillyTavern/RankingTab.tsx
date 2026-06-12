import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useSillytavern } from '../../hooks/useSillytavern';
import { Trophy } from 'lucide-react';

interface RankEntry { rank: number; name: string; title?: string; reason?: string; }

const RANKING_TABS = [
  { key: '定海神针榜', label: '定海神针榜', desc: '九位天人' },
  { key: '太阿录', label: '太阿录', desc: '绝顶高手' },
  { key: '惊蛰榜', label: '惊蛰榜', desc: '青年才俊' },
  { key: '群芳谱', label: '群芳谱', desc: '江湖群芳' },
  { key: '名锋卷', label: '名锋卷', desc: '名剑锋镝' },
] as const;

type RT = typeof RANKING_TABS[number]['key'];

function parseRankings(variables: Record<string, string | number>, tab: string): RankEntry[] {
  const baseKey = `武林榜单与悬赏.${tab}`;
  const raw = variables[baseKey] || variables['武林榜单与悬赏'];
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((entry: unknown, idx: number) => {
      if (typeof entry === 'object' && entry) {
        const obj = entry as Record<string, unknown>;
        return {
          rank: Number(obj.排名 || obj.rank || idx + 1),
          name: String(obj.姓名 || obj.name || '未知'),
          title: obj.身份 || obj.title ? String(obj.身份 || obj.title) : undefined,
          reason: obj.上榜理由 || obj.reason ? String(obj.上榜理由 || obj.reason) : undefined,
        };
      }
      return { rank: idx + 1, name: String(entry) };
    });
  }
  return [];
}

export function RankingTab() {
  const { activeChat } = useSillytavern();
  const vars = activeChat?.variables || {};
  const [activeTab, setActiveTab] = useState<RT>('定海神针榜');
  const rankings = useMemo(() => parseRankings(vars, activeTab), [vars, activeTab]);

  return (
    <div>
      <div className="ranking-tabs">
        {RANKING_TABS.map(tab => (
          <button key={tab.key} className={`ranking-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)} title={tab.desc}>{tab.label}</button>
        ))}
      </div>

      {rankings.length === 0 ? (
        <div className="empty-state"><div className="empty-state-text">暂无榜单数据</div></div>
      ) : (
        rankings.map((entry, i) => (
          <motion.div key={`${entry.name}-${i}`} className="ranking-row"
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <div className="ranking-pos" style={{ color: i === 0 ? 'var(--gold)' : i < 3 ? 'var(--moon-dim)' : 'var(--moon-faint)' }}>
              {i < 3 ? <Trophy size={13} style={{ color: i === 0 ? 'var(--gold)' : i === 1 ? '#A0A0B0' : '#B08060' }} /> : entry.rank}
            </div>
            <div className="ranking-info">
              <div className="ranking-name">{entry.name}</div>
              {entry.title && <div className="ranking-title">{entry.title}</div>}
            </div>
            {entry.reason && <div className="ranking-reason">{entry.reason.slice(0, 30)}</div>}
          </motion.div>
        ))
      )}
    </div>
  );
}
