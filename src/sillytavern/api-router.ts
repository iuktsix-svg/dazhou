// ============================================================
// Tavernlike — API Router (3-endpoint dispatch)
// ============================================================

import type { ApiConfig, ApiEndpoint, RouteDecision } from './types';

export type ApiTask = 'chat' | 'variables' | 'memory';

/**
 * Resolve which API endpoint to use for a given task.
 *
 * Routing:
 * - 'chat' → primary (main story generation)
 * - 'variables' → secondary (JSON Patch variable updates)
 * - 'memory' → memory (long-conversation summarization)
 */
export function decideRoute(task: ApiTask, config: ApiConfig): RouteDecision {
  const endpoints: Record<ApiTask, keyof ApiConfig> = {
    chat: 'primary',
    variables: 'secondary',
    memory: 'memory',
  };

  const key = endpoints[task];
  const endpoint = config[key];

  if (!endpoint?.enabled) {
    // Fallback: if the designated endpoint is disabled, use primary
    return { api: key, reason: `${task} → ${key} (${endpoint?.enabled ? 'enabled' : 'disabled, fallback to primary'})` };
  }

  return { api: key, reason: `${task} → ${key}` };
}

/**
 * Resolve the effective API config for a task.
 */
export function resolveApiConfig(
  task: ApiTask,
  config: ApiConfig,
): { baseUrl: string; apiKey: string; model: string } {
  const route = decideRoute(task, config);
  const endpointKey = route.api as keyof ApiConfig;
  const endpoint: ApiEndpoint | undefined = config[endpointKey];

  // Use the routed endpoint, or fall back to primary
  const target = (endpoint?.enabled ? endpoint : config.primary) ?? {
    baseUrl: '',
    apiKey: '',
    model: '',
  };

  return {
    baseUrl: target.baseUrl,
    apiKey: target.apiKey,
    model: target.model,
  };
}
