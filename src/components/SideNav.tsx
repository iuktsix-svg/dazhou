import { motion } from 'framer-motion';
import { ScrollText, MessageSquare, Settings, User, Backpack, Users, Newspaper, Trophy, Map } from 'lucide-react';

const TOP_NAV = [
  { id: 'story' as const, label: '正文', icon: ScrollText },
  { id: 'chats' as const, label: '对话', icon: MessageSquare },
];

const PANEL_BTNS = [
  { id: 'status' as const, label: '命盘', icon: User },
  { id: 'bag' as const, label: '行囊', icon: Backpack },
  { id: 'contacts' as const, label: '人脉', icon: Users },
  { id: 'news' as const, label: '情报', icon: Newspaper },
  { id: 'leaderboard' as const, label: '榜单', icon: Trophy },
  { id: 'map' as const, label: '地图', icon: Map },
];

const BOTTOM_NAV = [
  { id: 'settings' as const, label: '设置', icon: Settings },
];

type PageId = 'story' | 'chats' | 'settings';
type PanelId = 'status' | 'contacts' | 'bag' | 'news' | 'leaderboard' | 'map';

interface Props {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onOpenPanel: (panel: PanelId) => void;
  chatCount?: number;
}

export function SideNav({ currentPage, onNavigate, onOpenPanel, chatCount }: Props) {
  const NavBtn = ({ id, label, Icon, active, onClick, badge }: { id: string; label: string; Icon: typeof ScrollText; active: boolean; onClick: () => void; badge?: number }) => (
    <button key={id} className={`dz-nav-item ${active ? 'active' : ''}`} onClick={onClick} title={label}>
      {active && <motion.div layoutId="nav-active" className="dz-nav-active-bar" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
      {active && <motion.div layoutId="nav-bg" className="dz-nav-bg" transition={{ type: 'spring', stiffness: 500, damping: 35 }} />}
      <div style={{ position: 'relative' }}>
        <Icon className="dz-nav-icon" strokeWidth={active ? 2.5 : 1.5} />
        {badge ? <span style={{ position: 'absolute', top: -6, right: -10, minWidth: 16, height: 16, borderRadius: 8, background: 'var(--dz-red)', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)' }}>{badge}</span> : null}
      </div>
      <span className="dz-nav-label">{label}</span>
    </button>
  );

  return (
    <nav className="dz-sidenav">
      <div className="dz-logo-wrap"><div className="dz-logo-diamond" /><span className="dz-logo-text">暮</span></div>
      {TOP_NAV.map(item => NavBtn({ id: item.id, label: item.label, Icon: item.icon, active: currentPage === item.id, onClick: () => onNavigate(item.id), badge: item.id === 'chats' ? chatCount : undefined }))}
      <div style={{ width: 32, height: 1, background: 'rgba(46,46,66,0.5)', margin: '8px 0' }} />
      {PANEL_BTNS.map(item => NavBtn({ id: item.id, label: item.label, Icon: item.icon, active: false, onClick: () => onOpenPanel(item.id as PanelId) }))}
      <div style={{ flex: 1 }} />
      {BOTTOM_NAV.map(item => NavBtn({ id: item.id, label: item.label, Icon: item.icon, active: currentPage === item.id, onClick: () => onNavigate(item.id) }))}
      <div className="dz-nav-version">v3</div>
    </nav>
  );
}
