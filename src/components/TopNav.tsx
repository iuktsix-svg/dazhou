import { motion } from 'framer-motion';
import { Settings, BookOpen, MessageSquare, PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import { SealIcon } from './icons';

interface Props {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  onToggleLeft: () => void;
  onToggleRight: () => void;
  onOpenSettings: () => void;
  onOpenLorebooks: () => void;
  onOpenChats: () => void;
  chatCount?: number;
  showGMEntry?: boolean;
}

export function TopNav({
  leftPanelOpen, rightPanelOpen,
  onToggleLeft, onToggleRight,
  onOpenSettings, onOpenLorebooks, onOpenChats,
  chatCount = 0, showGMEntry = false,
}: Props) {
  return (
    <nav className="topnav">
      <div className="topnav-left">
        {/* Seal Logo */}
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} className="topnav-seal">
          <SealIcon size={28} />
          <span className="topnav-seal-text">大周日暮录</span>
        </motion.button>

        <div className="topnav-divider" />

        {/* Panel toggles */}
        <button className={`nav-btn ${leftPanelOpen ? 'active' : ''}`} onClick={onToggleLeft} title="角色面板">
          <PanelLeftOpen size={17} strokeWidth={1.5} />
          <span>面板</span>
        </button>
        <button className={`nav-btn ${rightPanelOpen ? 'active' : ''}`} onClick={onToggleRight} title="江湖见闻">
          <PanelRightOpen size={17} strokeWidth={1.5} />
          <span>见闻</span>
        </button>
      </div>

      <div className="topnav-right">
        <button className="nav-btn" onClick={onOpenChats} title="对话列表">
          <MessageSquare size={17} strokeWidth={1.5} />
          <span>对话</span>
          {chatCount > 0 && <span className="badge">{chatCount}</span>}
        </button>

        {showGMEntry && (
          <button className="nav-btn" onClick={onOpenLorebooks} title="世界书管理">
            <BookOpen size={17} strokeWidth={1.5} />
            <span>世界书</span>
          </button>
        )}

        <button className="nav-btn" onClick={onOpenSettings} title="系统设置">
          <Settings size={17} strokeWidth={1.5} />
          <span>设置</span>
        </button>
      </div>
    </nav>
  );
}
