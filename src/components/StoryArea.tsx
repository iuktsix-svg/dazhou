import { useEffect, useState } from 'react';
import { type ChatMessage, ASSISTANT_ROLE } from '../sillytavern';
import { useSillytavern } from '../hooks/useSillytavern';
import { Plus } from 'lucide-react';

interface Props { messages: ChatMessage[]; streamingText: string; isStreaming: boolean; onOption: (text: string) => void; }

function parseBlocks(text: string) {
  if (!text) return [];
  const lines = text.split('\n');
  const blocks: { type: 'npc' | 'narration'; name?: string; text: string }[] = [];
  let cur = ''; let curType: 'npc' | 'narration' = 'narration'; let curName = '';
  for (const line of lines) {
    const m1 = line.match(/^【(.+?)】(.*)/), m2 = line.match(/^(.{1,6})：(.+)/);
    if (m1 || m2) {
      if (cur.trim()) blocks.push({ type: curType, name: curName || undefined, text: cur.trim() });
      curName = m1 ? m1[1] : m2![1]; cur = m1 ? m1[2] : m2![2]; curType = 'npc';
    } else {
      if (curType === 'npc' && line.trim()) { cur += '\n' + line; }
      else { if (curType === 'narration') cur += (cur ? '\n' : '') + line; else { if (cur.trim()) blocks.push({ type: curType, name: curName || undefined, text: cur.trim() }); curType = 'narration'; curName = ''; cur = line; } }
    }
  }
  if (cur.trim()) blocks.push({ type: curType, name: curName || undefined, text: cur.trim() });
  return blocks.length > 0 ? blocks : [{ type: 'narration' as const, text }];
}

export function StoryArea({ messages, streamingText, isStreaming, onOption }: Props) {
  const { createChat } = useSillytavern();
  const [info, setInfo] = useState({ time: '--', location: '--' });

  useEffect(() => {
    const iv = setInterval(() => { /* reserved for future live updates */ }, 2000);
    return () => clearInterval(iv);
  }, []);

  // Try to get time/location from the last message's variables
  useEffect(() => {
    const lastMsg = messages.find(m => m.role === ASSISTANT_ROLE && m.variables);
    if (lastMsg?.variables) {
      const v = lastMsg.variables as Record<string, unknown>;
      const p = (v['主角状态'] || {}) as Record<string, unknown>;
      setInfo({
        time: String(v['当前时辰'] || '--'),
        location: String(p['当前所在地点'] || v['当前所在地点'] || '--'),
      });
    }
  }, [messages]);

  const last = [...messages].reverse().find(m => m.role === ASSISTANT_ROLE);
  const text = (isStreaming && streamingText) ? streamingText : (last?.content || '');
  const blocks = parseBlocks(text);
  const w3g = text.match(/<w3g>([\s\S]*?)<\/w3g>/i);
  const options = w3g ? w3g[1].trim().split(/\r?\n/).map(l => l.trim().replace(/^\d+\.\s*/, '')).filter(Boolean) : [];

  const hasContent = messages.length > 0;

  return (
    <div className="dz-story">
      <div className="dz-story-inner">
        {!hasContent ? (
          <div className="dz-story-empty">
            <h1>大周日暮录</h1>
            <p style={{ marginBottom: 20 }}>尚未开始江湖之旅</p>
            <button
              onClick={() => createChat()}
              style={{
                padding: '12px 28px', background: 'var(--dz-red)', color: '#fff', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, letterSpacing: 1,
                clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)',
                boxShadow: '4px 4px 0px rgba(197,48,48,0.35)',
                display: 'inline-flex', alignItems: 'center', gap: 8,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--dz-red-light)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--dz-red)'}
            >
              <Plus size={16} /> 创建新对话
            </button>
          </div>
        ) : (
          <>
            {/* Time + Location header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28,
              paddingBottom: 16, borderBottom: '1px solid var(--dz-gray-light)',
              fontFamily: 'var(--font-serif)',
            }}>
              <span style={{ fontSize: 18, color: 'var(--dz-gold)', fontWeight: 600 }}>{info.time}</span>
              <span style={{ color: 'var(--dz-text-dim)', fontSize: 16 }}>·</span>
              <span style={{ fontSize: 16, color: 'var(--dz-text)' }}>{info.location}</span>
            </div>

            {blocks.map((b, i) => b.type === 'npc' ? (
              <div key={i} className="dz-bubble">
                {b.name && <div className="dz-bubble-label">{b.name}</div>}
                <div className="dz-bubble-text">{b.text}</div>
              </div>
            ) : (
              <div key={i} className="dz-narration">{b.text}</div>
            ))}
          </>
        )}
        {isStreaming && streamingText && <span className="dz-cursor" />}
      </div>
      {options.length > 0 && (
        <div className="dz-options">
          {options.map((opt, i) => (
            <div key={i} className="dz-option" onClick={() => onOption(opt)}>
              <div className="opt-idx">选项 {i + 1}</div>
              <div className="opt-text">{opt}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
