// ============================================================
// Tavernlike — Variable Schema Merger (schema-first support)
// ============================================================

// VariableBlock type import unused currently; reserved for schema-first expansion

/**
 * Validate extracted variables against an optional schema.
 * This is a placeholder for future schema-first state system.
 */
export interface VarSchema {
  name: string;
  type: 'string' | 'number' | 'boolean';
  default?: string | number | boolean;
  min?: number;
  max?: number;
  enum?: (string | number)[];
}

export function validateVariables(
  updates: Record<string, string | number>,
  schema: VarSchema[],
): { valid: Record<string, string | number>; errors: string[] } {
  const valid: Record<string, string | number> = {};
  const errors: string[] = [];

  for (const { name, type, min, max, enum: enumVals } of schema) {
    const raw = updates[name];
    if (raw === undefined) continue;

    if (type === 'number') {
      const num = Number(raw);
      if (Number.isNaN(num)) {
        errors.push(`${name}: expected number, got "${raw}"`);
        continue;
      }
      if (min !== undefined && num < min) errors.push(`${name}: ${num} < min ${min}`);
      if (max !== undefined && num > max) errors.push(`${name}: ${num} > max ${max}`);
      if (errors.length) continue;
      valid[name] = num;
    } else if (type === 'boolean') {
      valid[name] = raw === 'true' || String(raw) === 'true' ? 1 : 0;
    } else {
      const str = String(raw);
      if (enumVals && !enumVals.includes(str)) {
        errors.push(`${name}: "${str}" not in allowed values [${enumVals.join(', ')}]`);
        continue;
      }
      valid[name] = str;
    }
  }

  // Pass through unknown keys
  for (const [k, v] of Object.entries(updates)) {
    if (!(k in valid) && !schema.some(s => s.name === k)) {
      valid[k] = v;
    }
  }

  return { valid, errors };
}

/**
 * Coerce a string value to the schema-expected type.
 */
export function coerceValue(
  value: string,
  type: VarSchema['type'],
): string | number | boolean {
  switch (type) {
    case 'number': {
      const n = Number(value);
      return Number.isNaN(n) ? value : n;
    }
    case 'boolean':
      return value === 'true' || value === '1';
    default:
      return value;
  }
}
