import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSillytavern } from '../../hooks/useSillytavern';
import { Newspaper, Search, Send } from 'lucide-react';

interface IntelItem { title: string; content: string; read?: boolean; }

function parseIntel(variables: Record<string, string | number>): IntelItem[] {
  const raw = variables['江湖风媒情报'] || variables['主角状态.江湖风媒情报'];
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((item: unknown) => {
      if (typeof item === 'object' && item) {
        const obj = item as Record<string, unknown>;
        return {
          title: String(obj.标题 || obj.title || '情报'),
          content: String(obj.内容 || obj.content || ''),
          read: !!(obj.已读 ?? obj.read),
        };
      }
      return { title: String(item), content: '' };
    });
  }
  return [];
}

export function IntelTab() {
  const { activeChat, sendMessage } = useSillytavern();
  const vars = activeChat?.variables || {};
  const intel = useMemo(() => parseIntel(vars), [vars]);

  return (
    <div>
      <div className="intel-action-row">
        <button className="intel-action-btn" onClick={() => sendMessage('向周围打听最近江湖上的消息和人物的下落。')}>
          <Search size={13} /> 打听下落
        </button>
        <button className="intel-action-btn" onClick={() => sendMessage('写一封飞鸽传书。')}>
          <Send size={13} /> 飞鸽传书
        </button>
      </div>

      <div className="panel-section-title">江湖风媒情报</div>

      {intel.length === 0 ? (
        <div className="empty-state"><div className="empty-state-text">暂无情报</div></div>
      ) : (
        intel.map((item, i) => (
          <motion.div key={i} className={`intel-item ${!item.read ? 'unread' : ''}`}
            initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
            <div className="intel-item-title">
              <Newspaper size={13} style={{ color: item.read ? 'var(--moon-dim)' : 'var(--gold)' }} />
              {item.title}
              {!item.read && <div className="intel-unread-dot" />}
            </div>
            {item.content && <div className="intel-item-content">{item.content.slice(0, 120)}{item.content.length > 120 ? '…' : ''}</div>}
          </motion.div>
        ))
      )}
    </div>
  );
}
