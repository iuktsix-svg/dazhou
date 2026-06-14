// ============================================================
// Tavernlike — useSillytavern (main React hook, v3)
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

export function useSillytavern() {
  // ---- State ----
  const [lorebooks, setLorebooks] = useState<Lorebook[]>([]);
  const [presets, setPresets] = useState<ChatPreset[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeLorebookIds, setActiveLorebookIds] = useState<string[]>([]);
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [streamingText, setStreamingText] = useState<string>('');
  const [streamingBlocks, setStreamingBlocks] = useState<ParsedBlock[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);

  const activeChat = useMemo(
    () => chats.find(c => c.id === activeChatId) || null,
    [chats, activeChatId],
  );

  // Ref that always mirrors latest chats — used by sendMessage to avoid stale closure
  const chatsRef = useRef(chats);
  chatsRef.current = chats;

  const abortRef = useRef<AbortController | null>(null);

  // ---- Init ----
  const loadAll = useCallback(async () => {
    setIsLoading(true);
    await initializeDatabase();
    await autoImportLorebooks();
    const [l, s] = await Promise.all([getLorebooks(), getSettings()]);
    let p = await getPresets();
    let c = await getChats();
    setLorebooks(l);
    setPresets(p);
    // Auto-create default settings if none exist
    if (!s) {
      const defaultSettings: AppSettings = {
        id: 'app-settings',
        api: { saved: [], mainRouteId: null, varRouteId: null, memRouteId: null, embedRouteId: null },
        userName: '侠客', characterName: '主角', activeLorebookIds: [], activePresetId: null, uiMode: 'game', customTags: ['maintext', 'option', 'sum', 'vars', 'thinking', 'transition'], stripTags: ['thinking', 'sum', 'transition', 'thinking'], varEnabled: true, memEnabled: true,
        createdAt: Date.now(), updatedAt: Date.now(),
      };
      await saveSettings(defaultSettings);
      setSettings(defaultSettings);
    } else {
      // Auto-patch: migrate old format → new ApiConfig + ensure defaults
      let patched = false;
      if (!s.api.saved) { s.api = { saved: [], mainRouteId: null, varRouteId: null, memRouteId: null, embedRouteId: null }; patched = true; }
      if (!s.customTags || s.customTags.length === 0) {
        s.customTags = ['maintext', 'option', 'sum', 'vars', 'thinking', 'transition'];
        s.stripTags = ['thinking', 'sum', 'transition', 'thinking'];
        patched = true;
      }
      if (patched) { await saveSettings(s); console.log('[init] 已迁移至新接口库格式'); }
      setSettings(s);
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
      setPresets([bp]);
      if (s && !s.activePresetId) { s.activePresetId = 'builtin-dual'; await saveSettings(s); }
    }
    // Auto-patch existing presets: ensure streaming on + adequate max_tokens
    for (const preset of p) {
      let changed = false;
      if (!preset.settings.stream_openai) { preset.settings.stream_openai = true; changed = true; }
      if ((preset.settings.openai_max_tokens || 0) < 4096) { preset.settings.openai_max_tokens = 8192; changed = true; }
      if (changed) { await savePreset(preset); console.log('[init] Patched preset:', preset.name); }
    }
    if (p.some(x => !x.settings.stream_openai || (x.settings.openai_max_tokens||0) < 4096)) {
      setPresets([...p]);
    }
    // Auto-activate all imported lorebooks if none selected
    const activeIds = s?.activeLorebookIds?.length ? s.activeLorebookIds : l.map(b => b.id);
    setActiveLorebookIds(activeIds);
    setChats(c);
    setIsLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ---- Lorebooks ----
  const toggleLorebook = useCallback(async (id: string) => {
    const newIds = activeLorebookIds.includes(id)
      ? activeLorebookIds.filter(i => i !== id)
      : [...activeLorebookIds, id];
    setActiveLorebookIds(newIds);
    setSettings(prev => {
      if (!prev) return prev;
      const updated = { ...prev, activeLorebookIds: newIds };
      saveSettings(updated);
      return updated;
    });
  }, [activeLorebookIds]);

  const handleSaveLorebook = useCallback(async (lb: Lorebook) => {
    await saveLorebook(lb);
    setLorebooks(prev => {
      const idx = prev.findIndex(l => l.id === lb.id);
      return idx >= 0 ? prev.map(l => l.id === lb.id ? lb : l) : [...prev, lb];
    });
  }, []);

  const handleDeleteLorebook = useCallback(async (id: string) => {
    await deleteLorebook(id);
    setLorebooks(prev => prev.filter(l => l.id !== id));
    setActiveLorebookIds(prev => prev.filter(i => i !== id));
  }, []);

  // ---- Presets ----
  const handleSavePreset = useCallback(async (p: ChatPreset) => {
    await savePreset(p);
    setPresets(prev => {
      const idx = prev.findIndex(x => x.id === p.id);
      return idx >= 0 ? prev.map(x => x.id === p.id ? p : x) : [...prev, p];
    });
  }, []);

  const handleDeletePreset = useCallback(async (id: string) => {
    await deletePreset(id);
    setPresets(prev => prev.filter(p => p.id !== id));
  }, []);

  // ---- Settings ----
  const updateSettings = useCallback(async (updates: Partial<AppSettings>) => {
    setSettings(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...updates };
      saveSettings(updated);
      return updated;
    });
  }, []);

  // ---- Chats ----
  const createChat = useCallback(async (name?: string) => {
    if (!settings) throw new Error('Settings not loaded');
    const chatCount = chats.filter(c => c.characterName === settings.characterName).length;
    const chatName = name || `${settings.characterName} - 新对话 ${chatCount + 1}`;
    const newChat: ChatSession = {
      id: crypto.randomUUID(),
      name: chatName,
      messages: [],
      characterName: settings.characterName,
      userName: settings.userName,
      presetId: settings.activePresetId || presets[0]?.id || null,
      lorebookIds: [...activeLorebookIds],
      variables: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveChat(newChat);
    setChats(prev => [...prev, newChat]);
    setActiveChatId(newChat.id);
    return newChat.id;
  }, [settings, chats, presets, activeLorebookIds]);

  const loadChat = useCallback((id: string) => {
    if (activeChatId === id) return;
    setActiveChatId(id);
    setStreamingText('');
    setStreamingBlocks([]);
  }, [activeChatId]);

  const deleteChat = useCallback(async (id: string) => {
    await deleteChatById(id);
    setChats(prev => prev.filter(c => c.id !== id));
    if (activeChatId === id) {
      setActiveChatId(null);
      setStreamingText('');
      setStreamingBlocks([]);
    }
  }, [activeChatId]);

  // ---- Direct state update (for NewGameFlow after DB write) ----
  const setChatMessages = useCallback((chatId: string, messages: ChatMessage[]) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, messages, updatedAt: Date.now() } : c));
  }, []);

  // ---- Variables ----
  const updateVariables = useCallback(async (updates: Record<string, string | number>) => {
    if (!activeChat) return;
    const merged = mergeVariables(activeChat.variables, updates);
    const updatedChat = { ...activeChat, variables: merged, updatedAt: Date.now() };
    await saveChat(updatedChat);
    setChats(prev => prev.map(c => c.id === updatedChat.id ? updatedChat : c));
  }, [activeChat]);

  // ---- Send Message (3-stage pipeline: AI3→AI1→AI2→AI3) ----
  const sendMessage = useCallback(async (content: string, optChat?: ChatSession) => {
    const targetChat = optChat || activeChat;
    if (!settings || !targetChat) throw new Error('No active chat or settings not loaded');
    if (!settings.api.saved || !settings.api.saved.some(e => e.enabled)) throw new Error('请先在设置中配置 API 接口。点击左下角设置 → API 配置 → 新增接口。');

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const signal = abortRef.current.signal;

    setIsSending(true);
    setStreamingText('');
    setStreamingBlocks([]);
    setLastError(null);

    const currentVariables = targetChat.variables || {};
    const api = settings.api;
    const activePreset = presets.find(p => p.id === settings.activePresetId) || presets[0];
    const activeBooks = lorebooks.filter(b => activeLorebookIds.includes(b.id));

    // Save user message immediately
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(), role: 'user', content,
      timestamp: Date.now(), variables: { ...currentVariables },
    };
    const updatedMessages = [...targetChat.messages, userMessage];
    let updatedChat = { ...targetChat, messages: updatedMessages, updatedAt: Date.now() };
    await saveChat(updatedChat);
    setChats(prev => prev.map(c => c.id === updatedChat.id ? updatedChat : c));

    try {
      if (!activePreset) throw new Error('没有可用的预设');

      const ps = activePreset.settings;

      // ============================================================
      // STAGE 0: AI3 — Memory Retrieval
      // ============================================================
      let memoryContext = '';
      if (settings.memEnabled !== false && api.memRouteId && api.saved.some(e => e.id === api.memRouteId && e.enabled)) {
        try {
          const embedApi = api.saved.find(e => e.id === api.embedRouteId);
          const embedCfg = (settings.embedModel && embedApi) ? { baseUrl: embedApi.baseUrl, apiKey: embedApi.apiKey, model: settings.embedModel } : null;
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
        userName: settings.userName,
        characterName: settings.characterName,
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
          setStreamingText(fullText);
          if (settings.uiMode === 'game') {
            const parsed = parseTaggedOutput(fullText, settings.customTags);
            setStreamingBlocks(parsed.blocks);
          }
          if (chunk.done) break;
        }
        rawReply = fullText;
      } else {
        rawReply = await chatCompletions(api1Cfg.baseUrl, api1Cfg.apiKey, body1, signal);
        setStreamingText(rawReply);
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
      if (settings.varEnabled !== false && api.varRouteId && api.saved.some(e => e.id === api.varRouteId && e.enabled) && summaryText) {
        try {
          const api2Cfg = resolveApiConfig('variables', api);
          const varBody = {
            model: api2Cfg.model,
            messages: [
              {
                role: 'system',
                content: (settings?.varPrompt || DEFAULT_VAR_PROMPT) + `\n\n当前变量状态：\n${JSON.stringify(currentVariables, null, 2)}`,
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
      if (settings.memEnabled !== false && api.memRouteId && api.saved.some(e => e.id === api.memRouteId && e.enabled) && summaryText) {
        try {
          const memCfg = resolveApiConfig('memory', api);
          // Ask AI3 to extract keywords from the summary
          const kwBody = {
            model: memCfg.model,
            messages: [
              { role: 'system', content: (settings?.memPrompt || DEFAULT_MEM_PROMPT) },
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
              const embedCfg2 = (settings.embedModel && embedApi2) ? { baseUrl: embedApi2.baseUrl, apiKey: embedApi2.apiKey, model: settings.embedModel } : null;
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
      setChats(prev => prev.map(c => c.id === updatedChat.id ? updatedChat : c));
      console.log('[sendMessage] Done. Msgs:', updatedChat.messages.length);
      setStreamingText('');
      setStreamingBlocks([]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('AbortError') || msg.includes('aborted') || msg === 'Aborted') {
        // User cancelled — not an error
      } else {
        console.error('[sendMessage] Error:', msg);
        setLastError(`请求失败：${msg}`);
      }
    } finally {
      setIsSending(false);
      abortRef.current = null;
    }
  }, [settings, activeChat, presets, lorebooks, activeLorebookIds]);

  // ---- Cancel ----
  const cancelGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  // ---- Edit / Delete / Branch ----
  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!activeChat) return;
    const idx = activeChat.messages.findIndex(m => m.id === messageId);
    if (idx === -1) return;
    if (activeChat.messages[idx].role !== USER_ROLE) return;

    const truncated = truncateChatAt(activeChat, idx, activeChat.messages[idx].variables);
    await saveChat(truncated);
    setChats(prev => prev.map(c => c.id === truncated.id ? truncated : c));
    await sendMessage(newContent);
  }, [activeChat, sendMessage]);

  const deleteMessagesFrom = useCallback(async (messageId: string) => {
    if (!activeChat) return;
    const idx = activeChat.messages.findIndex(m => m.id === messageId);
    if (idx === -1) return;

    const truncated = truncateChatAt(activeChat, idx);
    await saveChat(truncated);
    setChats(prev => prev.map(c => c.id === truncated.id ? truncated : c));
  }, [activeChat]);

  const branchFromMessage = useCallback(async (messageId: string, name?: string) => {
    if (!activeChat || !settings) throw new Error('No active chat');
    const idx = activeChat.messages.findIndex(m => m.id === messageId);
    if (idx === -1) throw new Error('Message not found');

    const branchCount = chats.filter(c => c.characterName === settings.characterName).length;
    const branchName = name || `${settings.characterName} - 分支 ${branchCount + 1}`;
    const newChat = branchChat(activeChat, idx, {
      name: branchName,
      presetId: settings.activePresetId || presets[0]?.id || null,
      lorebookIds: [...activeLorebookIds],
      variables: activeChat.messages[idx].variables,
    } as Partial<ChatSession>);
    await saveChat(newChat as ChatSession);
    setChats(prev => [...prev, newChat as ChatSession]);
    setActiveChatId((newChat as ChatSession).id);
    return (newChat as ChatSession).id;
  }, [activeChat, settings, chats, presets, activeLorebookIds]);

  // ---- Game Mode Helpers ----
  const gameBlocks = useMemo(() => {
    if (!streamingText || settings?.uiMode !== 'game') return null;
    const blocks = streamingBlocks.length > 0
      ? streamingBlocks
      : parseTaggedOutput(streamingText, settings.customTags).blocks;
    return {
      mainText: extractMainText(blocks),
      options: extractOptions(blocks),
      thinking: extractThinking(blocks),
      allBlocks: blocks,
    };
  }, [streamingText, streamingBlocks, settings]);

  return {
    // Data
    lorebooks,
    presets,
    settings,
    activeLorebookIds,
    chats,
    activeChatId,
    activeChat,
    // Status
    isSending,
    isLoading,
    streamingText,
    streamingBlocks,
    gameBlocks,
    lastError,
    clearError: () => setLastError(null),
    // Actions
    loadAll,
    setChats,
    setActiveChatId,
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
