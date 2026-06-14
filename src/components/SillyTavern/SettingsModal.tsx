import { useState, useEffect, useCallback, useRef } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { type ApiEndpoint, type AppSettings } from '../../sillytavern';
import { DEFAULT_VAR_PROMPT, DEFAULT_MEM_PROMPT } from '../../data/prompt-defaults';
import { createDefaultPreset, DEFAULT_PROMPT_ORDER, type ChatPreset } from '../../sillytavern';
import { Settings, Database, Archive, Filter, Variable, Brain, Plus, Trash2, Wifi, X, ChevronDown, Save, AlertCircle } from 'lucide-react';

interface Props { onClose: () => void; }

type Section = 'api' | 'var' | 'mem' | 'preset' | 'archive' | 'filter';

const NAV_ITEMS: { key: Section; label: string; icon: typeof Database }[] = [
  { key: 'api', label: 'API 配置', icon: Database },
  { key: 'var', label: '变量设置', icon: Variable },
  { key: 'mem', label: '记忆设置', icon: Brain },
  { key: 'preset', label: '预设设置', icon: Settings },
  { key: 'archive', label: '存档管理', icon: Archive },
  { key: 'filter', label: '正文过滤', icon: Filter },
];

function PresetPanel() {
  const { presets, savePreset, deletePreset, settings, updateSettings } = useSillytavern();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ChatPreset | null>(null);
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleNew = () => {
    const p = createDefaultPreset();
    setForm(p); setEditingId(null);
  };
  const handleEdit = (p: ChatPreset) => {
    setForm(JSON.parse(JSON.stringify(p))); setEditingId(p.id);
  };
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      // Convert SillyTavern preset → ChatPreset
      const systemPrompt = json.prompts?.find((p: Record<string,unknown>) => p.identifier === 'main' || p.role === 'system')?.content || '';
      const importedPrompts = (json.prompts || []).map((p: Record<string,unknown>) => ({
        name: String(p.name || ''),
        identifier: String(p.identifier || ''),
        role: String(p.role || 'system'),
        content: String(p.content || ''),
        enabled: Boolean(p.enabled),
        injection_position: Number(p.injection_position || 0),
      }));
      const imported = {
        id: crypto.randomUUID(),
        name: file.name.replace(/\.json$/i, ''),
        settings: {
          temp_openai: json.temperature ?? 0.7,
          openai_max_tokens: json.openai_max_tokens ?? 4096,
          top_p_openai: json.top_p ?? 1,
          freq_pen_openai: json.frequency_penalty ?? 0,
          pres_pen_openai: json.presence_penalty ?? 0,
          stream_openai: json.stream_openai ?? true,
          top_k_openai: json.top_k,
          min_p_openai: json.min_p,
          repeat_pen_openai: json.repetition_penalty,
        },
        systemPrompt,
        prompt_order: DEFAULT_PROMPT_ORDER.map(p => ({ ...p })),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        _importedPrompts: importedPrompts,
      } as unknown as ChatPreset;
      await savePreset(imported);
      // Auto-activate
      await updateSettings({ activePresetId: imported.id });
    } catch (err) {
      alert('导入失败：' + (err instanceof Error ? err.message : '无效的 JSON'));
    }
    if (fileRef.current) fileRef.current.value = '';
  };
  const handleSave = async () => {
    if (!form) return;
    const saved = { ...form, updatedAt: Date.now() };
    await savePreset(saved);
    // Sync to disk so Claude can see changes
    try { await fetch('/api/preset-sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: editingId ? 'updated' : 'created', presetName: saved.name, preset: { id: saved.id, name: saved.name, settings: saved.settings, systemPrompt: saved.systemPrompt?.slice(0, 300), entryCount: saved._importedPrompts?.length || 0, entries: saved._importedPrompts?.map(e => ({ name: e.name, role: e.role, enabled: e.enabled })) } }) }); } catch(e) { /* sync skipped */ }
    if (!editingId && settings && !settings.activePresetId) await updateSettings({ activePresetId: saved.id });
    setForm(null); setEditingId(null);
  };
  const handleDelete = async (id: string) => {
    if (!confirm('删除此预设？')) return;
    await deletePreset(id);
    if (settings?.activePresetId === id) await updateSettings({ activePresetId: null });
  };
  const handleActivate = async (id: string) => {
    await updateSettings({ activePresetId: id });
  };

  const activeId = settings?.activePresetId;

  return (
    <div className="st-panel">
      <div className="st-panel-head"><h2>预设设置</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="wx-btn-outline" onClick={() => fileRef.current?.click()}><Plus size={14} />导入预设</button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          <button className="wx-btn" onClick={handleNew}><Plus size={14} />新建预设</button>
        </div>
      </div>
      <p className="st-desc">管理对话预设——温度、最大 token、提示词模板等。</p>

      {/* Preset list */}
      {presets.map(p => (
        <div key={p.id} className={`st-card st-route-card ${activeId === p.id ? 'active' : ''}`} onClick={() => handleEdit(p)}>
          <div style={{ flex: 1 }}>
            <div className="st-api-name">{p.name} {activeId === p.id && <span className="st-route-badge main">使用中</span>}</div>
            <div className="st-api-detail">
              温度 {p.settings.temp_openai ?? 0.7} · max {p.settings.openai_max_tokens ?? 4096} · {p.settings.stream_openai ? '流式' : '非流式'}
            </div>
          </div>
          <button className="wx-btn-sm wx-btn-outline" onClick={e => { e.stopPropagation(); handleActivate(p.id); }}>启用</button>
          <button className="wx-btn-sm wx-btn-danger" onClick={e => { e.stopPropagation(); handleDelete(p.id); }}><Trash2 size={12} /></button>
        </div>
      ))}
      {presets.length === 0 && <div className="st-empty">暂无预设</div>}

      {/* Edit form */}
      {form && (
        <div className="st-card" style={{ marginTop: 16 }}>
          <h3>{editingId ? '编辑预设' : '新建预设'}</h3>
          <div className="st-form">
            <label className="st-label">预设名称</label>
            <input className="st-input" value={form.name} onChange={e => setForm(f => f ? { ...f, name: e.target.value } : f)} />
            <label className="st-label">温度 (0-2)</label>
            <input className="st-input" type="number" min={0} max={2} step={0.1} value={form.settings.temp_openai ?? 0.7} onChange={e => setForm(f => f ? { ...f, settings: { ...f.settings, temp_openai: Number(e.target.value) } } : f)} />
            <label className="st-label">Max Tokens</label>
            <input className="st-input" type="number" min={256} max={65536} step={256} value={form.settings.openai_max_tokens ?? 4096} onChange={e => setForm(f => f ? { ...f, settings: { ...f.settings, openai_max_tokens: Number(e.target.value) } } : f)} />
            <label className="st-label">流式输出</label>
            <label className="st-toggle-wrap"><input type="checkbox" checked={form.settings.stream_openai ?? true} onChange={e => setForm(f => f ? { ...f, settings: { ...f.settings, stream_openai: e.target.checked } } : f)} /><span className="st-toggle-track" /></label>

            {/* System prompt */}
            <label className="st-label" style={{ marginTop: 8 }}>系统提示词</label>
            <textarea className="st-textarea" style={{ minHeight: 120 }} value={form.systemPrompt || ''} onChange={e => setForm(f => f ? { ...f, systemPrompt: e.target.value } : f)} />

            {/* Imported prompt entries */}
            {form?._importedPrompts && form._importedPrompts.length > 0 && (() => {
              const prompts = form._importedPrompts;
              return (
              <div style={{ marginTop: 12 }}>
                <label className="st-label">导入的条目（{prompts.length} 条）</label>
                <div style={{ maxHeight: 460, overflow: 'auto', border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-md)' }}>
                  {prompts.map((p, i) => {
                    const isOpen = expandedEntry === i;
                    return (
                      <div key={i} style={{ borderBottom: '1px solid var(--bdr-subtle)' }}>
                        <div className={`st-entry-row ${isOpen ? 'open' : ''}`} onClick={() => setExpandedEntry(isOpen ? null : i)}>
                          <label className="st-toggle-wrap" onClick={e => e.stopPropagation()}>
                            <input type="checkbox" checked={!!p.enabled} onChange={e => { const updated = [...prompts]; updated[i] = { ...updated[i], enabled: e.target.checked }; setForm(f => f ? { ...f, _importedPrompts: updated } : f); }} />
                            <span className="st-toggle-track" />
                          </label>
                          <span className="st-entry-name" style={{ color: p.enabled ? 'var(--wx-ink)' : 'var(--wx-ink-dim)' }}>{p.name || `条目 ${i+1}`}</span>
                          <span className="st-entry-role">{p.role}</span>
                          <ChevronDown size={12} style={{ color: 'var(--wx-ink-dim)', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </div>
                        {isOpen && (
                          <div className="st-entry-body" onClick={e => e.stopPropagation()}>
                            <label className="st-label">名称</label>
                            <input className="st-input" value={p.name} onChange={e => { const u = [...prompts]; u[i] = { ...u[i], name: e.target.value }; setForm(f => f ? { ...f, _importedPrompts: u } : f); }} />
                            <label className="st-label">角色</label>
                            <select className="st-select" value={p.role} onChange={e => { const u = [...prompts]; u[i] = { ...u[i], role: e.target.value }; setForm(f => f ? { ...f, _importedPrompts: u } : f); }}>
                              <option value="system">system</option><option value="user">user</option><option value="assistant">assistant</option>
                            </select>
                            <label className="st-label">内容</label>
                            <textarea className="st-textarea" style={{ minHeight: 120, fontSize: 'var(--text-2xs)' }} value={p.content} onChange={e => { const u = [...prompts]; u[i] = { ...u[i], content: e.target.value }; setForm(f => f ? { ...f, _importedPrompts: u } : f); }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ); })()}

            <div className="st-form-actions" style={{ marginTop: 8 }}>
              <button className="wx-btn" onClick={handleSave}><Save size={14} />保存</button>
              <button className="wx-btn-ghost" onClick={() => { setForm(null); setEditingId(null); }}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SettingsModal({ onClose }: Props) {
  const { settings, updateSettings, chats, createChat, loadChat, deleteChat, activeChatId } = useSillytavern();

  // Working copy for dirty tracking
  const [draft, setDraft] = useState<AppSettings | null>(null);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { if (settings && !draft) setDraft(JSON.parse(JSON.stringify(settings))); }, [settings]);

  const markDirty = useCallback((patch: Partial<AppSettings>) => {
    setDraft(prev => prev ? { ...prev, ...patch } : prev);
    setDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!draft) return;
    await updateSettings(draft);
    setDirty(false);
  }, [draft, updateSettings]);

  const handleClose = useCallback(() => {
    if (dirty) {
      if (confirm('有未保存的更改，是否保存？')) handleSave().then(() => onClose());
      else onClose();
    } else onClose();
  }, [dirty, handleSave, onClose]);

  // ---- Common state ----
  const [section, setSection] = useState<Section>('api');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});
  const [fetchingModels, setFetchingModels] = useState<Record<string, boolean>>({});
  const [models, setModels] = useState<Record<string, string[]>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [newChatName, setNewChatName] = useState('');
  const [tagInput, setTagInput] = useState('');

  const api = draft?.api;
  const savedApis = api?.saved || [];
  const stripTags = draft?.stripTags || [];

  // ---- API helpers ----
  const handleAddApi = () => {
    if (!api) return;
    const newApi: ApiEndpoint = { id: crypto.randomUUID(), name: '新接口', enabled: true, baseUrl: '', apiKey: '', model: '' };
    markDirty({ api: { ...api, saved: [...savedApis, newApi] } });
    setExpandedId(newApi.id);
  };
  const handleUpdateApi = (id: string, patch: Partial<ApiEndpoint>) => {
    if (!api) return;
    markDirty({ api: { ...api, saved: savedApis.map(e => e.id === id ? { ...e, ...patch } : e) } });
  };
  const handleDeleteApi = (id: string) => {
    if (!api) return;
    if (!confirm('确定删除此接口？若其他设置引用了此接口，需重新分配路由。')) return;
    markDirty({ api: { ...api, saved: savedApis.filter(e => e.id !== id), mainRouteId: api.mainRouteId === id ? null : api.mainRouteId, varRouteId: api.varRouteId === id ? null : api.varRouteId, memRouteId: api.memRouteId === id ? null : api.memRouteId, embedRouteId: api.embedRouteId === id ? null : api.embedRouteId } });
  };
  const handleTestApi = async (ep: ApiEndpoint) => {
    setTestStatus(prev => ({ ...prev, [ep.id]: 'testing' }));
    try { const res = await fetch(`${ep.baseUrl}/models`, { headers: { Authorization: `Bearer ${ep.apiKey}` } }); setTestStatus(prev => ({ ...prev, [ep.id]: res.ok ? 'success' : 'error' })); }
    catch { setTestStatus(prev => ({ ...prev, [ep.id]: 'error' })); }
  };
  const handleFetchModels = async (ep: ApiEndpoint) => {
    if (!ep.baseUrl || !ep.apiKey) return;
    setFetchingModels(prev => ({ ...prev, [ep.id]: true }));
    try { const res = await fetch(`${ep.baseUrl}/models`, { headers: { Authorization: `Bearer ${ep.apiKey}` } }); if (res.ok) { const data = await res.json(); setModels(prev => ({ ...prev, [ep.id]: (data.data || []).map((m: Record<string, unknown>) => String(m.id || '')).filter(Boolean).sort() })); } } catch { /* ignore */ }
    setFetchingModels(prev => ({ ...prev, [ep.id]: false }));
  };

  // ---- Feature toggle helpers ----
  const toggleVar = (v: boolean) => markDirty({ varEnabled: v });
  const toggleMem = (v: boolean) => markDirty({ memEnabled: v });
  const setVarPrompt = (v: string) => markDirty({ varPrompt: v });
  const setMemPrompt = (v: string) => markDirty({ memPrompt: v });

  // ---- Archive / Filter ----
  const handleCreateChat = async () => { await createChat(newChatName.trim() || undefined); setNewChatName(''); };
  const handleAddTag = () => { const t = tagInput.trim(); if (!t || stripTags.includes(t)) { setTagInput(''); return; }; markDirty({ stripTags: [...stripTags, t] }); setTagInput(''); };
  const handleRemoveTag = (t: string) => { markDirty({ stripTags: stripTags.filter(x => x !== t) }); };

  const renderPanel = () => {
    // Helper for feature pages
    const FeaturePage = ({ title, desc, enabled, onToggle, routeId, onRouteChange, prompt, onPromptChange, defaultPrompt }: {
      title: string; desc: string; enabled?: boolean; onToggle: (v: boolean) => void;
      routeId: string | null; onRouteChange: (id: string | null) => void;
      prompt?: string; onPromptChange: (v: string) => void; defaultPrompt: string;
    }) => {
      return (
        <div className="st-panel">
          <h2>{title}</h2>
          <p className="st-desc">{desc}</p>

          <div className="st-card">
            <div className="st-feat-row">
              <div><div className="st-feat-label">启用功能</div></div>
              <label className="st-toggle-wrap">
                <input type="checkbox" checked={enabled ?? false} onChange={e => onToggle(e.target.checked)} />
                <span className="st-toggle-track" />
              </label>
            </div>
            <div className="st-feat-row" style={{ marginTop: 12 }}>
              <div><div className="st-feat-label">选择路由</div></div>
              <select className="st-select" value={routeId || ''} onChange={e => onRouteChange(e.target.value || null)}>
                <option value="">未选择</option>
                {savedApis.filter(e => e.enabled).map(e => (
                  <option key={e.id} value={e.id}>{e.name} · {e.model}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="st-card" style={{ marginTop: 10 }}>
            <div className="st-feat-row">
              <h3 style={{ margin: 0 }}>提示词模版</h3>
              <button className="wx-btn-sm wx-btn-outline" onClick={() => onPromptChange(defaultPrompt)}>恢复默认</button>
            </div>
            <textarea className="st-textarea" value={prompt || defaultPrompt} onChange={e => onPromptChange(e.target.value)}
              placeholder="输入系统提示词…" spellCheck={false} />
          </div>
        </div>
      );
    };

    switch (section) {
      case 'api': return (
        <div className="st-panel">
          <div className="st-panel-head"><h2>API 配置</h2><button className="wx-btn" onClick={handleAddApi}><Plus size={14} />新增接口</button></div>
          <p className="st-desc">管理接口库。正文路由在此选择，变量/记忆路由在各自设置页选择。</p>
          <div className="st-card" style={{ marginBottom: 16 }}>
            <div className="st-feat-row">
              <div><div className="st-feat-label">正文路由</div><div className="st-api-detail">选择 AI 生成正文使用的接口</div></div>
              <select className="st-select" value={api?.mainRouteId || ''} onChange={e => markDirty({ api: { ...api!, mainRouteId: e.target.value || null } })}>
                <option value="">未选择</option>
                {savedApis.filter(e => e.enabled).map(e => (<option key={e.id} value={e.id}>{e.name} · {e.model}</option>))}
              </select>
            </div>
          </div>
          {savedApis.length === 0 && <div className="st-empty">暂无接口，请点击"新增接口"</div>}
          {savedApis.map(ep => {
            const isExpanded = expandedId === ep.id;
            const testState = testStatus[ep.id] || 'idle';
            const modelList = models[ep.id] || [];
            return (
              <div key={ep.id} className={`st-api-card-wrap ${isExpanded ? 'expanded' : ''}`}>
                <div className="st-api-collapsed" onClick={() => setExpandedId(isExpanded ? null : ep.id)}>
                  <div className="st-api-collapsed-info">
                    <div className="st-api-name">📡 {ep.name}</div>
                    <div className="st-api-detail">{ep.model || '未配置模型'}</div>
                    <div className="st-api-detail">{ep.baseUrl || '未配置地址'} · 🔑 {ep.apiKey ? ep.apiKey.slice(0,6) + '…' + ep.apiKey.slice(-4) : '未设置'}</div>
                  </div>
                  <div className="st-api-collapsed-right">
                    <div className="st-route-badges">
                      {api?.mainRouteId === ep.id && <span className="st-route-badge main">正文</span>}
                      {api?.varRouteId === ep.id && <span className="st-route-badge var">变量</span>}
                      {api?.memRouteId === ep.id && <span className="st-route-badge mem">记忆</span>}
                    </div>
                    <div className={`st-expand-arrow ${isExpanded ? 'open' : ''}`}><ChevronDown size={16} /></div>
                  </div>
                </div>
                {isExpanded && (
                  <div className="st-api-expanded" onClick={e => e.stopPropagation()}>
                    <div className="st-form">
                      <label className="st-label">接口名称</label>
                      <input className="st-input" value={ep.name} onChange={e => handleUpdateApi(ep.id, { name: e.target.value })} />
                      <label className="st-label">接口地址</label>
                      <input className="st-input" value={ep.baseUrl} onChange={e => handleUpdateApi(ep.id, { baseUrl: e.target.value })} />
                      <label className="st-label">API Key</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input className="st-input" style={{ flex: 1 }} type={showKeys[ep.id] ? 'text' : 'password'} value={ep.apiKey} onChange={e => handleUpdateApi(ep.id, { apiKey: e.target.value })} placeholder="sk-…" />
                        <button className="wx-btn-sm wx-btn-ghost" onClick={() => setShowKeys(p => ({ ...p, [ep.id]: !p[ep.id] }))}>{showKeys[ep.id] ? '隐藏' : '显示'}</button>
                      </div>
                      <div className="st-form-row">
                        <button className="wx-btn-sm wx-btn-outline" onClick={() => handleTestApi(ep)}><Wifi size={12} />{testState === 'testing' ? '测试中…' : testState === 'success' ? '✓ 成功' : testState === 'error' ? '✗ 失败' : '测试连接'}</button>
                        <button className="wx-btn-sm wx-btn-outline" onClick={() => handleFetchModels(ep)} disabled={fetchingModels[ep.id]}>{fetchingModels[ep.id] ? '拉取中…' : '拉取模型'}</button>
                      </div>
                      {modelList.length > 0 && (
                        <div>
                          <label className="st-label" style={{ marginTop: 8 }}>当前模型：{ep.model || '未选择'}</label>
                          <select className="st-select" style={{ width: '100%' }} value={ep.model} onChange={e => handleUpdateApi(ep.id, { model: e.target.value })}>
                            {modelList.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                      )}
                      <button className="wx-btn-sm wx-btn-danger" style={{ marginTop: 8 }} onClick={() => handleDeleteApi(ep.id)}><Trash2 size={12} />删除</button>
                    </div>
                  </div>
                )}
              </div>
            );})}
        </div>
      );

      case 'var': return <FeaturePage title="变量设置" desc="根据剧情摘要更新游戏各面板的变量。" enabled={draft?.varEnabled} onToggle={toggleVar}
        routeId={api?.varRouteId ?? null} onRouteChange={id => { if(api) markDirty({api:{...api,varRouteId:id}}); }}
        prompt={draft?.varPrompt} onPromptChange={setVarPrompt} defaultPrompt={DEFAULT_VAR_PROMPT} />;

      case 'mem': return (
        <div className="st-panel">
          <h2>记忆设置</h2>
          <p className="st-desc">为每轮剧情提取关键词并存储记忆，在后续对话中检索相关记忆。</p>
          <div className="st-card">
            <div className="st-feat-row">
              <div><div className="st-feat-label">启用功能</div></div>
              <label className="st-toggle-wrap">
                <input type="checkbox" checked={draft?.memEnabled ?? false} onChange={e => toggleMem(e.target.checked)} />
                <span className="st-toggle-track" />
              </label>
            </div>
            <div className="st-feat-row" style={{ marginTop: 12 }}>
              <div><div className="st-feat-label">选择路由</div></div>
              <select className="st-select" value={api?.memRouteId || ''} onChange={e => { if(api) markDirty({api:{...api,memRouteId:e.target.value||null}}); }}>
                <option value="">未选择</option>
                {savedApis.filter(e => e.enabled).map(e => (
                  <option key={e.id} value={e.id}>{e.name} · {e.model}</option>
                ))}
              </select>
            </div>
            <div className="st-feat-row" style={{ marginTop: 12 }}>
              <div><div className="st-feat-label">嵌入接口</div><div className="st-api-detail">向量语义搜索。留空使用关键词匹配。</div></div>
              <select className="st-select" value={api?.embedRouteId || ''} onChange={e => { if(api) markDirty({api:{...api,embedRouteId:e.target.value||null}}); }}>
                <option value="">不使用（纯关键词）</option>
                {savedApis.filter(e => e.enabled).map(e => (<option key={e.id} value={e.id}>{e.name}</option>))}
              </select>
            </div>
            {api?.embedRouteId && (
              <div className="st-feat-row" style={{ marginTop: 8 }}>
                <div><div className="st-feat-label">嵌入模型名</div></div>
                <input className="st-input" style={{ width: 220 }} placeholder="如 text-embedding-3-small" value={draft?.embedModel || ''} onChange={e => markDirty({ embedModel: e.target.value })} />
              </div>
            )}
          </div>
          <div className="st-card" style={{ marginTop: 10 }}>
            <div className="st-feat-row">
              <h3 style={{ margin: 0 }}>提示词模版</h3>
              <button className="wx-btn-sm wx-btn-outline" onClick={() => setMemPrompt(DEFAULT_MEM_PROMPT)}>恢复默认</button>
            </div>
            <textarea className="st-textarea" value={draft?.memPrompt || DEFAULT_MEM_PROMPT} onChange={e => setMemPrompt(e.target.value)}
              placeholder="输入系统提示词…" spellCheck={false} />
          </div>
        </div>
      );

      case 'preset': return <PresetPanel />;
      case 'archive': return (
        <div className="st-panel"><h2>存档管理</h2>
          <div className="st-card" style={{ marginBottom: 16 }}><div style={{ display: 'flex', gap: 8 }}><input className="st-input" style={{ flex: 1 }} placeholder="新存档名称…" value={newChatName} onChange={e => setNewChatName(e.target.value)} /><button className="wx-btn" onClick={handleCreateChat}><Plus size={14} />新建</button></div></div>
          {chats.map(c => (<div key={c.id} className={`st-card st-route-card ${activeChatId === c.id ? 'active' : ''}`} onClick={() => { loadChat(c.id); onClose(); }}><div><div className="st-api-name">{c.name}</div><div className="st-api-detail">{c.messages.length} 条消息 · {new Date(c.updatedAt).toLocaleString('zh-CN')}</div></div><button className="wx-btn-sm wx-btn-danger" onClick={e => { e.stopPropagation(); if (confirm('删除？')) deleteChat(c.id); }}><Trash2 size={12} /></button></div>))}
        </div>);

      case 'filter': return (
        <div className="st-panel"><h2>正文过滤</h2><p className="st-desc">这些标签的内容不会在正文中显示。</p>
          <div className="st-card"><div style={{ display: 'flex', gap: 8 }}><input className="st-input" style={{ flex: 1 }} placeholder="标签名…" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleAddTag(); }} /><button className="wx-btn" onClick={handleAddTag}><Plus size={14} />添加</button></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>{stripTags.map(t => (<span key={t} className="st-tag">{t} <button onClick={() => handleRemoveTag(t)}>×</button></span>))}</div></div>
        </div>);
    }
  };

  return (
    <div className="st-root">
      <nav className="st-nav">
        <div className="st-nav-title">设置</div>
        {NAV_ITEMS.map(item => (
          <button key={item.key} className={`st-nav-item ${section === item.key ? 'active' : ''}`} onClick={() => setSection(item.key)}>
            <item.icon size={16} strokeWidth={1.5} /><span>{item.label}</span>
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="st-nav-close" onClick={handleClose}><X size={18} /></button>
      </nav>
      <div className="st-content">
        {/* Save bar */}
        <div className="st-save-bar">
          {dirty && <span className="st-dirty-badge"><AlertCircle size={12} />有未保存的更改</span>}
          <button className={`wx-btn ${dirty ? 'wx-btn-red' : ''}`} onClick={handleSave} disabled={!dirty}>
            <Save size={14} />保存
          </button>
        </div>
        {renderPanel()}
      </div>
    </div>
  );
}
