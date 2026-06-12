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

  const activeChat = useMemo(
    () => chats.find(c => c.id === activeChatId) || null,
    [chats, activeChatId],
  );

  const abortRef = useRef<AbortController | null>(null);

  // ---- Init ----
  const loadAll = useCallback(async () => {
    setIsLoading(true);
    await initializeDatabase();
    await autoImportLorebooks(); // silently import any .json dropped in src/lorebooks/
    const [l, p, s, c] = await Promise.all([
      getLorebooks(), getPresets(), getSettings(), getChats(),
    ]);
    setLorebooks(l);
    setPresets(p);
    setSettings(s || null);
    setActiveLorebookIds(s?.activeLorebookIds || []);
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

  // ---- Variables ----
  const updateVariables = useCallback(async (updates: Record<string, string | number>) => {
    if (!activeChat) return;
    const merged = mergeVariables(activeChat.variables, updates);
    const updatedChat = { ...activeChat, variables: merged, updatedAt: Date.now() };
    await saveChat(updatedChat);
    setChats(prev => prev.map(c => c.id === updatedChat.id ? updatedChat : c));
  }, [activeChat]);

  // ---- Send Message (core) ----
  const sendMessage = useCallback(async (content: string) => {
    if (!settings || !activeChat) {
      throw new Error('No active chat or settings not loaded');
    }

    // Cancel any ongoing stream
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setIsSending(true);
    setStreamingText('');
    setStreamingBlocks([]);

    try {
      const activePreset = presets.find(p => p.id === settings.activePresetId) || presets[0];
      if (!activePreset) throw new Error('No preset available');

      const activeBooks = lorebooks.filter(b => activeLorebookIds.includes(b.id));
      const currentVariables = activeChat.variables || {};

      // Add user message
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: Date.now(),
        variables: { ...currentVariables },
      };

      const updatedMessages = [...activeChat.messages, userMessage];
      let updatedChat = { ...activeChat, messages: updatedMessages, updatedAt: Date.now() };

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
      const nextVariables = mergeVariables(currentVariables, extractedVars);

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
      setStreamingText('');
      setStreamingBlocks([]);
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
    // Actions
    loadAll,
    toggleLorebook,
    updateSettings,
    createChat,
    loadChat,
    deleteChat,
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
