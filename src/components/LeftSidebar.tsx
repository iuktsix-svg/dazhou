import { BookOpen, MessageSquare, Settings, ScrollText, Swords, Map, Newspaper } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem { id: string; label: string; icon: LucideIcon; }

interface Props {
  collapsed: boolean;
  onToggle: () => void;
  activeNav: string;
  onNav: (id: string) => void;
  saveName?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'chats', label: '对话列表', icon: MessageSquare },
  { id: 'presets', label: '武学预设', icon: Swords },
  { id: 'lorebooks', label: '世界书', icon: BookOpen },
  { id: 'newspaper', label: '风媒情报', icon: Newspaper },
  { id: 'map', label: '堪舆图', icon: Map },
  { id: 'story-log', label: '剧情日志', icon: ScrollText },
  { id: 'settings', label: '系统设置', icon: Settings },
];

export function LeftSidebar({ collapsed, onToggle, activeNav, onNav, saveName }: Props) {
  return (
    <>
      <aside className={`dz-sidebar-left ${collapsed ? 'collapsed' : ''}`}>
        <div className="dz-sidebar-header">
          <div className="dz-sidebar-game-title">大周日暮录</div>
          <div className="dz-sidebar-save-name">{saveName || '未命名存档'}</div>
        </div>
        <nav className="dz-sidebar-nav">
          {NAV_ITEMS.map(item => (
            <div
              key={item.id}
              className={`dz-nav-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => onNav(item.id)}
            >
              <item.icon size={16} className="nav-icon" />
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
        <div className="dz-sidebar-footer">
          <button className="dz-collapse-btn" onClick={onToggle} title="收起导航">
            ◀
          </button>
        </div>
      </aside>
      <div className="dz-sidebar-overlay" onClick={onToggle} style={{ display: collapsed ? 'none' : undefined }} />
    </>
  );
}
