import { useEffect, useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { Package } from 'lucide-react';

interface Props { isOpen: boolean; onClose: () => void; onSend: (t: string) => void; }
interface ItemData { 物品类型?: string; 物品描述?: string; 数量?: number; type?: string; description?: string; quantity?: number; }
const TYPE_ICONS: Record<string, string> = { '丹药': '💊', '武器': '⚔', '杂物': '📦', '秘籍': '📜', '防具': '🛡', '饰品': '💎' };

export function StorageModal({ isOpen, onClose, onSend }: Props) {
  const { activeChat } = useSillytavern();
  const [items, setItems] = useState<Record<string, ItemData>>({});
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const v = (activeChat?.variables || {}) as Record<string, unknown>;
    setItems((v['仓库'] || {}) as Record<string, ItemData>);
  }, [isOpen, activeChat]);
  if (!isOpen) return null;
  const keys = Object.keys(items);
  const item = sel ? items[sel] : null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(44,36,22,0.55)' }} />
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 580, maxHeight: '82vh', background: 'var(--wx-paper-light)', border: '1px solid var(--bdr-ink)', borderRadius: 'var(--rd-xl)', boxShadow: 'var(--sh-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--bdr-subtle)' }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-xl)', color: 'var(--wx-cyan)', margin: 0, letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Package size={18} />
            仓库
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--wx-ink-dim)' }}>存放多余物品</span>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'none', border: 'none', color: 'var(--wx-ink-dim)', cursor: 'pointer', fontSize: 20 }}>×</button>
          </div>
        </div>
        <div style={{ zIndex: 1, flex: 1, overflow: 'auto', padding: 16 }}>
          {keys.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>🏚</div>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-lg)', color: 'var(--wx-ink-dim)', marginBottom: 8 }}>仓库空空</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-dim)', opacity: 0.6 }}>可将背囊中暂时不用的物品存入仓库</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
              {keys.map(k => {
                const data = items[k];
                const type = data['物品类型'] || data.type || '杂物';
                return (
                  <div key={k} onClick={() => setSel(k === sel ? null : k)} style={{
                    padding: '14px 10px', cursor: 'pointer', textAlign: 'center',
                    background: k === sel ? 'rgba(90,140,160,0.1)' : 'var(--wx-card)',
                    border: `1px solid ${k === sel ? 'rgba(90,140,160,0.3)' : 'var(--bdr-subtle)'}`,
                    borderRadius: 'var(--rd-md)', boxShadow: 'var(--sh-sm)', position: 'relative',
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{TYPE_ICONS[type] || '📦'}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--wx-ink)', lineHeight: 1.3 }}>{k}</div>
                    <div style={{ position: 'absolute', top: 6, right: 8, fontSize: 9, color: 'var(--wx-ink-dim)' }}>{type}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {item && (
          <div style={{ zIndex: 1, borderTop: '1px solid var(--bdr-subtle)', padding: '14px 20px', background: 'var(--wx-card)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-base)', color: 'var(--wx-ink)', marginBottom: 4 }}>{sel}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-dim)', lineHeight: 1.5 }}>{item['物品描述'] || item.description || '暂无描述'}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="wx-btn wx-btn-outline" style={{ padding: '6px 14px', fontSize: 'var(--text-xs)' }} onClick={() => { onSend(`丢弃仓库中的【${sel}】。`); onClose(); }}>丢弃</button>
              <button className="wx-btn wx-btn-red" style={{ padding: '6px 16px', fontSize: 'var(--text-xs)' }} onClick={() => { onSend(`从仓库中取出【${sel}】放回背囊。`); onClose(); }}>取回背囊</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
