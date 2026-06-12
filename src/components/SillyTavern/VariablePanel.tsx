import { useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';

export function VariablePanel() {
  const { activeChat, updateVariables } = useSillytavern();
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  if (!activeChat) return null;
  const vars = activeChat.variables || {};

  const startEdit = () => {
    setDraft(Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, String(v)])));
    setIsOpen(true);
  };

  const save = async () => {
    const updates: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(draft)) {
      if (k.trim()) {
        const num = Number(v);
        updates[k.trim()] = Number.isNaN(num) ? v : num;
      }
    }
    await updateVariables(updates);
    setIsOpen(false);
  };

  return (
    <div className="variable-panel">
      <button className="vp-toggle" onClick={() => (isOpen ? setIsOpen(false) : startEdit())}>
        {isOpen ? '取消' : '📊 变量'}
      </button>
      {isOpen && (
        <div className="variable-editor">
          {Object.entries(draft).map(([key, value], idx) => (
            <div key={idx} className="variable-row">
              <input
                value={key}
                onChange={(e) => {
                  const next = { ...draft };
                  const old = Object.keys(draft)[idx];
                  delete next[old];
                  next[e.target.value] = value;
                  setDraft(next);
                }}
                placeholder="名称"
              />
              <input
                value={value}
                onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                placeholder="值"
              />
              <button
                onClick={() => {
                  const next = { ...draft };
                  delete next[key];
                  setDraft(next);
                }}
              >
                ✕
              </button>
            </div>
          ))}
          <div className="vp-actions">
            <button onClick={() => setDraft({ ...draft, '': '' })}>+ 添加</button>
            <button onClick={save}>💾 保存</button>
          </div>
        </div>
      )}
      {!isOpen && Object.keys(vars).length > 0 && (
        <ul className="variable-list">
          {Object.entries(vars).map(([k, v]) => (
            <li key={k}><strong>{k}</strong>: {String(v)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
