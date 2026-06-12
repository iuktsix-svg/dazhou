import { useEffect, useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';

interface Props { isOpen: boolean; onClose: () => void; }
interface NPCData { 基本信息?: Record<string, unknown>; 武学信息?: Record<string, unknown>; 对user态度?: Record<string, unknown>; 所属势力?: string; 武功层次?: string; 好感度?: number; 敬畏度?: number; 利用价值?: number; 当前心理活动?: string; }

export function ContactsModal({ isOpen, onClose }: Props) {
  const { activeChat } = useSillytavern();
  const [npcs, setNpcs] = useState<Record<string, NPCData>>({}); const [sel, setSel] = useState<string | null>(null);
  useEffect(() => { if (!isOpen) return; const raw = ((activeChat?.variables || {}) as Record<string, unknown>)['江湖人际录'] as Record<string, NPCData> || {}; setNpcs(raw); const k = Object.keys(raw); if (k.length && !sel) setSel(k[0]); }, [isOpen, activeChat]);
  const npc = sel ? npcs[sel] : null; const keys = Object.keys(npcs);

  if (!isOpen) return null;

  const AttB = ({ l, v, color }: { l: string; v: string; color: string }) => {
    const vm: Record<string, number> = { '倾心/生死': 100, '知己': 80, '平淡': 50, '臣服/恐惧': 100, '仰望': 80, '忌惮': 60, '平视': 40, '核心盟友': 100, '高价值筹码': 75, '可用之材': 50 };
    const pct = vm[v] !== undefined ? vm[v] : Math.min(100, Math.max(0, Number(v) || 0));
    return (<div style={{ marginBottom: 8 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--dz-text-dim)', marginBottom: 3 }}><span>{l}</span><span>{v}</span></div><div style={{ height: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} /></div></div>);
  };

  const renderDetail = () => {
    if (!npc) return <div style={{ textAlign: 'center', padding: 20, color: 'var(--dz-text-dim)', fontSize: 12 }}>请选择上方一位人物</div>;
    const b = npc.基本信息 || {}; const w = npc.武学信息 || {}; const a = npc.对user态度 || {};
    const extended = Object.keys(b).length > 0 || Object.keys(w).length > 0 || Object.keys(a).length > 0;
    if (extended) return <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--dz-text)', lineHeight: 1.7 }}>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 600, color: 'var(--dz-gold)', marginBottom: 8, paddingLeft: 8, borderLeft: '2px solid var(--dz-red)' }}>基本信息</div>
      <div style={{ display: 'flex', marginBottom: 4 }}><span style={{ width: 80, color: 'var(--dz-text-dim)', fontSize: 11 }}>年龄</span><span>{String(b['年龄'] || '--')}</span></div>
      <div style={{ display: 'flex', marginBottom: 4 }}><span style={{ width: 80, color: 'var(--dz-text-dim)', fontSize: 11 }}>状态</span><span>{String(b['状态'] || '--')}</span></div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 600, color: 'var(--dz-gold)', margin: '12px 0 8px', paddingLeft: 8, borderLeft: '2px solid var(--dz-red)' }}>武学信息</div>
      <div style={{ display: 'flex', marginBottom: 4 }}><span style={{ width: 80, color: 'var(--dz-text-dim)', fontSize: 11 }}>境界</span><span>{String(w['境界'] || '--')}</span></div>
      <div style={{ display: 'flex', marginBottom: 4 }}><span style={{ width: 80, color: 'var(--dz-text-dim)', fontSize: 11 }}>内功</span><span>{String(w['内功'] || '--')}</span></div>
      <div style={{ display: 'flex', marginBottom: 4 }}><span style={{ width: 80, color: 'var(--dz-text-dim)', fontSize: 11 }}>外功</span><span>{String(w['外功'] || '--')}</span></div>
      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 600, color: 'var(--dz-gold)', margin: '12px 0 8px', paddingLeft: 8, borderLeft: '2px solid var(--dz-red)' }}>对我的态度</div>
      <AttB l="情感羁绊" v={String(a['情感羁绊'] || '--')} color="linear-gradient(to right, #b83b5e, #d9534f)" />
      <AttB l="敬畏威慑" v={String(a['敬畏威慑'] || '--')} color="linear-gradient(to right, #2a6c8c, #5bc0de)" />
      <AttB l="利益价值" v={String(a['利益价值'] || '--')} color="linear-gradient(to right, #c8a060, #f0ad4e)" />
      {a['内心短评'] ? <div style={{ marginTop: 12, padding: 12, background: 'rgba(201,166,92,0.04)', borderLeft: '3px solid var(--dz-gold)', fontStyle: 'italic', color: 'var(--dz-text)', fontSize: 12, lineHeight: 1.7 }}>{String(a['内心短评'])}</div> : null}
    </div>;
    return <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--dz-text)' }}>
      <div style={{ display: 'flex', marginBottom: 4 }}><span style={{ width: 80, color: 'var(--dz-text-dim)', fontSize: 11 }}>所属势力</span><span>{npc['所属势力'] || '--'}</span></div>
      <AttB l="好感" v={String(npc['好感度'] || 0)} color="linear-gradient(to right, #b83b5e, #d9534f)" />
      <AttB l="敬畏" v={String(npc['敬畏度'] || 0)} color="linear-gradient(to right, #2a6c8c, #5bc0de)" />
      <AttB l="价值" v={String(npc['利用价值'] || 0)} color="linear-gradient(to right, #c8a060, #f0ad4e)" />
      {npc['当前心理活动'] ? <div style={{ marginTop: 12, padding: 12, background: 'rgba(201,166,92,0.04)', borderLeft: '3px solid var(--dz-gold)', fontStyle: 'italic', color: 'var(--dz-text)', fontSize: 12, lineHeight: 1.7 }}>{String(npc['当前心理活动'])}</div> : null}
    </div>;
  };

  const modalContent = (
    <div style={{ position: 'relative', width: '100%', maxWidth: 520, maxHeight: '82vh', background: 'var(--dz-dark)', border: '1px solid var(--dz-gray-light)', boxShadow: '0 8px 40px rgba(0,0,0,0.8)', clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(197,48,48,0.06) 1px, transparent 1px)', backgroundSize: '8px 8px', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--dz-gray-light)', background: 'rgba(197,48,48,0.08)' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--dz-white)', letterSpacing: 1, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 4, height: 22, background: 'var(--dz-red)', clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }} />江湖人脉</h2>
        <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 2, background: 'none', border: 'none', color: 'var(--dz-text)', cursor: 'pointer', fontSize: 20 }}>×</button>
      </div>
      <div style={{ position: 'relative', zIndex: 1, flex: 1, overflow: 'auto', padding: 16 }}>
        {keys.length === 0 ? (<div style={{ textAlign: 'center', padding: 40 }}><div style={{ fontSize: 15, color: 'var(--dz-text-dim)', marginBottom: 8 }}>暂无结识的江湖人士</div><div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--dz-text-dim)', opacity: 0.7 }}>与 NPC 对话、切磋或同行后出现。</div></div>) : (<>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16, scrollbarWidth: 'none' }}>{keys.map(k => <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', flexShrink: 0 }} onClick={() => setSel(k)}><div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--bg-card)', border: `2px solid ${k===sel?'var(--dz-red)':'var(--dz-gray-light)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-ui)', fontSize: 17, fontWeight: 700, color: k===sel?'var(--dz-white)':'var(--dz-text-dim)', transition: 'all 0.2s' }}>{k.charAt(0)}</div><div style={{ fontSize: 11, color: k===sel?'var(--dz-white)':'var(--dz-text-dim)', fontFamily: 'var(--font-sans)' }}>{k}</div></div>)}</div>
          {renderDetail()}
        </>)}
      </div>
      <div style={{ position: 'relative', zIndex: 1, height: 3, flexShrink: 0, background: 'linear-gradient(90deg, var(--dz-red), var(--dz-gold), var(--dz-red))' }} />
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div onClick={e => e.stopPropagation()}>{modalContent}</div>
    </div>
  );
}
