// ============================================================
// Tavernlike — Lorebook Keyword Matching Engine
// ============================================================

import type { Lorebook, LorebookEntry } from './types';

export interface MatchResult {
  entry: LorebookEntry;
  matchedKeys: string[];
  score: number;               // higher = better match
}

/**
 * Score and match lorebook entries against input text.
 * Returns matched entries sorted by priority (desc) then score (desc).
 */
export function matchLorebooks(
  lorebooks: Lorebook[],
  text: string,
): MatchResult[] {
  const results: MatchResult[] = [];

  for (const book of lorebooks) {
    for (const entry of book.entries) {
      if (!entry.enabled) continue;

      const match = matchEntry(entry, text);
      if (match) {
        results.push(match);
      }
    }
  }

  // Sort: higher priority first, then higher score
  results.sort((a, b) => {
    if (a.entry.priority !== b.entry.priority) return b.entry.priority - a.entry.priority;
    return b.score - a.score;
  });

  return results;
}

/**
 * Test a single entry against text.
 */
function matchEntry(entry: LorebookEntry, text: string): MatchResult | null {
  // Constant entries always match
  if (entry.constant) {
    return { entry, matchedKeys: ['__constant__'], score: 100 };
  }

  if (entry.keys.length === 0 && entry.secondaryKeys.length === 0) {
    return null;
  }

  const searchText = entry.caseSensitive ? text : text.toLowerCase();

  // Match primary keys
  const matchedPrimary: string[] = [];
  for (const key of entry.keys) {
    const k = entry.caseSensitive ? key : key.toLowerCase();
    if (entry.useRegex) {
      try {
        const re = new RegExp(k, entry.caseSensitive ? '' : 'i');
        if (re.test(text)) {
          matchedPrimary.push(key);
        }
      } catch {
        // invalid regex, skip
      }
    } else {
      if (searchText.includes(k)) {
        matchedPrimary.push(key);
      }
    }
  }

  // Match secondary keys
  const matchedSecondary: string[] = [];
  for (const key of entry.secondaryKeys) {
    const k = entry.caseSensitive ? key : key.toLowerCase();
    if (entry.useRegex) {
      try {
        const re = new RegExp(k, entry.caseSensitive ? '' : 'i');
        if (re.test(text)) {
          matchedSecondary.push(key);
        }
      } catch {
        // skip
      }
    } else {
      if (searchText.includes(k)) {
        matchedSecondary.push(key);
      }
    }
  }

  // Determine if entry triggers
  const hasPrimary = matchedPrimary.length > 0;
  const hasSecondary = matchedSecondary.length > 0;

  // An entry needs at least one primary key matched (or it only has secondary keys)
  const primaryRequirement = entry.keys.length === 0 || hasPrimary;

  // Secondary key logic
  let secondaryOk = true;
  if (entry.secondaryKeys.length > 0) {
    if (entry.selectiveLogic === 'AND') {
      // All secondary keys must match
      secondaryOk = matchedSecondary.length === entry.secondaryKeys.length;
    } else {
      // OR — at least one secondary key matched
      secondaryOk = hasSecondary;
    }
  }

  if (!primaryRequirement || !secondaryOk) return null;

  // Score: primary matches weighted heavier
  const score = matchedPrimary.length * 10 + matchedSecondary.length * 5;
  return {
    entry,
    matchedKeys: [...matchedPrimary, ...matchedSecondary],
    score,
  };
}

/**
 * Assemble injected context from matched entries, sorted and grouped by position.
 */
export function assembleContext(
  matches: MatchResult[],
): { beforeChar: string; afterChar: string; beforeSystem: string; afterSystem: string } {
  const groups = {
    before_char: [] as string[],
    after_char: [] as string[],
    before_system: [] as string[],
    after_system: [] as string[],
  };

  for (const { entry } of matches) {
    const pos = entry.position || 'before_char';
    groups[pos].push(entry.content);
  }

  return {
    beforeChar: groups.before_char.join('\n\n'),
    afterChar: groups.after_char.join('\n\n'),
    beforeSystem: groups.before_system.join('\n\n'),
    afterSystem: groups.after_system.join('\n\n'),
  };
}
