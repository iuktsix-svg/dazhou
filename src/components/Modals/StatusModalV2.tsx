import { useEffect, useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';

interface Props { isOpen: boolean; onClose: () => void; }

export function StatusModal({ isOpen, onClose }: Props) {
  const { activeChat } = useSillytavern();
  const [data, setData] = useState<Record<string, unknown>>({});
  useEffect(() => { if (!isOpen) return; setData({ ...((activeChat?.variables || {}) as Record<string, unknown>), ...(((activeChat?.variables || {}) as Record<string, unknown>)['主角状态'] || {}) as Record<string, unknown> }); }, [isOpen, activeChat]);

  const attrs = (data['基础属性'] || {}) as Record<string, unknown>;
  const kungfus = (data['已学武学'] || {}) as Record<string, { 武学描述?: string }>;
  const realm = String(data['武功境界'] || '--'); const silver = Number(data['持有银两'] || 0);
  const hp = Number(data['当前气血'] || 0); const hpMax = Number(data['气血上限'] || 100);
  const mp = Number(data['当前真气'] || 0); const mpMax = Number(data['真气上限'] || 100);
  const exp = Number(data['当前阅历'] || 0); const expMax = Number(data['破境所需阅历'] || 100);

  if (!isOpen) return null;

  const StatB = ({ l, c, m, color }: { l: string; c: number; m: number; color: string }) => (
    <div style={{ marginBottom: 10 }}><div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dz-text-dim)', marginBottom: 3 }}><span>{l}</span><span>{c}/{m}</span></div><div style={{ height: 5, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}><div style={{ height: '100%', width: `${Math.min(100,(c/Math.max(m,1))*100)}%`, background: color, borderRadius: 2, transition: 'width 0.5s ease' }} /></div></div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div onClick={e => e.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 480, maxHeight: '82vh', background: 'var(--dz-dark)', border: '1px solid var(--dz-gray-light)', boxShadow: '0 8px 40px rgba(0,0,0,0.8)', clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(197,48,48,0.06) 1px, transparent 1px)', backgroundSize: '8px 8px', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--dz-gray-light)', background: 'rgba(197,48,48,0.08)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--dz-white)', letterSpacing: 1, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 4, height: 22, background: 'var(--dz-red)', clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }} />个人命盘</h2>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 2, background: 'none', border: 'none', color: 'var(--dz-text)', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>
        <div style={{ position: 'relative', zIndex: 1, flex: 1, overflow: 'auto', padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dz-text-dim)', marginBottom: 2 }}>武功境界</div><div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, color: 'var(--dz-white)', letterSpacing: 1 }}>{realm}</div></div>
            <div style={{ textAlign: 'right' }}><div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dz-text-dim)', marginBottom: 2 }}>随身财物</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: 'var(--dz-gold)' }}>{silver} 两</div></div>
          </div>
          <StatB l="气血" c={hp} m={hpMax} color="var(--dz-red)" />
          <StatB l="真气" c={mp} m={mpMax} color="var(--dz-blue)" />
          <StatB l="阅历" c={exp} m={expMax} color="var(--dz-gold)" />
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600, color: 'var(--dz-gold)', letterSpacing: 1, margin: '16px 0 10px', paddingLeft: 10, borderLeft: '3px solid var(--dz-red)' }}>基础属性</div>
          {Object.keys(attrs).length ? <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>{Object.entries(attrs).map(([k, v]) => <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--dz-gray-light)', clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)', fontFamily: 'var(--font-mono)', fontSize: 13 }}><span style={{ color: 'var(--dz-text-dim)' }}>{k}</span><span style={{ color: 'var(--dz-gold)', fontWeight: 700 }}>{String(v)}</span></div>)}</div> : <div style={{ textAlign: 'center', padding: 12, fontSize: 12, color: 'var(--dz-text-dim)' }}>尚未初始化角色属性</div>}
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600, color: 'var(--dz-gold)', letterSpacing: 1, margin: '16px 0 10px', paddingLeft: 10, borderLeft: '3px solid var(--dz-red)' }}>已领悟武学</div>
          {Object.keys(kungfus).length ? Object.entries(kungfus).map(([n, i]) => <div key={n} style={{ padding: 10, marginBottom: 6, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--dz-gray-light)', clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }}><div style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, color: 'var(--dz-gold)', fontSize: 14 }}>{n}</div><div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--dz-text-dim)' }}>{i?.['武学描述'] || '暂无描述'}</div></div>) : <div style={{ textAlign: 'center', padding: 12, fontSize: 12, color: 'var(--dz-text-dim)' }}>暂未习得武学</div>}
        </div>
        <div style={{ position: 'relative', zIndex: 1, height: 3, flexShrink: 0, background: 'linear-gradient(90deg, var(--dz-red), var(--dz-gold), var(--dz-red))' }} />
      </div>
    </div>
  );
}
