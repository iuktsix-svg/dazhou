// ============================================================
// Tavernlike — Prompt Assembler
// ============================================================

import type {
  ChatMessage, ChatPreset, PromptAssemblyInput,
  PromptAssemblyResult, PromptMessage, PromptOrderItem,
} from './types';
import {
  matchLorebooks, assembleContext, createLorebookSession,
  type MatchResult, type LorebookSessionOptions,
} from './lorebook-engine';
import { injectVariables, renderVariablesBlock } from './variables';

/**
 * Assemble the full prompt messages for an API call.
 * Respects the preset's prompt_order to determine block ordering.
 *
 * If `lorebookSession` is provided, uses stateful matching with
 * cooldown/sticky/group-scoring support.
 * If `maxContextChars` is provided, caps total injected content.
 */
export function assemblePrompt(input: PromptAssemblyInput): PromptAssemblyResult {
  const {
    userInput, history, preset, lorebooks, userName, characterName, variables,
    lorebookSession, maxContextChars,
  } = input;

  // 1. Match lorebooks against the current context
  const contextText = history.map(m => m.content).join('\n') + '\n' + userInput;
  let matches: MatchResult[];
  if (lorebookSession) {
    // Stateful matching with cooldown/sticky/group/token-budget
    lorebookSession.advanceTurn();
    matches = lorebookSession.matchLorebooks(lorebooks, contextText);
  } else {
    // Stateless fallback
    matches = matchLorebooks(lorebooks, contextText);
    // Apply simple token budget if specified
    if (maxContextChars && maxContextChars > 0) {
      let total = 0;
      matches = matches.filter(m => {
        total += m.entry.content.length;
        return total <= maxContextChars;
      });
    }
  }
  const ctx = assembleContext(matches);

  // 2. Build system prompt
  let systemPrompt = buildSystemPrompt({
    preset,
    characterName,
    userName,
    variables,
  });

  // 2.5 Inject enabled preset entries into system prompt
  const importedEntries = (preset as ChatPreset & { _importedPrompts?: { name: string; role: string; content: string; enabled: boolean }[] })._importedPrompts;
  const extraMessages: PromptMessage[] = [];
  if (importedEntries) {
    for (const entry of importedEntries) {
      if (!entry.enabled || !entry.content?.trim()) continue;
      if (entry.role === 'system') {
        systemPrompt += '\n\n' + entry.content;
      } else if (entry.role === 'user' || entry.role === 'assistant') {
        extraMessages.push({ role: entry.role, content: entry.content });
      }
    }
  }

  // 3. Build messages according to prompt_order
  const order = preset.prompt_order?.length ? preset.prompt_order : getDefaultOrder();
  const messages = buildMessagesByOrder({
    order,
    systemPrompt,
    history,
    userInput,
    characterName,
    userName,
    variables,
    preset,
    lorebookCtx: ctx,
  });

  // Insert extra preset messages before the last user message
  if (extraMessages.length > 0) {
    const lastUserIdx = messages.map((m, i) => m.role === 'user' ? i : -1).filter(i => i >= 0).pop();
    const insertAt = lastUserIdx !== undefined ? lastUserIdx : messages.length;
    messages.splice(insertAt, 0, ...extraMessages);
  }

  // Append <sum> requirement to user message
  const lastMsg = messages[messages.length - 1];
  if (lastMsg && lastMsg.role === 'user') {
    lastMsg.content += '\n\n[系统指令：请在回复末尾用 <sum>标签</sum> 输出本次剧情摘要，100-200字。]';
  }

  return {
    messages,
    injectedEntries: matches.map(m => m.entry),
    systemPrompt,
  };
}

function getDefaultOrder(): PromptOrderItem[] {
  return [
    { id: 'system', label: '系统提示词', enabled: true, order: 0 },
    { id: 'lorebook', label: '世界书上下文', enabled: true, order: 1 },
    { id: 'chat_history', label: '对话历史', enabled: true, order: 2 },
    { id: 'user_input', label: '用户输入', enabled: true, order: 3 },
  ];
}

interface BuildContext {
  order: PromptOrderItem[];
  systemPrompt: string;
  history: ChatMessage[];
  userInput: string;
  characterName: string;
  userName: string;
  variables: Record<string, string | number>;
  preset: ChatPreset;
  lorebookCtx: {
    beforeChar: string;
    afterChar: string;
    beforeSystem: string;
    afterSystem: string;
  };
}

function buildMessagesByOrder(ctx: BuildContext): PromptMessage[] {
  const messages: PromptMessage[] = [];
  const enabledBlocks = ctx.order
    .filter(item => item.enabled)
    .sort((a, b) => a.order - b.order);

  for (const block of enabledBlocks) {
    switch (block.id) {
      case 'system': {
        messages.push({ role: 'system', content: ctx.systemPrompt });
        break;
      }
      case 'lorebook': {
        const lbContent = [
          ctx.lorebookCtx.beforeSystem,
          ctx.lorebookCtx.afterSystem,
        ].filter(Boolean).join('\n\n');
        if (lbContent) {
          // Insert lorebook as additional system context or standalone
          // If we already have a system message, prepend to it
          const sysIdx = messages.findIndex(m => m.role === 'system');
          if (sysIdx >= 0) {
            messages[sysIdx].content = lbContent + '\n\n' + messages[sysIdx].content;
          } else {
            messages.push({ role: 'system', content: lbContent });
          }
        }
        break;
      }
      case 'chat_history': {
        // Include history messages (excluding the last user message which will be added separately)
        const historyMsgs = ctx.history.slice(0, -1); // exclude current user message
        for (const msg of historyMsgs) {
          if (msg.role === 'system') continue; // skip history system messages
          messages.push({ role: msg.role, content: msg.content });
        }
        break;
      }
      case 'user_input': {
        // Add the current user input with lorebook context
        let userContent = ctx.userInput;
        if (ctx.lorebookCtx.beforeChar) {
          userContent = ctx.lorebookCtx.beforeChar + '\n\n' + userContent;
        }
        if (ctx.lorebookCtx.afterChar) {
          userContent = userContent + '\n\n' + ctx.lorebookCtx.afterChar;
        }
        messages.push({ role: 'user', content: userContent });
        break;
      }
      default: {
        // Custom block — handle as template
        const customContent = buildCustomBlock(block.id, ctx);
        if (customContent) {
          messages.push({ role: 'system', content: customContent });
        }
        break;
      }
    }
  }

  return messages;
}

function buildSystemPrompt(ctx: Pick<BuildContext, 'preset' | 'characterName' | 'userName' | 'variables'>): string {
  // Use preset's system prompt or build default
  if (ctx.preset.systemPrompt) {
    return injectVariables(ctx.preset.systemPrompt, ctx.variables);
  }

  // Default system prompt — kept lean; detailed rules live in world book constant entries
  const charDesc = ctx.characterName || 'Assistant';
  const userDesc = ctx.userName || 'User';

  let prompt = `你是「${charDesc}」，正在与「${userDesc}」互动。\n\n`;

  prompt += `【核心规则】\n`;
  prompt += `1. 始终以角色身份说话，使用古风中文，风格贴近金庸/古龙武侠小说的叙事语气。\n`;
  prompt += `2. 描写要细致但不冗长，注重意境和留白。\n`;
  prompt += `3. 严禁出现现代词汇、网络用语、英文缩写。\n\n`;

  prompt += `【输出格式（必须遵守）】\n`;
  prompt += `1. 正文用 <maintext>...</maintext> 包裹。\n`;
  prompt += `2. 每轮提供 3-4 个行动选项，用 <option>选项描述</option> 包裹。\n`;
  prompt += `3. 变量变化用 <var name="变量名" value="新值" /> 输出（不变则不输出）。\n`;
  prompt += `4. 剧情摘要用 <sum>...</sum> 输出（100-200字）。\n`;
  prompt += `5. 场景转场用 <transition>...</transition> 标记。\n`;
  prompt += `详细的变量规则、UI交互规范、世界运作法则，请严格遵循世界书中的系统规则条目。\n\n`;

  // Inject variables block
  const varsBlock = renderVariablesBlock(ctx.variables);
  if (varsBlock) {
    prompt += `【当前状态变量】\n${varsBlock}\n`;
  }

  return prompt;
}

function buildCustomBlock(blockId: string, ctx: BuildContext): string {
  // Handle custom prompt templates from preset
  const templates: Record<string, string | undefined> = {
    systemPrompt: ctx.preset.systemPrompt,
    userPrompt: ctx.preset.userPrompt,
    assistantPrompt: ctx.preset.assistantPrompt,
  };
  const template = templates[blockId];
  if (template) {
    return injectVariables(template, ctx.variables);
  }
  return '';
}

/**
 * Truncate chat at a given message index (exclusive).
 * Used for edit/delete operations.
 */
export function truncateChatAt<T extends { messages: ChatMessage[]; variables?: Record<string, string | number> }>(
  chat: T,
  index: number,
  variables?: Record<string, string | number>,
): T {
  const messages = chat.messages.slice(0, index);
  return {
    ...chat,
    messages,
    variables: variables ?? chat.messages[index]?.variables ?? {},
  } as T;
}

/**
 * Branch a chat from a given message index.
 * Creates a new chat with messages up to (and including) that index.
 */
export function branchChat<T extends { messages: ChatMessage[]; id: string }>(
  chat: T,
  index: number,
  overrides: Partial<T> & { variables?: Record<string, string | number> },
): T {
  const messages = chat.messages.slice(0, index + 1);
  return {
    ...chat,
    ...overrides,
    id: crypto.randomUUID(),
    messages,
  } as T;
}
