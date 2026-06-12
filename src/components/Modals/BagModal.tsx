import { useEffect, useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';

interface Props { isOpen: boolean; onClose: () => void; onSend: (text: string) => void; }
interface ItemData { 物品类型?: string; 物品描述?: string; 数量?: number; type?: string; description?: string; quantity?: number; }

export function BagModal({ isOpen, onClose, onSend }: Props) {
  const { activeChat } = useSillytavern();
  const [items, setItems] = useState<Record<string, ItemData>>({});
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const vars = (activeChat?.variables || {}) as Record<string, unknown>;
    const raw = (vars['随身行囊'] || {}) as Record<string, ItemData>;
    setItems(raw);
    const keys = Object.keys(raw);
    if (keys.length && !sel) setSel(keys[0]);
  }, [isOpen, activeChat]);

  const item = sel ? items[sel] : null;
  const keys = Object.keys(items);

  return (
    <div className={`dz-modal ${isOpen ? 'on' : ''}`}>
      <div className="dz-modal-head"><h2>随身行囊</h2><button className="dz-modal-close" onClick={onClose}>×</button></div>
      <div className="dz-modal-body">
        {keys.length === 0 ? (
          <div className="dz-empty">
            <div className="title">行囊空空如也</div>
            <div className="guide">可在集市购买、任务获取或击败敌人搜刮物品。</div>
          </div>
        ) : (
          <div className="dz-items-side">
            <div className="dz-items-list">
              {keys.map(k => (
                <div key={k} className={`dz-item-row ${k === sel ? 'sel' : ''}`} onClick={() => setSel(k)}>
                  <span>{k}</span><span style={{ color: 'var(--text-dim)', fontSize: 'var(--text-xs)' }}>×{items[k]?.['数量'] || items[k]?.quantity || 1}</span>
                </div>
              ))}
            </div>
            {item && (
              <div className="dz-item-detail">
                <div className="dz-item-name">{sel}</div>
                <div className="dz-item-type">{item['物品类型'] || item.type || '杂物'}</div>
                <div className="dz-item-desc">{item['物品描述'] || item.description || '暂无描述'}</div>
                <button className="dz-btn dz-btn-gold" style={{ marginTop: 'auto' }} onClick={() => { onSend(`从行囊中取出【${sel}】并尝试使用它`); onClose(); }}>互动 / 使用</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
