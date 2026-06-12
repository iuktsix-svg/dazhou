import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export interface GameItem {
  name: string;
  type: string;     // 丹药 / 武器 / 杂物 / 秘籍 / 防具 / 饰品
  quantity: number;
  description?: string;
}

interface Props {
  item: GameItem;
  onClose: () => void;
  onUse?: () => void;
  onEquip?: () => void;
  onDiscard?: () => void;
}

export function ItemDetailModal({ item, onClose, onUse, onEquip, onDiscard }: Props) {
  const typeColors: Record<string, string> = {
    '丹药': 'var(--jade)',
    '武器': 'var(--vermillion)',
    '杂物': 'var(--moon-dim)',
    '秘籍': 'var(--gold)',
    '防具': 'var(--indigo)',
    '饰品': 'var(--gold-light)',
  };

  const accentColor = typeColors[item.type] || 'var(--moon-dim)';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 'var(--z-modal, 300)', padding: 20,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        style={{
          background: 'var(--ink-surface)',
          border: `1px solid var(--ink-border)`,
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          maxWidth: 360, width: '100%',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 12,
          background: 'none', border: 'none', color: 'var(--moon-dim)',
          cursor: 'pointer',
        }}>
          <X size={18} />
        </button>

        {/* Type badge */}
        <div style={{
          display: 'inline-block', padding: '3px 10px',
          background: `${accentColor}20`, border: `1px solid ${accentColor}40`,
          borderRadius: 'var(--radius-full)', fontSize: 'var(--text-xs)',
          fontFamily: 'var(--font-ui)', color: accentColor,
          marginBottom: 12,
        }}>
          {item.type}
        </div>

        {/* Name */}
        <h3 style={{
          fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)',
          color: 'var(--gold)', margin: '0 0 8px',
        }}>
          {item.name}
        </h3>

        {/* Quantity */}
        {item.quantity > 1 && (
          <div style={{
            fontSize: 'var(--text-sm)', color: 'var(--moon-dim)',
            fontFamily: 'var(--font-ui)', marginBottom: 12,
          }}>
            数量：{item.quantity}
          </div>
        )}

        {/* Description */}
        {item.description && (
          <div style={{
            fontSize: 'var(--text-sm)', color: 'var(--moon-white)',
            fontFamily: 'var(--font-display)', lineHeight: 1.7,
            padding: '12px', background: 'var(--ink-deep)',
            borderRadius: 'var(--radius-md)', marginBottom: 16,
            border: '1px solid var(--ink-border)',
          }}>
            {item.description}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {onDiscard && (
            <button onClick={onDiscard} style={{
              padding: '7px 16px', background: 'transparent',
              border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-md)',
              color: 'var(--moon-dim)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)',
              cursor: 'pointer',
            }}>
              丢弃
            </button>
          )}
          {onEquip && (
            <button onClick={onEquip} style={{
              padding: '7px 16px', background: 'var(--indigo)',
              border: 'none', borderRadius: 'var(--radius-md)',
              color: '#fff', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)',
              cursor: 'pointer',
            }}>
              装备
            </button>
          )}
          {onUse && (
            <button onClick={onUse} style={{
              padding: '7px 16px', background: 'var(--gold)',
              border: 'none', borderRadius: 'var(--radius-md)',
              color: 'var(--ink-deep)', fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)',
              fontWeight: 600, cursor: 'pointer',
            }}>
              使用
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
