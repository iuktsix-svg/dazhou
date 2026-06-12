// ============================================================
// Tavernlike — useApiRouter (React hook, v3 3-endpoint)
// ============================================================

import { useMemo } from 'react';
import { decideRoute, resolveApiConfig, type ApiConfig } from '../sillytavern';
import type { ApiTask } from '../sillytavern/api-router';

export function useApiRouter(apiConfig: ApiConfig | null) {
  const route = useMemo(
    () => (task: ApiTask) => {
      if (!apiConfig) return { api: 'primary' as const, reason: 'no config' };
      return decideRoute(task, apiConfig);
    },
    [apiConfig],
  );

  const resolved = useMemo(
    () => (task: ApiTask) => {
      if (!apiConfig) return null;
      return resolveApiConfig(task, apiConfig);
    },
    [apiConfig],
  );

  return {
    primaryEnabled: apiConfig?.primary?.enabled ?? false,
    secondaryEnabled: apiConfig?.secondary?.enabled ?? false,
    memoryEnabled: apiConfig?.memory?.enabled ?? false,
    route,
    resolved,
  };
}
