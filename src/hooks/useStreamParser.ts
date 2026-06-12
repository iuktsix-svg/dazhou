// ============================================================
// Tavernlike — useStreamParser (React hook)
// ============================================================

import { useCallback, useRef, useState } from 'react';
import { parseSSELine, type StreamChunk } from '../sillytavern';

export interface StreamState {
  text: string;
  chunks: StreamChunk[];
  isStreaming: boolean;
  error: string | null;
}

export function useStreamParser() {
  const [state, setState] = useState<StreamState>({
    text: '',
    chunks: [],
    isStreaming: false,
    error: null,
  });
  const abortRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async (
    url: string,
    apiKey: string,
    body: Record<string, unknown>,
  ) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setState({ text: '', chunks: [], isStreaming: true, error: null });

    try {
      const response = await fetch(`${url}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...body, stream: true }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';
      const chunks: StreamChunk[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const chunk = parseSSELine(line.trim());
          if (chunk) {
            fullText += chunk.delta;
            chunks.push(chunk);
            setState({ text: fullText, chunks: [...chunks], isStreaming: true, error: null });
            if (chunk.done) break;
          }
        }
      }
      reader.releaseLock();

      setState(prev => ({ ...prev, isStreaming: false }));
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setState(prev => ({ ...prev, isStreaming: false }));
        return;
      }
      setState(prev => ({
        ...prev,
        isStreaming: false,
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    setState({ text: '', chunks: [], isStreaming: false, error: null });
  }, []);

  return { ...state, startStream, cancel, reset };
}
