import { useEffect, useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';

interface Props { isOpen: boolean; onClose: () => void; onSend: (t: string) => void; }
interface ItemData { 物品类型?: string; 物品描述?: string; 数量?: number; type?: string; description?: string; quantity?: number; }

const SLOT_LIMIT = 20;
const TYPE_META: Record<string, { char: string; bg: string; border: string; text: string }> = {
  '丹药': { char: '丹', bg: '#8B451310', border: '#8B451340', text: '#8B4513' },
  '武器': { char: '兵', bg: '#6B3A3A10', border: '#6B3A3A40', text: '#6B3A3A' },
  '杂物': { char: '杂', bg: '#5A5A5A10', border: '#5A5A5A40', text: '#5A5A5A' },
  '秘籍': { char: '卷', bg: '#8B691410', border: '#8B691440', text: '#8B6914' },
  '防具': { char: '甲', bg: '#3A5A6B10', border: '#3A5A6B40', text: '#3A5A6B' },
  '饰品': { char: '佩', bg: '#6B5A8A10', border: '#6B5A8A40', text: '#6B5A8A' },
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
        <div style={{ zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid var(--bdr-subtle)' }}>
          <h2 style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-xl)', color: 'var(--wx-vermillion)', margin: 0, letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 14, height: 14, background: 'var(--wx-vermillion)', clipPath: 'polygon(20% 0, 80% 0, 100% 50%, 80% 100%, 20% 100%, 0 50%)' }} />
            随身行囊
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--wx-ink-dim)' }}>{used}/{SLOT_LIMIT}</span>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--wx-gold)' }}>{silver} 两</span>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: '50%', background: 'none', border: '1px solid var(--bdr-subtle)', color: 'var(--wx-ink-dim)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        </div>
        <div style={{ zIndex: 1, flex: 1, overflow: 'auto', padding: 14 }}>
          {keys.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--wx-ink-dim)' }}>
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-lg)', marginBottom: 8 }}>行囊空空</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', opacity: 0.6 }}>可在集市购买、任务获取或击败敌人搜刮物品</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8 }}>
              {keys.map(k => {
                const data = items[k];
                const type = data['物品类型'] || data.type || '杂物';
                const qty = data['数量'] || data.quantity || 1;
                const meta = TYPE_META[type] || TYPE_META['杂物'];
                return (
                  <div key={k} onClick={() => setSel(k === sel ? null : k)} style={{
                    padding: '12px 8px', cursor: 'pointer', textAlign: 'center',
                    background: k === sel ? 'var(--wx-vermillion-dim)' : 'var(--wx-card)',
                    border: `1px solid ${k === sel ? 'var(--wx-vermillion-dim)' : 'var(--bdr-subtle)'}`,
                    borderRadius: 'var(--rd-md)', boxShadow: 'var(--sh-sm)', position: 'relative',
                  }}>
                    <div style={{ width: 36, height: 36, margin: '0 auto 4px', background: meta.bg, border: `2px solid ${meta.border}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-title)', fontSize: 18, color: meta.text }}>{meta.char}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--wx-ink)', lineHeight: 1.2, marginBottom: 2 }}>{k}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--wx-gold)' }}>×{qty}</div>
                    <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 9, color: meta.text, fontFamily: 'var(--font-body)' }}>{type}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {item && (
          <div style={{ zIndex: 1, borderTop: '1px solid var(--bdr-subtle)', padding: '12px 18px', background: 'var(--wx-card)', display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--wx-ink)', marginBottom: 2 }}>{sel}</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-dim)', lineHeight: 1.5 }}>{item['物品描述'] || item.description || '暂无描述'}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button className="wx-btn wx-btn-outline" style={{ padding: '5px 12px', fontSize: 'var(--text-xs)' }} onClick={() => { onSend(`丢弃行囊中的【${sel}】。`); onClose(); }}>丢弃</button>
              <button className="wx-btn wx-btn-outline" style={{ padding: '5px 12px', fontSize: 'var(--text-xs)' }} onClick={() => { onSend(`将行囊中的【${sel}】存入仓库。`); onClose(); }}>存仓库</button>
              <button className="wx-btn wx-btn-red" style={{ padding: '5px 14px', fontSize: 'var(--text-xs)' }} onClick={() => { onSend(`从行囊中取出【${sel}】并尝试使用它`); onClose(); }}>使用</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
