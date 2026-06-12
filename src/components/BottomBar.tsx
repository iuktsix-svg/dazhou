import { useEffect, useState } from 'react';
import { useSillytavern } from '../hooks/useSillytavern';
import { Settings } from 'lucide-react';

interface BarState { hp: number; hpMax: number; mp: number; mpMax: number; exp: number; expMax: number; }

function parseBars(vars: Record<string, string | number>): BarState {
  const d = vars as Record<string, unknown>;
  const p = (d['主角状态'] || {}) as Record<string, unknown>;
  return {
    hp: Number(p['当前气血'] || vars['当前气血'] || 0),
    hpMax: Number(p['气血上限'] || vars['气血上限'] || 100),
    mp: Number(p['当前真气'] || vars['当前真气'] || 0),
    mpMax: Number(p['真气上限'] || vars['真气上限'] || 100),
    exp: Number(p['当前阅历'] || vars['当前阅历'] || 0),
    expMax: Number(p['破境所需阅历'] || vars['破境所需阅历'] || 100),
  };
}

type ModalType = 'status' | 'contacts' | 'bag' | 'news' | 'leaderboard' | 'map' | 'settings' | 'lorebooks' | 'chats';

interface Props {
  onOpenModal: (m: ModalType) => void;
  onToggleInput: () => void;
}

const ACTIONS: { key: ModalType; label: string; title: string }[] = [
  { key: 'status', label: '盘', title: '个人命盘' },
  { key: 'contacts', label: '脉', title: '江湖人脉' },
  { key: 'bag', label: '囊', title: '随身行囊' },
  { key: 'news', label: '报', title: '风媒情报' },
  { key: 'leaderboard', label: '榜', title: '武林榜单' },
  { key: 'map', label: '图', title: '堪舆图' },
];

export function BottomBar({ onOpenModal, onToggleInput }: Props) {
  const { activeChat, chats } = useSillytavern();
  const [bars, setBars] = useState<BarState>({ hp: 0, hpMax: 100, mp: 0, mpMax: 100, exp: 0, expMax: 100 });

  useEffect(() => {
    const vars = activeChat?.variables || {};
    setBars(parseBars(vars));
    const i = setInterval(() => setBars(parseBars(activeChat?.variables || {})), 2000);
    return () => clearInterval(i);
  }, [activeChat]);

  const Bar = ({ label, cur, max, cls }: { label: string; cur: number; max: number; cls: string }) => (
    <div className="dz-bb-bar-wrap">
      <div className="dz-bb-bar-label"><span>{label}</span><span>{cur}/{max}</span></div>
      <div className="dz-bb-bar-track">
        <div className={`dz-bb-bar-fill ${cls}`} style={{ width: `${Math.min(100, (cur / Math.max(max, 1)) * 100)}%` }} />
      </div>
    </div>
  );

  return (
    <footer className="dz-bottombar">
      <div className="dz-bb-bars">
        <Bar label="气血" cur={bars.hp} max={bars.hpMax} cls="fill-hp" />
        <Bar label="真气" cur={bars.mp} max={bars.mpMax} cls="fill-mp" />
        <Bar label="阅历" cur={bars.exp} max={bars.expMax} cls="fill-exp" />
      </div>
      <div className="dz-bb-actions">
        {ACTIONS.map(a => (
          <button key={a.key} className="dz-bb-btn" title={a.title} onClick={() => onOpenModal(a.key)}>
            {a.label}
          </button>
        ))}
        <button className="dz-bb-btn" title="输入" onClick={onToggleInput} style={{ fontSize: 18 }}>
          ✎
        </button>
        <button className="dz-bb-btn" title="对话" onClick={() => onOpenModal('chats')} style={{ fontSize: 12 }}>
          {chats.length}
        </button>
        <button className="dz-bb-btn" title="设置" onClick={() => onOpenModal('settings')}>
          <Settings size={16} />
        </button>
      </div>
    </footer>
  );
}
