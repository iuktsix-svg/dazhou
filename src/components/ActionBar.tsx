import { useState } from 'react';

interface Props { onSend: (text: string) => void; onStop: () => void; isSending: boolean; }

const PRESETS = [
  { label: '静观其变', cmd: '静观其变，观察周围的情况。' },
  { label: '顺势而为', cmd: '顺着当前的情势行动。' },
  { label: '运功调息', cmd: '运功调息，恢复气血与真气。' },
  { label: '查看周围', cmd: '仔细查看周围的环境与人物。' },
  { label: '江湖行走', cmd: '前往下一个地点，继续江湖之行。' },
  { label: '拔剑出招', cmd: '凝神戒备，拔剑出招。' },
];

export function ActionBar({ onSend, onStop, isSending }: Props) {
  const [input, setInput] = useState('');

  const send = () => { const v = input.trim(); if (v && !isSending) { onSend(v); setInput(''); } };

  return (
    <div className="dz-actionbar">
      <div className="dz-actionbar-inner">
        <div className="dz-preset-label">快捷指令</div>
        <div className="dz-presets">
          {PRESETS.map(p => (
            <button key={p.label} className="dz-preset" onClick={() => onSend(p.cmd)} disabled={isSending}>{p.label}</button>
          ))}
        </div>
        <div className="dz-input-row">
          <input className="dz-input" value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="写下你的行动…" disabled={isSending} />
          {isSending ? (
            <button className="dz-send stop" onClick={onStop}>停止</button>
          ) : (
            <button className="dz-send" onClick={send} disabled={!input.trim()}>发送</button>
          )}
        </div>
      </div>
    </div>
  );
}
