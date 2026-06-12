// ============================================================
// Tavernlike — SillyTavern Format Importer
// ============================================================

import type { Lorebook, LorebookEntry } from './types';

/**
 * Parse a SillyTavern world info JSON export into a Lorebook.
 * Handles both spec v2 and loose formats.
 */
export function importSillyTavernWorldInfo(
  json: Record<string, unknown>,
  name?: string,
): Lorebook {
  const entries: LorebookEntry[] = [];
  const now = Date.now();

  // SillyTavern format: { entries: { "key": { ... } } } or { entries: [...] }
  const rawEntries = json.entries;

  if (rawEntries && typeof rawEntries === 'object') {
    if (Array.isArray(rawEntries)) {
      // Array format
      for (const e of rawEntries) {
        if (e && typeof e === 'object') {
          entries.push(parseEntry(e as Record<string, unknown>, crypto.randomUUID()));
        }
      }
    } else {
      // Object format: { "key": entryObj }
      for (const [key, value] of Object.entries(rawEntries as Record<string, unknown>)) {
        if (value && typeof value === 'object') {
          entries.push(parseEntry(value as Record<string, unknown>, crypto.randomUUID(), key));
        }
      }
    }
  }

  return {
    id: crypto.randomUUID(),
    name: name || (json.name as string) || (json.title as string) || 'Imported Lorebook',
    description: (json.description as string) || '',
    entries,
    createdAt: now,
    updatedAt: now,
  };
}

function parseEntry(
  raw: Record<string, unknown>,
  lorebookId: string,
  fallbackId?: string,
): LorebookEntry {
  const keys = asStringArray(raw.keys) ?? asStringArray(raw.key) ?? [];
  const secondaryKeys = asStringArray(raw.secondary_keys) ?? asStringArray(raw.secondaryKeys) ?? [];

  return {
    id: (raw.id as string) || (raw.uid as string) || fallbackId || crypto.randomUUID(),
    lorebookId,
    keys,
    secondaryKeys,
    content: (raw.content as string) || '',
    enabled: raw.enabled !== undefined ? !!raw.enabled : raw.disable !== true,
    priority: asNumber(raw.priority) ?? asNumber(raw.weight) ?? 10,
    position: normalizePosition(raw.position as string | undefined),
    constant: !!raw.constant,
    caseSensitive: !!raw.caseSensitive,
    useRegex: !!raw.useRegex,
    order: asNumber(raw.order) ?? asNumber(raw.insertion_order) ?? 100,
    selectiveLogic: (raw.selectiveLogic as number) === 1 ? 'OR' : 'AND',
    comment: (raw.comment as string) || '',
    insertionOrder: asNumber(raw.insertion_order),
  };
}

function asStringArray(val: unknown): string[] | null {
  if (Array.isArray(val)) return val.map(String).filter(Boolean);
  if (typeof val === 'string') {
    return val.split(',').map(s => s.trim()).filter(Boolean);
  }
  return null;
}

function asNumber(val: unknown): number | undefined {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const n = Number(val);
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
}

function normalizePosition(pos: string | undefined): LorebookEntry['position'] {
  if (!pos) return 'before_char';
  const map: Record<string, LorebookEntry['position']> = {
    before_char: 'before_char',
    after_char: 'after_char',
    before_system: 'before_system',
    after_system: 'after_system',
    // ST uses numeric codes sometimes
    '0': 'before_char',
    '1': 'after_char',
    '2': 'before_system',
    '3': 'after_system',
  };
  return map[pos] || 'before_char';
}

/**
 * Export a Lorebook to SillyTavern-compatible JSON format.
 */
export function exportSillyTavernWorldInfo(lorebook: Lorebook): Record<string, unknown> {
  const entries: Record<string, unknown> = {};
  for (const entry of lorebook.entries) {
    entries[entry.id] = {
      keys: entry.keys,
      secondary_keys: entry.secondaryKeys,
      content: entry.content,
      constant: entry.constant,
      enabled: entry.enabled,
      priority: entry.priority,
      position: entry.position,
      selectiveLogic: entry.selectiveLogic === 'OR' ? 1 : 0,
      caseSensitive: entry.caseSensitive,
      useRegex: entry.useRegex,
      order: entry.order,
      comment: entry.comment,
      insertion_order: entry.insertionOrder ?? entry.order,
    };
  }

  return {
    name: lorebook.name,
    description: lorebook.description || '',
    entries,
  };
}
