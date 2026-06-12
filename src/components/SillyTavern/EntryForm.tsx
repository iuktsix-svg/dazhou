import { useState, useEffect } from 'react';
import { type LorebookEntry, type EntryPosition, createDefaultEntry, applyEntryDefaults, DEFAULT_POSITIONS } from '../../sillytavern';

interface Props {
  lorebookId: string;
  entry?: LorebookEntry | null;
  onSave: (entry: LorebookEntry) => void;
  onCancel: () => void;
}

export function EntryForm({ lorebookId, entry, onSave, onCancel }: Props) {
  const [form, setForm] = useState<LorebookEntry>(
    entry
      ? applyEntryDefaults(entry)
      : createDefaultEntry(lorebookId),
  );

  useEffect(() => {
    if (entry) setForm(applyEntryDefaults(entry));
  }, [entry]);

  const update = (patch: Partial<LorebookEntry>) => {
    setForm(prev => ({ ...prev, ...patch }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      {/* Core fields */}
      <div className="form-row">
        <label>触发词（逗号分隔）
          <input
            value={form.keys.join(',')}
            onChange={e => update({ keys: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            placeholder="hero, sword, castle"
          />
        </label>
      </div>

      <div className="form-row">
        <label>注入内容
          <textarea
            value={form.content}
            onChange={e => update({ content: e.target.value })}
            rows={4}
            placeholder="这个条目被触发时会插入的上下文..."
          />
        </label>
      </div>

      <div className="form-row form-inline">
        <label>优先级 <input type="number" value={form.priority} onChange={e => update({ priority: Number(e.target.value) })} min={0} max={1000} /></label>
        <label>顺序 <input type="number" value={form.order} onChange={e => update({ order: Number(e.target.value) })} min={0} max={10000} /></label>
        <label>位置
          <select value={form.position} onChange={e => update({ position: e.target.value as EntryPosition })}>
            {DEFAULT_POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
      </div>

      <div className="form-row form-inline">
        <label className="checkbox-label"><input type="checkbox" checked={form.enabled} onChange={e => update({ enabled: e.target.checked })} /> 启用</label>
        <label className="checkbox-label"><input type="checkbox" checked={form.constant} onChange={e => update({ constant: e.target.checked })} /> 始终注入</label>
      </div>

      {/* Advanced — collapsible */}
      <details className="form-advanced">
        <summary>高级选项</summary>
        <div className="form-row form-inline">
          <label>二级触发词
            <input
              value={form.secondaryKeys.join(',')}
              onChange={e => update({ secondaryKeys: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              placeholder="trigger2, context3"
            />
          </label>
          <label>二级逻辑
            <select value={form.selectiveLogic} onChange={e => update({ selectiveLogic: e.target.value as 'AND' | 'OR' })}>
              <option value="AND">AND（全部匹配）</option>
              <option value="OR">OR（任一匹配）</option>
            </select>
          </label>
        </div>
        <div className="form-row form-inline">
          <label className="checkbox-label"><input type="checkbox" checked={form.caseSensitive} onChange={e => update({ caseSensitive: e.target.checked })} /> 区分大小写</label>
          <label className="checkbox-label"><input type="checkbox" checked={form.useRegex} onChange={e => update({ useRegex: e.target.checked })} /> 使用正则</label>
        </div>
        <div className="form-row">
          <label>备注
            <input value={form.comment || ''} onChange={e => update({ comment: e.target.value })} />
          </label>
        </div>
      </details>

      <div className="form-actions">
        <button type="submit">💾 保存条目</button>
        <button type="button" onClick={onCancel}>取消</button>
      </div>
    </form>
  );
}
