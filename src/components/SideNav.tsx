import { useState, useEffect, useCallback } from 'react';
import { Menu, X, Settings, Users, Newspaper, Trophy, Map, Crosshair, Sun, Moon, Home } from 'lucide-react';

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
  onHome: () => void;
  theme: string;
  onToggleTheme: () => void;
}

export function SideNav({ onOpenPanel, onOpenSettings, onHome, theme, onToggleTheme }: Props) {
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handlePanel = useCallback((panel: PanelId) => {
    onOpenPanel(panel);
    setOpen(false);
  }, [onOpenPanel]);

  const handleSettings = useCallback(() => {
    onOpenSettings();
    setOpen(false);
  }, [onOpenSettings]);

  const handleHome = useCallback(() => {
    onHome();
    setOpen(false);
  }, [onHome]);

  // ---- Shared nav items ----
  const navItems = (
    <>
      <button className="dz-nav-item dz-home-btn-mobile" onClick={handleHome} title="返回首页">
        <Home size={16} strokeWidth={1.5} />
        <span className="dz-nav-label">首页</span>
      </button>

      {PANEL_BTNS.map(item => (
        <button key={item.id} className="dz-nav-item" onClick={() => handlePanel(item.id as PanelId)} title={item.label}>
          <item.icon className="dz-nav-icon" strokeWidth={1.5} />
          <span className="dz-nav-label">{item.label}</span>
        </button>
      ))}

      <div style={{ flex: 1 }} />

      <button className="dz-nav-item" onClick={onToggleTheme} title={theme === 'light' ? '切换夜间模式' : '切换日间模式'}>
        {theme === 'light' ? <Moon className="dz-nav-icon" strokeWidth={1.5} /> : <Sun className="dz-nav-icon" strokeWidth={1.5} />}
        <span className="dz-nav-label">{theme === 'light' ? '夜间' : '日间'}</span>
      </button>

      <button className="dz-nav-item" onClick={handleSettings} title="设置">
        <Settings className="dz-nav-icon" strokeWidth={1.5} />
        <span className="dz-nav-label">设置</span>
      </button>
    </>
  );

  // ---- Desktop: vertical sidebar ----
  if (!isMobile) {
    return (
      <nav className="dz-sidenav">
        <div className="dz-logo-wrap"><div className="dz-logo-diamond" /><span className="dz-logo-text">暮</span></div>
        {navItems}
        <div className="dz-nav-version">v1.0</div>
      </nav>
    );
  }

  // ---- Mobile: hamburger → drawer overlay ----
  return (
    <>
      {/* Hamburger button — top-left, safe-area aware */}
      <button
        className="dz-hamburger"
        onClick={() => setOpen(true)}
        aria-label="菜单"
        style={{
          position: 'fixed', zIndex: 200,
          top: `calc(10px + env(safe-area-inset-top))`,
          left: `calc(10px + env(safe-area-inset-left))`,
        }}
      >
        <Menu size={20} />
      </button>

      {/* Overlay */}
      {open && (
        <div className="dz-nav-overlay" onClick={() => setOpen(false)} />
      )}

      {/* Sliding drawer */}
      <nav className={`dz-sidenav-mobile ${open ? 'open' : ''}`}>
        <div className="dz-nav-mobile-head">
          <div className="dz-logo-wrap"><div className="dz-logo-diamond" /><span className="dz-logo-text">暮</span></div>
          <button className="dz-nav-close-btn" onClick={() => setOpen(false)} aria-label="关闭">
            <X size={20} />
          </button>
        </div>
        <div className="dz-nav-mobile-body">
          {navItems}
        </div>
      </nav>
    </>
  );
}
