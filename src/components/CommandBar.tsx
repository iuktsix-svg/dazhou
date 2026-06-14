import { useState } from 'react';
import { Send, Square, AlertTriangle, Settings } from 'lucide-react';
import type { ChatSession } from '../sillytavern';

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  isSending: boolean;
  chat: ChatSession | null;
  hasApi: boolean;
  onOpenSettings: () => void;
}

export function CommandBar({ onSend, onStop, isSending, chat: _chat, hasApi, onOpenSettings }: Props) {
  const [input, setInput] = useState('');

  const send = () => { const v = input.trim(); if (v && !isSending) { onSend(v); setInput(''); } };

  return (
    <div className="dz-cmd-wrap">
      {/* API warning — ABOVE input, never inside the input row */}
      {!hasApi && (
        <div className="dz-cmd-api-bar">
          <AlertTriangle size={14} />
          <span className="dz-cmd-api-bar-text">尚未配置AI接口</span>
          <button className="dz-cmd-api-bar-btn" onClick={onOpenSettings}>
            <Settings size={12} />配置
          </button>
        </div>
      )}

      {/* Input row — only input + send, clean layout */}
      <div className="dz-cmd-inner">
        <input className="dz-cmd-input" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="写下你的行动…" disabled={isSending} />
        {isSending ? (
          <button className="dz-cmd-send stop" onClick={onStop}><Square size={16} fill="currentColor" /><span className="dz-cmd-send-label">停止</span></button>
        ) : (
          <button className={`dz-cmd-send ${input.trim() ? 'on' : 'off'}`} onClick={send} disabled={!input.trim()}>
            <Send size={16} /><span className="dz-cmd-send-label">发送</span>
          </button>
        )}
      </div>
    </div>
  );
}
