import { useState, useEffect } from 'react';
import { Send, Square, Heart, Sparkles, Skull, Coins } from 'lucide-react';
import type { ChatSession } from '../sillytavern';

interface Props {
  onSend: (text: string) => void;
  onStop: () => void;
  isSending: boolean;
  chat: ChatSession | null;
}

export function CommandBar({ onSend, onStop, isSending, chat }: Props) {
  const [input, setInput] = useState('');
  const [stats, setStats] = useState({ hp: 0, hpMax: 100, mp: 0, mpMax: 100, demon: 0, location: '--', silver: 0 });

  useEffect(() => {
    const update = () => {
      const vars = (chat?.variables || {}) as Record<string, unknown>;
      const p = (vars['主角状态'] || {}) as Record<string, unknown>;
      setStats({
        hp: Number(p['当前气血'] || 0), hpMax: Number(p['气血上限'] || 100),
        mp: Number(p['当前真气'] || 0), mpMax: Number(p['真气上限'] || 100),
        demon: Number(p['心魔值'] || vars['心魔值'] || 0),
        location: String(p['当前所在地点'] || vars['当前所在地点'] || '--'),
        silver: Number(p['持有银两'] || vars['持有银两'] || 0),
      });
    };
    update();
    const iv = setInterval(update, 2000);
    return () => clearInterval(iv);
  }, [chat]);

  const send = () => { const v = input.trim(); if (v && !isSending) { onSend(v); setInput(''); } };

  return (
    <div className="dz-cmd-wrap" style={{ padding: '0 24px 16px' }}>
      {/* Stat bar above input */}
      <div style={{
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24,
        padding: '8px 0 12px', fontFamily: 'var(--font-mono)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--dz-red)' }}>
          <Heart size={14} /> 气血 {stats.hp}/{stats.hpMax}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--dz-blue)' }}>
          <Sparkles size={14} /> 真气 {stats.mp}/{stats.mpMax}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: stats.demon >= 80 ? '#c026d3' : 'var(--dz-text-dim)' }}>
          <Skull size={14} /> 心魔 {stats.demon}
        </span>
        <span style={{ color: 'var(--dz-text-dim)', fontSize: 14 }}>·</span>
        <span style={{ fontSize: 14, color: 'var(--dz-text)' }}>{stats.location}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, color: 'var(--dz-gold)' }}>
          <Coins size={14} /> {stats.silver}两
        </span>
      </div>

      {/* Input row */}
      <div className="dz-cmd-inner">
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
