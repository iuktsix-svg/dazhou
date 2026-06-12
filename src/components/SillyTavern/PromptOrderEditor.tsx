import { type PromptOrderItem, movePromptItem } from '../../sillytavern';

interface Props {
  items: PromptOrderItem[];
  onChange: (items: PromptOrderItem[]) => void;
}

export function PromptOrderEditor({ items, onChange }: Props) {
  const toggle = (index: number) => {
    const next = items.map((item, i) =>
      i === index ? { ...item, enabled: !item.enabled } : item,
    );
    onChange(next);
  };

  const move = (index: number, dir: 'up' | 'down') => {
    onChange(movePromptItem(items, index, dir));
  };

  return (
    <div className="prompt-order-editor">
      {items.map((item, i) => (
        <div key={item.id} className={`po-item ${!item.enabled ? 'disabled' : ''}`}>
          <span className="po-handle">⠿</span>
          <span className="po-label">{item.label}</span>
          <span className="po-id">({item.id})</span>
          <label className="checkbox-label">
            <input type="checkbox" checked={item.enabled} onChange={() => toggle(i)} />
            启用
          </label>
          <button onClick={() => move(i, 'up')} disabled={i === 0}>↑</button>
          <button onClick={() => move(i, 'down')} disabled={i === items.length - 1}>↓</button>
        </div>
      ))}
    </div>
  );
}
