import { useEffect, useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { Trophy, Star, Swords, Crown, Sparkles } from 'lucide-react';

interface Props { isOpen: boolean; onClose: () => void; }
interface LbEntry { 排名或赏金?: string; 上榜理由与罪状?: string; 最后出没地点?: string; rank?: string; reason?: string; }

const BOARDS = [
  { key: '定海神针榜', label: '定海神针榜', desc: '九位天人·武林至尊', icon: Crown, color: '#f0a030' },
  { key: '太阿录', label: '太阿录', desc: '绝顶高手排行', icon: Swords, color: '#d0a060' },
  { key: '惊蛰榜', label: '惊蛰榜', desc: '三十六席·青年才俊', icon: Sparkles, color: '#60a0d0' },
  { key: '群芳谱', label: '群芳谱', desc: '江湖群芳', icon: Star, color: '#d060a0' },
  { key: '名锋卷', label: '名锋卷', desc: '天下名剑锋镝', icon: Swords, color: '#a0c0d0' },
];

export function LeaderboardModal({ isOpen, onClose }: Props) {
  const { activeChat } = useSillytavern();
  const [boards, setBoards] = useState<Record<string, Record<string, LbEntry>>>({});
  const [tab, setTab] = useState('定海神针榜');

  useEffect(() => {
    if (!isOpen) return;
    setBoards(((activeChat?.variables || {}) as Record<string, unknown>)['武林榜单与悬赏'] as Record<string, Record<string, LbEntry>> || {});
  }, [isOpen, activeChat]);

  if (!isOpen) return null;

  const current = boards[tab] || {};
  const entries = Object.entries(current);
  const boardInfo = BOARDS.find(b => b.key === tab) || BOARDS[0];

  const getRankColor = (i: number) => {
    if (i === 0) return { bg: 'rgba(240,160,48,0.12)', border: 'rgba(240,160,48,0.3)', text: '#f0a030', badge: '🥇' };
    if (i === 1) return { bg: 'rgba(180,180,190,0.1)', border: 'rgba(180,180,190,0.25)', text: '#b8b8c0', badge: '🥈' };
    if (i === 2) return { bg: 'rgba(200,150,100,0.1)', border: 'rgba(200,150,100,0.25)', text: '#c89660', badge: '🥉' };
    return { bg: 'rgba(255,255,255,0.02)', border: 'rgba(46,46,66,0.5)', text: 'var(--dz-text-dim)', badge: `${i + 1}` };
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 580, maxHeight: '84vh', background: 'var(--dz-dark)', border: '1px solid var(--dz-gray-light)', boxShadow: '0 8px 40px rgba(0,0,0,0.8)', clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(197,48,48,0.06) 1px, transparent 1px)', backgroundSize: '8px 8px', pointerEvents: 'none', zIndex: 0 }} />

        {/* Header */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--dz-gray-light)', background: 'rgba(197,48,48,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 4, height: 22, background: 'var(--dz-red)', clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }} />
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700, color: 'var(--dz-white)', letterSpacing: 2, margin: 0 }}>武林榜单</h2>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 2, background: 'none', border: 'none', color: 'var(--dz-text)', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>

        {/* Board tabs */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 4, padding: '12px 16px', overflowX: 'auto', borderBottom: '1px solid rgba(46,46,66,0.5)' }}>
          {BOARDS.map(b => {
            const Icon = b.icon;
            const active = tab === b.key;
            return (
              <button key={b.key} onClick={() => setTab(b.key)} title={b.desc} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                background: active ? 'rgba(197,48,48,0.08)' : 'transparent',
                border: `1px solid ${active ? 'rgba(197,48,48,0.3)' : 'rgba(46,46,66,0.4)'}`,
                borderBottom: active ? `2px solid ${b.color}` : '2px solid transparent',
                color: active ? 'var(--dz-white)' : 'var(--dz-text-dim)',
                cursor: 'pointer', fontFamily: 'var(--font-serif)', fontSize: 13, fontWeight: active ? 600 : 400,
                whiteSpace: 'nowrap', borderRadius: '2px 2px 0 0', transition: 'all 0.15s',
              }}>
                <Icon size={14} style={{ color: active ? b.color : 'var(--dz-text-dim)' }} />
                {b.label}
              </button>
            );
          })}
        </div>

        {/* Board content */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, overflow: 'auto', padding: '16px 20px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dz-text-dim)', marginBottom: 14, letterSpacing: 1 }}>
            {boardInfo.desc} · 收录 {entries.length} 人
          </div>

          {entries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 50 }}>
              <Trophy size={32} style={{ color: 'var(--dz-text-dim)', opacity: 0.3, marginBottom: 12 }} />
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--dz-text-dim)' }}>此榜暂无收录</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--dz-text-dim)', opacity: 0.6, marginTop: 6 }}>随江湖闯荡逐渐解锁</div>
            </div>
          ) : (
            entries.map(([name, info], i) => {
              const rc = getRankColor(i);
              return (
                <div key={name} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '12px 14px', marginBottom: 8,
                  background: rc.bg, border: `1px solid ${rc.border}`,
                  clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
                  transition: 'all 0.15s',
                }}>
                  {/* Rank badge */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(0,0,0,0.3)', border: `2px solid ${rc.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'var(--font-mono)', fontSize: i < 3 ? 16 : 13,
                    fontWeight: 700, color: rc.text, flexShrink: 0, marginTop: 2,
                  }}>
                    {rc.badge}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 700, color: 'var(--dz-white)', letterSpacing: 0.5 }}>{name}</span>
                      {info['排名或赏金'] && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: rc.text, flexShrink: 0, marginLeft: 12 }}>
                          {info['排名或赏金']}
                        </span>
                      )}
                    </div>
                    {info['上榜理由与罪状'] && (
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--dz-text)', lineHeight: 1.6, marginBottom: 4 }}>
                        {info['上榜理由与罪状']}
                      </div>
                    )}
                    {info['最后出没地点'] && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--dz-text-dim)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--dz-text-dim)' }} />
                        {info['最后出没地点']}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div style={{ position: 'relative', zIndex: 1, height: 3, flexShrink: 0, background: 'linear-gradient(90deg, var(--dz-red), var(--dz-gold), var(--dz-red))' }} />
      </div>
    </div>
  );
}
