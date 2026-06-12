import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSillytavern } from '../../hooks/useSillytavern';
import { Trophy, Swords, Star, Crown, Sparkles, ChevronLeft } from 'lucide-react';

interface Props { isOpen: boolean; onClose: () => void; }
interface LbEntry { 排名或赏金?: string; 上榜理由与罪状?: string; 最后出没地点?: string; }

const BOOKS = [
  { key: '定海神针榜', label: '定海神针榜', subtitle: '九位天人', icon: Crown, color: '#b8860b', spine: '#8B6914', width: 38 },
  { key: '太阿录', label: '太阿录', subtitle: '绝顶高手', icon: Swords, color: '#8B4513', spine: '#6B3410', width: 34 },
  { key: '惊蛰榜', label: '惊蛰榜', subtitle: '青年才俊', icon: Sparkles, color: '#1E5A7A', spine: '#16445E', width: 36 },
  { key: '群芳谱', label: '群芳谱', subtitle: '江湖群芳', icon: Star, color: '#8B3A5A', spine: '#6B2A44', width: 32 },
  { key: '名锋卷', label: '名锋卷', subtitle: '名剑锋镝', icon: Swords, color: '#4A6A6A', spine: '#3A5A5A', width: 35 },
];

export function LeaderboardModal({ isOpen, onClose }: Props) {
  const { activeChat } = useSillytavern();
  const [boards, setBoards] = useState<Record<string, Record<string, LbEntry>>>({});
  const [openBook, setOpenBook] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setBoards(((activeChat?.variables || {}) as Record<string, unknown>)['武林榜单与悬赏'] as Record<string, Record<string, LbEntry>> || {});
  }, [isOpen, activeChat]);

  if (!isOpen) return null;

  const getRankStyle = (i: number) => {
    if (i === 0) return { bg: 'rgba(184,134,11,0.08)', border: 'rgba(184,134,11,0.3)', badge: '🥇' };
    if (i === 1) return { bg: 'rgba(44,36,22,0.03)', border: 'rgba(44,36,22,0.2)', badge: '🥈' };
    if (i === 2) return { bg: 'rgba(139,69,19,0.06)', border: 'rgba(139,69,19,0.2)', badge: '🥉' };
    return { bg: 'rgba(44,36,22,0.02)', border: 'rgba(44,36,22,0.15)', badge: `${i + 1}` };
  };

  return (
    <div className="dz-modal-shell" onClick={onClose}>
      <div className="dz-modal-box wide" style={{ maxWidth: 660 }} onClick={e => e.stopPropagation()}>
        <div className="dz-modal-head">
          <h2>{openBook ? BOOKS.find(b => b.key === openBook)?.label : '武林藏经阁'}</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {openBook && <button onClick={() => setOpenBook(null)} className="wx-btn wx-btn-outline" style={{ padding: '6px 14px', fontSize: 'var(--text-xs)' }}><ChevronLeft size={14} /> 书架</button>}
            <button className="dz-modal-close-btn" onClick={onClose}>×</button>
          </div>
        </div>
        <div className="dz-modal-body">
          {/* ============ BOOKSHELF VIEW ============ */}
          {!openBook && (
            <div>
              {/* Shelf */}
              <div style={{
                position: 'relative', padding: '30px 10px 20px',
                background: 'linear-gradient(180deg, var(--wx-paper-light) 0%, var(--wx-paper-dark) 100%)',
                border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-md)',
              }}>
                {/* Shelf board */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 10,
                  background: 'linear-gradient(180deg, #8B7355 0%, #6B5335 50%, #5A4328 100%)',
                  borderRadius: '0 0 var(--rd-md) var(--rd-md)', boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }} />
                {/* Shelf shadow */}
                <div style={{
                  position: 'absolute', bottom: 10, left: 0, right: 0, height: 3,
                  background: 'rgba(0,0,0,0.2)',
                }} />

                {/* Books */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 6, paddingBottom: 16, position: 'relative', zIndex: 1 }}>
                  {BOOKS.map((book) => {
                    const Icon = book.icon;
                    const entries = boards[book.key] || {};
                    const count = Object.keys(entries).length;
                    return (
                      <motion.div
                        key={book.key}
                        whileHover={{ y: -8, scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setOpenBook(book.key)}
                        style={{
                          width: book.width, cursor: 'pointer', position: 'relative',
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                        }}
                      >
                        {/* Book spine top shadow */}
                        <div style={{
                          width: book.width - 4, height: 140,
                          background: `linear-gradient(180deg, ${book.color} 0%, ${book.spine} 100%)`,
                          borderRadius: '2px 4px 4px 2px',
                          boxShadow: `2px 2px 8px rgba(0,0,0,0.2), inset 1px 0 2px rgba(255,255,255,0.1)`,
                          display: 'flex', flexDirection: 'column', alignItems: 'center',
                          justifyContent: 'space-between', padding: '12px 4px',
                          position: 'relative',
                        }}>
                          {/* Spine lines */}
                          <div style={{ width: '70%', height: 1, background: 'rgba(255,255,255,0.15)' }} />
                          {/* Vertical title */}
                          <div style={{
                            writingMode: 'vertical-rl', fontFamily: 'var(--font-title)',
                            fontSize: 14, color: '#fff', letterSpacing: 4, fontWeight: 700,
                            textShadow: '1px 1px 2px rgba(0,0,0,0.4)',
                          }}>
                            {book.label}
                          </div>
                          <div style={{ width: '70%', height: 1, background: 'rgba(255,255,255,0.15)' }} />
                          {/* Icon at bottom of spine */}
                          <Icon size={14} style={{ color: 'rgba(255,255,255,0.6)' }} />
                        </div>

                        {/* Book bottom */}
                        <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--wx-ink-dim)', fontFamily: 'var(--font-body)', marginTop: 4, textAlign: 'center' }}>
                          {book.subtitle}
                        </div>
                        {count > 0 && (
                          <div style={{
                            position: 'absolute', top: -8, right: 2,
                            minWidth: 18, height: 18, borderRadius: 9,
                            background: 'var(--wx-vermillion)', color: '#fff',
                            fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: 'var(--font-body)', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                          }}>{count}</div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
              <div style={{ textAlign: 'center', marginTop: 12, fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--wx-ink-dim)' }}>
                点击书卷翻阅榜单
              </div>
            </div>
          )}

          {/* ============ BOOK CONTENT (page view) ============ */}
          <AnimatePresence mode="wait">
            {openBook && (
              <motion.div
                key={openBook}
                initial={{ rotateY: -90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={{ rotateY: 90, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                style={{ perspective: 1200, transformStyle: 'preserve-3d' }}
              >
                {(() => {
                  const bookInfo = BOOKS.find(b => b.key === openBook)!;
                  const current = boards[bookInfo.key] || {};
                  const entries = Object.entries(current);
                  return (
                    <div>
                      {/* Book header */}
                      <div style={{
                        padding: '16px 18px', marginBottom: 16,
                        background: `linear-gradient(135deg, ${bookInfo.color}10, ${bookInfo.spine}08)`,
                        border: `1px solid ${bookInfo.color}30`,
                        borderLeft: `4px solid ${bookInfo.color}`,
                        borderRadius: '0 var(--rd-md) var(--rd-md) 0',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {<bookInfo.icon size={20} style={{ color: bookInfo.color }} />}
                          <div>
                            <div style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-lg)', color: bookInfo.color, letterSpacing: 2 }}>{bookInfo.label}</div>
                            <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--wx-ink-dim)', marginTop: 2 }}>{bookInfo.subtitle} · 收录 {entries.length} 人</div>
                          </div>
                        </div>
                      </div>

                      {/* Page edge effect */}
                      <div style={{
                        position: 'relative', marginBottom: 12,
                        padding: '2px 0', background: 'linear-gradient(180deg, rgba(44,36,22,0.04) 0%, transparent 100%)',
                      }} />

                      {entries.length === 0 ? (
                        <div className="wx-empty">
                          <Trophy size={32} style={{ color: bookInfo.color, opacity: 0.3, marginBottom: 10 }} />
                          <div className="tl">此榜暂无收录</div>
                          <div className="gd">随江湖闯荡逐渐解锁</div>
                        </div>
                      ) : (
                        <div style={{ maxHeight: '50vh', overflow: 'auto' }}>
                          {entries.map(([name, info], i) => {
                            const rs = getRankStyle(i);
                            return (
                              <motion.div
                                key={name}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                style={{
                                  display: 'flex', gap: 14, alignItems: 'flex-start',
                                  padding: '14px 16px', marginBottom: 8,
                                  background: rs.bg, border: `1px solid ${rs.border}`,
                                  borderRadius: 'var(--rd-md)', boxShadow: 'var(--sh-sm)',
                                }}
                              >
                                <div style={{
                                  width: 40, height: 40, borderRadius: '50%',
                                  background: 'var(--wx-surface)', border: `2px solid ${rs.border}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontFamily: 'var(--font-body)', fontSize: i < 3 ? 18 : 14,
                                  fontWeight: 700, color: bookInfo.color, flexShrink: 0,
                                }}>
                                  {rs.badge}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                                    <span style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-base)', color: 'var(--wx-ink)', fontWeight: 600, letterSpacing: 1 }}>{name}</span>
                                    {info['排名或赏金'] && <span style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', fontWeight: 700, color: bookInfo.color, marginLeft: 12 }}>{info['排名或赏金']}</span>}
                                  </div>
                                  {info['上榜理由与罪状'] && <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-light)', lineHeight: 1.6 }}>{info['上榜理由与罪状']}</div>}
                                  {info['最后出没地点'] && <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-2xs)', color: 'var(--wx-ink-dim)', marginTop: 4 }}>📍 {info['最后出没地点']}</div>}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="dz-modal-foot" />
      </div>
    </div>
  );
}
