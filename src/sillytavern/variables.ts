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
  const varRegex = /<var\s+name\s*=\s*"([^"]*)"\s+value\s*=\s*"([^"]*)"\s*\/>/gi;

  let cleanedText = rawText;
  let match: RegExpExecArray | null;

  while ((match = varRegex.exec(rawText)) !== null) {
    const name = match[1].trim();
    const value = match[2];

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
 * New values overwrite existing keys.
 */
export function mergeVariables(
  current: Record<string, string | number>,
  updates: Record<string, string | number>,
): Record<string, string | number> {
  return { ...current, ...updates };
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
    return variables[key] !== undefined ? String(variables[key]) : `{{${key}}}`;
  });
}

/**
 * Render variables as a formatted block for system prompt.
 */
export function renderVariablesBlock(
  variables: Record<string, string | number>,
): string {
  const entries = Object.entries(variables);
  if (entries.length === 0) return '';

  const lines = entries.map(([k, v]) => `  ${k}: ${v}`);
  return `<vars>\n${lines.join('\n')}\n</vars>`;
}
