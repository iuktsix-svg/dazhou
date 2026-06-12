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
  type Lorebook, type ChatPreset, type AppSettings,
  type ChatSession, type ChatMessage, type ParsedBlock,
} from '../sillytavern';
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
    await autoImportLorebooks(); // silently import any .json dropped in src/lorebooks/
    const [l, p, s] = await Promise.all([getLorebooks(), getPresets(), getSettings()]);
    let c = await getChats();
    setLorebooks(l);
    setPresets(p);
    // Auto-create default settings if none exist
    if (!s) {
      const defaultSettings: AppSettings = {
        id: 'app-settings',
        api: { primary: { enabled: false, baseUrl: '', apiKey: '', model: '' }, secondary: { enabled: false, baseUrl: '', apiKey: '', model: '' }, memory: { enabled: false, baseUrl: '', apiKey: '', model: '' } },
        userName: '侠客', characterName: '主角', activeLorebookIds: [], activePresetId: null, uiMode: 'game', customTags: [], stripTags: [],
        createdAt: Date.now(), updatedAt: Date.now(),
      };
      await saveSettings(defaultSettings);
      setSettings(defaultSettings);
    } else {
      setSettings(s);
    }
    // Auto-create default preset if none exist (needed for sendMessage to work)
    if (p.length === 0) {
      const { createDefaultPreset } = await import('../sillytavern/editor-utils');
      const dp: ChatPreset = { id: crypto.randomUUID(), createdAt: Date.now(), updatedAt: Date.now(), ...createDefaultPreset() };
      await savePreset(dp);
      setPresets([dp]);
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

  // ---- Send Message (core) ----
  const sendMessage = useCallback(async (content: string, optChat?: ChatSession) => {
    // Resolve target chat: prefer optChat (passed explicitly, avoids stale closure),
    // fall back to activeChat from state (for normal usage)
    const targetChat = optChat || activeChat;

    if (!settings || !targetChat) {
      throw new Error('No active chat or settings not loaded');
    }

    // Cancel any ongoing stream
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsSending(true);
    setStreamingText('');
    setStreamingBlocks([]);

    setLastError(null);

    // ---- Step 1: Save user message immediately (before any API work) ----
    const currentVariables = targetChat.variables || {};
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
      variables: { ...currentVariables },
    };
    const updatedMessages = [...targetChat.messages, userMessage];
    let updatedChat = { ...targetChat, messages: updatedMessages, updatedAt: Date.now() };
    await saveChat(updatedChat);
    setChats(prev => prev.map(c => c.id === updatedChat.id ? updatedChat : c));

    // ---- Step 2: API call (may fail — user message is already persisted) ----
    try {
      const activePreset = presets.find(p => p.id === settings.activePresetId) || presets[0];
      if (!activePreset) throw new Error('没有可用的预设，请先创建一个预设。');

      const activeBooks = lorebooks.filter(b => activeLorebookIds.includes(b.id));

      // Assemble prompt
      const { messages: promptMessages } = assemblePrompt({
        userInput: content,
        history: updatedMessages,
        preset: activePreset,
        lorebooks: activeBooks,
        userName: settings.userName,
        characterName: settings.characterName,
        variables: currentVariables,
      });

      // Resolve API endpoint for chat
      const apiCfg = resolveApiConfig('chat', settings.api);

      // Build request body
      const requestBody: Record<string, unknown> = {
        model: activePreset.settings.openai_model || apiCfg.model,
        messages: promptMessages,
      };
      const ps = activePreset.settings;
      if (ps.temp_openai !== undefined) requestBody.temperature = ps.temp_openai;
      if (ps.openai_max_tokens !== undefined) requestBody.max_tokens = ps.openai_max_tokens;
      if (ps.top_p_openai !== undefined) requestBody.top_p = ps.top_p_openai;
      if (ps.freq_pen_openai !== undefined) requestBody.frequency_penalty = ps.freq_pen_openai;
      if (ps.pres_pen_openai !== undefined) requestBody.presence_penalty = ps.pres_pen_openai;

      let rawReply: string;

      if (ps.stream_openai) {
        // ---- Streaming ----
        let fullText = '';
        for await (const chunk of streamChatCompletions(
          apiCfg.baseUrl, apiCfg.apiKey, requestBody, abortRef.current.signal,
        )) {
          fullText += chunk.delta;
          setStreamingText(fullText);

          // Parse blocks in game mode
          if (settings.uiMode === 'game') {
            const parsed = parseTaggedOutput(fullText, settings.customTags);
            setStreamingBlocks(parsed.blocks);
          }

          if (chunk.done) break;
        }
        rawReply = fullText;
      } else {
        // ---- Non-streaming ----
        rawReply = await chatCompletions(
          apiCfg.baseUrl, apiCfg.apiKey, requestBody, abortRef.current.signal,
        );
        setStreamingText(rawReply);
      }

      // Extract variables from reply
      const { cleanedText: reply, updates: extractedVars } = extractVariables(rawReply);
      let nextVariables = mergeVariables(currentVariables, extractedVars);

      // ---- Secondary API: validate/process variables ----
      if (settings.api.secondary?.enabled && Object.keys(extractedVars).length > 0) {
        try {
          const varApiCfg = resolveApiConfig('variables', settings.api);
          const varBody = {
            model: varApiCfg.model,
            messages: [
              { role: 'system', content: '你是一个变量校验系统。根据当前的变量状态和剧情变化，校验并返回更新后的变量。以 JSON 格式回复：{"variables": {"key": value, ...}}。只修改需要变更的变量。' },
              { role: 'user', content: `当前变量：${JSON.stringify(currentVariables)}\n剧情更新：${rawReply.slice(0, 2000)}\n提取到的变量变更：${JSON.stringify(extractedVars)}\n请校验并返回最终变量状态。` },
            ],
            temperature: 0.1, max_tokens: 1000,
          };
          const varReply = await chatCompletions(varApiCfg.baseUrl, varApiCfg.apiKey, varBody, abortRef.current?.signal);
          try {
            const jsonMatch = varReply.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const validated = JSON.parse(jsonMatch[0]);
              if (validated.variables) {
                nextVariables = mergeVariables(nextVariables, validated.variables);
              }
            }
          } catch { /* JSON parse failed, keep extracted vars */ }
        } catch { /* secondary API failed, keep extracted vars */ }
      }

      // ---- Memory API: compress long conversations ----
      let finalMessages = [...updatedChat.messages];
      if (settings.api.memory?.enabled && finalMessages.length > 16) {
        try {
          const memApiCfg = resolveApiConfig('memory', settings.api);
          const historySummary = finalMessages.slice(0, -8).map(m => `${m.role}: ${m.content.slice(0, 200)}`).join('\n');
          const memBody = {
            model: memApiCfg.model,
            messages: [
              { role: 'system', content: '你是一个记忆压缩系统。将以下对话历史压缩为一段简洁的叙事总结，保留关键事件、人物关系和变量变化。200字以内。' },
              { role: 'user', content: historySummary },
            ],
            temperature: 0.3, max_tokens: 500,
          };
          const memReply = await chatCompletions(memApiCfg.baseUrl, memApiCfg.apiKey, memBody, abortRef.current?.signal);
          // Insert memory summary as system message
          const memMsg: ChatMessage = {
            id: crypto.randomUUID(), role: 'system',
            content: `[记忆摘要] ${memReply}`,
            timestamp: Date.now(), variables: {},
          };
          const recentMsgs = finalMessages.slice(-8);
          finalMessages = [memMsg, ...recentMsgs];
        } catch { /* memory API failed, keep full history */ }
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: reply,
        timestamp: Date.now(),
        variables: { ...nextVariables },
      };

      updatedChat = {
        ...updatedChat,
        messages: [...finalMessages, assistantMessage],
        variables: nextVariables,
      };
      await saveChat(updatedChat);
      setChats(prev => prev.map(c => c.id === updatedChat.id ? updatedChat : c));
      setStreamingText('');
      setStreamingBlocks([]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('AbortError') || msg.includes('aborted')) {
        // User cancelled — not an error
      } else if (msg.includes('API error') || msg.includes('fetch')) {
        setLastError(`API 请求失败：${msg}`);
      } else {
        setLastError(`发送失败：${msg}`);
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
