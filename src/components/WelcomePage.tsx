import { motion } from 'framer-motion';
import { Swords, Archive, Settings, ScrollText } from 'lucide-react';

interface Props {
  onNewGame: () => void;
  onLoadGame: () => void;
  onSettings: () => void;
  onChangelog: () => void;
}

const CARDS = [
  { key: 'new', label: '踏入江湖', desc: '开启一段全新的武侠之旅', icon: Swords, color: '#b5281a', delay: 0.1 },
  { key: 'load', label: '前尘旧事', desc: '继续之前的江湖历程', icon: Archive, color: '#c8a060', delay: 0.2 },
  { key: 'settings', label: '系统设置', desc: '配置 API 与游戏参数', icon: Settings, color: '#5a8ca0', delay: 0.3 },
  { key: 'log', label: '更新日志', desc: '查看版本更新内容', icon: ScrollText, color: '#6a7a5a', delay: 0.4 },
];

export function WelcomePage({ onNewGame, onLoadGame, onSettings, onChangelog }: Props) {
  const handlers: Record<string, () => void> = {
    new: onNewGame, load: onLoadGame, settings: onSettings, log: onChangelog,
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--wx-paper)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Subtle background decoration */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.06,
        backgroundImage: `
          radial-gradient(ellipse at 50% 30%, rgba(181,40,26,0.3) 0%, transparent 60%),
          radial-gradient(ellipse at 20% 70%, rgba(200,160,96,0.2) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 60%, rgba(90,140,160,0.15) 0%, transparent 50%)
        `,
      }} />

      {/* Paper grain */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.03,
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(44,36,22,0.3) 2px, rgba(44,36,22,0.3) 3px)',
      }} />

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 }}
      >
        <h1 style={{
          fontFamily: 'var(--font-title)',
          fontSize: 'clamp(2.5rem, 6vw, 5rem)',
          color: 'var(--wx-vermillion)',
          letterSpacing: '0.15em',
          margin: 0,
          textShadow: '2px 2px 8px rgba(181,40,26,0.15)',
        }}>
          大周日暮录
        </h1>
        <div style={{
          marginTop: 12, fontFamily: 'var(--font-body)',
          fontSize: 'var(--text-base)', color: 'var(--wx-ink-dim)',
          letterSpacing: '0.3em',
        }}>
          承平五十年 · 江湖风云录
        </div>
        {/* Decorative line */}
        <div style={{
          width: 120, height: 1, margin: '16px auto 0',
          background: 'linear-gradient(to right, transparent, var(--wx-gold-dim), transparent)',
        }} />
      </motion.div>

      {/* Cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 16, maxWidth: 520, width: '90%',
        position: 'relative', zIndex: 1,
      }}>
        {CARDS.map(card => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: card.delay, ease: [0.25, 0.1, 0.25, 1] }}
              whileHover={{ y: -4, boxShadow: `0 8px 24px ${card.color}20` }}
              whileTap={{ scale: 0.97 }}
              onClick={handlers[card.key]}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                padding: '28px 20px', cursor: 'pointer',
                background: 'var(--wx-card)', border: '1px solid var(--bdr-subtle)',
                borderRadius: 'var(--rd-lg)', boxShadow: 'var(--sh-sm)',
                transition: 'all 0.2s', textAlign: 'center',
                fontFamily: 'inherit',
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: `${card.color}15`, border: `2px solid ${card.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={22} style={{ color: card.color }} strokeWidth={1.5} />
              </div>
              <div>
                <div style={{
                  fontFamily: 'var(--font-title)', fontSize: 'var(--text-lg)',
                  color: 'var(--wx-ink)', letterSpacing: '0.05em', marginBottom: 4,
                }}>
                  {card.label}
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)',
                  color: 'var(--wx-ink-dim)',
                }}>
                  {card.desc}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Version */}
      <div style={{
        position: 'absolute', bottom: 20,
        fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)',
        color: 'var(--wx-ink-dim)', opacity: 0.5,
      }}>
        v1.0
      </div>
    </div>
  );
}
