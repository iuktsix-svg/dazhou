import { type ChatMessage, ASSISTANT_ROLE } from '../sillytavern';
import { useSillytavern } from '../hooks/useSillytavern';

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
  const { settings } = useSillytavern();
  const stripTags = settings?.stripTags || ['thinking', 'think', 'sum', 'vars'];

  const last = [...messages].reverse().find(m => m.role === ASSISTANT_ROLE);
  const rawText = (isStreaming && streamingText) ? streamingText : (last?.content || '');

  let cleanText = rawText
    .replace(/<maintext>/gi, '').replace(/<\/maintext>/gi, '')
    .replace(/<option>[\s\S]*?<\/option>/gi, '')
    .replace(/<var\s[^>]*\/>/gi, '');
  for (const tag of stripTags) {
    cleanText = cleanText.replace(new RegExp(`<${tag}>[\\s\\S]*?<\\/${tag}>`, 'gi'), '');
  }

  const blocks = parseBlocks(cleanText);
  const optMatch = rawText.match(/<option>([\s\S]*?)<\/option>/i);
  const w3gMatch = !optMatch ? rawText.match(/<w3g>([\s\S]*?)<\/w3g>/i) : null;
  const optRaw = optMatch ? optMatch[1] : (w3gMatch ? w3gMatch[1] : '');
  const options = optRaw
    ? optRaw.trim().split(/\r?\n/).map((l: string) => l.trim().replace(/^\d+\.\s*/, '')).filter(Boolean)
    : [];

  return (
    <div className="dz-story">
      <div className="dz-story-inner">
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
