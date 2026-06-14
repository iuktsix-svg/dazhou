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
      {/* Input row */}
      <div className="dz-cmd-inner">
        {/* API warning — compact inline */}
        {!hasApi && (
          <button className="dz-cmd-api-warn" onClick={onOpenSettings}>
            <AlertTriangle size={13} />
            <span className="dz-cmd-api-warn-text">未配置API</span>
            <Settings size={11} />
          </button>
        )}
        <input className="dz-cmd-input" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="写下你的行动…" disabled={isSending} />
        {isSending ? (
          <button className="dz-cmd-send stop" onClick={onStop}><Square size={14} fill="currentColor" /> 停止</button>
        ) : (
          <button className={`dz-cmd-send ${input.trim() ? 'on' : 'off'}`} onClick={send} disabled={!input.trim()}>
            <Send size={14} /> 发送
          </button>
        )}
      </div>
    </div>
  );
}
