// ============================================================
// Tavernlike — Public API (barrel export)
// ============================================================

// Types
export type {
  LorebookEntry,
  Lorebook,
  ChatPreset,
  PresetSettings,
  PromptOrderItem,
  ApiConfig,
  ApiEndpoint,
  AppSettings,
  GameSettings,
  ChatSession,
  ChatMessage,
  VariableExtraction,
  VariableBlock,
  PromptAssemblyInput,
  PromptAssemblyResult,
  PromptMessage,
  StreamChunk,
  ParsedBlock,
  ParseResult,
  RouteDecision,
  SillyTavernWorldInfo,
  SillyTavernEntry,
  EntryPosition,
} from './types';

export {
  USER_ROLE,
  ASSISTANT_ROLE,
  SYSTEM_ROLE,
  DEFAULT_TAGS,
  DEFAULT_PROMPT_ORDER,
  DEFAULT_POSITIONS,
} from './types';

// Database
export {
  initializeDatabase,
  getLorebooks,
  getLorebook,
  saveLorebook,
  deleteLorebook,
  getPresets,
  getPreset,
  savePreset,
  deletePreset,
  getSettings,
  saveSettings,
  getChats,
  getChat,
  saveChat,
  deleteChat,
  exportAllData,
  importAllData,
} from './database';

// Lorebook engine
export {
  matchLorebooks,
  assembleContext,
  type MatchResult,
} from './lorebook-engine';

// Prompt assembler
export {
  assemblePrompt,
  truncateChatAt,
  branchChat,
} from './prompt-assembler';

// Importer
export {
  importSillyTavernWorldInfo,
  exportSillyTavernWorldInfo,
} from './importer';

// Variables
export {
  extractVariables,
  mergeVariables,
  injectVariables,
  renderVariablesBlock,
} from './variables';

// Stream parser
export {
  parseSSELine,
  streamChatCompletions,
  chatCompletions,
  parseTaggedOutput,
  extractMainText,
  extractOptions,
  extractThinking,
  extractSummary,
} from './stream-parser';

// Vars merger
export {
  validateVariables,
  coerceValue,
  type VarSchema,
} from './vars-merger';

// API router
export {
  decideRoute,
  resolveApiConfig,
} from './api-router';

// Editor utils
export {
  createDefaultEntry,
  createDefaultLorebook,
  applyEntryDefaults,
  updateEntry,
  removeEntry,
  movePromptItem,
  clampNumber,
  createDefaultPreset,
  slugify,
  truncate,
} from './editor-utils';
