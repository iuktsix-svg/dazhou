import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSillytavern } from '../../hooks/useSillytavern';
import { Heart, Shield, Coins, ChevronRight, X } from 'lucide-react';

interface NPCInfo {
  name: string;
  attitude?: {
    情感?: number;  // affection
    敬畏?: number;  // awe/fear
    利益?: number;  // profit
  };
  relation?: string;
  innerThought?: string;  // 内心短评
}

function parseNPCs(variables: Record<string, string | number>): NPCInfo[] {
  const raw = variables['江湖人际录'] || variables['主角状态.江湖人际录'];
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((npc: unknown) => {
      if (typeof npc === 'object' && npc) {
        const obj = npc as Record<string, unknown>;
        return {
          name: String(obj.姓名 || obj.name || '未知人物'),
          attitude: {
            情感: Number(obj.情感 || 0),
            敬畏: Number(obj.敬畏 || 0),
            利益: Number(obj.利益 || 0),
          },
          relation: String(obj.关系 || obj.relation || ''),
          innerThought: String(obj.内心短评 || obj.innerThought || ''),
        };
      }
      return { name: String(npc) };
    });
  }
  if (typeof raw === 'object') {
    return Object.entries(raw as Record<string, unknown>).map(([name, data]) => {
      const obj = data as Record<string, unknown> || {};
      return {
        name,
        attitude: {
          情感: Number(obj.情感 || 0),
          敬畏: Number(obj.敬畏 || 0),
          利益: Number(obj.利益 || 0),
        },
        relation: String(obj.关系 || obj.relation || ''),
        innerThought: String(obj.内心短评 || obj.innerThought || ''),
      };
    });
  }
  return [];
}

export function ContactsTab() {
  const { activeChat } = useSillytavern();
  const vars = activeChat?.variables || {};
  const npcs = useMemo(() => parseNPCs(vars), [vars]);
  const [selectedNPC, setSelectedNPC] = useState<NPCInfo | null>(null);

  return (
    <div style={{ fontFamily: 'var(--font-display)' }}>
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--gold)', fontFamily: 'var(--font-ui)', marginBottom: 8, letterSpacing: '0.05em' }}>
        江湖人际录
      </div>

      {npcs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--moon-dim)', fontSize: 'var(--text-sm)' }}>
          尚未结识江湖人士
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {npcs.map((npc, i) => (
            <motion.button
              key={npc.name}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ x: -4 }}
              onClick={() => setSelectedNPC(npc)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px',
                background: 'var(--ink-card)',
                border: '1px solid var(--ink-border)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'var(--ink-deep)', border: '1px solid var(--ink-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-seal)', fontSize: '1rem',
                color: 'var(--moon-white)',
                flexShrink: 0,
              }}>
                {npc.name[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--moon-white)', fontWeight: 500 }}>
                  {npc.name}
                </div>
                {npc.relation && (
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--moon-dim)', fontFamily: 'var(--font-ui)' }}>
                    {npc.relation}
                  </div>
                )}
              </div>
              <ChevronRight size={14} style={{ color: 'var(--moon-dim)' }} />
            </motion.button>
          ))}
        </div>
      )}

      {/* NPC Detail Drawer */}
      <AnimatePresence>
        {selectedNPC && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            style={{
              position: 'fixed', right: 0, top: 0, bottom: 0,
              width: 320, maxWidth: '90vw',
              background: 'var(--ink-surface)',
              borderLeft: '1px solid var(--ink-border)',
              zIndex: 'var(--z-modal, 300)',
              padding: 20,
              overflow: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', margin: 0, fontSize: 'var(--text-lg)' }}>
                {selectedNPC.name}
              </h3>
              <button onClick={() => setSelectedNPC(null)} style={{
                background: 'none', border: 'none', color: 'var(--moon-dim)', cursor: 'pointer',
              }}>
                <X size={18} />
              </button>
            </div>

            {selectedNPC.relation && (
              <div style={{ fontSize: 'var(--text-sm)', color: 'var(--moon-dim)', marginBottom: 16, fontFamily: 'var(--font-ui)' }}>
                {selectedNPC.relation}
              </div>
            )}

            {/* Attitude dimensions */}
            {selectedNPC.attitude && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--moon-dim)', marginBottom: 8, fontFamily: 'var(--font-ui)' }}>
                  态度
                </div>
                <AttitudeBar icon={<Heart size={12} />} label="情感" value={selectedNPC.attitude.情感 ?? 0} color="var(--vermillion)" />
                <AttitudeBar icon={<Shield size={12} />} label="敬畏" value={selectedNPC.attitude.敬畏 ?? 0} color="var(--indigo)" />
                <AttitudeBar icon={<Coins size={12} />} label="利益" value={selectedNPC.attitude.利益 ?? 0} color="var(--gold)" />
              </div>
            )}

            {/* Inner thought */}
            {selectedNPC.innerThought && (
              <div style={{
                padding: 12, background: 'var(--ink-deep)',
                border: '1px solid var(--ink-border)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-xs)', color: 'var(--moon-dim)',
                lineHeight: 1.7, fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
              }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--moon-dim)', fontFamily: 'var(--font-ui)', marginBottom: 4, fontStyle: 'normal' }}>
                  内心短评
                </div>
                {selectedNPC.innerThought}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AttitudeBar({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number; color: string;
}) {
  const pct = Math.max(0, Math.min(100, ((value + 100) / 200) * 100));
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-ui)', color: 'var(--moon-dim)', marginBottom: 2 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{icon}{label}</span>
        <span style={{ color: value > 0 ? 'var(--jade)' : value < 0 ? 'var(--vermillion)' : 'var(--moon-dim)' }}>
          {value > 0 ? '+' : ''}{value}
        </span>
      </div>
      <div style={{ height: 4, background: 'var(--ink-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 'var(--radius-full)', transition: 'width 0.5s ease' }} />
      </div>
    </div>
  );
}
