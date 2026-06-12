import { useEffect, useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';

interface Props { isOpen: boolean; onClose: () => void; }

export function StatusModal({ isOpen, onClose }: Props) {
  const { activeChat } = useSillytavern();
  const [data, setData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!isOpen) return;
    const vars = (activeChat?.variables || {}) as Record<string, unknown>;
    setData({ ...vars, ...((vars['主角状态'] || {}) as Record<string, unknown>) });
  }, [isOpen, activeChat]);

  const attrs = (data['基础属性'] || {}) as Record<string, unknown>;
  const kungfus = (data['已学武学'] || {}) as Record<string, { 武学描述?: string }>;
  const silver = Number(data['持有银两'] || 0);
  const realm = String(data['武功境界'] || '--');
  const hp = Number(data['当前气血'] || 0); const hpMax = Number(data['气血上限'] || 100);
  const mp = Number(data['当前真气'] || 0); const mpMax = Number(data['真气上限'] || 100);
  const exp = Number(data['当前阅历'] || 0); const expMax = Number(data['破境所需阅历'] || 100);

  const StatBar = ({ label, cur, max, color }: { label: string; cur: number; max: number; color: string }) => (
    <div>
      <div className="dz-stat-bar-label"><span>{label}</span><span>{cur}/{max}</span></div>
      <div className="dz-stat-bar-track">
        <div className="dz-stat-bar-fill" style={{ width: `${Math.min(100, Math.max(0, (cur/Math.max(max,1))*100))}%`, background: color, boxShadow: `0 0 8px ${color}40` }} />
      </div>
    </div>
  );

  return (
    <div className={`dz-modal ${isOpen ? 'on' : ''}`}>
      <div className="dz-modal-head">
        <h2>个人命盘</h2>
        <button className="dz-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="dz-modal-body">
        {/* Realm + Silver summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', marginBottom: 2 }}>武功境界</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', color: 'var(--gold)', fontWeight: 700, letterSpacing: '0.05em' }}>{realm}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-xs)', color: 'var(--text-dim)', marginBottom: 2 }}>随身财物</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--text-lg)', color: 'var(--gold)', fontWeight: 700 }}>{silver} 两</div>
          </div>
        </div>

        {/* HP/MP/Exp */}
        <div className="dz-stat-bars">
          <StatBar label="气血" cur={hp} max={hpMax} color="linear-gradient(90deg, #8c2a2a, #d34242)" />
          <StatBar label="真气" cur={mp} max={mpMax} color="linear-gradient(90deg, #2a6c8c, #42a5d3)" />
          <StatBar label="阅历" cur={exp} max={expMax} color="linear-gradient(90deg, #c8a060, #d4b878)" />
        </div>

        {/* Attributes */}
        <div className="dz-section">
          <div className="dz-section-title">基础属性</div>
          {Object.keys(attrs).length === 0 ? (
            <div className="dz-empty">
              <div className="guide">尚未初始化角色属性。<br />完成角色创建后，各项属性将在此显示。</div>
            </div>
          ) : (
            <div className="dz-attrs">
              {Object.entries(attrs).map(([k, v]) => (
                <div key={k} className="dz-attr"><span className="label">{k}</span><span className="value">{String(v)}</span></div>
              ))}
            </div>
          )}
        </div>

        {/* Kungfu */}
        <div className="dz-section">
          <div className="dz-section-title">已领悟武学</div>
          {Object.keys(kungfus).length === 0 ? (
            <div className="dz-empty">
              <div className="guide">暂未习得武学。<br />可通过拜师学艺、研读秘籍或奇遇获得武学。</div>
            </div>
          ) : (
            Object.entries(kungfus).map(([name, info]) => (
              <div key={name} className="dz-section-content" style={{ marginBottom: 12, padding: '12px 14px', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--gold)', marginBottom: 4, fontSize: 'var(--text-sm)' }}>{name}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{info?.['武学描述'] || '暂无描述'}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
