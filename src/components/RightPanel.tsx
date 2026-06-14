import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ChatSession } from '../sillytavern';
import { Swords, ScrollText, Heart, Sparkles, Star, Skull, Backpack, Warehouse, User } from 'lucide-react';

const REALMS = ['凡骨', '淬体', '冲脉', '通明', '入微', '绝顶', '宗师', '天人'];
const REALM_XP = [0, 100, 300, 600, 1200, 2400, 4800, 9600];

type DrawerType = 'realm' | 'status' | 'martial' | null;

interface Props {
  chat: ChatSession | null;
  openDrawer: DrawerType;
  onOpenDrawer: (d: DrawerType) => void;
  onOpenBag: () => void;
  onOpenStorage: () => void;
}

export function RightPanel({ chat, openDrawer, onOpenDrawer, onOpenBag, onOpenStorage }: Props) {
  const [state, setState] = useState({
    realm: '凡骨', realmIdx: 0, hp: 0, hpMax: 100, mp: 0, mpMax: 100,
    exp: 0, expMax: 100, demon: 0, demonMax: 100, condition: '健康', alignment: '中立',
    attrs: {} as Record<string, unknown>,
    martial: {} as Record<string, { name?: string; desc?: string }>,
  });

  useEffect(() => {
    const update = () => {
      const vars = (chat?.variables || {}) as Record<string, unknown>;
      const p = (vars['主角状态'] || {}) as Record<string, unknown>;
      const realm = String(p['武功境界'] || vars['武功境界'] || '凡骨');
      const ri = REALMS.indexOf(realm); const rIdx = ri >= 0 ? ri : 0;
      const nextXp = rIdx < REALMS.length - 1 ? REALM_XP[rIdx + 1] : REALM_XP[REALMS.length - 1] * 2;

      const rawM = (p['已学武学'] || {}) as Record<string, { 武学描述?: string }>;
      const martial: Record<string, { name?: string; desc?: string }> = {};
      for (const [name, info] of Object.entries(rawM)) {
        let slot = '外功';
        if (name.includes('法') || name.includes('诀') || name.includes('功') || name.includes('经')) slot = '内功';
        else if (name.includes('步') || name.includes('渡')) slot = '轻功';
        else if (name.includes('篇') || name.includes('录')) slot = '秘术';
        if (!martial[slot]?.name) martial[slot] = { name, desc: info['武学描述'] || '' };
      }

      setState({
        realm, realmIdx: rIdx, hp: Number(p['当前气血'] || 0), hpMax: Number(p['气血上限'] || 100),
        mp: Number(p['当前真气'] || 0), mpMax: Number(p['真气上限'] || 100),
        exp: Number(p['当前阅历'] || 0), expMax: nextXp,
        demon: Number(p['心魔值'] || vars['心魔值'] || 0), demonMax: 100,
        condition: String(p['身体状态'] || '健康'), alignment: String(p['阵营倾向'] || '中立'),
        attrs: (p['基础属性'] || {}) as Record<string, unknown>,
        martial,
      });
    };
    update(); const iv = setInterval(update, 2000); return () => clearInterval(iv);
  }, [chat]);

  const nextRealm = state.realmIdx < REALMS.length - 1 ? REALMS[state.realmIdx + 1] : null;
  const realmPct = nextRealm ? Math.min(100, Math.round((state.exp / state.expMax) * 100)) : 100;

  const NavBtn = ({ icon: Icon, label, sub, active, onClick }: {
    icon: typeof Heart; label: string; sub?: string; active?: boolean; onClick: () => void;
  }) => (
    <button className={`dz-nav-item ${active ? 'active' : ''}`} onClick={onClick} title={sub || label}>
      {active && <motion.div layoutId="nav-dr" className="dz-nav-active-bar" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
      {active && <motion.div layoutId="nav-db" className="dz-nav-bg" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
      <Icon className="dz-nav-icon" strokeWidth={active ? 2.5 : 1.5} />
      <span className="dz-nav-label">{label}</span>
      {sub && <span style={{ fontSize: 9, color: 'var(--dz-text-dim)', marginTop: -2, maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>{sub}</span>}
    </button>
  );

  const closeDrawer = () => onOpenDrawer(null);

  return (
    <>
      {/* ---- Icon Nav Strip ---- */}
      <nav className="dz-sidenav" style={{ borderLeft: '1px solid rgba(46,46,66,0.5)', borderRight: 'none' }}>
        {/* Realm */}
        <button className={`dz-nav-item ${openDrawer === 'realm' ? 'active' : ''}`} onClick={() => onOpenDrawer(openDrawer === 'realm' ? null : 'realm')} title="武功境界">
          {openDrawer === 'realm' && <motion.div layoutId="nav-dr1" className="dz-nav-active-bar" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
          <div style={{ position: 'relative', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 36 36" style={{ position: 'absolute' }}>
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15" fill="none" stroke="var(--dz-gold)" strokeWidth="3"
                strokeDasharray={`${realmPct * 0.942} 94.2`} strokeLinecap="round"
                transform="rotate(-90 18 18)" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
            </svg>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--dz-gold)', fontWeight: 700, position: 'relative' }}>{realmPct}%</span>
          </div>
          <span className="dz-nav-label">{state.realm}</span>
        </button>

        <div style={{ width: 36, height: 1, background: 'rgba(46,46,66,0.5)', margin: '6px 0' }} />

        <NavBtn icon={User} label="状态" active={openDrawer === 'status'} onClick={() => onOpenDrawer(openDrawer === 'status' ? null : 'status')} />
        <NavBtn icon={Swords} label="功法" active={openDrawer === 'martial'} onClick={() => onOpenDrawer(openDrawer === 'martial' ? null : 'martial')} />
        <NavBtn icon={Backpack} label="背囊" onClick={onOpenBag} />
        <NavBtn icon={Warehouse} label="仓库" onClick={onOpenStorage} />

        <div style={{ flex: 1 }} />
      </nav>

      {/* ---- Realm Drawer ---- */}
      <AnimatePresence>
        {openDrawer === 'realm' && (
          <Drawer onClose={closeDrawer}>
            <div style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, color: 'var(--dz-gold)', letterSpacing: 3, marginBottom: 8 }}>{state.realm}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--dz-text-dim)', marginBottom: 6 }}>
                {nextRealm ? `${state.exp}/${state.expMax} · 下一境：${nextRealm}` : '已达武道巅峰'}
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${realmPct}%`, background: 'var(--dz-gold)', borderRadius: 3, transition: 'width 0.5s ease', boxShadow: '0 0 8px rgba(201,166,92,0.3)' }} />
              </div>
              <div style={{ marginTop: 16, fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--dz-text)', lineHeight: 1.8, fontStyle: 'italic' }}>
                {state.realmIdx === 0 && '肉身凡胎，尚未踏入武道之门。寿元与常人无异。'}
                {state.realmIdx === 1 && '以药浴、锻打淬炼筋骨皮膜，肉身可扛普通刀剑。'}
                {state.realmIdx === 2 && '打通奇经八脉，内力自丹田而生，可外放伤人。'}
                {state.realmIdx === 3 && '神识初开，可感知周遭气机流动，夜能视物。'}
                {state.realmIdx === 4 && '内力入微，举手投足皆可杀人。寿元增至一百五十载。'}
                {state.realmIdx === 5 && '登临绝顶，一览众山小。宗师之下无敌手。'}
                {state.realmIdx === 6 && '开宗立派之境，内力生生不息。寿元可逾两百。'}
                {state.realmIdx === 7 && '天人合一，举手投足引动天地之力。武林传说之境。'}
              </div>
            </div>
          </Drawer>
        )}
      </AnimatePresence>

      {/* ---- Status Drawer ---- */}
      <AnimatePresence>
        {openDrawer === 'status' && (
          <Drawer onClose={closeDrawer} title="主角状态">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <span style={{ padding: '5px 14px', fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--dz-text-dim)', background: 'var(--dz-gray)', border: '1px solid var(--dz-gray-light)', clipPath: 'polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%)' }}>{state.alignment}</span>
              <span style={{ padding: '5px 14px', fontSize: 13, fontFamily: 'var(--font-mono)', color: state.condition === '健康' ? 'var(--dz-green)' : 'var(--dz-red)', background: 'var(--dz-gray)', border: '1px solid var(--dz-gray-light)', clipPath: 'polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%)' }}>{state.condition}</span>
            </div>
            {[
              ['气血', state.hp, state.hpMax, 'var(--dz-red)'],
              ['真气', state.mp, state.mpMax, 'var(--dz-blue)'],
              ['阅历', state.exp, state.expMax, 'var(--dz-gold)'],
              ['心魔', state.demon, state.demonMax, state.demon >= 80 ? '#c026d3' : 'rgba(255,255,255,0.2)'],
            ].map(([l, c, m, color]) => (
              <div key={String(l)} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--dz-text-dim)', marginBottom: 5 }}>
                  <span>{String(l)}</span><span>{String(c)}/{String(m)}</span>
                </div>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (Number(c) / Math.max(Number(m), 1)) * 100)}%`, background: String(color), borderRadius: 2, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            ))}
            {state.demon >= 80 && (
              <div style={{ padding: '10px 14px', marginBottom: 16, background: state.demon >= 100 ? 'rgba(197,48,48,0.12)' : 'rgba(192,38,211,0.08)', border: `1px solid ${state.demon >= 100 ? 'var(--dz-red)' : 'rgba(192,38,211,0.3)'}`, clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: state.demon >= 100 ? 'var(--dz-red)' : '#c026d3', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Skull size={16} /> {state.demon >= 100 ? '走火入魔！' : '心魔涌动！再增则走火入魔'}
              </div>
            )}

            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600, color: 'var(--dz-gold)', marginBottom: 10, letterSpacing: 1 }}>基础属性</div>
            {Object.keys(state.attrs).length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--dz-text-dim)', textAlign: 'center', padding: 12 }}>尚未初始化</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {Object.entries(state.attrs).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--dz-text-dim)', background: 'rgba(255,255,255,0.01)', clipPath: 'polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%)' }}>
                    <span>{k}</span><span style={{ color: 'var(--dz-gold)', fontWeight: 700, fontSize: 16 }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </Drawer>
        )}
      </AnimatePresence>

      {/* ---- Martial Drawer ---- */}
      <AnimatePresence>
        {openDrawer === 'martial' && (
          <Drawer onClose={closeDrawer} title="武学功法">
            {[
              { key: '内功', label: '内功心法', icon: Sparkles },
              { key: '外功', label: '外功招式', icon: Swords },
              { key: '轻功', label: '轻功身法', icon: Star },
              { key: '秘术', label: '秘术绝学', icon: ScrollText },
            ].map(mt => {
              const skill = state.martial[mt.key];
              const Icon = mt.icon;
              return (
                <div key={mt.key} style={{ padding: '12px 14px', marginBottom: 8, background: skill?.name ? 'rgba(201,166,92,0.04)' : 'rgba(255,255,255,0.01)', border: `1px solid ${skill?.name ? 'rgba(201,166,92,0.2)' : 'var(--dz-gray-light)'}`, clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Icon size={16} style={{ color: skill?.name ? 'var(--dz-gold)' : 'var(--dz-text-dim)' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--dz-text-dim)' }}>{mt.label}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: skill?.name ? 'var(--dz-gold)' : 'var(--dz-text-dim)', fontWeight: skill?.name ? 600 : 400 }}>{skill?.name || '未习得'}</span>
                  </div>
                </div>
              );
            })}
            {Object.values(state.martial).some(s => s?.name) && (
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(192,38,211,0.04)', border: '1px solid rgba(192,38,211,0.15)', borderRadius: 'var(--rd-sm)', fontFamily: 'var(--font-sans)', fontSize: 12, color: '#c026d3', lineHeight: 1.6 }}>
                初学乍练，来去随心。待到绝学在身，弃之如割肉；若背弃师门不传之秘，轻则心魔缠身，重则走火入魔。
              </div>
            )}
          </Drawer>
        )}
      </AnimatePresence>
    </>
  );
}

// Shared drawer shell
function Drawer({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title?: string }) {
  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      style={{
        position: 'absolute', right: 88, top: 0, bottom: 0,
        background: 'var(--dz-dark)', borderLeft: '1px solid rgba(46,46,66,0.5)',
        zIndex: 30, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 18px', borderBottom: '1px solid rgba(46,46,66,0.5)', fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--dz-gold)', letterSpacing: 1, flexShrink: 0 }}>
        {title || '详情'}
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dz-text-dim)', fontSize: 20, padding: '4px 8px' }}>×</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 18 }}>
        {children}
      </div>
    </motion.aside>
  );
}

