import { useState } from 'react';
import { type ChatMessage, ASSISTANT_ROLE } from '../sillytavern';

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

const DEMO_TEXT = `<maintext>
午休的教室只有我们两个人。

蛋蛋趴在桌上，脸朝着我的方向，指尖无意识地卷着发尾。阳光从她背后的窗户斜斜地照进来，把她的睫毛在脸颊上投下一小片阴影。

她好像有话要说。或者只是在看我。又或者说，她只是在发呆。

你注意到她的耳朵有点红。

"......"她轻轻吸了一口气，"你中午......要不要和我一起吃午饭？"

她垂下眼睛，声音很轻，但每个字都很清楚。
</maintext>
<option>
1.你决定接受她的邀请。
2.你婉拒了。
3.你拒绝并嘲笑她痴心妄想
4.时间来到午餐结束后。
</option>`;

export function StoryArea({ messages, streamingText, isStreaming, onOption }: Props) {
  const [info] = useState({ time: '午时三刻', location: '大周·洛阳·平康坊' });

  const last = [...messages].reverse().find(m => m.role === ASSISTANT_ROLE);
  const rawText = (isStreaming && streamingText) ? streamingText : (last?.content || DEMO_TEXT);

  // Strip tags for clean display
  const cleanText = rawText
    .replace(/<maintext>/gi, '').replace(/<\/maintext>/gi, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<sum>[\s\S]*?<\/sum>/gi, '')
    .replace(/<vars>[\s\S]*?<\/vars>/gi, '');

  const blocks = parseBlocks(cleanText);

  // Extract options from <option> or <w3g> tags
  const optMatch = rawText.match(/<option>([\s\S]*?)<\/option>/i);
  const w3gMatch = !optMatch ? rawText.match(/<w3g>([\s\S]*?)<\/w3g>/i) : null;
  const optRaw = optMatch ? optMatch[1] : (w3gMatch ? w3gMatch[1] : '');
  const options = optRaw
    ? optRaw.trim().split(/\r?\n/).map((l: string) => l.trim().replace(/^\d+\.\s*/, '')).filter(Boolean)
    : [];

  const hasContent = messages.length > 0;

  return (
    <div className="dz-story">
      <div className="dz-story-inner">
        {!hasContent && !isStreaming && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28,
            paddingBottom: 16, borderBottom: '1px solid var(--bdr-subtle)',
            fontFamily: 'var(--font-body)',
          }}>
            <span style={{ fontSize: 'var(--text-lg)', color: 'var(--wx-gold)', fontWeight: 600 }}>{info.time}</span>
            <span style={{ color: 'var(--wx-ink-dim)', fontSize: 'var(--text-base)' }}>·</span>
            <span style={{ fontSize: 'var(--text-base)', color: 'var(--wx-ink)' }}>{info.location}</span>
          </div>
        )}

        {blocks.map((b, i) => b.type === 'npc' ? (
          <div key={i} className="dz-bubble">
            {b.name && <div className="dz-bubble-label">{b.name}</div>}
            <div className="dz-bubble-text">{b.text}</div>
          </div>
        ) : (
          <div key={i} className="dz-narration">{b.text}</div>
        ))}
        {isStreaming && streamingText && <span className="dz-cursor" />}
      </div>
      {options.length > 0 && (
        <div className="dz-options">
          {options.map((opt: string, i: number) => (
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
