import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSillytavern } from '../../hooks/useSillytavern';
import { ItemDetailModal, type GameItem } from './ItemDetailModal';
// lucide icons used for equip slot labels

type Category = '全部' | '丹药' | '武器' | '杂物' | '秘籍' | '防具' | '饰品';
const CATEGORIES: Category[] = ['全部', '丹药', '武器', '防具', '饰品', '秘籍', '杂物'];

const TYPE_COLORS: Record<string, string> = {
  '丹药': 'var(--jade)',
  '武器': 'var(--vermillion)',
  '杂物': 'var(--moon-dim)',
  '秘籍': 'var(--gold)',
  '防具': 'var(--indigo)',
  '饰品': 'var(--gold-light)',
};

function parseItems(variables: Record<string, string | number>): GameItem[] {
  const raw = variables['随身行囊'] || variables['主角状态.随身行囊'];
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((item: unknown) => {
      if (typeof item === 'object' && item) {
        const obj = item as Record<string, unknown>;
        return {
          name: String(obj.名称 || obj.name || '未知物品'),
          type: String(obj.类型 || obj.type || '杂物'),
          quantity: Number(obj.数量 || obj.quantity || 1),
          description: obj.描述 || obj.description ? String(obj.描述 || obj.description) : undefined,
        };
      }
      return { name: String(item), type: '杂物', quantity: 1 };
    });
  }
  return [];
}

export function InventoryTab() {
  const { activeChat, sendMessage } = useSillytavern();
  const [category, setCategory] = useState<Category>('全部');
  const [selectedItem, setSelectedItem] = useState<GameItem | null>(null);

  const vars = activeChat?.variables || {};
  const items = useMemo(() => parseItems(vars), [vars]);
  const filtered = category === '全部' ? items : items.filter(i => i.type === category);

  const handleUse = () => { if (selectedItem) { sendMessage(`使用「${selectedItem.name}」。`); setSelectedItem(null); } };
  const handleEquip = () => { if (selectedItem) { sendMessage(`装备「${selectedItem.name}」。`); setSelectedItem(null); } };
  const handleDiscard = () => { if (selectedItem) { sendMessage(`丢弃「${selectedItem.name}」。`); setSelectedItem(null); } };

  return (
    <div>
      <div className="inv-category-row">
        {CATEGORIES.map(cat => (
          <button key={cat} className={`inv-category-chip ${category === cat ? 'active' : ''}`} onClick={() => setCategory(cat)}>
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-text">行囊空空</div></div>
      ) : (
        <div className="inv-grid">
          <AnimatePresence>
            {filtered.map((item, i) => (
              <motion.button
                key={`${item.name}-${i}`}
                className="inv-item-card"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setSelectedItem(item)}
              >
                <div className="inv-item-initial" style={{ borderColor: TYPE_COLORS[item.type] || 'var(--moon-dim)', color: TYPE_COLORS[item.type] || 'var(--moon-dim)' }}>
                  {item.name[0]}
                </div>
                <div className="inv-item-name">{item.name}</div>
                {item.quantity > 1 && <div className="inv-item-qty">×{item.quantity}</div>}
                <div className="inv-item-dot" style={{ background: TYPE_COLORS[item.type] || 'var(--moon-dim)' }} />
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Equipment */}
      <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--ink-border)' }}>
        <div className="panel-section-title">装备栏</div>
        <EquipSlot label="武器" />
        <EquipSlot label="防具" />
        <EquipSlot label="饰品" />
      </div>

      <AnimatePresence>
        {selectedItem && (
          <ItemDetailModal
            item={selectedItem} onClose={() => setSelectedItem(null)}
            onUse={['丹药', '杂物', '秘籍'].includes(selectedItem.type) ? handleUse : undefined}
            onEquip={['武器', '防具', '饰品'].includes(selectedItem.type) ? handleEquip : undefined}
            onDiscard={handleDiscard}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function EquipSlot({ label }: { label: string }) {
  return (
    <div className="equip-slot">
      <div className="equip-slot-icon">{label[0]}</div>
      <div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--moon-dim)' }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xs)', color: 'var(--moon-faint)' }}>（空）</div>
      </div>
    </div>
  );
}
