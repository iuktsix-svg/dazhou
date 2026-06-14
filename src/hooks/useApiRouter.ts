// ============================================================
// Tavernlike — useApiRouter (React hook, library-based)
// ============================================================

import { useMemo } from 'react';
import { resolveApiConfig, type ApiConfig } from '../sillytavern';
import type { ApiTask } from '../sillytavern/api-router';

export function useApiRouter(apiConfig: ApiConfig | null) {
  const resolved = useMemo(
    () => (task: ApiTask) => {
      if (!apiConfig) return null;
      return resolveApiConfig(task, apiConfig);
    },
    [apiConfig],
  );

  return {
    mainEnabled: apiConfig?.saved.some(e => e.enabled) ?? false,
    resolved,
  };
}
