import { useState, useEffect } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { type AppSettings, type ApiConfig, type ApiEndpoint, DEFAULT_TAGS } from '../../sillytavern';

interface Props { onClose: () => void; }


export function SettingsModal({ onClose }: Props) {
  const { settings, updateSettings } = useSillytavern();
  const [form, setForm] = useState<AppSettings | null>(null);

  useEffect(() => {
    if (settings) setForm(JSON.parse(JSON.stringify(settings)));
  }, [settings]);

  if (!form) return null;

  const handleSave = async () => { await updateSettings(form); onClose(); };

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
    setForm(prev => prev ? { ...prev, [key]: value } : prev);

  const updateEndpoint = (which: keyof ApiConfig, patch: Partial<ApiEndpoint>) =>
    setForm(prev => prev ? { ...prev, api: { ...prev.api, [which]: { ...prev.api[which], ...patch } } } : prev);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>系统设置</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Character */}
          <section>
            <h3>角色与用户</h3>
            <label>用户名 <input value={form.userName} onChange={e => update('userName', e.target.value)} /></label>
            <label>角色名 <input value={form.characterName} onChange={e => update('characterName', e.target.value)} /></label>
          </section>

          {/* 3-API Endpoints */}
          {(['primary', 'secondary', 'memory'] as const).map(which => {
            const ep = form.api[which];
            const labels = { primary: '正文 API', secondary: '变量 API (JSON Patch)', memory: '记忆 API (总结压缩)' };
            return (
              <section key={which}>
                <h3>
                  {labels[which]}
                  <label className="checkbox-label" style={{ marginLeft: 12 }}>
                    <input type="checkbox" checked={ep?.enabled ?? false} onChange={e => updateEndpoint(which, { enabled: e.target.checked })} />
                    启用
                  </label>
                </h3>
                {ep?.enabled !== false && (
                  <>
                    <label>Base URL <input value={ep?.baseUrl || ''} onChange={e => updateEndpoint(which, { baseUrl: e.target.value })} placeholder="https://api.openai.com/v1" /></label>
                    <label>API Key <input type="password" value={ep?.apiKey || ''} onChange={e => updateEndpoint(which, { apiKey: e.target.value })} /></label>
                    <label>Model <input value={ep?.model || ''} onChange={e => updateEndpoint(which, { model: e.target.value })} placeholder="gpt-4o" /></label>
                  </>
                )}
              </section>
            );
          })}

          {/* UI Mode */}
          <section>
            <h3>界面模式</h3>
            <select value={form.uiMode} onChange={e => update('uiMode', e.target.value as 'chat' | 'game')}>
              <option value="chat">聊天模式</option>
              <option value="game">游戏模式（正文+选项）</option>
            </select>
          </section>

          {/* Custom Tags */}
          <section>
            <h3>自定义标签</h3>
            <input value={form.customTags.join(' ')} onChange={e => update('customTags', e.target.value.split(/\s+/).filter(Boolean))} placeholder={DEFAULT_TAGS.join(' ')} />
            <small>空格分隔。游戏模式至少需要 maintext 和 option。</small>
          </section>

          {form.uiMode === 'game' && (
            <section>
              <h3>游戏设置</h3>
              <label className="checkbox-label"><input type="checkbox" checked={form.gameSettings?.autoContinue ?? false} onChange={e => update('gameSettings', { ...form.gameSettings, autoContinue: e.target.checked })} /> 空选项时自动继续</label>
              <label className="checkbox-label"><input type="checkbox" checked={form.gameSettings?.showThinking ?? true} onChange={e => update('gameSettings', { ...form.gameSettings, showThinking: e.target.checked })} /> 显示思考过程</label>
            </section>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={handleSave}>保存</button>
          <button onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  );
}
