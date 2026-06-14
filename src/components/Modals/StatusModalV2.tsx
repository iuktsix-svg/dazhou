import { useEffect, useState } from 'react';
import { getChats } from '../../sillytavern/database';

interface Props { isOpen: boolean; onClose: () => void; }

export function StatusModal({ isOpen, onClose }: Props) {
  const [data, setData] = useState<Record<string, unknown>>({});
  useEffect(() => { if (!isOpen) return; getChats().then(chats => { const v = (chats[0]?.variables || {}) as Record<string, unknown>; setData({ ...v, ...((v['主角状态'] || {}) as Record<string, unknown>) }); }); }, [isOpen]);
  if (!isOpen) return null;

  const attrs = (data['基础属性'] || {}) as Record<string, unknown>;
  const kungfus = (data['已学武学'] || {}) as Record<string, { 武学描述?: string }>;
  const realm = String(data['武功境界'] || '--'); const silver = Number(data['持有银两'] || 0);
  const hp = Number(data['当前气血'] || 0); const hpMax = Number(data['气血上限'] || 100);
  const mp = Number(data['当前真气'] || 0); const mpMax = Number(data['真气上限'] || 100);
  const exp = Number(data['当前阅历'] || 0); const expMax = Number(data['破境所需阅历'] || 100);

  const StatB = ({ l, c, m, color }: { l: string; c: number; m: number; color: string }) => (
    <div className="wx-stat"><div className="wx-stat-label"><span>{l}</span><span>{c}/{m}</span></div><div className="wx-stat-track"><div className="wx-stat-fill" style={{ width: `${Math.min(100,(c/Math.max(m,1))*100)}%`, background: color }} /></div></div>
  );

  return (
    <div className="dz-modal-shell" onClick={onClose}>
      <div className="dz-modal-box" onClick={e => e.stopPropagation()}>
        <div className="dz-modal-head"><h2>个人命盘</h2><button className="dz-modal-close-btn" onClick={onClose}>×</button></div>
        <div className="dz-modal-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
            <div><div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--wx-ink-dim)', marginBottom: 2 }}>武功境界</div><div style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-2xl)', color: 'var(--wx-vermillion)', letterSpacing: 2 }}>{realm}</div></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--wx-ink-dim)', marginBottom: 2 }}>随身财物</div><div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--wx-gold)' }}>{silver} 两</div></div>
          </div>
          <StatB l="气血" c={hp} m={hpMax} color="var(--wx-vermillion)" />
          <StatB l="真气" c={mp} m={mpMax} color="var(--wx-cyan)" />
          <StatB l="阅历" c={exp} m={expMax} color="var(--wx-gold)" />
          <div className="wx-section-title" style={{ marginTop: 20 }}>基础属性</div>
          {Object.keys(attrs).length ? <div className="wx-attrs">{Object.entries(attrs).map(([k, v]) => <div key={k} className="wx-attr"><span className="l">{k}</span><span className="v">{String(v)}</span></div>)}</div> : <div style={{ textAlign: 'center', padding: 16, color: 'var(--wx-ink-dim)', fontSize: 'var(--text-sm)' }}>尚未初始化角色属性</div>}
          <div className="wx-section-title" style={{ marginTop: 20 }}>已领悟武学</div>
          {Object.keys(kungfus).length ? Object.entries(kungfus).map(([n, i]) => <div key={n} style={{ padding: '12px 14px', marginBottom: 8, background: 'var(--wx-card)', border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-md)' }}><div style={{ fontFamily: 'var(--font-title)', fontWeight: 600, color: 'var(--wx-ink)', fontSize: 'var(--text-base)', letterSpacing: 1 }}>{n}</div><div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-dim)' }}>{i?.['武学描述'] || '暂无描述'}</div></div>) : <div style={{ textAlign: 'center', padding: 16, color: 'var(--wx-ink-dim)', fontSize: 'var(--text-sm)' }}>暂未习得武学</div>}
        </div>
        <div className="dz-modal-foot" />
      </div>
    </div>
  );
}
