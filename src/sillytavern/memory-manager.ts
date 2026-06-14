// ============================================================
// 大周日暮录 — Memory Manager
// Stores narrative summaries with importance scoring + optional embeddings.
// Retrieves relevant memories for context injection.
// ============================================================

import { db } from './database';
import type { MemoryEntry } from './types';

// ---- Cosine Similarity ----

function dotProduct(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

function magnitude(v: number[]): number {
  return Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
}

function cosineSimilarity(a: number[], b: number[]): number {
  const mag = magnitude(a) * magnitude(b);
  return mag === 0 ? 0 : dotProduct(a, b) / mag;
}

// ---- Embedding API ----

interface EmbedConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

async function getEmbedding(text: string, config: EmbedConfig): Promise<number[]> {
  const res = await fetch(`${config.baseUrl}/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}` },
    body: JSON.stringify({ model: config.model, input: text }),
  });
  if (!res.ok) throw new Error(`Embedding API error: ${res.status}`);
  const data = await res.json();
  return data.data?.[0]?.embedding || [];
}

// ---- Importance Scoring ----

const IMPORTANCE_PATTERNS: { pattern: RegExp; score: number }[] = [
  { pattern: /结识|认识|初遇|首次见到|第一次见/, score: 4 },
  { pattern: /破境|突破|晋升|踏入.*境/, score: 5 },
  { pattern: /获得.*宝物|得到.*秘籍|习得.*功法|学会/, score: 3 },
  { pattern: /击杀|击败|斩杀|消灭/, score: 3 },
  { pattern: /死亡|战死|被杀|陨落/, score: 5 },
  { pattern: /加入|成为|投靠|拜师|入门/, score: 3 },
  { pattern: /离开|告别|分手|决裂/, score: 2 },
  { pattern: /婚约|定亲|成亲|大婚/, score: 4 },
  { pattern: /阴谋|暗杀|背叛|真相/, score: 3 },
  { pattern: /悬赏|追杀|通缉/, score: 2 },
  { pattern: /王都|皇城|洛阳.*大事|朝廷/, score: 3 },
  { pattern: /名锋|太阿|惊蛰榜|群芳谱|定海神针/, score: 2 },
];

function calcImportance(summary: string): number {
  let score = 0;
  for (const { pattern, score: s } of IMPORTANCE_PATTERNS) {
    if (pattern.test(summary)) score += s;
  }
  return Math.min(10, score);
}

// ---- Storage ----

export async function addMemory(
  summary: string,
  keywords: string[],
  chatId: string,
  embedConfig?: EmbedConfig | null,
): Promise<MemoryEntry> {
  const cleanKeywords = keywords.filter(k => k.length >= 2);
  const entry: MemoryEntry = {
    id: crypto.randomUUID(),
    chatId,
    summary: summary.trim(),
    keywords: cleanKeywords,
    timestamp: Date.now(),
    importance: calcImportance(summary),
  };

  // Try to compute embedding (non-blocking, silent failure)
  if (embedConfig?.baseUrl && embedConfig?.apiKey) {
    try {
      entry.embedding = await getEmbedding(summary.trim(), embedConfig);
    } catch (e) { /* embedding unavailable, continue without */ }
  }

  await db.memories.put(entry);

  // Periodic merging
  const count = await db.memories.where('chatId').equals(chatId).count();
  if (count % 20 === 0) {
    mergeMemories(chatId).catch(() => {});
  }

  return entry;
}

// ---- Retrieval ----

export async function getMemoriesByChat(chatId: string): Promise<MemoryEntry[]> {
  return db.memories.where('chatId').equals(chatId).reverse().sortBy('timestamp');
}

export async function retrieveMemories(
  userMessage: string,
  chatId: string,
  maxResults = 5,
  embedConfig?: EmbedConfig | null,
): Promise<MemoryEntry[]> {
  const allMemories = await getMemoriesByChat(chatId);
  if (allMemories.length === 0) return [];

  const msgLower = userMessage.toLowerCase();
  const now = Date.now();
  const hasEmbeddings = allMemories.some(m => m.embedding?.length);

  // Compute query embedding if vector search is available
  let queryEmbedding: number[] | null = null;
  if (hasEmbeddings && embedConfig?.baseUrl) {
    try {
      queryEmbedding = await getEmbedding(userMessage, embedConfig);
    } catch { /* fall back to keyword-only */ }
  }

  const scored = allMemories.map(m => {
    let keywordScore = 0;
    let vectorScore = 0;

    // Keyword match
    for (const kw of m.keywords) {
      if (msgLower.includes(kw.toLowerCase())) keywordScore += 12;
    }

    // Vector similarity
    if (queryEmbedding && m.embedding?.length) {
      vectorScore = cosineSimilarity(queryEmbedding, m.embedding) * 15;
    }

    // Recency bonus
    const hoursAgo = (now - m.timestamp) / (1000 * 60 * 60);
    const recencyBonus = Math.max(0, 8 - hoursAgo * 0.3);

    // Importance multiplier
    const importanceWeight = 1 + m.importance * 0.3;

    // Hybrid: 40% keyword + 60% vector, falling back to 100% keyword
    const hybridScore = queryEmbedding
      ? keywordScore * 0.4 + vectorScore * 0.6
      : keywordScore;

    const score = (hybridScore + recencyBonus) * importanceWeight;
    return { memory: m, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored
    .filter(s => s.score > 2)
    .slice(0, maxResults)
    .map(s => s.memory);
}

// ---- Merging ----

export async function mergeMemories(chatId: string): Promise<void> {
  const all = await getMemoriesByChat(chatId);
  if (all.length < 30) return;

  // Keep high-importance memories, merge low-importance old ones
  const keep: MemoryEntry[] = [];
  const toMerge: MemoryEntry[] = [];

  for (const m of all) {
    if (m.importance >= 3) {
      keep.push(m);
    } else {
      toMerge.push(m);
    }
  }

  // Only merge if we have enough low-importance memories
  if (toMerge.length < 10) return;

  // Group by common keywords
  const groups: Map<string, MemoryEntry[]> = new Map();
  for (const m of toMerge) {
    const key = m.keywords.slice(0, 2).sort().join('|') || '_general';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  // Compress each group: delete all but the most recent, update its summary
  for (const [_, group] of groups) {
    if (group.length < 3) continue;
    group.sort((a, b) => b.timestamp - a.timestamp);
    const latest = group[0];
    const old = group.slice(1);

    // Merge summaries
    latest.summary = `[合并记忆] ${latest.summary}（同期另有 ${old.length} 段相关事件，包括：${old.slice(0, 3).map(m => m.summary.slice(0, 30)).join('；')}…）`;
    latest.keywords = [...new Set([...latest.keywords, ...old.flatMap(m => m.keywords)])].slice(0, 15);
    latest.importance = Math.max(latest.importance, 1);
    await db.memories.put(latest);

    // Delete old
    for (const m of old) {
      await db.memories.delete(m.id);
    }
  }
}

// ---- Cleanup ----

export async function deleteMemoriesByChat(chatId: string): Promise<void> {
  await db.memories.where('chatId').equals(chatId).delete();
}

export async function getMemoryCount(chatId: string): Promise<number> {
  return db.memories.where('chatId').equals(chatId).count();
}

// ---- Prompt helpers ----

export function buildMemoryStoragePrompt(summary: string): string {
  return `你是一个记忆关键词提取系统。根据剧情摘要，提取5-10个最重要的关键词。

剧情摘要：
${summary}

请以 JSON 格式返回关键词数组：
{"keywords": ["关键词1", "关键词2", ...]}`;
}

export function buildMemoryContextBlock(memories: MemoryEntry[]): string {
  if (memories.length === 0) return '';
  return `[前情回顾]
${memories.map((m, i) => `${i + 1}. ${m.summary}${m.importance >= 5 ? ' ⭐' : ''}`).join('\n')}
[/前情回顾]`;
}
