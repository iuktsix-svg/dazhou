import { useState, useEffect } from 'react';
import {
  type ChatPreset, type PresetSettings,
  createDefaultPreset, DEFAULT_PROMPT_ORDER,
} from '../../sillytavern';
import { PromptOrderEditor } from './PromptOrderEditor';

interface Props {
  preset: ChatPreset | null;          // null = creating new
  presets: ChatPreset[];
  onSave: (preset: ChatPreset) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

type Tab = 'sampling' | 'prompts' | 'templates' | 'order';

export function PresetModal({ preset, presets, onSave, onDelete, onClose }: Props) {
  const [form, setForm] = useState<ChatPreset>(
    preset ? { ...preset, prompt_order: [...(preset.prompt_order || DEFAULT_PROMPT_ORDER)] }
      : createDefaultPreset(),
  );
  const [tab, setTab] = useState<Tab>('sampling');
  const [duplicateFrom, setDuplicateFrom] = useState<string>('');

  useEffect(() => {
    if (preset) {
      setForm({ ...preset, prompt_order: [...(preset.prompt_order || DEFAULT_PROMPT_ORDER.map(p => ({ ...p })))] });
    }
  }, [preset]);

  const updateSettings = (patch: Partial<PresetSettings>) => {
    setForm(prev => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  };

  const handleDuplicate = () => {
    if (!duplicateFrom) return;
    const src = presets.find(p => p.id === duplicateFrom);
    if (src) {
      setForm({ ...src, id: crypto.randomUUID(), name: src.name + ' (副本)', prompt_order: [...src.prompt_order] });
    }
  };

  const handleSave = () => {
    onSave({ ...form, updatedAt: Date.now() });
    onClose();
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'sampling', label: '采样参数' },
    { key: 'prompts', label: 'Prompt 文本' },
    { key: 'templates', label: '自定义 Prompts' },
    { key: 'order', label: 'Prompt 排序' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{preset ? '编辑预设' : '新建预设'}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="preset-header">
            <label>名称：<input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} /></label>
            <label>从现有预设复制：
              <select value={duplicateFrom} onChange={e => setDuplicateFrom(e.target.value)}>
                <option value="">-- 选择 --</option>
                {presets.filter(p => p.id !== preset?.id).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button onClick={handleDuplicate} disabled={!duplicateFrom}>复制</button>
            </label>
          </div>

          <div className="tabs">
            {tabs.map(t => (
              <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="tab-content">
            {tab === 'sampling' && (
              <div className="sampling-grid">
                <label>Temperature <input type="number" step="0.01" min="0" max="2" value={form.settings.temp_openai ?? ''} onChange={e => updateSettings({ temp_openai: e.target.value ? Number(e.target.value) : undefined })} /></label>
                <label>Max Tokens <input type="number" min="1" max="200000" value={form.settings.openai_max_tokens ?? ''} onChange={e => updateSettings({ openai_max_tokens: e.target.value ? Number(e.target.value) : undefined })} /></label>
                <label>Top P <input type="number" step="0.01" min="0" max="1" value={form.settings.top_p_openai ?? ''} onChange={e => updateSettings({ top_p_openai: e.target.value ? Number(e.target.value) : undefined })} /></label>
                <label>Frequency Penalty <input type="number" step="0.01" min="-2" max="2" value={form.settings.freq_pen_openai ?? ''} onChange={e => updateSettings({ freq_pen_openai: e.target.value ? Number(e.target.value) : undefined })} /></label>
                <label>Presence Penalty <input type="number" step="0.01" min="-2" max="2" value={form.settings.pres_pen_openai ?? ''} onChange={e => updateSettings({ pres_pen_openai: e.target.value ? Number(e.target.value) : undefined })} /></label>
                <label>Max Context <input type="number" min="1" max="200000" value={form.settings.max_context ?? ''} onChange={e => updateSettings({ max_context: e.target.value ? Number(e.target.value) : undefined })} /></label>
                <label>Model <input value={form.settings.openai_model || ''} onChange={e => updateSettings({ openai_model: e.target.value })} /></label>
                <label className="checkbox-label"><input type="checkbox" checked={form.settings.stream_openai ?? false} onChange={e => updateSettings({ stream_openai: e.target.checked })} /> 启用流式</label>
              </div>
            )}

            {tab === 'prompts' && (
              <div>
                <label>System Prompt（覆盖默认）
                  <textarea rows={6} value={form.systemPrompt || ''} onChange={e => setForm(prev => ({ ...prev, systemPrompt: e.target.value }))} placeholder="You are {{char}}..." />
                </label>
                <label>User Prompt 模板
                  <textarea rows={3} value={form.userPrompt || ''} onChange={e => setForm(prev => ({ ...prev, userPrompt: e.target.value }))} placeholder="{{user}}: {{input}}" />
                </label>
              </div>
            )}

            {tab === 'templates' && (
              <div>
                <p className="hint">自定义 Prompt 块 — 在 prompt_order 中添加对应 id 即可激活</p>
                {/* Custom template slots could be extended here */}
              </div>
            )}

            {tab === 'order' && (
              <PromptOrderEditor
                items={form.prompt_order}
                onChange={(items) => setForm(prev => ({ ...prev, prompt_order: items }))}
              />
            )}
          </div>
        </div>

        <div className="modal-footer">
          {preset && <button onClick={() => onDelete(form.id)} className="btn-danger">🗑 删除</button>}
          <button onClick={handleSave}>💾 保存</button>
          <button onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  );
}
