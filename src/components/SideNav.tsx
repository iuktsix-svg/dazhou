import { Settings, User, Backpack, Users, Newspaper, Trophy, Map } from 'lucide-react';

const PANEL_BTNS = [
  { id: 'status' as const, label: '命盘', icon: User },
  { id: 'bag' as const, label: '行囊', icon: Backpack },
  { id: 'contacts' as const, label: '人脉', icon: Users },
  { id: 'news' as const, label: '情报', icon: Newspaper },
  { id: 'leaderboard' as const, label: '榜单', icon: Trophy },
  { id: 'map' as const, label: '地图', icon: Map },
];

type PanelId = 'status' | 'contacts' | 'bag' | 'news' | 'leaderboard' | 'map';

interface Props {
  onOpenPanel: (panel: PanelId) => void;
  onOpenSettings: () => void;
}

export function SideNav({ onOpenPanel, onOpenSettings }: Props) {
  const NavBtn = ({ id, label, Icon, onClick }: { id: string; label: string; Icon: typeof Settings; onClick: () => void }) => (
    <button key={id} className="dz-nav-item" onClick={onClick} title={label}>
      <Icon className="dz-nav-icon" strokeWidth={1.5} />
      <span className="dz-nav-label">{label}</span>
    </button>
  );

  return (
    <nav className="dz-sidenav">
      <div className="dz-logo-wrap"><div className="dz-logo-diamond" /><span className="dz-logo-text">暮</span></div>

      {PANEL_BTNS.map(item => NavBtn({ id: item.id, label: item.label, Icon: item.icon, onClick: () => onOpenPanel(item.id as PanelId) }))}

      <div style={{ flex: 1 }} />

      <button className="dz-nav-item" onClick={onOpenSettings} title="设置">
        <Settings className="dz-nav-icon" strokeWidth={1.5} />
        <span className="dz-nav-label">设置</span>
      </button>
      <div className="dz-nav-version">v3</div>
    </nav>
  );
}
