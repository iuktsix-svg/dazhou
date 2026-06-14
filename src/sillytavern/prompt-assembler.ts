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

  // Default system prompt
  const charDesc = ctx.characterName || 'Assistant';
  const userDesc = ctx.userName || 'User';

  let prompt = `你是「${charDesc}」，正在与「${userDesc}」互动。\n\n`;

  prompt += `【核心规则】\n`;
  prompt += `1. 始终以角色身份说话，使用古风中文，风格贴近金庸/古龙武侠小说的叙事语气。\n`;
  prompt += `2. 描写要细致但不冗长，注重意境和留白。\n`;
  prompt += `3. 严禁出现现代词汇、网络用语、英文缩写。\n\n`;

  prompt += `【变量更新规则（严格执行）】\n`;
  prompt += `1. 每轮回复末尾，只输出本轮剧情中实际发生变化的变量。未变化的变量绝对不要输出。\n`;
  prompt += `2. 变量用 <var name="变量名" value="新值" /> 格式输出。\n`;
  prompt += `3. 数值类变量直接赋新值（如银两从10变为9，输出 value="9"，不要输出增量）。\n`;
  prompt += `4. 列表/数组类变量（如随身行囊、追杀榜、江湖人际录），发生变化时输出完整的最终列表，替换旧值。\n`;
  prompt += `5. 物品消耗、银两收支、榜单变动、人物关系变化——这些是最常见的变量更新触发条件。\n`;
  prompt += `6. 如果本轮没有任何变量变化，不输出任何 <var> 标签。\n\n`;

  prompt += `【剧情摘要（必须输出）】\n`;
  prompt += `在每轮回复的最后，必须用 <sum> 标签输出一段本次剧情的摘要。\n`;
  prompt += `摘要要求：\n`;
  prompt += `1. 概括本轮发生的核心事件（地点变化、人物出场/退场、战斗结果、对话结论）\n`;
  prompt += `2. 列出涉及的物品得失（获得/消耗/交易了什么）\n`;
  prompt += `3. 列出涉及的人物关系变化（新增/加深/恶化的人际关系）\n`;
  prompt += `4. 100-200字，纯叙事，不包含变量标签\n`;
  prompt += `格式：<sum>剧情摘要内容</sum>\n`;
  prompt += `此摘要将用于后续的变量更新和记忆存储，请务必认真撰写。\n\n`;

  prompt += `【场景转场】\n`;
  prompt += `当剧情发生时间跳跃或地点转换时，使用 <transition> 标签标记。\n`;
  prompt += `例如：<transition>片刻之后</transition> 或 <transition>翌日清晨 · 洛阳城门</transition>\n`;
  prompt += `转场标签应放在新场景的叙事正文之前。\n\n`;

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
