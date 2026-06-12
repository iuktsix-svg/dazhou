// ============================================================
// Tavernlike — Full Type Definitions
// ============================================================

// ---- Lorebook / World Info ----

export interface LorebookEntry {
  id: string;
  lorebookId: string;
  keys: string[];              // primary trigger keywords
  secondaryKeys: string[];     // secondary keywords (selective logic)
  content: string;             // injected context text
  enabled: boolean;
  priority: number;            // higher = injected closer to top
  position: 'before_char' | 'after_char' | 'before_system' | 'after_system';
  constant: boolean;           // always inject regardless of key match
  caseSensitive: boolean;
  useRegex: boolean;
  order: number;               // relative order within same priority
  // selective logic: AND — all secondary keys must match; OR — any secondary key
  selectiveLogic: 'AND' | 'OR';
  // extended metadata (imported from SillyTavern JSON)
  comment?: string;
  insertionOrder?: number;
}

export interface Lorebook {
  id: string;
  name: string;
  description?: string;
  entries: LorebookEntry[];
  createdAt: number;
  updatedAt: number;
}

// ---- Chat Preset ----

export interface ChatPreset {
  id: string;
  name: string;
  settings: PresetSettings;
  // Custom prompt templates
  systemPrompt?: string;       // overrides default "You are {{char}}..."
  userPrompt?: string;         // template for user messages
  assistantPrompt?: string;    // template prefix for assistant
  // Block ordering
  prompt_order: PromptOrderItem[];
  createdAt: number;
  updatedAt: number;
}

export interface PresetSettings {
  // Model
  openai_model?: string;
  // Sampling parameters
  temp_openai?: number;        // temperature 0-2
  openai_max_tokens?: number;  // max response tokens
  top_p_openai?: number;
  freq_pen_openai?: number;    // frequency penalty
  pres_pen_openai?: number;    // presence penalty
  // Streaming
  stream_openai?: boolean;
  // Additional OpenAI params
  top_k_openai?: number;
  repeat_pen_openai?: number;
  min_p_openai?: number;
  top_a_openai?: number;
  // Token management
  max_context?: number;        // max context window
  max_prompt_tokens?: number;
}

export interface PromptOrderItem {
  id: string;                   // e.g. 'system', 'lorebook', 'chat_history', 'user_input'
  label: string;
  enabled: boolean;
  order: number;
}

// ---- App Settings ----

export interface ApiEndpoint {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface ApiConfig {
  primary: ApiEndpoint;    // 正文生成
  secondary: ApiEndpoint;  // 变量更新 (JSON Patch)
  memory: ApiEndpoint;     // 记忆总结 (长对话压缩)
}

export interface AppSettings {
  id: string;                   // always 'app-settings' (singleton)
  api: ApiConfig;
  userName: string;
  characterName: string;
  activeLorebookIds: string[];
  activePresetId: string | null;
  uiMode: 'chat' | 'game';
  customTags: string[];         // e.g. ['maintext', 'option', 'sum', 'vars', 'thinking', 'think']
  gameSettings?: GameSettings;
  createdAt: number;
  updatedAt: number;
}

export interface GameSettings {
  autoContinue?: boolean;       // auto-send "继续" on empty option
  showThinking?: boolean;       // fold thinking blocks
  historyStyle?: 'drawer' | 'inline';
}

// ---- Chat Session ----

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  characterName: string;
  userName: string;
  presetId: string | null;
  lorebookIds: string[];
  variables: Record<string, string | number>;
  createdAt: number;
  updatedAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  variables: Record<string, string | number>;  // variable snapshot at this turn
}

// ---- Variable System ----

export interface VariableExtraction {
  cleanedText: string;          // text with <var> tags removed
  updates: Record<string, string | number>;
  rawBlocks: VariableBlock[];
}

export interface VariableBlock {
  name: string;
  value: string;
  raw: string;                  // the original XML string
}

// ---- Prompt Assembly ----

export interface PromptAssemblyInput {
  userInput: string;
  history: ChatMessage[];
  preset: ChatPreset;
  lorebooks: Lorebook[];
  userName: string;
  characterName: string;
  variables: Record<string, string | number>;
}

export interface PromptAssemblyResult {
  messages: PromptMessage[];
  injectedEntries: LorebookEntry[];
  systemPrompt: string;
}

export interface PromptMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// ---- Streaming ----

export interface StreamChunk {
  raw: string;                  // raw SSE line
  delta: string;                // content delta
  done: boolean;
  finishReason?: string;
}

export interface ParseResult {
  blocks: ParsedBlock[];
  rawText: string;
}

export interface ParsedBlock {
  tag: string;                  // e.g. 'maintext', 'option', 'thinking'
  content: string;
  attributes: Record<string, string>;
}

// ---- API Routing ----

export interface RouteDecision {
  api: 'primary' | 'secondary' | 'memory';
  reason: string;
}

// ---- Import / Export ----

export interface SillyTavernWorldInfo {
  entries: Record<string, SillyTavernEntry>;
  // ... other fields we parse loosely
}

export interface SillyTavernEntry {
  keys?: string[];
  secondary_keys?: string[];
  content?: string;
  constant?: boolean;
  enabled?: boolean;
  priority?: number;
  position?: string;
  selectiveLogic?: number;       // 0 = AND, 1 = OR
  caseSensitive?: boolean;
  useRegex?: boolean;
  order?: number;
  comment?: string;
  insertion_order?: number;
}

// ---- Constants ----

export const USER_ROLE = 'user' as const;
export const ASSISTANT_ROLE = 'assistant' as const;
export const SYSTEM_ROLE = 'system' as const;

export const DEFAULT_TAGS = ['maintext', 'option', 'sum', 'vars', 'thinking', 'think'] as const;

export const DEFAULT_PROMPT_ORDER: PromptOrderItem[] = [
  { id: 'system', label: '系统提示词', enabled: true, order: 0 },
  { id: 'lorebook', label: '世界书上下文', enabled: true, order: 1 },
  { id: 'chat_history', label: '对话历史', enabled: true, order: 2 },
  { id: 'user_input', label: '用户输入', enabled: true, order: 3 },
];

export const DEFAULT_POSITIONS = [
  'before_char',
  'after_char',
  'before_system',
  'after_system',
] as const;

export type EntryPosition = typeof DEFAULT_POSITIONS[number];
