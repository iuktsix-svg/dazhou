// ============================================================
// Tavernlike — SSE Stream Parser
// ============================================================

import type { StreamChunk, ParsedBlock, ParseResult } from './types';

/**
 * Parse an SSE stream line into a StreamChunk.
 * Handles: data: {"choices":[{"delta":{"content":"text"},"finish_reason":"stop"}]}
 * and:    data: [DONE]
 */
export function parseSSELine(line: string): StreamChunk | null {
  if (!line.startsWith('data: ')) return null;

  const data = line.slice(6).trim();
  if (data === '[DONE]') {
    return { raw: line, delta: '', done: true };
  }

  try {
    const json = JSON.parse(data);
    const choice = json.choices?.[0];
    if (!choice) return { raw: line, delta: '', done: false };

    const delta = choice.delta?.content || '';
    const done = choice.finish_reason != null;
    return {
      raw: line,
      delta,
      done,
      finishReason: choice.finish_reason,
    };
  } catch {
    return { raw: line, delta: '', done: false };
  }
}

/**
 * Streaming API call helper.
 * Yields StreamChunks as they arrive via SSE.
 */
export async function* streamChatCompletions(
  baseUrl: string,
  apiKey: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): AsyncGenerator<StreamChunk> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...body, stream: true }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      // Keep last partial line in buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const chunk = parseSSELine(line.trim());
        if (chunk) yield chunk;
      }
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      const chunk = parseSSELine(buffer.trim());
      if (chunk) yield chunk;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Non-streaming API call.
 */
export async function chatCompletions(
  baseUrl: string,
  apiKey: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<string> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// ---- Game-mode tag parser ----

/**
 * Parse LLM output into ParsedBlocks based on custom tags.
 * Tags matched are determined by the settings.customTags list.
 * Text outside any recognized tag is treated as untagged (maintext).
 */
export function parseTaggedOutput(raw: string, tags: string[]): ParseResult {
  const blocks: ParsedBlock[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // We need to build a regex that matches any of the known tags
  const tagNames = tags.join('|');
  const dynamicRegex = new RegExp(`<(${tagNames})(\\s[^>]*)?>([\\s\\S]*?)<\\/\\1>`, 'gi');

  while ((match = dynamicRegex.exec(raw)) !== null) {
    // Capture any untagged text before this tag
    const before = raw.slice(lastIndex, match.index).trim();
    if (before) {
      blocks.push({ tag: '__text__', content: before, attributes: {} });
    }

    const tag = match[1].toLowerCase();
    const attrsStr = match[2] || '';
    const content = match[3].trim();
    const attributes = parseAttributes(attrsStr);

    blocks.push({ tag, content, attributes });
    lastIndex = match.index + match[0].length;
  }

  // Remaining untagged text
  const remainder = raw.slice(lastIndex).trim();
  if (remainder) {
    blocks.push({ tag: '__text__', content: remainder, attributes: {} });
  }

  return { blocks, rawText: raw };
}

function parseAttributes(attrStr: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /(\w+)\s*=\s*"([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = attrRegex.exec(attrStr)) !== null) {
    attrs[m[1]] = m[2];
  }
  return attrs;
}

/**
 * Extract the main text from parsed blocks.
 * In game mode: uses 'maintext' blocks; in chat mode: returns untagged text.
 */
export function extractMainText(blocks: ParsedBlock[]): string {
  const maintextBlocks = blocks.filter(b => b.tag === 'maintext' || b.tag === '__text__');
  return maintextBlocks.map(b => b.content).join('\n\n');
}

/**
 * Extract options from parsed blocks.
 */
export function extractOptions(blocks: ParsedBlock[]): string[] {
  const optionBlock = blocks.find(b => b.tag === 'option');
  if (!optionBlock) return [];

  // Options can be separated by newlines or numbered
  return optionBlock.content
    .split('\n')
    .map(line => line.replace(/^\d+[\.\)]\s*/, '').trim())
    .filter(Boolean);
}

/**
 * Extract thinking content (foldable by UI).
 */
export function extractThinking(blocks: ParsedBlock[]): string[] {
  return blocks
    .filter(b => b.tag === 'thinking' || b.tag === 'think')
    .map(b => b.content);
}

/**
 * Extract summary block.
 */
export function extractSummary(blocks: ParsedBlock[]): string | null {
  const sumBlock = blocks.find(b => b.tag === 'sum');
  return sumBlock?.content || null;
}
