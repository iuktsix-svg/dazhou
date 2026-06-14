// ============================================================
// Tavernlike — Editor Utilities (pure functions, no DB)
// ============================================================

import type { Lorebook, LorebookEntry, PromptOrderItem, ChatPreset } from './types';
import { DEFAULT_PROMPT_ORDER } from './types';

// ---- Lorebook Entry Helpers ----

export function createDefaultEntry(lorebookId: string, overrides?: Partial<LorebookEntry>): LorebookEntry {
  return {
    id: crypto.randomUUID(),
    lorebookId,
    keys: [],
    secondaryKeys: [],
    content: '',
    enabled: true,
    priority: 10,
    position: 'before_char',
    constant: false,
    caseSensitive: false,
    useRegex: false,
    order: 100,
    selectiveLogic: 'AND',
    ...overrides,
  };
}

export function createDefaultLorebook(name?: string): Lorebook {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name: name || 'New Lorebook',
    description: '',
    entries: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function applyEntryDefaults(entry: Partial<LorebookEntry> & { id: string; lorebookId: string }): LorebookEntry {
  const defaults = createDefaultEntry(entry.lorebookId);
  return { ...defaults, ...entry };
}

export function updateEntry(
  lorebook: Lorebook,
  entryId: string,
  patch: Partial<LorebookEntry>,
): Lorebook {
  return {
    ...lorebook,
    entries: lorebook.entries.map(e =>
      e.id === entryId ? { ...e, ...patch } : e,
    ),
    updatedAt: Date.now(),
  };
}

export function removeEntry(lorebook: Lorebook, entryId: string): Lorebook {
  return {
    ...lorebook,
    entries: lorebook.entries.filter(e => e.id !== entryId),
    updatedAt: Date.now(),
  };
}

// ---- Prompt Order Helpers ----

export function movePromptItem(
  items: PromptOrderItem[],
  index: number,
  direction: 'up' | 'down',
): PromptOrderItem[] {
  const next = [...items];
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= next.length) return items;

  const [item] = next.splice(index, 1);
  next.splice(targetIndex, 0, item);

  // Re-number
  return next.map((item, i) => ({ ...item, order: i }));
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ---- Preset Helpers ----

export function createDefaultPreset(name?: string): ChatPreset {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    name: name || 'Default Preset',
    settings: {
      temp_openai: 0.7,
      openai_max_tokens: 8192,
      top_p_openai: 1,
      freq_pen_openai: 0,
      pres_pen_openai: 0,
      stream_openai: true,
    },
    prompt_order: DEFAULT_PROMPT_ORDER.map(p => ({ ...p })),
    createdAt: now,
    updatedAt: now,
  };
}

// ---- String Helpers ----

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}
