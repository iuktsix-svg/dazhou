import { Settings, Users, Newspaper, Trophy, Map, Crosshair, Sun, Moon } from 'lucide-react';

const PANEL_BTNS = [
  { id: 'contacts' as const, label: '人脉', icon: Users },
  { id: 'news' as const, label: '情报', icon: Newspaper },
  { id: 'leaderboard' as const, label: '榜单', icon: Trophy },
  { id: 'bounty' as const, label: '悬赏', icon: Crosshair },
  { id: 'map' as const, label: '地图', icon: Map },
];

type PanelId = 'status' | 'contacts' | 'bag' | 'news' | 'leaderboard' | 'map' | 'bounty';

interface Props {
  onOpenPanel: (panel: PanelId) => void;
  onOpenSettings: () => void;
  theme: string;
  onToggleTheme: () => void;
}

export function SideNav({ onOpenPanel, onOpenSettings, theme, onToggleTheme }: Props) {
  return (
    <nav className="dz-sidenav">
      <div className="dz-logo-wrap"><div className="dz-logo-diamond" /><span className="dz-logo-text">暮</span></div>

      {PANEL_BTNS.map(item => (
        <button key={item.id} className="dz-nav-item" onClick={() => onOpenPanel(item.id as PanelId)} title={item.label}>
          <item.icon className="dz-nav-icon" strokeWidth={1.5} />
          <span className="dz-nav-label">{item.label}</span>
        </button>
      ))}

      <div style={{ flex: 1 }} />

      <button className="dz-nav-item" onClick={onToggleTheme} title={theme === 'light' ? '切换夜间模式' : '切换日间模式'}>
        {theme === 'light' ? <Moon className="dz-nav-icon" strokeWidth={1.5} /> : <Sun className="dz-nav-icon" strokeWidth={1.5} />}
        <span className="dz-nav-label">{theme === 'light' ? '夜间' : '日间'}</span>
      </button>

      <button className="dz-nav-item" onClick={onOpenSettings} title="设置">
        <Settings className="dz-nav-icon" strokeWidth={1.5} />
        <span className="dz-nav-label">设置</span>
      </button>
      <div className="dz-nav-version">v3</div>
    </nav>
  );
}
