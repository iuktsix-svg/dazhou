import { useEffect, useState } from 'react';
import { useSillytavern } from '../hooks/useSillytavern';
import { User, Backpack, Swords, ScrollText, Newspaper, Users, Trophy, Crosshair, Map, MessageCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface QuickItem { id: string; label: string; icon: LucideIcon; }

const QUICK_ITEMS: QuickItem[] = [
  { id: 'status', label: '个人命盘', icon: User },
  { id: 'contacts', label: '江湖人脉', icon: Users },
  { id: 'bag', label: '随身行囊', icon: Backpack },
  { id: 'news', label: '风媒情报', icon: Newspaper },
  { id: 'leaderboard', label: '武林榜单', icon: Trophy },
  { id: 'map', label: '堪舆图', icon: Map },
  { id: 'martial', label: '武学经脉', icon: Swords },
  { id: 'bounty', label: '追杀悬赏', icon: Crosshair },
  { id: 'quest', label: '任务日志', icon: ScrollText },
  { id: 'quick-chat', label: '快速交谈', icon: MessageCircle },
];

interface PlayerState {
  realm: string; hp: number; hpMax: number; mp: number; mpMax: number;
  exp: number; expMax: number; location: string; silver: number; condition: string; alignment: string;
}

function parseState(vars: Record<string, string | number>): PlayerState {
  const d = vars as Record<string, unknown>;
  const p = (d['主角状态'] || {}) as Record<string, unknown>;
  return {
    realm: String(p['武功境界'] || vars['武功境界'] || '凡骨'),
    hp: Number(p['当前气血'] || vars['当前气血'] || 0),
    hpMax: Number(p['气血上限'] || vars['气血上限'] || 100),
    mp: Number(p['当前真气'] || vars['当前真气'] || 0),
    mpMax: Number(p['真气上限'] || vars['真气上限'] || 100),
    exp: Number(p['当前阅历'] || vars['当前阅历'] || 0),
    expMax: Number(p['破境所需阅历'] || vars['破境所需阅历'] || 100),
    location: String(p['当前所在地点'] || vars['当前所在地点'] || '江湖'),
    silver: Number(p['持有银两'] || vars['持有银两'] || 0),
    condition: String(p['身体状态'] || vars['身体状态'] || '健康'),
    alignment: String(p['阵营倾向'] || vars['阵营倾向'] || '中立'),
  };
}

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  onQuickAction: (id: string) => void;
}

export function RightSidebar({ collapsed, onToggle, onQuickAction }: Props) {
  const { activeChat } = useSillytavern();
  const [state, setState] = useState<PlayerState>({
    realm: '凡骨', hp: 0, hpMax: 100, mp: 0, mpMax: 100, exp: 0, expMax: 100,
    location: '江湖', silver: 0, condition: '健康', alignment: '中立',
  });

  useEffect(() => {
    const update = () => setState(parseState(activeChat?.variables || {}));
    update();
    const iv = setInterval(update, 2000);
    return () => clearInterval(iv);
  }, [activeChat]);

  const Bar = ({ label, cur, max, color }: { label: string; cur: number; max: number; color: string }) => (
    <div className="dz-ps-bar">
      <div className="dz-ps-bar-label"><span>{label}</span><span>{cur}/{max}</span></div>
      <div className="dz-ps-bar-track">
        <div className="dz-ps-bar-fill" style={{ width: `${Math.min(100, (cur / Math.max(max, 1)) * 100)}%`, background: color }} />
      </div>
    </div>
  );

  const condColor = state.condition === '健康' ? 'var(--accent-jade)' : 'var(--accent-red)';

  return (
    <>
      <aside className={`dz-sidebar-right ${collapsed ? 'collapsed' : ''}`}>
        <div className="dz-quick-title">快捷</div>
        <div className="dz-quick-list">
          {QUICK_ITEMS.map(item => (
            <div key={item.id} className="dz-quick-item" onClick={() => onQuickAction(item.id)}>
              <item.icon size={16} className="quick-icon" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Player Status */}
        <div className="dz-player-status">
          <div className="dz-ps-realm">{state.realm}</div>
          <div style={{ display: 'flex', gap: 8, fontSize: '0.65rem', fontFamily: 'var(--font-ui)', color: 'var(--text-muted)', marginBottom: 4 }}>
            <span>{state.alignment}</span>
            <span style={{ color: condColor }}>{state.condition}</span>
          </div>
          <Bar label="气血" cur={state.hp} max={state.hpMax} color="linear-gradient(90deg, #8c2a2a, #d34242)" />
          <Bar label="真气" cur={state.mp} max={state.mpMax} color="linear-gradient(90deg, #2a6c8c, #42a5d3)" />
          <Bar label="阅历" cur={state.exp} max={state.expMax} color="linear-gradient(90deg, #c8a060, #d4b878)" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', fontFamily: 'var(--font-ui)', color: 'var(--text-muted)' }}>
            <span>{state.location}</span>
            <span style={{ color: 'var(--gold)' }}>{state.silver}两</span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '8px 16px', flexShrink: 0 }}>
          <button className="dz-collapse-btn" onClick={onToggle} title="收起面板">▶</button>
        </div>
      </aside>
      <div className="dz-sidebar-overlay" onClick={onToggle} style={{ display: collapsed ? 'none' : undefined }} />
    </>
  );
}
