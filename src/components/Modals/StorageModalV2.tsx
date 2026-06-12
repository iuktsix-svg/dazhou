import { useEffect, useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { Package } from 'lucide-react';

interface Props { isOpen: boolean; onClose: () => void; onSend: (t: string) => void; }
interface ItemData { 物品类型?: string; 物品描述?: string; 数量?: number; type?: string; description?: string; quantity?: number; }

export function StorageModal({ isOpen, onClose, onSend }: Props) {
  const { activeChat } = useSillytavern();
  const [items, setItems] = useState<Record<string, ItemData>>({});
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const vars = (activeChat?.variables || {}) as Record<string, unknown>;
    setItems((vars['仓库'] || vars['主角状态.仓库'] || {}) as Record<string, ItemData>);
    const k = Object.keys(vars['仓库'] || vars['主角状态.仓库'] || {});
    if (k.length && !sel) setSel(k[0]);
  }, [isOpen, activeChat]);

  if (!isOpen) return null;

  const item = sel ? items[sel] : null;
  const keys = Object.keys(items);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }}
      onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: 'relative', width: '100%', maxWidth: 520, maxHeight: '80vh',
        background: 'var(--dz-dark)', border: '1px solid var(--dz-gray-light)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.8), 4px 4px 0px rgba(197,48,48,0.2)',
        clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(197,48,48,0.06) 1px, transparent 1px)', backgroundSize: '8px 8px', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--dz-gray-light)', background: 'rgba(197,48,48,0.08)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--dz-white)', letterSpacing: 1, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 4, height: 22, background: 'var(--dz-red)', clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }} />
            仓库
          </h2>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 2, background: 'transparent', border: 'none', color: 'var(--dz-text)', cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        <div style={{ position: 'relative', zIndex: 1, flex: 1, overflow: 'auto', padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '8px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--dz-gray-light)', clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }}>
            <Package size={14} style={{ color: 'var(--dz-gold)' }} />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--dz-text-dim)' }}>仓库可存放多余物品，不占背囊空间。</span>
          </div>
          {keys.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 36, fontFamily: 'var(--font-serif)' }}>
              <div style={{ fontSize: 15, color: 'var(--dz-text-dim)', marginBottom: 8 }}>仓库空空</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--dz-text-dim)', opacity: 0.7 }}>可将背囊中暂时不用的物品存入仓库。</div>
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
                    <button className="dz-btn dz-btn-red" onClick={() => { onSend(`从仓库中取出【${sel}】放回背囊。`); onClose(); }}>取回背囊</button>
                    <button className="dz-btn dz-btn-outline" onClick={() => { onSend(`丢弃仓库中的【${sel}】。`); onClose(); }}>丢弃</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ position: 'relative', zIndex: 1, height: 3, flexShrink: 0, background: 'linear-gradient(90deg, var(--dz-red), var(--dz-gold), var(--dz-red))' }} />
      </div>
    </div>
  );
}
