// ============================================================
// Tavernlike — Lorebook Keyword Matching Engine
// ============================================================
//
// Features:
// - Keyword matching (primary + secondary, AND/OR logic)
// - Cooldown: entries wait N turns before re-triggering
// - Sticky: entries stay active for N turns after last keyword match
// - Group scoring: within a group, only top entries win
// - Token budget: cap total injected content
// - Probability: random chance of injection per match
// - Regex and case-sensitive matching support
// ============================================================

import type { Lorebook, LorebookEntry } from './types';

export interface MatchResult {
  entry: LorebookEntry;
  matchedKeys: string[];
  score: number;               // higher = better match
}

export interface LorebookSessionOptions {
  /** Maximum total characters of injected content (0 = unlimited) */
  maxContextChars?: number;
  /** Seed for deterministic probability rolls (for testing) */
  probabilitySeed?: number;
}

interface SessionEntryState {
  lastInjectedTurn: number;    // turn number when last injected
  lastMatchedTurn: number;     // turn number when last keyword-matched
  injectionCount: number;       // total times injected this session
}

/**
 * Creates a stateful lorebook matching session.
 *
 * Tracks cooldown and sticky state across turns so that entries
 * respect their configured delays and persistence.
 */
export function createLorebookSession(options: LorebookSessionOptions = {}) {
  const { maxContextChars = 0, probabilitySeed } = options;
  const entryStates = new Map<string, SessionEntryState>();
  let turnNumber = 0;
  // Simple seeded PRNG for probability (mulberry32)
  let rngState = probabilitySeed ?? (Date.now() ^ (Math.random() * 0x100000000));

  function nextRandom(): number {
    rngState |= 0;
    rngState = (rngState + 0x6D2B79F5) | 0;
    let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function getState(entryId: string): SessionEntryState {
    if (!entryStates.has(entryId)) {
      entryStates.set(entryId, { lastInjectedTurn: -999, lastMatchedTurn: -999, injectionCount: 0 });
    }
    return entryStates.get(entryId)!;
  }

  /**
   * Advance the turn counter. Call once per user message.
   */
  function advanceTurn(): number {
    turnNumber++;
    return turnNumber;
  }

  /**
   * Score and match lorebook entries against input text.
   * Respects cooldown, sticky, group scoring, probability, and token budget.
   */
  function matchLorebooks(
    lorebooks: Lorebook[],
    text: string,
  ): MatchResult[] {
    const rawMatches: MatchResult[] = [];
    const now = turnNumber;

    for (const book of lorebooks) {
      for (const entry of book.entries) {
        if (!entry.enabled) continue;

        const match = matchEntry(entry, text);
        if (match) {
          rawMatches.push(match);
        } else {
          // Check sticky: was this entry recently active?
          const st = getState(entry.id);
          const stickyTurns = entry.sticky ?? 0;
          if (stickyTurns > 0 && (now - st.lastInjectedTurn) <= stickyTurns) {
            // Sticky entry: still active, force-match
            rawMatches.push({
              entry,
              matchedKeys: ['__sticky__'],
              score: 50, // lower than real matches but still included
            });
          }
        }
      }
    }

    // ---- Apply probability ----
    const probabilized: MatchResult[] = [];
    for (const m of rawMatches) {
      const prob = m.entry.probability ?? 100;
      if (prob >= 100 || nextRandom() * 100 < prob) {
        probabilized.push(m);
      }
    }

    // ---- Apply delay (entries wait N turns before first injection) ----
    const delayFiltered: MatchResult[] = [];
    for (const m of probabilized) {
      const st = getState(m.entry.id);
      const d = m.entry.delay ?? 0;
      if (d > 0 && now < d) {
        continue; // not yet reached delay threshold
      }
      delayFiltered.push(m);
    }

    // ---- Apply cooldown ----
    const cooldownFiltered: MatchResult[] = [];
    for (const m of delayFiltered) {
      const st = getState(m.entry.id);
      const cd = m.entry.cooldown ?? 0;
      if (cd > 0 && (now - st.lastInjectedTurn) < cd) {
        continue; // still on cooldown
      }
      cooldownFiltered.push(m);
    }

    // ---- Apply group scoring (competitive within same group) ----
    const groupFiltered = applyGroupScoring(cooldownFiltered);

    // ---- Sort: higher priority first, then higher score ----
    groupFiltered.sort((a, b) => {
      if (a.entry.priority !== b.entry.priority) return b.entry.priority - a.entry.priority;
      return b.score - a.score;
    });

    // ---- Apply token budget ----
    let result = groupFiltered;
    if (maxContextChars > 0) {
      let totalChars = 0;
      const budgeted: MatchResult[] = [];
      for (const m of groupFiltered) {
        const len = m.entry.content.length;
        if (totalChars + len > maxContextChars) break;
        budgeted.push(m);
        totalChars += len;
      }
      result = budgeted;
    }

    // ---- Record injection state ----
    for (const m of result) {
      const st = getState(m.entry.id);
      st.lastInjectedTurn = now;
      st.injectionCount++;
    }
    // Also record matched-but-not-injected (e.g. due to budget) as "seen" for sticky
    for (const m of probabilized) {
      const st = getState(m.entry.id);
      if (m.matchedKeys[0] !== '__sticky__') {
        st.lastMatchedTurn = now;
      }
    }

    return result;
  }

  /**
   * Reset all session state (cooldowns, stickies, turn counter).
   */
  function reset(): void {
    entryStates.clear();
    turnNumber = 0;
    rngState = probabilitySeed ?? (Date.now() ^ (Math.random() * 0x100000000));
  }

  return {
    matchLorebooks,
    advanceTurn,
    reset,
    getTurnNumber: () => turnNumber,
  };
}

// ============================================================
// Internal matching logic
// ============================================================

/**
 * Test a single entry against text. Returns match result or null.
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
      secondaryOk = hasPrimary || matchedSecondary.length > 0;
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

// ============================================================
// Group scoring
// ============================================================

/**
 * Within each group that has useGroupScoring enabled, keep only the
 * top-scoring entries (up to 3 per group). Entries without a group
 * or with useGroupScoring disabled pass through unchanged.
 */
function applyGroupScoring(matches: MatchResult[]): MatchResult[] {
  // Partition into groups
  const groups = new Map<string, MatchResult[]>();
  const ungrouped: MatchResult[] = [];

  for (const m of matches) {
    const group = m.entry.group;
    if (group && m.entry.useGroupScoring) {
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(m);
    } else {
      ungrouped.push(m);
    }
  }

  const result = [...ungrouped];

  for (const [, groupMatches] of groups) {
    // Sort by score desc within group
    groupMatches.sort((a, b) => b.score - a.score);
    // Take top 3 per group
    const topN = groupMatches.slice(0, 3);
    result.push(...topN);
  }

  return result;
}

// ============================================================
// Context assembly (stateless)
// ============================================================

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
    // Normalize position names from ST numeric codes
    const normalizedPos = normalizePosition(pos);
    groups[normalizedPos].push(entry.content);
  }

  return {
    beforeChar: groups.before_char.join('\n\n'),
    afterChar: groups.after_char.join('\n\n'),
    beforeSystem: groups.before_system.join('\n\n'),
    afterSystem: groups.after_system.join('\n\n'),
  };
}

function normalizePosition(pos: string): 'before_char' | 'after_char' | 'before_system' | 'after_system' {
  const map: Record<string, 'before_char' | 'after_char' | 'before_system' | 'after_system'> = {
    '0': 'before_char',
    '1': 'after_char',
    '2': 'before_system',
    '3': 'after_system',
    before_char: 'before_char',
    after_char: 'after_char',
    before_system: 'before_system',
    after_system: 'after_system',
  };
  return map[pos] || 'before_char';
}

// ============================================================
// Standalone matcher (stateless, backward-compatible)
// ============================================================

/**
 * Simple stateless matcher. Does NOT track cooldown/sticky.
 * Use createLorebookSession() for stateful matching.
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
