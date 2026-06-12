import { User, Backpack, Users, Newspaper, Trophy, Map, Settings, MessageSquare } from 'lucide-react';

const ACTIONS = [
  { id: 'status', label: '命盘', icon: User },
  { id: 'contacts', label: '人脉', icon: Users },
  { id: 'bag', label: '行囊', icon: Backpack },
  { id: 'news', label: '情报', icon: Newspaper },
  { id: 'leaderboard', label: '榜单', icon: Trophy },
  { id: 'map', label: '地图', icon: Map },
  { id: 'chats', label: '对话', icon: MessageSquare },
  { id: 'settings', label: '设置', icon: Settings },
];

interface Props { onAction: (id: string) => void; }

export function BottomActions({ onAction }: Props) {
  return (
    <div className="dz-bottom-actions">
      {ACTIONS.map(a => (
        <button key={a.id} className="dz-ba-btn" onClick={() => onAction(a.id)} title={a.label}>
          <a.icon size={18} className="ba-icon" />
          <span>{a.label}</span>
        </button>
      ))}
    </div>
  );
}
