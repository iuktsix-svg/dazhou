// ============================================================
// Tavernlike — Variable Extraction & Merge
// ============================================================

import type { VariableExtraction, VariableBlock } from './types';

/**
 * Extract <var name="..." value="..." /> tags from LLM output.
 * Returns cleaned text (tags stripped) and extracted variable updates.
 */
export function extractVariables(rawText: string): VariableExtraction {
  const blocks: VariableBlock[] = [];
  const varRegex = /<var\s+name\s*=\s*(?:"([^"]*)"|'([^']*)')\s+value\s*=\s*(?:"([\s\S]*?)"|'([\s\S]*?)')\s*\/>/gi;

  let cleanedText = rawText;
  let match: RegExpExecArray | null;

  while ((match = varRegex.exec(rawText)) !== null) {
    const name = (match[1] || match[2]).trim();
    const value = match[3] || match[4];

    blocks.push({
      name,
      value,
      raw: match[0],
    });

    // Remove the tag from text
    cleanedText = cleanedText.replace(match[0], '');
  }

  // Convert to record, try parse numbers
  const updates: Record<string, string | number> = {};
  for (const block of blocks) {
    const num = Number(block.value);
    updates[block.name] = Number.isNaN(num) ? block.value : num;
  }

  // Clean up extra whitespace from removed tags
  cleanedText = cleanedText.replace(/\n{3,}/g, '\n\n').trim();

  return { cleanedText, updates, rawBlocks: blocks };
}

/**
 * Merge new variable updates into existing variables.
 * - Simple keys: shallow replace (old value completely replaced)
 * - Dot-separated paths (e.g. "武林榜单与悬赏.追杀榜"): deep set into nested object
 * - Array values: auto-parsed from JSON string if possible
 */
export function mergeVariables(
  current: Record<string, string | number>,
  updates: Record<string, string | number>,
): Record<string, string | number> {
  const result = JSON.parse(JSON.stringify(current)); // deep clone

  for (const [key, value] of Object.entries(updates)) {
    // Try to parse JSON array/object values
    let parsedValue: string | number | object = value;
    if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
      try { parsedValue = JSON.parse(value); } catch { /* keep as string */ }
    }

    if (key.includes('.')) {
      // Deep path — e.g. "武林榜单与悬赏.追杀榜" → result.武林榜单与悬赏.追杀榜 = parsedValue
      const parts = key.split('.');
      let obj: Record<string, unknown> = result as unknown as Record<string, unknown>;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]] || typeof obj[parts[i]] !== 'object') {
          obj[parts[i]] = {};
        }
        obj = obj[parts[i]] as Record<string, unknown>;
      }
      obj[parts[parts.length - 1]] = parsedValue;
    } else {
      // Simple key — full replace
      (result as Record<string, unknown>)[key] = parsedValue;
    }
  }

  return result;
}

/**
 * Inject variable values into a template string.
 * Replaces {{varName}} with the variable value.
 */
export function injectVariables(
  template: string,
  variables: Record<string, string | number>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = variables[key];
    if (val === undefined) return `{{${key}}}`;
    return typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val);
  });
}

/**
 * Render variables as a formatted block for system prompt.
 * Nested objects/arrays are serialized as JSON so the AI can read them.
 */
export function renderVariablesBlock(
  variables: Record<string, string | number>,
): string {
  const entries = Object.entries(variables);
  if (entries.length === 0) return '';

  const lines = entries.map(([k, v]) => {
    const display = typeof v === 'object' && v !== null
      ? JSON.stringify(v, null, 2)
      : String(v);
    return `  ${k}: ${display}`;
  });
  return `<vars>\n${lines.join('\n')}\n</vars>`;
}
