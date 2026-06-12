import { useEffect, useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { X } from 'lucide-react';

interface Props { isOpen: boolean; onClose: () => void; }

export function StatusModal({ isOpen, onClose }: Props) {
  const { activeChat } = useSillytavern();
  const [data, setData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!isOpen) return;
    setData({ ...((activeChat?.variables || {}) as Record<string, unknown>), ...(((activeChat?.variables || {}) as Record<string, unknown>)['主角状态'] || {}) as Record<string, unknown> });
  }, [isOpen, activeChat]);

  const attrs = (data['基础属性'] || {}) as Record<string, unknown>;
  const kungfus = (data['已学武学'] || {}) as Record<string, { 武学描述?: string }>;
  const realm = String(data['武功境界'] || '--');
  const silver = Number(data['持有银两'] || 0);
  const hp = Number(data['当前气血'] || 0); const hpMax = Number(data['气血上限'] || 100);
  const mp = Number(data['当前真气'] || 0); const mpMax = Number(data['真气上限'] || 100);
  const exp = Number(data['当前阅历'] || 0); const expMax = Number(data['破境所需阅历'] || 100);

  const StatB = ({ l, c, m, color }: { l: string; c: number; m: number; color: string }) => (
    <div className="dz-stat"><div className="dz-stat-label"><span>{l}</span><span>{c}/{m}</span></div><div className="dz-stat-track"><div className="dz-stat-fill" style={{ width: `${Math.min(100,(c/Math.max(m,1))*100)}%`, background: color, boxShadow: `0 0 6px ${color}60` }} /></div></div>
  );

  return (
    <div className={`dz-modal ${isOpen ? 'on' : ''}`}>
      <div className="dz-modal-halftone" />
      <div className="dz-modal-head"><h2>个人命盘</h2><button className="dz-modal-close" onClick={onClose}><X size={18} /></button></div>
      <div className="dz-modal-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dz-text-dim)', marginBottom: 2 }}>武功境界</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, color: 'var(--dz-white)', letterSpacing: 1 }}>{realm}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dz-text-dim)', marginBottom: 2 }}>随身财物</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--dz-gold)' }}>{silver} 两</div>
          </div>
        </div>
        <StatB l="气血" c={hp} m={hpMax} color="var(--dz-red)" />
        <StatB l="真气" c={mp} m={mpMax} color="var(--dz-blue)" />
        <StatB l="阅历" c={exp} m={expMax} color="var(--dz-gold)" />

        <div className="dz-sec" style={{ marginTop: 20 }}><div className="dz-sec-title">基础属性</div>
          {Object.keys(attrs).length ? <div className="dz-attrs">{Object.entries(attrs).map(([k, v]) => <div key={k} className="dz-attr"><span className="l">{k}</span><span className="v">{String(v)}</span></div>)}</div> : <div className="dz-empty"><div className="gd">尚未初始化角色属性。</div></div>}
        </div>

        <div className="dz-sec"><div className="dz-sec-title">已领悟武学</div>
          {Object.keys(kungfus).length ? Object.entries(kungfus).map(([name, info]) => (
            <div key={name} style={{ padding: 10, marginBottom: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--dz-gray-light)', clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--dz-gold)', marginBottom: 2, fontSize: 14 }}>{name}</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--dz-text-dim)' }}>{info?.['武学描述'] || '暂无描述'}</div>
            </div>
          )) : <div className="dz-empty"><div className="gd">暂未习得武学。<br />可通过拜师学艺、研读秘籍或奇遇获得。</div></div>}
        </div>
      </div>
      <div className="dz-modal-foot" />
    </div>
  );
}
