import { useEffect, useState } from 'react';
import type { ChatSession } from '../sillytavern';

interface Props { chat: ChatSession | null; }

export function ResourceBar({ chat }: Props) {
  const [state, setState] = useState({ realm: '--', hp: 0, hpMax: 100, mp: 0, mpMax: 100, exp: 0, expMax: 100, location: '--', silver: 0 });

  useEffect(() => {
    const update = () => {
      const vars = (chat?.variables || {}) as Record<string, unknown>;
      const p = (vars['主角状态'] || {}) as Record<string, unknown>;
      setState({
        realm: String(p['武功境界'] || vars['武功境界'] || '--'),
        hp: Number(p['当前气血'] || vars['当前气血'] || 0),
        hpMax: Number(p['气血上限'] || vars['气血上限'] || 100),
        mp: Number(p['当前真气'] || vars['当前真气'] || 0),
        mpMax: Number(p['真气上限'] || vars['真气上限'] || 100),
        exp: Number(p['当前阅历'] || vars['当前阅历'] || 0),
        expMax: Number(p['破境所需阅历'] || vars['破境所需阅历'] || 100),
        location: String(p['当前所在地点'] || vars['当前所在地点'] || '--'),
        silver: Number(p['持有银两'] || vars['持有银两'] || 0),
      });
    };
    update();
    const iv = setInterval(update, 2000);
    return () => clearInterval(iv);
  }, [chat]);

  const MiniBar = ({ label, cur, max, color }: { label: string; cur: number; max: number; color: string }) => (
    <div className="dz-res-item">
      <span className="dz-res-label">{label}</span>
      <div className="dz-res-bar-wrap">
        <div className="dz-res-bar-track">
          <div className="dz-res-bar-fill" style={{ width: `${Math.min(100, Math.max(0, (cur / Math.max(max, 1)) * 100))}%`, background: color }} />
        </div>
        <span className="dz-res-label" style={{ textAlign: 'right', fontSize: 10 }}>{cur}/{max}</span>
      </div>
    </div>
  );

  return (
    <div className="dz-resbar">
      <div className="dz-res-item"><span className="dz-res-label">境界</span><span className="dz-res-value" style={{ color: 'var(--dz-gold)' }}>{state.realm}</span></div>
      <MiniBar label="气血" cur={state.hp} max={state.hpMax} color="var(--dz-red)" />
      <MiniBar label="真气" cur={state.mp} max={state.mpMax} color="var(--dz-blue)" />
      <MiniBar label="阅历" cur={state.exp} max={state.expMax} color="var(--dz-gold)" />
      <div className="dz-res-item" style={{ marginLeft: 'auto' }}>
        <span className="dz-res-label">{state.location}</span>
        <span className="dz-res-value" style={{ color: 'var(--dz-gold)' }}>{state.silver}两</span>
      </div>
    </div>
  );
}
