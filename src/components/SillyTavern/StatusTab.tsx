import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSillytavern } from '../../hooks/useSillytavern';
import { SwordIcon } from '../icons';
import { Heart, Sparkles, Star, MapPin, Activity, Coins } from 'lucide-react';

function parsePlayerState(variables: Record<string, string | number>) {
  const hp = (variables['当前气血'] as number) ?? (variables['主角状态.当前气血'] as number) ?? 100;
  const hpMax = (variables['气血上限'] as number) ?? (variables['主角状态.气血上限'] as number) ?? 100;
  const mp = (variables['当前真气'] as number) ?? (variables['主角状态.当前真气'] as number) ?? 100;
  const mpMax = (variables['真气上限'] as number) ?? (variables['主角状态.真气上限'] as number) ?? 100;
  const exp = (variables['当前阅历'] as number) ?? (variables['主角状态.当前阅历'] as number) ?? 0;
  const expMax = (variables['破境所需阅历'] as number) ?? (variables['主角状态.破境所需阅历'] as number) ?? 100;

  const realm = (variables['武功境界'] as string) ?? (variables['主角状态.武功境界'] as string) ?? '凡骨';
  const alignment = (variables['阵营倾向'] as string) ?? (variables['主角状态.阵营倾向'] as string) ?? '中立';
  const location = (variables['当前所在地点'] as string) ?? '江湖';
  const bodyStatus = (variables['身体状态'] as string) ?? (variables['主角状态.身体状态'] as string) ?? '健康';
  const silver = (variables['持有银两'] as number) ?? (variables['主角状态.持有银两'] as number) ?? 0;

  const attrs = {
    臂力: (variables['臂力'] as number) ?? (variables['主角状态.臂力'] as number) ?? 10,
    身法: (variables['身法'] as number) ?? (variables['主角状态.身法'] as number) ?? 10,
    体魄: (variables['体魄'] as number) ?? (variables['主角状态.体魄'] as number) ?? 10,
    内息: (variables['内息'] as number) ?? (variables['主角状态.内息'] as number) ?? 10,
    灵巧: (variables['灵巧'] as number) ?? (variables['主角状态.灵巧'] as number) ?? 10,
  };

  return { hp, hpMax, mp, mpMax, exp, expMax, realm, alignment, location, bodyStatus, silver, attrs };
}

const ATTR_LABELS: Record<string, string> = {
  臂力: '决定近战威力与负重上限',
  身法: '决定闪避、先手与移动速度',
  体魄: '决定气血上限与抗击打能力',
  内息: '决定真气上限与内功威力',
  灵巧: '决定暗器、机关与精细操作',
};

const REALM_STYLES: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  凡骨: { bg: '#1A1A2E', border: '#3A3A5A', text: '#8899B0', glow: 'rgba(136,153,176,0.2)' },
  淬体: { bg: '#1E2428', border: '#4A5A3A', text: '#8A9A7A', glow: 'rgba(138,154,122,0.2)' },
  冲脉: { bg: '#1E242A', border: '#3A5A6E', text: '#7AAAC0', glow: 'rgba(122,170,192,0.2)' },
  通明: { bg: '#20202E', border: '#5A4A7E', text: '#9A8AC8', glow: 'rgba(154,138,200,0.25)' },
  入微: { bg: '#24202A', border: '#6A4A3A', text: '#C0A060', glow: 'rgba(192,160,96,0.25)' },
  绝顶: { bg: '#242020', border: '#7A3A3A', text: '#D08060', glow: 'rgba(208,128,96,0.3)' },
  宗师: { bg: '#201E1E', border: '#8A6A20', text: '#E0C040', glow: 'rgba(224,192,64,0.3)' },
  天人: { bg: '#1A1A22', border: '#C0A040', text: '#FFD060', glow: 'rgba(255,208,96,0.35)' },
};

export function StatusTab() {
  const { activeChat } = useSillytavern();
  const [attrsOpen, setAttrsOpen] = useState(false);
  const [hoveredAttr, setHoveredAttr] = useState<string | null>(null);

  const vars = activeChat?.variables || {};
  const state = parsePlayerState(vars);
  const rs = REALM_STYLES[state.realm] || REALM_STYLES['凡骨'];

  const StatBar = ({ label, icon, current, max, color, glow }: {
    label: string; icon: React.ReactNode; current: number; max: number; color: string; glow: string;
  }) => (
    <div className="stat-bar-row">
      <div className="stat-bar-label">
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{icon}{label}</span>
        <span>{current}/{max}</span>
      </div>
      <div className="stat-bar-track">
        <motion.div
          className="stat-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, (current / Math.max(max, 1)) * 100))}%` }}
          transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
          style={{ background: color, boxShadow: `0 0 10px ${glow}` }}
        />
      </div>
    </div>
  );

  return (
    <div>
      {/* Realm Badge */}
      <div className="stat-realm-badge" style={{ background: rs.bg, borderColor: rs.border, boxShadow: `0 0 20px ${rs.glow}` }}>
        <SwordIcon size={22} style={{ color: rs.text }} />
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--moon-dim)', marginBottom: 2 }}>武功境界</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 700, color: rs.text, letterSpacing: '0.06em' }}>
            {state.realm}
          </div>
        </div>
      </div>

      {/* Chips */}
      <div className="stat-chip-row">
        <div className="stat-chip"><Star size={11} style={{ marginRight: 4 }} />{state.alignment}</div>
        <div className="stat-chip"><MapPin size={11} style={{ marginRight: 4 }} />{state.location}</div>
        <div className="stat-chip"><Activity size={11} style={{ marginRight: 4 }} />{state.bodyStatus}</div>
      </div>

      {/* HP/MP/Exp Bars */}
      <StatBar label="气血" icon={<Heart size={12} />} current={state.hp} max={state.hpMax} color="var(--vermillion)" glow="var(--vermillion-glow)" />
      <StatBar label="真气" icon={<Sparkles size={12} />} current={state.mp} max={state.mpMax} color="var(--indigo)" glow="rgba(58,90,140,0.3)" />
      <StatBar label="阅历" icon={<Star size={12} />} current={state.exp} max={state.expMax} color="var(--gold)" glow="var(--gold-glow)" />

      {/* Silver */}
      <div className="stat-silver">
        <Coins size={16} style={{ color: 'var(--gold)' }} />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', color: 'var(--moon-dim)' }}>银两</span>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--gold)', marginLeft: 'auto' }}>
          {state.silver.toLocaleString()} 两
        </span>
      </div>

      {/* Attributes */}
      <button className="stat-attrs-toggle" onClick={() => setAttrsOpen(!attrsOpen)}>
        基础属性
        <span style={{ transform: attrsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▾</span>
      </button>

      {attrsOpen && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ overflow: 'hidden', paddingTop: 8 }}>
          {Object.entries(state.attrs).map(([name, val]) => (
            <div
              key={name}
              className="stat-attr-row"
              onMouseEnter={() => setHoveredAttr(name)}
              onMouseLeave={() => setHoveredAttr(null)}
            >
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', color: 'var(--moon)' }}>{name}</span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--moon)' }}>{val}</span>
              {hoveredAttr === name && (
                <div className="stat-attr-tooltip">{ATTR_LABELS[name]}</div>
              )}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
