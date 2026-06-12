import { useEffect, useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { Crosshair, MapPin } from 'lucide-react';

interface Props { isOpen: boolean; onClose: () => void; onSend: (text: string) => void; }
interface BountyEntry { 排名或赏金?: string; 上榜理由与罪状?: string; 最后出没地点?: string; rank?: string; reason?: string; location?: string; }

export function BountyModal({ isOpen, onClose, onSend }: Props) {
  const { activeChat } = useSillytavern();
  const [bounties, setBounties] = useState<Record<string, BountyEntry>>({});

  useEffect(() => {
    if (!isOpen) return;
    const boards = ((activeChat?.variables || {}) as Record<string, unknown>)['武林榜单与悬赏'] as Record<string, Record<string, BountyEntry>> || {};
    // Extract only the 悬赏榜 / bounty entries
    const raw = boards['追杀悬赏榜'] || boards['悬赏榜'] || boards['追杀榜'] || {};
    setBounties(raw);
  }, [isOpen, activeChat]);

  if (!isOpen) return null;

  const entries = Object.entries(bounties);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 540, maxHeight: '84vh', background: 'var(--dz-dark)', border: '1px solid var(--dz-gray-light)', boxShadow: '0 8px 40px rgba(0,0,0,0.8)', clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(197,48,48,0.08) 1px, transparent 1px)', backgroundSize: '8px 8px', pointerEvents: 'none', zIndex: 0 }} />

        {/* Header */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--dz-gray-light)', background: 'rgba(197,48,48,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 4, height: 22, background: 'var(--dz-red)', clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }} />
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, color: 'var(--dz-white)', letterSpacing: 3, margin: 0 }}>悬赏令</h2>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 2, background: 'none', border: 'none', color: 'var(--dz-text)', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, overflow: 'auto', padding: '16px 20px' }}>
          {entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 50 }}>
              <Crosshair size={36} style={{ color: 'var(--dz-text-dim)', opacity: 0.3, marginBottom: 12 }} />
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: '#c8a86c', fontWeight: 700, marginBottom: 8 }}>暂无悬赏</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#8a7a5a', lineHeight: 1.7 }}>
                在江湖中打听消息或揭下告示<br />悬赏目标将汇集于此
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {entries.map(([name, info], i) => {
                const bounty = info['排名或赏金'] || info.rank || '--';
                const crime = info['上榜理由与罪状'] || info.reason || '';
                const loc = info['最后出没地点'] || info.location || '';

                return (
                  <div key={name} style={{
                    padding: '16px 18px',
                    background: `rgba(197,48,48,${0.04 + i * 0.01})`,
                    border: '1px solid rgba(197,48,48,0.2)',
                    borderLeft: '4px solid var(--dz-red)',
                    clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
                    boxShadow: i === 0 ? '0 0 20px rgba(197,48,48,0.08)' : undefined,
                  }}>
                    {/* Name + Bounty */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Crosshair size={18} style={{ color: 'var(--dz-red)' }} />
                        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--dz-white)', letterSpacing: 1 }}>{name}</span>
                      </div>
                      <div style={{
                        padding: '4px 14px', background: 'rgba(197,48,48,0.15)', border: '1px solid rgba(197,48,48,0.3)',
                        clipPath: 'polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%)',
                        fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: '#f0a030',
                      }}>
                        {bounty}
                      </div>
                    </div>

                    {/* Crime */}
                    {crime && (
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--dz-text)', lineHeight: 1.7, marginBottom: 10, paddingLeft: 4 }}>
                        {crime}
                      </div>
                    )}

                    {/* Location + Track */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {loc && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dz-text-dim)' }}>
                          <MapPin size={12} style={{ color: 'var(--dz-red)' }} />
                          {loc}
                        </div>
                      )}
                      <button onClick={() => { onSend(`前往追踪悬赏目标「${name}」，${loc ? `最后出没于${loc}。` : '搜寻其下落。'}`); onClose(); }} style={{
                        padding: '8px 20px', background: 'var(--dz-red)', color: '#fff', border: 'none', cursor: 'pointer',
                        fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, letterSpacing: 1,
                        clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)',
                        boxShadow: '4px 4px 0px rgba(197,48,48,0.3)',
                        transition: 'all 0.15s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--dz-red-light)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--dz-red)'}
                      >
                        前往追踪
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ position: 'relative', zIndex: 1, height: 3, flexShrink: 0, background: 'linear-gradient(90deg, var(--dz-red), #8b0000, var(--dz-red))' }} />
      </div>
    </div>
  );
}
