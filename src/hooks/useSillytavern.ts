// ============================================================
// Tavernlike — useSillytavern (main React hook, v3)
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import {
  initializeDatabase,
  getLorebooks, saveLorebook, deleteLorebook,
  getPresets, savePreset, deletePreset,
  getSettings, saveSettings,
  getChats, saveChat, deleteChat as deleteChatById,
  assemblePrompt, truncateChatAt, branchChat,
  extractVariables, mergeVariables,
  chatCompletions, streamChatCompletions,
  parseTaggedOutput, extractMainText, extractOptions, extractThinking,
  USER_ROLE,
  resolveApiConfig,
  retrieveMemories, addMemory, buildMemoryContextBlock,
  type Lorebook, type ChatPreset, type AppSettings,
  type ChatSession, type ChatMessage, type ParsedBlock,
} from '../sillytavern';
import { DEFAULT_VAR_PROMPT, DEFAULT_MEM_PROMPT } from '../data/prompt-defaults';
import { autoImportLorebooks } from '../lorebooks/auto-import';

// ============================================================
// Module-level singleton store — all useSillytavern() calls share this state
// ============================================================
interface StoreState {
  lorebooks: Lorebook[];
  presets: ChatPreset[];
  settings: AppSettings | null;
  activeLorebookIds: string[];
  chats: ChatSession[];
  activeChatId: string | null;
  isSending: boolean;
  isLoading: boolean;
  streamingText: string;
  streamingBlocks: ParsedBlock[];
  lastError: string | null;
  _initDone: boolean;
}

let _store: StoreState = {
  lorebooks: [],
  presets: [],
  settings: null,
  activeLorebookIds: [],
  chats: [],
  activeChatId: null,
  isSending: false,
  isLoading: true,
  streamingText: '',
  streamingBlocks: [],
  lastError: null,
  _initDone: false,
};

const _listeners = new Set<() => void>();
function _notify() { _listeners.forEach(fn => fn()); }
function _getStore(): StoreState { return _store; }
function _subscribe(fn: () => void) { _listeners.add(fn); return () => { _listeners.delete(fn); }; }
function _patchStore(patch: Partial<StoreState>) {
  _store = { ..._store, ...patch };
  _notify();
}

// Refs that always mirror latest store — for sendMessage closure
export const _storeRef = { current: _store };

export function useSillytavern() {
  const store = useSyncExternalStore(_subscribe, _getStore, _getStore);
  _storeRef.current = store;

  const activeChat = useMemo(
    () => store.chats.find(c => c.id === store.activeChatId) || null,
    [store.chats, store.activeChatId],
  );

  // Ref that always mirrors latest store — used by sendMessage to avoid stale closure
  const abortRef = useRef<AbortController | null>(null);

  // ---- Init ----
  const loadAll = useCallback(async () => {
    if (_store._initDone) return;
    _patchStore({ isLoading: true });
    await initializeDatabase();
    await autoImportLorebooks();
    const [l, settingsResult] = await Promise.all([getLorebooks(), getSettings()]);
    let s = settingsResult;
    let p = await getPresets();
    let c = await getChats();
    // Auto-create default settings if none exist
    if (!s) {
      const defaultSettings: AppSettings = {
        id: 'app-settings',
        api: { saved: [], mainRouteId: null, varRouteId: null, memRouteId: null, embedRouteId: null },
        userName: '侠客', characterName: '主角', activeLorebookIds: [], activePresetId: null, uiMode: 'game', customTags: ['maintext', 'option', 'sum', 'vars', 'thinking', 'transition'], stripTags: ['thinking', 'sum', 'transition', 'thinking'], varEnabled: true, memEnabled: true,
        createdAt: Date.now(), updatedAt: Date.now(),
      };
      await saveSettings(defaultSettings);
      s = defaultSettings;
    } else {
      let patched = false;
      if (!s.api.saved) { s.api = { saved: [], mainRouteId: null, varRouteId: null, memRouteId: null, embedRouteId: null }; patched = true; }
      if (!s.customTags || s.customTags.length === 0) {
        s.customTags = ['maintext', 'option', 'sum', 'vars', 'thinking', 'transition'];
        s.stripTags = ['thinking', 'sum', 'transition', 'thinking'];
        patched = true;
      }
      if (patched) { await saveSettings(s); console.log('[init] 已迁移至新接口库格式'); }
      // Auto-seed dev API — localhost + LAN IPs, never in production
      const host = typeof window !== 'undefined' ? window.location.hostname : '';
      const isLocal = host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.');
      if (isLocal && s.api.saved.length === 0) {
        try {
          const seed = await (await fetch('/api-seed.json')).json();
          if (seed?.endpoints?.length) {
            s.api = { ...s.api, saved: seed.endpoints };
            if (seed.mainRouteId) s.api.mainRouteId = seed.mainRouteId;
            if (seed.varRouteId) s.api.varRouteId = seed.varRouteId;
            if (seed.memRouteId) s.api.memRouteId = seed.memRouteId;
            await saveSettings(s);
            console.log('[init] 已注入本地开发 API 配置');
          }
        } catch { /* seed file not found */ }
      }
    }
    // Auto-import / refresh built-in preset
    const builtin = p.find(x => x.id === 'builtin-dual');
    if (!builtin || !builtin._importedPrompts || builtin._importedPrompts.length === 0) {
      if (builtin) { await deletePreset('builtin-dual'); p = p.filter(x => x.id !== 'builtin-dual'); }
      const { BUILTIN_PROMPTS, BUILTIN_TEMP, BUILTIN_MAX_TOKENS, BUILTIN_TOP_P, BUILTIN_SYSTEM_PROMPT } = await import('../data/builtin-prompts');
      const bp: ChatPreset = {
        id: 'builtin-dual', name: '双人成行 V7.1—长风渡',
        settings: {
          temp_openai: BUILTIN_TEMP ?? 0.7, openai_max_tokens: BUILTIN_MAX_TOKENS ?? 4096,
          top_p_openai: BUILTIN_TOP_P ?? 1, freq_pen_openai: 0, pres_pen_openai: 0, stream_openai: true,
        },
        systemPrompt: BUILTIN_SYSTEM_PROMPT, prompt_order: [],
        _importedPrompts: BUILTIN_PROMPTS,
        createdAt: Date.now(), updatedAt: Date.now(),
      };
      await savePreset(bp);
      p = [bp];
      if (s && !s.activePresetId) { s.activePresetId = 'builtin-dual'; await saveSettings(s); }
    }
    for (const preset of p) {
      let changed = false;
      if (!preset.settings.stream_openai) { preset.settings.stream_openai = true; changed = true; }
      if ((preset.settings.openai_max_tokens || 0) < 4096) { preset.settings.openai_max_tokens = 8192; changed = true; }
      if (changed) { await savePreset(preset); console.log('[init] Patched preset:', preset.name); }
    }
    const activeIds = s?.activeLorebookIds?.length ? s.activeLorebookIds : l.map(b => b.id);
    _patchStore({ lorebooks: l, presets: p, settings: s, activeLorebookIds: activeIds, chats: c, isLoading: false, _initDone: true });
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ---- Lorebooks ----
  const toggleLorebook = useCallback(async (id: string) => {
    const newIds = store.activeLorebookIds.includes(id)
      ? store.activeLorebookIds.filter(i => i !== id)
      : [...store.activeLorebookIds, id];
    const updated = store.settings ? { ...store.settings, activeLorebookIds: newIds } : null;
    if (updated) { await saveSettings(updated); _patchStore({ activeLorebookIds: newIds, settings: updated }); }
    else _patchStore({ activeLorebookIds: newIds });
  }, [store.activeLorebookIds, store.settings]);

  const handleSaveLorebook = useCallback(async (lb: Lorebook) => {
    await saveLorebook(lb);
    const idx = store.lorebooks.findIndex(l => l.id === lb.id);
    _patchStore({ lorebooks: idx >= 0 ? store.lorebooks.map(l => l.id === lb.id ? lb : l) : [...store.lorebooks, lb] });
  }, [store.lorebooks]);

  const handleDeleteLorebook = useCallback(async (id: string) => {
    await deleteLorebook(id);
    _patchStore({
      lorebooks: store.lorebooks.filter(l => l.id !== id),
      activeLorebookIds: store.activeLorebookIds.filter(i => i !== id),
    });
  }, [store.lorebooks, store.activeLorebookIds]);

  // ---- Presets ----
  const handleSavePreset = useCallback(async (p: ChatPreset) => {
    await savePreset(p);
    const idx = store.presets.findIndex(x => x.id === p.id);
    _patchStore({ presets: idx >= 0 ? store.presets.map(x => x.id === p.id ? p : x) : [...store.presets, p] });
  }, [store.presets]);

  const handleDeletePreset = useCallback(async (id: string) => {
    await deletePreset(id);
    _patchStore({ presets: store.presets.filter(p => p.id !== id) });
  }, [store.presets]);

  // ---- Settings (now shared across ALL hook instances) ----
  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    const prev = _getStore().settings;
    if (!prev) return;
    const updated = { ...prev, ...updates };
    await saveSettings(updated);
    _patchStore({ settings: updated });
  }, []);

  // ---- Chats ----
  const createChat = useCallback(async (name?: string) => {
    const s = _getStore().settings;
    const ch = _getStore().chats;
    const pr = _getStore().presets;
    const aIds = _getStore().activeLorebookIds;
    if (!s) throw new Error('Settings not loaded');
    const chatCount = ch.filter(c => c.characterName === s.characterName).length;
    const chatName = name || `${s.characterName} - 新对话 ${chatCount + 1}`;
    const newChat: ChatSession = {
      id: crypto.randomUUID(),
      name: chatName,
      messages: [],
      characterName: s.characterName,
      userName: s.userName,
      presetId: s.activePresetId || pr[0]?.id || null,
      lorebookIds: [...aIds],
      variables: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveChat(newChat);
    _patchStore({ chats: [...ch, newChat], activeChatId: newChat.id });
    return newChat.id;
  }, []);

  const loadChat = useCallback((id: string) => {
    if (_getStore().activeChatId === id) return;
    _patchStore({ activeChatId: id, streamingText: '', streamingBlocks: [] });
  }, []);

  const deleteChat = useCallback(async (id: string) => {
    await deleteChatById(id);
    _patchStore({
      chats: _getStore().chats.filter(c => c.id !== id),
      activeChatId: _getStore().activeChatId === id ? null : _getStore().activeChatId,
      streamingText: _getStore().activeChatId === id ? '' : _getStore().streamingText,
      streamingBlocks: _getStore().activeChatId === id ? [] : _getStore().streamingBlocks,
    });
  }, []);

  const setChatMessages = useCallback((chatId: string, messages: ChatMessage[]) => {
    _patchStore({ chats: _getStore().chats.map(c => c.id === chatId ? { ...c, messages, updatedAt: Date.now() } : c) });
  }, []);

  // ---- Variables ----
  const updateVariables = useCallback(async (updates: Record<string, string | number>) => {
    const ac = activeChat;
    if (!ac) return;
    const merged = mergeVariables(ac.variables, updates);
    const updatedChat = { ...ac, variables: merged, updatedAt: Date.now() };
    await saveChat(updatedChat);
    _patchStore({ chats: _getStore().chats.map(c => c.id === updatedChat.id ? updatedChat : c) });
  }, [activeChat]);

  // ---- Send Message (3-stage pipeline: AI3→AI1→AI2→AI3) ----
  const sendMessage = useCallback(async (content: string, optChat?: ChatSession) => {
    const st = _getStore();
    const targetChat = optChat || (st.chats.find(c => c.id === st.activeChatId) || null);
    if (!st.settings || !targetChat) throw new Error('No active chat or settings not loaded');
    if (!st.settings.api.saved || !st.settings.api.saved.some(e => e.enabled)) throw new Error('请先在设置中配置 API 接口。点击左下角设置 → API 配置 → 新增接口。');

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    _patchStore({ isSending: true, streamingText: '', streamingBlocks: [], lastError: null });

    const currentVariables = targetChat.variables || {};
    const api = st.settings.api;
    const activePreset = st.presets.find(p => p.id === st.settings!.activePresetId) || st.presets[0];
    const activeBooks = st.lorebooks.filter(b => st.activeLorebookIds.includes(b.id));

    // Save user message immediately
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(), role: 'user', content,
      timestamp: Date.now(), variables: { ...currentVariables },
    };
    const updatedMessages = [...targetChat.messages, userMessage];
    let updatedChat = { ...targetChat, messages: updatedMessages, updatedAt: Date.now() };
    await saveChat(updatedChat);
    _patchStore({ chats: _getStore().chats.map(c => c.id === updatedChat.id ? updatedChat : c) });

    try {
      if (!activePreset) throw new Error('没有可用的预设');

      const ps = activePreset.settings;

      // ============================================================
      // STAGE 0: AI3 — Memory Retrieval
      // ============================================================
      let memoryContext = '';
      if (st.settings!.memEnabled !== false && api.memRouteId && api.saved.some(e => e.id === api.memRouteId && e.enabled)) {
        try {
          const embedApi = api.saved.find(e => e.id === api.embedRouteId);
          const embedCfg = (st.settings!.embedModel && embedApi) ? { baseUrl: embedApi.baseUrl, apiKey: embedApi.apiKey, model: st.settings!.embedModel } : null;
          const relevantMemories = await retrieveMemories(content, targetChat.id, 5, embedCfg);
          if (relevantMemories.length > 0) {
            memoryContext = buildMemoryContextBlock(relevantMemories);
          }
        } catch (e) { console.warn('[AI3 retrieve] failed:', e); }
      }

      // ============================================================
      // STAGE 1: AI1 — Main Narrative Generation
      // ============================================================
      // Assemble prompt (with memory context injected if available)
      let { messages: promptMessages } = assemblePrompt({
        userInput: content,
        history: updatedMessages,
        preset: activePreset,
        lorebooks: activeBooks,
        userName: st.settings!.userName,
        characterName: st.settings!.characterName,
        variables: currentVariables,
      });

      // Inject memory context into system prompt
      if (memoryContext) {
        const sysIdx = promptMessages.findIndex(m => m.role === 'system');
        if (sysIdx >= 0) {
          promptMessages[sysIdx] = {
            ...promptMessages[sysIdx],
            content: promptMessages[sysIdx].content + '\n\n' + memoryContext,
          };
        }
      }

      const api1Cfg = resolveApiConfig('chat', api);
      const body1: Record<string, unknown> = {
        model: ps.openai_model || api1Cfg.model,
        messages: promptMessages,
      };
      if (ps.temp_openai !== undefined) body1.temperature = ps.temp_openai;
      if (ps.openai_max_tokens !== undefined) body1.max_tokens = ps.openai_max_tokens;
      if (ps.top_p_openai !== undefined) body1.top_p = ps.top_p_openai;
      if (ps.freq_pen_openai !== undefined) body1.frequency_penalty = ps.freq_pen_openai;
      if (ps.pres_pen_openai !== undefined) body1.presence_penalty = ps.pres_pen_openai;

      let rawReply: string;
      if (ps.stream_openai) {
        let fullText = '';
        for await (const chunk of streamChatCompletions(api1Cfg.baseUrl, api1Cfg.apiKey, body1, signal)) {
          if (signal.aborted) break;
          fullText += chunk.delta;
          _patchStore({ streamingText: fullText });
          if (st.settings!.uiMode === 'game') {
            const parsed = parseTaggedOutput(fullText, st.settings!.customTags);
            _patchStore({ streamingBlocks: parsed.blocks });
          }
          if (chunk.done) break;
        }
        rawReply = fullText;
      } else {
        rawReply = await chatCompletions(api1Cfg.baseUrl, api1Cfg.apiKey, body1, signal);
        _patchStore({ streamingText: rawReply });
      }

      if (signal.aborted) throw new Error('Aborted');

      // Extract <sum> block for AI2 and AI3. If missing, use last 500 chars as fallback.
      let narrativeText = rawReply;
      let summaryText = '';
      const sumMatch = rawReply.match(/<sum>([\s\S]*?)<\/sum>/i);
      if (sumMatch) {
        summaryText = sumMatch[1].trim();
        narrativeText = rawReply.replace(/<sum>[\s\S]*?<\/sum>/gi, '').trim();
      } else {
        // No <sum> — use the last ~500 chars of narrative as summary
        const cleaned = narrativeText.replace(/<maintext>/gi,'').replace(/<\/maintext>/gi,'').replace(/<option>[\s\S]*?<\/option>/gi,'').replace(/<var\s[^>]*\/>/gi,'').replace(/<thinking>[\s\S]*?<\/thinking>/gi,'');
        summaryText = cleaned.slice(-500).trim();
      }

      // Extract variables from AI1's reply (may contain <var> tags too)
      const { cleanedText: reply, updates: ai1Vars } = extractVariables(narrativeText);
      let nextVariables = mergeVariables(currentVariables, ai1Vars);

      // ============================================================
      // STAGE 2: AI2 — Dedicated Variable Processing
      // ============================================================
      if (st.settings!.varEnabled !== false && api.varRouteId && api.saved.some(e => e.id === api.varRouteId && e.enabled) && summaryText) {
        try {
          const api2Cfg = resolveApiConfig('variables', api);
          const varBody = {
            model: api2Cfg.model,
            messages: [
              {
                role: 'system',
                content: (st.settings!.varPrompt || DEFAULT_VAR_PROMPT) + `\n\n当前变量状态：\n${JSON.stringify(currentVariables, null, 2)}`,
              },
              {
                role: 'user',
                content: `剧情摘要：${summaryText}\n\n请输出需要更新的 <var> 标签。`,
              },
            ],
            temperature: 0.1,
            max_tokens: 2000,
          };
          const varReply = await chatCompletions(api2Cfg.baseUrl, api2Cfg.apiKey, varBody, signal);
          const { updates: ai2Vars } = extractVariables(varReply);
          nextVariables = mergeVariables(nextVariables, ai2Vars);
          console.log('[AI2] Variables updated:', Object.keys(ai2Vars).length, 'keys');
        } catch (e) { console.warn('[AI2] Variable update failed:', e); }
      }

      // ============================================================
      // STAGE 3: AI3 — Memory Storage
      // ============================================================
      if (st.settings!.memEnabled !== false && api.memRouteId && api.saved.some(e => e.id === api.memRouteId && e.enabled) && summaryText) {
        try {
          const memCfg = resolveApiConfig('memory', api);
          // Ask AI3 to extract keywords from the summary
          const kwBody = {
            model: memCfg.model,
            messages: [
              { role: 'system', content: (st.settings!.memPrompt || DEFAULT_MEM_PROMPT) },
              { role: 'user', content: `剧情摘要：${summaryText}` },
            ],
            temperature: 0.1, max_tokens: 300,
          };
          const kwReply = await chatCompletions(memCfg.baseUrl, memCfg.apiKey, kwBody, signal);
          try {
            const kwJson = JSON.parse(kwReply.match(/\{[\s\S]*\}/)?.[0] || '{}');
            const keywords: string[] = kwJson.keywords || [];
            if (keywords.length > 0) {
              const embedApi2 = api.saved.find(e => e.id === api.embedRouteId);
              const embedCfg2 = (st.settings!.embedModel && embedApi2) ? { baseUrl: embedApi2.baseUrl, apiKey: embedApi2.apiKey, model: st.settings!.embedModel } : null;
              await addMemory(summaryText, keywords, targetChat.id, embedCfg2);
              console.log('[AI3] Memory stored:', keywords.slice(0, 5).join(', '));
            }
          } catch { /* JSON parse failed */ }
        } catch (e) { console.warn('[AI3] Memory storage failed:', e); }
      }

      // ============================================================
      // Final: Persist assistant reply
      // ============================================================
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
        variables: { ...nextVariables },
      };

      updatedChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, assistantMessage],
        variables: nextVariables,
      };
      await saveChat(updatedChat);
      _patchStore({ chats: _getStore().chats.map(c => c.id === updatedChat.id ? updatedChat : c) });
      console.log('[sendMessage] Done. Msgs:', updatedChat.messages.length);
      _patchStore({ streamingText: '', streamingBlocks: [] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes('AbortError') && !msg.includes('aborted') && msg !== 'Aborted') {
        console.error('[sendMessage] Error:', msg);
        _patchStore({ lastError: `请求失败：${msg}` });
      }
    } finally {
      _patchStore({ isSending: false });
      abortRef.current = null;
    }
  }, []);

  // ---- Cancel ----
  const cancelGeneration = useCallback(() => { abortRef.current?.abort(); }, []);

  // ---- Edit / Delete / Branch ----
  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    const ac = _getStore().chats.find(c => c.id === _getStore().activeChatId);
    if (!ac) return;
    const idx = ac.messages.findIndex(m => m.id === messageId);
    if (idx === -1 || ac.messages[idx].role !== USER_ROLE) return;
    const truncated = truncateChatAt(ac, idx, ac.messages[idx].variables);
    await saveChat(truncated);
    _patchStore({ chats: _getStore().chats.map(c => c.id === truncated.id ? truncated : c) });
    await sendMessage(newContent);
  }, [sendMessage]);

  const deleteMessagesFrom = useCallback(async (messageId: string) => {
    const ac = _getStore().chats.find(c => c.id === _getStore().activeChatId);
    if (!ac) return;
    const idx = ac.messages.findIndex(m => m.id === messageId);
    if (idx === -1) return;
    const truncated = truncateChatAt(ac, idx);
    await saveChat(truncated);
    _patchStore({ chats: _getStore().chats.map(c => c.id === truncated.id ? truncated : c) });
  }, []);

  const branchFromMessage = useCallback(async (messageId: string, name?: string) => {
    const st = _getStore();
    const ac = st.chats.find(c => c.id === st.activeChatId);
    if (!ac || !st.settings) throw new Error('No active chat');
    const idx = ac.messages.findIndex(m => m.id === messageId);
    if (idx === -1) throw new Error('Message not found');
    const branchCount = st.chats.filter(c => c.characterName === st.settings!.characterName).length;
    const branchName = name || `${st.settings!.characterName} - 分支 ${branchCount + 1}`;
    const newChat = branchChat(ac, idx, {
      name: branchName,
      presetId: st.settings.activePresetId || st.presets[0]?.id || null,
      lorebookIds: [...st.activeLorebookIds],
      variables: ac.messages[idx].variables,
    } as Partial<ChatSession>);
    await saveChat(newChat as ChatSession);
    _patchStore({ chats: [...st.chats, newChat as ChatSession], activeChatId: (newChat as ChatSession).id });
    return (newChat as ChatSession).id;
  }, []);

  // ---- Game Mode Helpers ----
  const gameBlocks = useMemo(() => {
    if (!store.streamingText || store.settings?.uiMode !== 'game') return null;
    const blocks = store.streamingBlocks.length > 0
      ? store.streamingBlocks
      : parseTaggedOutput(store.streamingText, store.settings.customTags).blocks;
    return {
      mainText: extractMainText(blocks),
      options: extractOptions(blocks),
      thinking: extractThinking(blocks),
      allBlocks: blocks,
    };
  }, [store.streamingText, store.streamingBlocks, store.settings]);

  return {
    lorebooks: store.lorebooks,
    presets: store.presets,
    settings: store.settings,
    activeLorebookIds: store.activeLorebookIds,
    chats: store.chats,
    activeChatId: store.activeChatId,
    activeChat,
    isSending: store.isSending,
    isLoading: store.isLoading,
    streamingText: store.streamingText,
    streamingBlocks: store.streamingBlocks,
    gameBlocks,
    lastError: store.lastError,
    clearError: () => _patchStore({ lastError: null }),
    loadAll,
    setChats: (chats: ChatSession[]) => _patchStore({ chats }),
    setActiveChatId: (id: string | null) => _patchStore({ activeChatId: id }),
    toggleLorebook,
    updateSettings,
    createChat,
    loadChat,
    deleteChat,
    setChatMessages,
    sendMessage,
    cancelGeneration,
    updateVariables,
    editMessage,
    deleteMessagesFrom,
    branchFromMessage,
    saveLorebook: handleSaveLorebook,
    deleteLorebook: handleDeleteLorebook,
    savePreset: handleSavePreset,
    deletePreset: handleDeletePreset,
  };
}
