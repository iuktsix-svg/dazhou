import { useEffect, useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
// Icons are inline

interface Props { isOpen: boolean; onClose: () => void; onSend: (t: string) => void; }
interface ItemData { 物品类型?: string; 物品描述?: string; 数量?: number; type?: string; description?: string; quantity?: number; }

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
    const k = Object.keys(v['随身行囊'] || {});
    if (k.length && !sel) setSel(k[0]);
  }, [isOpen, activeChat]);

  if (!isOpen) return null;

  const item = sel ? items[sel] : null;
  const keys = Object.keys(items);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }}
      onClick={onClose}>
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />

      {/* Modal */}
      <div onClick={e => e.stopPropagation()} style={{
        position: 'relative', width: '100%', maxWidth: 520, maxHeight: '80vh',
        background: 'var(--dz-dark)', border: '1px solid var(--dz-gray-light)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.8), 4px 4px 0px rgba(197,48,48,0.2)',
        clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Halftone */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(197,48,48,0.06) 1px, transparent 1px)', backgroundSize: '8px 8px', pointerEvents: 'none', zIndex: 0 }} />

        {/* Header */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--dz-gray-light)', background: 'rgba(197,48,48,0.08)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--dz-white)', letterSpacing: 1, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 4, height: 22, background: 'var(--dz-red)', clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }} />
            随身行囊
          </h2>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 2, background: 'transparent', border: 'none', color: 'var(--dz-text)', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>

        {/* Body */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, overflow: 'auto', padding: 16 }}>
          {/* Silver */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', marginBottom: 14, background: 'rgba(201,166,92,0.06)', border: '1px solid rgba(201,166,92,0.2)', clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--dz-text-dim)' }}>银两</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--dz-gold)' }}>{silver} 两</span>
          </div>

          {keys.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 36, fontFamily: 'var(--font-serif)' }}>
              <div style={{ fontSize: 15, color: 'var(--dz-text-dim)', marginBottom: 8 }}>行囊空空如也</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--dz-text-dim)', opacity: 0.7 }}>可在集市购买、任务获取或击败敌人搜刮物品。</div>
            </div>
          ) : (
            <div className="dz-items-side">
              <div className="dz-items-list">
                {keys.map(k => (
                  <div key={k} className={`dz-item-row ${k === sel ? 'sel' : ''}`} onClick={() => setSel(k)}>
                    <span>{k}</span>
                    <span style={{ color: 'var(--dz-text-dim)', fontSize: 11 }}>×{items[k]?.['数量'] || items[k]?.quantity || 1}</span>
                  </div>
                ))}
              </div>
              {item && (
                <div className="dz-item-detail">
                  <div className="dz-item-name">{sel}</div>
                  <div className="dz-item-type">{item['物品类型'] || item.type || '杂物'}</div>
                  <div className="dz-item-desc">{item['物品描述'] || item.description || '暂无描述'}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                    <button className="dz-btn dz-btn-red" onClick={() => { onSend(`从行囊中取出【${sel}】并尝试使用它`); onClose(); }}>使用</button>
                    <button className="dz-btn dz-btn-outline" onClick={() => { onSend(`丢弃行囊中的【${sel}】。`); onClose(); }}>丢弃</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer accent */}
        <div style={{ position: 'relative', zIndex: 1, height: 3, flexShrink: 0, background: 'linear-gradient(90deg, var(--dz-red), var(--dz-gold), var(--dz-red))' }} />
      </div>
    </div>
  );
}
