import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSillytavern } from '../../hooks/useSillytavern';
import { Crosshair, MapPin } from 'lucide-react';

interface BountyEntry { name: string; bounty: number; crime?: string; lastSeen?: string; }

function parseBounties(variables: Record<string, string | number>): BountyEntry[] {
  // Support both flat dot-notation keys AND nested objects
  let raw: unknown = variables['武林榜单与悬赏.悬赏榜'] || variables['悬赏榜'];
  if (!raw) {
    const nested = variables['武林榜单与悬赏'];
    if (nested && typeof nested === 'object') raw = (nested as Record<string,unknown>)['悬赏榜'];
  }
  if (!raw || !Array.isArray(raw)) return [];
  if (Array.isArray(raw)) {
    return raw.map((entry: unknown) => {
      if (typeof entry === 'object' && entry) {
        const obj = entry as Record<string, unknown>;
        return {
          name: String(obj.姓名 || obj.name || '未知'),
          bounty: Number(obj.赏金 || obj.bounty || 0),
          crime: obj.罪状 || obj.crime ? String(obj.罪状 || obj.crime) : undefined,
          lastSeen: obj.最后出没 || obj.lastSeen ? String(obj.最后出没 || obj.lastSeen) : undefined,
        };
      }
      return { name: String(entry), bounty: 0 };
    });
  }
  return [];
}

export function BountyTab() {
  const { activeChat, sendMessage } = useSillytavern();
  const vars = activeChat?.variables || {};
  const bounties = useMemo(() => parseBounties(vars), [vars]);

  return (
    <div>
      <div className="panel-section-title" style={{ color: 'var(--vermillion)' }}>追杀悬赏</div>

      {bounties.length === 0 ? (
        <div className="empty-state"><div className="empty-state-text">暂无悬赏</div></div>
      ) : (
        bounties.map((b, i) => (
          <motion.div key={`${b.name}-${i}`} className="bounty-card"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <div className="bounty-header">
              <div className="bounty-name">
                <Crosshair size={14} style={{ color: 'var(--vermillion)' }} />
                {b.name}
              </div>
              <span className="bounty-amount">{b.bounty.toLocaleString()} 两</span>
            </div>
            {b.crime && <div className="bounty-crime">{b.crime}</div>}
            <div className="bounty-footer">
              {b.lastSeen && (
                <div className="bounty-location"><MapPin size={11} />{b.lastSeen}</div>
              )}
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                className="bounty-track-btn" onClick={() => sendMessage(`前往追踪悬赏目标「${b.name}」，据说最后出现在${b.lastSeen || '某处'}。`)}>
                前往追踪
              </motion.button>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}
