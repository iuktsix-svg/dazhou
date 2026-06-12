import { useEffect, useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';

interface Props { isOpen: boolean; onClose: () => void; }
interface LbEntry { 排名或赏金?: string; 上榜理由与罪状?: string; 最后出没地点?: string; }

export function LeaderboardModal({ isOpen, onClose }: Props) {
  const { activeChat } = useSillytavern();
  const [boards, setBoards] = useState<Record<string, Record<string, LbEntry>>>({});
  const [tab, setTab] = useState(0);
  useEffect(() => { if (!isOpen) return; setBoards(((activeChat?.variables || {}) as Record<string, unknown>)['武林榜单与悬赏'] as Record<string, Record<string, LbEntry>> || {}); }, [isOpen, activeChat]);
  if (!isOpen) return null;
  const keys = Object.keys(boards); const cur = keys[tab]; const persons = cur ? boards[cur] : {};

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 520, maxHeight: '82vh', background: 'var(--dz-dark)', border: '1px solid var(--dz-gray-light)', boxShadow: '0 8px 40px rgba(0,0,0,0.8)', clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(197,48,48,0.06) 1px, transparent 1px)', backgroundSize: '8px 8px', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--dz-gray-light)', background: 'rgba(197,48,48,0.08)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--dz-white)', letterSpacing: 1, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 4, height: 22, background: 'var(--dz-red)', clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }} />武林榜单与悬赏</h2>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 2, background: 'none', border: 'none', color: 'var(--dz-text)', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>
        <div style={{ position: 'relative', zIndex: 1, flex: 1, overflow: 'auto', padding: 16 }}>
          {keys.length === 0 ? <div style={{ textAlign: 'center', padding: 40 }}><div style={{ fontSize: 15, color: 'var(--dz-text-dim)', marginBottom: 8 }}>暂无榜单记录</div><div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--dz-text-dim)', opacity: 0.7 }}>在江湖中闯荡后随声望解锁。</div></div> : (<>
            <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto' }}>{keys.map((k, i) => <button key={k} onClick={() => setTab(i)} style={{ padding: '6px 14px', borderRadius: 'var(--radius-full)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12, color: i===tab?'var(--dz-white)':'var(--dz-text-dim)', background: i===tab?'var(--dz-gray)':'transparent', border: `1px solid ${i===tab?'var(--dz-red)':'var(--dz-gray-light)'}`, whiteSpace: 'nowrap' }}>{k}</button>)}</div>
            {Object.keys(persons).length === 0 ? <div style={{ textAlign: 'center', padding: 20, color: 'var(--dz-text-dim)' }}>此榜单暂无记录。</div>
              : Object.entries(persons).map(([n, i]) => <div key={n} style={{ padding: 12, marginBottom: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--dz-gray-light)', clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)' }}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600, color: 'var(--dz-white)' }}>{n}</span><span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--dz-gold)' }}>{i['排名或赏金'] || '--'}</span></div><div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--dz-text)', lineHeight: 1.5 }}>{i['上榜理由与罪状'] || ''}</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dz-text-dim)', marginTop: 6 }}>出没地：{i['最后出没地点'] || '--'}</div></div>)}
          </>)}
        </div>
        <div style={{ position: 'relative', zIndex: 1, height: 3, flexShrink: 0, background: 'linear-gradient(90deg, var(--dz-red), var(--dz-gold), var(--dz-red))' }} />
      </div>
    </div>
  );
}
