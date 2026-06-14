// ============================================================
// Tavernlike — API Router (library-based dispatch)
// ============================================================

import type { ApiConfig, ApiEndpoint } from './types';

export type ApiTask = 'chat' | 'variables' | 'memory';

function findById(config: ApiConfig, id: string | null): ApiEndpoint | undefined {
  return config.saved.find(e => e.id === id);
}

/**
 * Resolve the effective API config for a task using the interface library.
 */
export function resolveApiConfig(
  task: ApiTask,
  config: ApiConfig,
): { baseUrl: string; apiKey: string; model: string } {
  let target: ApiEndpoint | undefined;

  if (task === 'chat') target = findById(config, config.mainRouteId);
  else if (task === 'variables') target = findById(config, config.varRouteId);
  else if (task === 'memory') target = findById(config, config.memRouteId);

  // Fallback to first enabled saved endpoint
  if (!target?.enabled) target = config.saved.find(e => e.enabled);

  return {
    baseUrl: target?.baseUrl || '',
    apiKey: target?.apiKey || '',
    model: target?.model || '',
  };
}
