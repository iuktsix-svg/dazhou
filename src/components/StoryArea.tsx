import { useRef, useEffect, useState } from 'react';
import { type ChatMessage, USER_ROLE } from '../sillytavern';
import { useSillytavern } from '../hooks/useSillytavern';
import { Clock, MapPin, Heart, Sparkles, RefreshCw, Edit3, Check, X } from 'lucide-react';

interface Props {
  messages: ChatMessage[]; streamingText: string; isStreaming: boolean;
  chatId?: string | null;
  statusLocation?: string;
  statusTime?: string;
  onOption: (text: string) => void;
  onRegenerate?: () => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
}

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

function cleanContent(text: string, stripTags: string[]) {
  let c = text.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/^#{1,3}\s*正文\s*\n?/gim, '')
    .replace(/<maintext>/gi, '').replace(/<\/maintext>/gi, '')
    .replace(/<option>[\s\S]*?<\/option>/gi, '')
    .replace(/<var\s[^>]*\/>/gi, '');
  for (const tag of stripTags) c = c.replace(new RegExp(`<${tag}>[\\s\\S]*?<\\/${tag}>`, 'gi'), '');
  return c;
}

function Divider() { return <div className="sc-divider"><span /></div>; }
function TransitionDivider({ text }: { text: string }) {
  return <div className="sc-transition"><span className="sc-transition-line" /><span className="sc-transition-text">{text}</span><span className="sc-transition-line" /></div>;
}
function parseTransitions(text: string) {
  const parts: (string | { type: 'transition'; text: string })[] = [];
  const regex = /<transition>([\s\S]*?)<\/transition>/gi;
  let last = 0; let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) { if (m.index > last) parts.push(text.slice(last, m.index)); parts.push({ type: 'transition', text: m[1].trim() }); last = m.index + m[0].length; }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

type Layer = { role: 'you' | 'ai' | 'opening'; text: string; id: string };

export function StoryArea({ messages, streamingText, isStreaming, statusLocation, statusTime, onOption, onRegenerate, onEditMessage }: Props) {
  const { settings } = useSillytavern();
  const stripTags = settings?.stripTags || ['thinking', 'think', 'sum', 'vars'];
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Status bar: use props for initial display, DB poll for updates
  const currentLocation = statusLocation || '大周 · 江湖';
  const currentTime = statusTime || '承平五十年 · 子时';

  // Stats polling (moved from CommandBar so input has room on mobile)
  const { activeChat } = useSillytavern();
  const [stats, setStats] = useState({ hp: 0, hpMax: 100, mp: 0, mpMax: 100, demon: 0 });
  useEffect(() => {
    const update = () => {
      const vars = (activeChat?.variables || {}) as unknown as Record<string, unknown>;
      const p = (vars['主角状态'] || {}) as Record<string, unknown>;
      setStats({
        hp: Number(p['当前气血'] || 0), hpMax: Number(p['气血上限'] || 100),
        mp: Number(p['当前真气'] || 0), mpMax: Number(p['真气上限'] || 100),
        demon: Number(p['心魔值'] || vars['心魔值'] || 0),
      });
    };
    update();
    const iv = setInterval(update, 2000);
    return () => clearInterval(iv);
  }, [activeChat]);

  const hasAI = messages.some(m => m.role === 'assistant');
  const layers: Layer[] = [];
  for (const msg of messages) {
    if (msg.role === 'system') continue;
    if (msg.role === USER_ROLE) { if (msg.content.includes('[玩家信息]')) continue; const isOpening = !hasAI && layers.length === 0; layers.push({ role: isOpening ? 'opening' : 'you', text: msg.content, id: msg.id }); }
    else layers.push({ role: 'ai', text: msg.content, id: msg.id });
  }

  const lastAI = [...layers].reverse().find(l => l.role === 'ai');
  const latestText = streamingText || lastAI?.text || '';
  const optMatch = latestText.match(/<option>([\s\S]*?)<\/option>/i);
  const options = optMatch?.[1]?.trim().split(/\r?\n/).map((l: string) => l.trim().replace(/^\d+\.\s*/, '')).filter(Boolean) || [];

  const storyRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (storyRef.current) storyRef.current.scrollTop = storyRef.current.scrollHeight; }, [streamingText, messages.length]);

  function renderLayer(layer: Layer) {
    if (layer.role === 'opening') {
      // eslint-disable-next-line react/jsx-key
      return parseTransitions(layer.text).map((part, j) => typeof part === 'string' ? <div key={j}>{parseBlocks(cleanContent(part, stripTags)).map((b, k) => b.type === 'npc' ? <div key={k} className="dz-bubble"><div className="dz-bubble-label">{b.name}</div><div className="dz-bubble-text">{b.text}</div></div> : <div key={k} className="dz-narration">{b.text}</div>)}</div> : <TransitionDivider key={j} text={part.text} />);
    }
    if (layer.role === 'you') {
      if (editingId === layer.id) return <div className="sc-you"><span className="sc-you-dot">你</span><div style={{ flex: 1 }}><textarea className="st-textarea" style={{ minHeight: 60, fontSize: 'var(--text-sm)' }} value={editText} onChange={e => setEditText(e.target.value)} /><div style={{ display: 'flex', gap: 6, marginTop: 6 }}><button className="wx-btn-sm wx-btn-accent" onClick={() => { onEditMessage?.(layer.id, editText); setEditingId(null); }}><Check size={12} />确认</button><button className="wx-btn-sm wx-btn-ghost" onClick={() => setEditingId(null)}><X size={12} />取消</button></div></div></div>;
      return <div className="sc-you"><span className="sc-you-dot">你</span><span className="sc-you-text">{layer.text.length > 200 ? layer.text.slice(0, 200) + '…' : layer.text}</span>{!isStreaming && onEditMessage && <button className="sc-edit-btn" onClick={() => { setEditingId(layer.id); setEditText(layer.text); }} title="编辑"><Edit3 size={10} /></button>}</div>;
    }
    // AI layer
    if (editingId === layer.id) return <div style={{ marginBottom: 16 }}><textarea className="st-textarea" style={{ minHeight: 120, fontSize: 'var(--text-xs)' }} value={editText} onChange={e => setEditText(e.target.value)} /><div style={{ display: 'flex', gap: 6, marginTop: 6 }}><span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-2xs)', color: 'var(--wx-ink-dim)', flex: 1, alignSelf: 'center' }}>AI 原始回复（包含 &lt;sum&gt; &lt;var&gt; 等标签）</span><button className="wx-btn-sm wx-btn-ghost" onClick={() => setEditingId(null)}><X size={12} />关闭</button></div></div>;
    return <div className="sc-ai-wrap">{parseTransitions(layer.text).map((part, j) => typeof part === 'string' ? <div key={j}>{parseBlocks(cleanContent(part, stripTags)).map((b, k) => b.type === 'npc' ? <div key={k} className="dz-bubble"><div className="dz-bubble-label">{b.name}</div><div className="dz-bubble-text">{b.text}</div></div> : <div key={k} className="dz-narration">{b.text}</div>)}</div> : <TransitionDivider key={j} text={part.text} />)}{!isStreaming && <button className="sc-edit-btn sc-edit-btn-ai" onClick={() => { setEditingId(layer.id); setEditText(layer.text); }} title="原始回复"><Edit3 size={10} /></button>}</div>;
  }

  return (
    <div className="dz-story">
      <div className="sc-status">
        <span className="sc-status-item"><MapPin size={13} />{currentLocation}</span>
        <span className="sc-status-item"><Clock size={13} />{currentTime}</span>
        <span className="sc-status-item sc-stat-hp"><Heart size={12} />{stats.hp}/{stats.hpMax}</span>
        <span className="sc-status-item sc-stat-mp"><Sparkles size={12} />{stats.mp}/{stats.mpMax}</span>
      </div>
      <div className="dz-story-inner" ref={storyRef}>
        {layers.map((layer, i) => <div key={layer.id}>{i > 0 && <Divider />}{renderLayer(layer)}</div>)}
        {isStreaming && streamingText && <div><Divider />{parseTransitions(streamingText).map((part, j) => typeof part === 'string' ? <div key={j}>{parseBlocks(cleanContent(part, stripTags)).map((b, k) => b.type === 'npc' ? <div key={k} className="dz-bubble"><div className="dz-bubble-label">{b.name}</div><div className="dz-bubble-text">{b.text}</div></div> : <div key={k} className="dz-narration">{b.text}</div>)}</div> : <TransitionDivider key={j} text={part.text} />)}<span className="dz-cursor" /></div>}
        {isStreaming && !streamingText && <div className="sc-waiting"><span className="sc-waiting-dot" /><span className="sc-waiting-dot" /><span className="sc-waiting-dot" /></div>}
        {!isStreaming && onRegenerate && layers.some(l => l.role === 'ai') && <div style={{ textAlign: 'center', marginTop: 16 }}><button className="wx-btn-sm wx-btn-outline" onClick={onRegenerate}><RefreshCw size={12} />重新生成</button></div>}
      </div>
      {options.length > 0 && <div className="dz-options">{options.map((opt: string, i: number) => <div key={i} className="dz-option" onClick={() => onOption(opt)}><div className="opt-idx">选项 {i + 1}</div><div className="opt-text">{opt}</div></div>)}</div>}
    </div>
  );
}
