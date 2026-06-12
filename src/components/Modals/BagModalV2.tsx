import { useEffect, useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';

interface Props { isOpen: boolean; onClose: () => void; onSend: (t: string) => void; }
interface ItemData { 物品类型?: string; 物品描述?: string; 数量?: number; type?: string; description?: string; quantity?: number; }

const SLOT_LIMIT = 20;
const TYPE_META: Record<string, { char: string; color: string }> = {
  '丹药': { char: '丹', color: '#8B4513' },
  '武器': { char: '兵', color: '#6B3A3A' },
  '杂物': { char: '杂', color: '#5A5A5A' },
  '秘籍': { char: '卷', color: '#8B6914' },
  '防具': { char: '甲', color: '#3A5A6B' },
  '饰品': { char: '佩', color: '#6B5A8A' },
};

export function BagModal({ isOpen, onClose, onSend }: Props) {
  const { activeChat } = useSillytavern();
  const [items, setItems] = useState<Record<string, ItemData>>({});
  const [sel, setSel] = useState<string | null>(null);
  const [silver, setSilver] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const v = (activeChat?.variables || {}) as Record<string, unknown>;
    const p = (v['主角状态'] || {}) as Record<string, unknown>;
    setItems((v['随身行囊'] || {}) as Record<string, ItemData>);
    setSilver(Number(p['持有银两'] || v['持有银两'] || 0));
  }, [isOpen, activeChat]);

  if (!isOpen) return null;
  const keys = Object.keys(items);
  const used = keys.reduce((sum, k) => sum + (items[k]?.['数量'] || items[k]?.quantity || 1), 0);
  const item = sel ? items[sel] : null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(44,36,22,0.55)' }} />
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 580, maxHeight: '82vh', background: 'var(--wx-paper-light)', border: '1px solid var(--bdr-ink)', borderRadius: 'var(--rd-xl)', boxShadow: 'var(--sh-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--bdr-subtle)' }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-xl)', color: 'var(--wx-vermillion)', margin: 0, letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 14, height: 14, background: 'var(--wx-vermillion)', clipPath: 'polygon(20% 0, 80% 0, 100% 50%, 80% 100%, 20% 100%, 0 50%)' }} />
            随身行囊
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-dim)' }}>
              {used}/{SLOT_LIMIT} 栏位
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--wx-gold)' }}>{silver} 两</span>
            <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: '50%', background: 'none', border: 'none', color: 'var(--wx-ink-dim)', cursor: 'pointer', fontSize: 20 }}>×</button>
          </div>
        </div>
        <div style={{ zIndex: 1, flex: 1, overflow: 'auto', padding: 16 }}>
          {keys.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>🎒</div>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-lg)', color: 'var(--wx-ink-dim)', marginBottom: 8 }}>行囊空空如也</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-dim)', opacity: 0.6 }}>可在集市购买、任务获取或击败敌人搜刮物品</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
              {keys.map(k => {
                const data = items[k];
                const type = data['物品类型'] || data.type || '杂物';
                const qty = data['数量'] || data.quantity || 1;
                const isSelected = k === sel;
                return (
                  <div key={k} onClick={() => setSel(isSelected ? null : k)} style={{
                    padding: '14px 10px', cursor: 'pointer', textAlign: 'center',
                    background: isSelected ? 'var(--wx-vermillion-dim)' : 'var(--wx-card)',
                    border: `1px solid ${isSelected ? 'var(--wx-vermillion-dim)' : 'var(--bdr-subtle)'}`,
                    borderRadius: 'var(--rd-md)', boxShadow: 'var(--sh-sm)',
                    transition: 'all 0.15s', position: 'relative',
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{(TYPE_META[type]?.char || '物')}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--wx-ink)', lineHeight: 1.3, marginBottom: 4 }}>{k}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--wx-gold)' }}>×{qty}</div>
                    <div style={{ position: 'absolute', top: 6, right: 8, fontFamily: 'var(--font-body)', fontSize: 9, color: 'var(--wx-ink-dim)', background: 'var(--wx-surface)', padding: '1px 6px', borderRadius: 'var(--rd-full)' }}>{type}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {/* Detail panel for selected item */}
        {item && (
          <div style={{ zIndex: 1, borderTop: '1px solid var(--bdr-subtle)', padding: '14px 20px', background: 'var(--wx-card)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-base)', color: 'var(--wx-ink)', marginBottom: 4 }}>{sel}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-dim)', lineHeight: 1.5 }}>{item['物品描述'] || item.description || '暂无描述'}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button className="wx-btn wx-btn-outline" style={{ padding: '6px 14px', fontSize: 'var(--text-xs)' }} onClick={() => { onSend(`丢弃行囊中的【${sel}】。`); onClose(); }}>丢弃</button>
              <button className="wx-btn wx-btn-red" style={{ padding: '6px 16px', fontSize: 'var(--text-xs)' }} onClick={() => { onSend(`从行囊中取出【${sel}】并尝试使用它`); onClose(); }}>使用</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
