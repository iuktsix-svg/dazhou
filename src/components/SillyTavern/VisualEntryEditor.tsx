// ============================================================
// 大周日暮录 — VisualEntryEditor
// Rich visual editor for lorebook entries
// ============================================================

import { useState, useRef, useCallback } from 'react';
import {
  createDefaultEntry, DEFAULT_POSITIONS,
  type LorebookEntry, type EntryPosition,
} from '../../sillytavern';
import { Eye, EyeOff, ChevronDown, ChevronRight, Save, Plus, X } from 'lucide-react';

interface Props {
  lorebookId: string;
  entry?: LorebookEntry | null; // null = create mode
  inline?: boolean;            // if true, skip modal shell (for embedded use)
  onSave: (entry: LorebookEntry) => void;
  onSaveAndNew: (entry: LorebookEntry) => void;
  onCancel: () => void;
}

export function VisualEntryEditor({ lorebookId, entry, inline, onSave, onSaveAndNew, onCancel }: Props) {
  const isNew = !entry;

  const [form, setForm] = useState<LorebookEntry>(() =>
    entry
      ? { ...entry, keys: [...entry.keys], secondaryKeys: [...entry.secondaryKeys] }
      : createDefaultEntry(lorebookId),
  );

  const [showPreview, setShowPreview] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newSecondaryKey, setNewSecondaryKey] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const update = useCallback((patch: Partial<LorebookEntry>) => {
    setForm(prev => ({ ...prev, ...patch }));
  }, []);

  // ---- Keyword chip management ----

  const addKey = useCallback(() => {
    const trimmed = newKey.trim();
    if (trimmed && !form.keys.includes(trimmed)) {
      update({ keys: [...form.keys, trimmed] });
      setNewKey('');
    }
  }, [newKey, form.keys, update]);

  const removeKey = useCallback((key: string) => {
    update({ keys: form.keys.filter(k => k !== key) });
  }, [form.keys, update]);

  const addSecondaryKey = useCallback(() => {
    const trimmed = newSecondaryKey.trim();
    if (trimmed && !form.secondaryKeys.includes(trimmed)) {
      update({ secondaryKeys: [...form.secondaryKeys, trimmed] });
      setNewSecondaryKey('');
    }
  }, [newSecondaryKey, form.secondaryKeys, update]);

  const removeSecondaryKey = useCallback((key: string) => {
    update({ secondaryKeys: form.secondaryKeys.filter(k => k !== key) });
  }, [form.secondaryKeys, update]);

  // ---- Textarea auto-grow ----

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    update({ content: e.target.value });
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = el.scrollHeight + 'px';
    }
  }, [update]);

  // ---- Keyboard shortcuts ----

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSave(form);
    }
  }, [form, onSave]);

  // ---- Slider helpers ----

  const priorityPercent = Math.round((form.priority / 1000) * 100);
  const orderPercent = Math.round((form.order / 100) * 100);

  // ---- Position label map ----

  const positionLabels: Record<EntryPosition, string> = {
    before_char: '角色前 (before_char)',
    after_char: '角色后 (after_char)',
    before_system: '系统前 (before_system)',
    after_system: '系统后 (after_system)',
  };

  const content = (
    <>
      {/* ---- Header ---- */}
      <div className="dz-modal-head">
        <h2>{isNew ? '✦ 新建条目' : '✎ 编辑条目'}</h2>
        <button className="wx-btn-outline-sm" onClick={onCancel}><X size={16} /></button>
      </div>

      {/* ---- Body ---- */}
      <div className="dz-modal-body ve-body" onKeyDown={handleKeyDown}>

          {/* ====== Section 1: Trigger Keywords ====== */}
          <div className="ve-section">
            <div className="ve-section-label">
              <span className="ve-section-icon">🔑</span> 触发词
              <span className="ve-hint">（输入后按 Enter 添加）</span>
            </div>
            <div className="ve-chip-area">
              {form.keys.map(key => (
                <span key={key} className="ve-chip">
                  {key}
                  <button type="button" className="ve-chip-x" onClick={() => removeKey(key)}>×</button>
                </span>
              ))}
              <input
                className="ve-chip-input"
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { e.preventDefault(); addKey(); }
                }}
                placeholder={form.keys.length === 0 ? '输入触发词，按 Enter 添加...' : '继续添加...'}
              />
            </div>
          </div>

          {/* ====== Section 2: Content + Preview ====== */}
          <div className="ve-section">
            <div className="ve-section-label">
              <span className="ve-section-icon">📝</span> 注入内容
              <span className="ve-hint">（Ctrl+Enter 保存）</span>
              <button
                type="button"
                className={`ve-preview-toggle ${showPreview ? 'active' : ''}`}
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                {showPreview ? '隐藏预览' : '预览'}
              </button>
            </div>
            <textarea
              ref={textareaRef}
              className="ve-textarea"
              value={form.content}
              onChange={handleContentChange}
              placeholder="在此撰写注入的叙事上下文…&#10;&#10;例如：&#10;事件名称：前尘旧事·某某战役&#10;发生时间：某年某月&#10;各方记载：…"
              rows={14}
            />
            {showPreview && (
              <div className="ve-preview-box">
                <div className="ve-preview-label">预览效果</div>
                <div className="ve-preview-text">
                  {form.content || <span className="ve-preview-empty">暂无内容</span>}
                </div>
              </div>
            )}
          </div>

          {/* ====== Section 3: Basic Settings ====== */}
          <div className="ve-section">
            <div className="ve-section-label"><span className="ve-section-icon">⚙</span> 基本设置</div>

            <div className="ve-settings-grid">
              {/* Priority slider */}
              <div className="ve-slider-group">
                <label className="ve-slider-label">
                  优先级 <span className="ve-slider-val">{form.priority}</span>
                </label>
                <input
                  type="range" className="ve-range" min={0} max={1000} step={10}
                  value={form.priority}
                  onChange={e => update({ priority: Number(e.target.value) })}
                  style={{ '--ve-pct': `${priorityPercent}%` } as React.CSSProperties}
                />
              </div>

              {/* Order slider */}
              <div className="ve-slider-group">
                <label className="ve-slider-label">
                  顺序 <span className="ve-slider-val">{form.order}</span>
                </label>
                <input
                  type="range" className="ve-range" min={0} max={100} step={5}
                  value={form.order}
                  onChange={e => update({ order: Number(e.target.value) })}
                  style={{ '--ve-pct': `${orderPercent}%` } as React.CSSProperties}
                />
              </div>

              {/* Position select */}
              <div className="ve-field">
                <label className="ve-field-label">位置</label>
                <select
                  className="ve-select"
                  value={form.position}
                  onChange={e => update({ position: e.target.value as EntryPosition })}
                >
                  {DEFAULT_POSITIONS.map(p => (
                    <option key={p} value={p}>{positionLabels[p]}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Toggles */}
            <div className="ve-toggles">
              <label className="ve-toggle">
                <input type="checkbox" checked={form.enabled} onChange={e => update({ enabled: e.target.checked })} />
                <span className="ve-toggle-track" />
                <span>启用</span>
              </label>
              <label className="ve-toggle">
                <input type="checkbox" checked={form.constant} onChange={e => update({ constant: e.target.checked })} />
                <span className="ve-toggle-track" />
                <span>始终注入</span>
              </label>
            </div>
          </div>

          {/* ====== Section 4: Advanced (collapsible) ====== */}
          <div className="ve-section">
            <button
              type="button"
              className="ve-advanced-toggle"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              高级选项
            </button>

            {showAdvanced && (
              <div className="ve-advanced-body">
                {/* Secondary keys */}
                <div className="ve-field">
                  <label className="ve-field-label">二级触发词</label>
                  <div className="ve-chip-area">
                    {form.secondaryKeys.map(key => (
                      <span key={key} className="ve-chip ve-chip-secondary">
                        {key}
                        <button type="button" className="ve-chip-x" onClick={() => removeSecondaryKey(key)}>×</button>
                      </span>
                    ))}
                    <input
                      className="ve-chip-input"
                      value={newSecondaryKey}
                      onChange={e => setNewSecondaryKey(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); addSecondaryKey(); }
                      }}
                      placeholder="添加二级触发词..."
                    />
                  </div>
                </div>

                {/* Selective logic */}
                <div className="ve-field">
                  <label className="ve-field-label">二级逻辑</label>
                  <select
                    className="ve-select"
                    value={form.selectiveLogic}
                    onChange={e => update({ selectiveLogic: e.target.value as 'AND' | 'OR' })}
                  >
                    <option value="AND">AND — 全部二级词匹配才触发</option>
                    <option value="OR">OR — 任一二级词匹配即触发</option>
                  </select>
                </div>

                {/* Checkboxes row */}
                <div className="ve-toggles">
                  <label className="ve-toggle">
                    <input type="checkbox" checked={form.caseSensitive} onChange={e => update({ caseSensitive: e.target.checked })} />
                    <span className="ve-toggle-track" />
                    <span>区分大小写</span>
                  </label>
                  <label className="ve-toggle">
                    <input type="checkbox" checked={form.useRegex} onChange={e => update({ useRegex: e.target.checked })} />
                    <span className="ve-toggle-track" />
                    <span>使用正则</span>
                  </label>
                </div>

                {/* Comment */}
                <div className="ve-field">
                  <label className="ve-field-label">备注</label>
                  <input
                    className="ve-input"
                    value={form.comment || ''}
                    onChange={e => update({ comment: e.target.value })}
                    placeholder="分类标签，如：人物_张三、事件_某某战役..."
                  />
                </div>
              </div>
            )}
          </div>

        </div>

      {/* ---- Footer Actions ---- */}
      <div className="ve-action-bar">
        <button type="button" className="wx-btn" onClick={() => onSave(form)}>
          <Save size={14} /> 保存
        </button>
        <button type="button" className="wx-btn-outline" onClick={() => onSaveAndNew(form)}>
          <Plus size={14} /> 保存并新建
        </button>
        <button type="button" className="wx-btn-ghost" onClick={onCancel}>取消</button>
      </div>
    </>
  );

  if (inline) {
    return <div className="ve-inline">{content}</div>;
  }

  return (
    <div className="dz-modal-shell" onClick={onCancel}>
      <div className="dz-modal-box ve-box" onClick={e => e.stopPropagation()}>
        {content}
      </div>
    </div>
  );
}
