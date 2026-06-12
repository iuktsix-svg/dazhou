import { useState, useEffect } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { type AppSettings, type ApiConfig, type ApiEndpoint } from '../../sillytavern';

interface Props { onClose: () => void; }

export function SettingsModal({ onClose }: Props) {
  const { settings, updateSettings, chats, createChat, loadChat, deleteChat, activeChatId } = useSillytavern();
  const [form, setForm] = useState<AppSettings | null>(null);
  const [tab, setTab] = useState<'settings' | 'archive'>('settings');
  const [newChatName, setNewChatName] = useState('');

  useEffect(() => { if (settings) setForm(JSON.parse(JSON.stringify(settings))); }, [settings]);
  // Fallback form so modal always renders
  const f = form || { id: 'app-settings', api: { primary: { enabled: true, baseUrl: '', apiKey: '', model: '' }, secondary: { enabled: false, baseUrl: '', apiKey: '', model: '' }, memory: { enabled: false, baseUrl: '', apiKey: '', model: '' } }, userName: '', characterName: '', activeLorebookIds: [], activePresetId: null, uiMode: 'game' as const, customTags: [], createdAt: 0, updatedAt: 0 };
  if (!f) return null;

  const handleSave = async () => { await updateSettings(f); onClose(); };
  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => setForm(prev => prev ? { ...prev, [key]: value } : prev);
  const updateEndpoint = (which: keyof ApiConfig, patch: Partial<ApiEndpoint>) =>
    setForm(prev => prev ? { ...prev, api: { ...prev.api, [which]: { ...prev.api[which], ...patch } } } : prev);

  const handleCreateChat = async () => { await createChat(newChatName.trim() || undefined); setNewChatName(''); };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 640, maxHeight: '82vh', background: 'var(--dz-dark)', border: '1px solid var(--dz-gray-light)', boxShadow: '0 8px 40px rgba(0,0,0,0.8)', clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(197,48,48,0.06) 1px, transparent 1px)', backgroundSize: '8px 8px', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--dz-gray-light)', background: 'rgba(197,48,48,0.08)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--dz-white)', letterSpacing: 1, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 4, height: 22, background: 'var(--dz-red)', clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }} />
            {tab === 'settings' ? '系统设置' : '存档管理'}
          </h2>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 2, background: 'none', border: 'none', color: 'var(--dz-text)', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>

        {/* Tab bar */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', borderBottom: '1px solid var(--ink-border)', padding: '0 20px' }}>
          <button onClick={() => setTab('settings')} style={{ padding: '10px 18px', background: 'none', border: 'none', borderBottom: tab === 'settings' ? '2px solid var(--dz-red)' : '2px solid transparent', color: tab === 'settings' ? 'var(--dz-white)' : 'var(--dz-text-dim)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 14 }}>设置</button>
          <button onClick={() => setTab('archive')} style={{ padding: '10px 18px', background: 'none', border: 'none', borderBottom: tab === 'archive' ? '2px solid var(--dz-red)' : '2px solid transparent', color: tab === 'archive' ? 'var(--dz-white)' : 'var(--dz-text-dim)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 14 }}>存档</button>
        </div>

        <div style={{ position: 'relative', zIndex: 1, flex: 1, overflow: 'auto', padding: '16px 20px' }}>
          {tab === 'settings' && (
            <>
              <section><h3>角色与用户</h3>
                <label>用户名 <input value={f.userName} onChange={e => update('userName', e.target.value)} /></label>
                <label>角色名 <input value={f.characterName} onChange={e => update('characterName', e.target.value)} /></label>
              </section>

              {(['primary', 'secondary', 'memory'] as const).map(which => {
                const ep = f.api[which];
                const labels = { primary: '正文 API', secondary: '变量 API', memory: '记忆 API' };
                return (<section key={which}><h3>{labels[which]}<label className="checkbox-label" style={{ marginLeft: 12 }}><input type="checkbox" checked={ep?.enabled ?? false} onChange={e => updateEndpoint(which, { enabled: e.target.checked })} />启用</label></h3>
                  {ep?.enabled !== false && (<>
                    <label>Base URL <input value={ep?.baseUrl || ''} onChange={e => updateEndpoint(which, { baseUrl: e.target.value })} /></label>
                    <label>API Key <input type="password" value={ep?.apiKey || ''} onChange={e => updateEndpoint(which, { apiKey: e.target.value })} /></label>
                    <label>Model <input value={ep?.model || ''} onChange={e => updateEndpoint(which, { model: e.target.value })} /></label>
                  </>)}
                </section>);
              })}
            </>
          )}

          {tab === 'archive' && (
            <section>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <input value={newChatName} onChange={e => setNewChatName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleCreateChat(); }}
                  placeholder="新存档名称（可选）" style={{ flex: 1, padding: '8px 12px', border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-md)', background: 'var(--ink-deep)', color: 'var(--moon)', fontFamily: 'var(--font-ui)', fontSize: 14 }} />
                <button onClick={handleCreateChat} className="dz-btn dz-btn-red">新建存档</button>
              </div>

              {chats.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--dz-text-dim)', fontFamily: 'var(--font-serif)' }}>暂无存档。创建一个来开始游戏。</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflow: 'auto' }}>
                  {chats.map(chat => (
                    <div key={chat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: chat.id === activeChatId ? 'rgba(197,48,48,0.08)' : 'var(--ink-card)', border: `1px solid ${chat.id === activeChatId ? 'rgba(197,48,48,0.3)' : 'var(--ink-border)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ flex: 1, minWidth: 0 }} onClick={() => { loadChat(chat.id); onClose(); }}>
                        <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, color: chat.id === activeChatId ? 'var(--dz-white)' : 'var(--moon)', fontSize: 15 }}>{chat.name}</div>
                        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--dz-text-dim)', marginTop: 3 }}>
                          {chat.messages.length} 条消息 · {new Date(chat.updatedAt).toLocaleString('zh-CN')}
                          {chat.id === activeChatId && <span style={{ color: 'var(--dz-red)', marginLeft: 8 }}>● 当前</span>}
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); if (confirm('确定删除此存档？')) deleteChat(chat.id); }}
                        style={{ padding: '4px 12px', background: 'none', border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-sm)', color: 'var(--dz-text-dim)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 12 }}>删除</button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {tab === 'settings' && (
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 20px', borderTop: '1px solid var(--ink-border)' }}>
            <button onClick={handleSave} className="dz-btn dz-btn-red">保存</button>
            <button onClick={onClose} className="dz-btn dz-btn-outline">取消</button>
          </div>
        )}
        <div style={{ position: 'relative', zIndex: 1, height: 3, flexShrink: 0, background: 'linear-gradient(90deg, var(--dz-red), var(--dz-gold), var(--dz-red))' }} />
      </div>
    </div>
  );
}
