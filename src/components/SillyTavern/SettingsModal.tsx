import { useState, useEffect } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { type AppSettings, type ApiConfig, type ApiEndpoint } from '../../sillytavern';
import { Settings, Save, Wifi, Download, Trash2, Plus, MessageSquare } from 'lucide-react';

interface Props { onClose: () => void; }

type Section = 'main' | 'api' | 'archive' | 'filter';

export function SettingsModal({ onClose }: Props) {
  const { settings, updateSettings, chats, createChat, loadChat, deleteChat, activeChatId } = useSillytavern();
  const [form, setForm] = useState<AppSettings | null>(null);
  const [section, setSection] = useState<Section>('main');
  const [newChatName, setNewChatName] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMsg, setTestMsg] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);

  useEffect(() => { if (settings) setForm(JSON.parse(JSON.stringify(settings))); }, [settings]);
  const f = form || { id: 'app-settings', api: { primary: { enabled: true, baseUrl: '', apiKey: '', model: '' }, secondary: { enabled: false, baseUrl: '', apiKey: '', model: '' }, memory: { enabled: false, baseUrl: '', apiKey: '', model: '' } }, userName: '', characterName: '', activeLorebookIds: [], activePresetId: null, uiMode: 'game' as const, customTags: [], stripTags: [], createdAt: 0, updatedAt: 0 };
  if (!f) return null;

  const handleSave = async () => { await updateSettings(f); onClose(); };
  const updateEndpoint = (which: keyof ApiConfig, patch: Partial<ApiEndpoint>) =>
    setForm(prev => prev ? { ...prev, api: { ...prev.api, [which]: { ...prev.api[which], ...patch } } } : prev);

  const ep = f.api.primary;

  const handleTestConnection = async () => {
    if (!ep.baseUrl || !ep.apiKey) { setTestMsg('请先填写调用地址和秘钥'); setTestStatus('error'); return; }
    setTestStatus('testing'); setTestMsg('');
    try {
      const res = await fetch(`${ep.baseUrl}/models`, { headers: { Authorization: `Bearer ${ep.apiKey}` } });
      if (res.ok) { setTestStatus('success'); setTestMsg('连接成功'); }
      else { setTestStatus('error'); setTestMsg(`HTTP ${res.status}`); }
    } catch { setTestStatus('error'); setTestMsg('网络错误，请检查地址'); }
  };

  const handleFetchModels = async () => {
    if (!ep.baseUrl || !ep.apiKey) return;
    setFetchingModels(true);
    try {
      const res = await fetch(`${ep.baseUrl}/models`, { headers: { Authorization: `Bearer ${ep.apiKey}` } });
      if (res.ok) {
        const data = await res.json();
        const names = (data.data || []).map((m: Record<string, unknown>) => String(m.id || '')).filter(Boolean).sort();
        setModels(names);
      }
    } catch { /* ignore */ }
    setFetchingModels(false);
  };

  const handleCreateChat = async () => { await createChat(newChatName.trim() || undefined); setNewChatName(''); };

  const cardStyle: React.CSSProperties = {
    padding: '20px 22px', marginBottom: 10, background: 'var(--wx-card)',
    border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-md)',
    cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 14,
    boxShadow: 'var(--sh-sm)',
  };

  return (
    <div className="dz-modal-shell" onClick={section === 'main' ? onClose : undefined}>
      <div className={`dz-modal-box ${section !== 'main' ? 'wide' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="dz-modal-head">
          <h2>{section === 'main' ? '系统设置' : section === 'api' ? 'API 设置' : section === 'filter' ? '正文过滤' : '存档管理'}</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {section !== 'main' && (
              <button onClick={() => setSection('main')} className="wx-btn wx-btn-outline" style={{ padding: '6px 14px', fontSize: 'var(--text-xs)' }}>返回</button>
            )}
            <button className="dz-modal-close-btn" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="dz-modal-body">
          {/* ============ MAIN ============ */}
          {section === 'main' && (
            <>
              <div onClick={() => setSection('api')} style={cardStyle} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--wx-vermillion)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(44,36,22,0.12)'}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--rd-md)', background: 'var(--wx-vermillion-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Wifi size={20} style={{ color: 'var(--wx-vermillion)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--wx-ink)', marginBottom: 3 }}>API 设置</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--wx-ink-dim)' }}>配置正文、变量、记忆三个 API 端点，测试连接并拉取模型列表</div>
                </div>
                <span style={{ color: 'var(--wx-ink-dim)', fontSize: 18 }}>›</span>
              </div>

              <div onClick={() => setSection('archive')} style={cardStyle} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--wx-gold)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(44,36,22,0.12)'}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--rd-md)', background: 'var(--wx-gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Save size={20} style={{ color: 'var(--wx-gold)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--wx-ink)', marginBottom: 3 }}>存档管理</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--wx-ink-dim)' }}>创建、切换、删除游戏存档 · {chats.length} 个存档</div>
                </div>
                <span style={{ color: 'var(--wx-ink-dim)', fontSize: 18 }}>›</span>
              </div>

              <div onClick={() => setSection('filter')} style={cardStyle} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--wx-cyan)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(44,36,22,0.12)'}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--rd-md)', background: 'rgba(90,140,160,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Settings size={20} style={{ color: 'var(--wx-cyan)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--wx-ink)', marginBottom: 3 }}>正文过滤</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--wx-ink-dim)' }}>管理正文中需要过滤的标签 · {(f.stripTags || []).length} 个规则</div>
                </div>
                <span style={{ color: 'var(--wx-ink-dim)', fontSize: 18 }}>›</span>
              </div>

              <div style={{ ...cardStyle, opacity: 0.5, cursor: 'default' }}>
                <div style={{ width: 44, height: 44, borderRadius: 'var(--rd-md)', background: 'rgba(44,36,22,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Settings size={20} style={{ color: 'var(--wx-ink-dim)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--wx-ink)', marginBottom: 3 }}>角色与用户</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--wx-ink-dim)' }}>{f.userName || '未设置'} · {f.characterName || '未设置'}</div>
                </div>
                <span style={{ color: 'var(--wx-ink-dim)', fontSize: 12 }}>即将开放</span>
              </div>
            </>
          )}

          {/* ============ API ============ */}
          {section === 'api' && (
            <div>
              {(['primary', 'secondary', 'memory'] as const).map(which => {
                const ep = f.api[which];
                const labels = { primary: '正文 API', secondary: '变量 API', memory: '记忆 API' };
                const isPrimary = which === 'primary';
                return (
                  <div key={which} style={{ marginBottom: 22, padding: 18, background: 'var(--wx-card)', border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--wx-ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: isPrimary ? 'var(--wx-vermillion)' : which === 'secondary' ? 'var(--wx-gold)' : 'var(--wx-cyan)' }} />
                        {labels[which]}
                      </div>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--wx-ink-dim)' }}>
                        <input type="checkbox" checked={ep?.enabled ?? false} onChange={e => updateEndpoint(which, { enabled: e.target.checked })} style={{ accentColor: 'var(--wx-vermillion)' }} />
                        启用
                      </label>
                    </div>
                    {ep?.enabled !== false && (
                      <>
                        <div style={{ marginBottom: 10 }}>
                          <label style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--wx-ink-dim)', display: 'block', marginBottom: 4 }}>调用地址 (Base URL)</label>
                          <input value={ep?.baseUrl || ''} onChange={e => updateEndpoint(which, { baseUrl: e.target.value })} placeholder="https://api.openai.com/v1" style={{ width: '100%', padding: '9px 14px', border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-md)', background: 'var(--wx-surface)', color: 'var(--wx-ink)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', outline: 'none' }} />
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <label style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--wx-ink-dim)', display: 'block', marginBottom: 4 }}>秘钥 (API Key)</label>
                          <input type="password" value={ep?.apiKey || ''} onChange={e => updateEndpoint(which, { apiKey: e.target.value })} placeholder="sk-..." style={{ width: '100%', padding: '9px 14px', border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-md)', background: 'var(--wx-surface)', color: 'var(--wx-ink)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', outline: 'none' }} />
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <label style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--wx-ink-dim)', display: 'block', marginBottom: 4 }}>模型 (Model)</label>
                          <input value={ep?.model || ''} onChange={e => updateEndpoint(which, { model: e.target.value })} placeholder="gpt-4o" style={{ width: '100%', padding: '9px 14px', border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-md)', background: 'var(--wx-surface)', color: 'var(--wx-ink)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', outline: 'none' }} />
                        </div>
                        {isPrimary && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <button onClick={handleTestConnection} disabled={testStatus === 'testing'} className="wx-btn wx-btn-outline" style={{ padding: '8px 16px', fontSize: 'var(--text-xs)' }}>
                              <Wifi size={14} /> {testStatus === 'testing' ? '测试中…' : '测试连接'}
                            </button>
                            <button onClick={handleFetchModels} disabled={fetchingModels} className="wx-btn wx-btn-outline" style={{ padding: '8px 16px', fontSize: 'var(--text-xs)' }}>
                              <Download size={14} /> {fetchingModels ? '拉取中…' : '拉取模型'}
                            </button>
                          </div>
                        )}
                        {isPrimary && testMsg && (
                          <div style={{ marginTop: 8, padding: '8px 14px', borderRadius: 'var(--rd-md)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', background: testStatus === 'success' ? 'rgba(90,140,106,0.1)' : 'rgba(181,40,26,0.08)', color: testStatus === 'success' ? 'var(--wx-jade)' : 'var(--wx-vermillion)' }}>
                            {testMsg}
                          </div>
                        )}
                        {isPrimary && models.length > 0 && (
                          <div style={{ marginTop: 10 }}>
                            <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--wx-ink-dim)', marginBottom: 6 }}>可用模型 ({models.length})</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {models.slice(0, 30).map(m => (
                                <button key={m} onClick={() => updateEndpoint('primary', { model: m })} style={{
                                  padding: '5px 12px', border: `1px solid ${ep.model === m ? 'var(--wx-vermillion)' : 'var(--bdr-subtle)'}`,
                                  borderRadius: 'var(--rd-full)', background: ep.model === m ? 'var(--wx-vermillion-dim)' : 'var(--wx-surface)',
                                  color: ep.model === m ? 'var(--wx-vermillion)' : 'var(--wx-ink-dim)', cursor: 'pointer',
                                  fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)',
                                }}>{m}</button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ============ ARCHIVE ============ */}
          {/* ============ FILTER ============ */}
          {section === 'filter' && (
            <div>
              <div style={{ marginBottom: 18, fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-dim)', lineHeight: 1.7 }}>
                这些标签及其内容会从正文显示中自动过滤。标签名不含尖括号。
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input id="new-tag-input" placeholder="输入标签名…" style={{ flex: 1, padding: '9px 14px', border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-md)', background: 'var(--wx-surface)', color: 'var(--wx-ink)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', outline: 'none' }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const inp = e.currentTarget;
                      const v = inp.value.trim();
                      if (v) {
                        setForm(prev => prev ? { ...prev, stripTags: [...(prev.stripTags || []), v] } : prev);
                        inp.value = '';
                      }
                    }
                  }} />
                <button onClick={() => {
                  const inp = document.getElementById('new-tag-input') as HTMLInputElement;
                  const v = inp?.value?.trim();
                  if (v) { setForm(prev => prev ? { ...prev, stripTags: [...(prev.stripTags || []), v] } : prev); inp.value = ''; }
                }} className="wx-btn wx-btn-outline" style={{ padding: '9px 16px' }}>添加</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(f.stripTags || ['thinking', 'think', 'sum', 'vars']).map((tag, i) => (
                  <div key={tag + i} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                    background: 'var(--wx-card)', border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-full)',
                    fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--wx-ink-dim)',
                  }}>
                    &lt;{tag}&gt;
                    <button onClick={() => {
                      setForm(prev => prev ? { ...prev, stripTags: (prev.stripTags || []).filter((_, j) => j !== i) } : prev);
                    }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--wx-vermillion)', fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {section === 'archive' && (
            <div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                <input value={newChatName} onChange={e => setNewChatName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleCreateChat(); }}
                  placeholder="新存档名称（可选）" style={{ flex: 1, padding: '9px 14px', border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-md)', background: 'var(--wx-surface)', color: 'var(--wx-ink)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', outline: 'none' }} />
                <button onClick={handleCreateChat} className="wx-btn wx-btn-red" style={{ padding: '9px 20px' }}><Plus size={16} /> 新建</button>
              </div>

              {chats.length === 0 ? (
                <div className="wx-empty"><div className="tl">暂无存档</div><div className="gd">创建一个存档开始游戏</div></div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 340, overflow: 'auto' }}>
                  {chats.map(chat => (
                    <div key={chat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: chat.id === activeChatId ? 'var(--wx-vermillion-dim)' : 'var(--wx-card)', border: `1px solid ${chat.id === activeChatId ? 'var(--wx-vermillion-dim)' : 'var(--bdr-subtle)'}`, borderRadius: 'var(--rd-md)', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ flex: 1, minWidth: 0 }} onClick={() => { loadChat(chat.id); onClose(); }}>
                        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--wx-ink)', fontSize: 'var(--text-base)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <MessageSquare size={14} style={{ color: 'var(--wx-vermillion)' }} />
                          {chat.name}
                          {chat.id === activeChatId && <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', color: 'var(--wx-vermillion)', background: 'var(--wx-vermillion-dim)', padding: '2px 8px', borderRadius: 'var(--rd-full)' }}>当前</span>}
                        </div>
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--wx-ink-dim)', marginTop: 4 }}>
                          {chat.messages.length} 条消息 · {new Date(chat.updatedAt).toLocaleString('zh-CN')}
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); if (confirm('确定删除此存档？')) deleteChat(chat.id); }}
                        className="wx-btn wx-btn-outline" style={{ padding: '5px 14px', fontSize: 'var(--text-xs)' }}>
                        <Trash2 size={13} /> 删除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
        {section === 'api' && (
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '12px 22px', borderTop: '1px solid var(--bdr-subtle)' }}>
            <button onClick={handleSave} className="wx-btn wx-btn-red">保存设置</button>
            <button onClick={onClose} className="wx-btn wx-btn-outline">关闭</button>
          </div>
        )}
        <div className="dz-modal-foot" />
      </div>
    </div>
  );
}
