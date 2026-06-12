// ============================================================
// Tavernlike — Prompt Assembler
// ============================================================

import type {
  ChatMessage, ChatPreset, PromptAssemblyInput,
  PromptAssemblyResult, PromptMessage, PromptOrderItem,
} from './types';
import { matchLorebooks, assembleContext, type MatchResult } from './lorebook-engine';
import { injectVariables, renderVariablesBlock } from './variables';

/**
 * Assemble the full prompt messages for an API call.
 * Respects the preset's prompt_order to determine block ordering.
 */
export function assemblePrompt(input: PromptAssemblyInput): PromptAssemblyResult {
  const {
    userInput, history, preset, lorebooks, userName, characterName, variables,
  } = input;

  // 1. Match lorebooks against the current context
  const contextText = history.map(m => m.content).join('\n') + '\n' + userInput;
  const matches: MatchResult[] = matchLorebooks(lorebooks, contextText);
  const ctx = assembleContext(matches);

  // 2. Build system prompt
  const systemPrompt = buildSystemPrompt({
    preset,
    characterName,
    userName,
    variables,
  });

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

  // Default system prompt
  const charDesc = ctx.characterName || 'Assistant';
  const userDesc = ctx.userName || 'User';

  let prompt = `你是「${charDesc}」，正在与「${userDesc}」互动。\n\n`;

  prompt += `【核心规则】\n`;
  prompt += `1. 始终以角色身份说话，使用古风中文，风格贴近金庸/古龙武侠小说的叙事语气。\n`;
  prompt += `2. 描写要细致但不冗长，注重意境和留白。\n`;
  prompt += `3. 严禁出现现代词汇、网络用语、英文缩写。\n\n`;

  prompt += `【武学境界跨文化命名规则】\n`;
  prompt += `大周十三州的武学境界通用标准为：凡骨→淬体→冲脉→通明→入微→绝顶→宗师→天人。\n`;
  prompt += `但不同地域/国家对同一境界有各自的叫法，你必须根据角色的出身地使用对应称呼：\n`;
  prompt += `- 东瀛（日本）：对应使用日本武道术语（如切纸→目录→免许→皆传→师范→名人→达人→剑圣）\n`;
  prompt += `- 波斯：对应使用波斯/阿拉伯武学体系术语\n`;
  prompt += `- 吐蕃：对应使用藏地密宗修炼体系术语\n`;
  prompt += `- 南洋：对应使用南洋群岛武术流派术语\n`;
  prompt += `- 英吉利：对应使用欧洲骑士/击剑体系术语\n`;
  prompt += `- 高丽：对应使用朝鲜半岛武学体系术语\n`;
  prompt += `当遇到这些地区的角色时，务必使用该地区的境界称呼，而不是大周标准称呼。\n`;
  prompt += `如果世界书条目中只有大周叫法，请自动转换为对应地区的叫法。\n\n`;

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
