import { useEffect, useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';

interface Props { isOpen: boolean; onClose: () => void; onSend: (text: string) => void; }
interface LbEntry { 排名或赏金?: string; 上榜理由与罪状?: string; 最后出没地点?: string; rank?: string; reason?: string; location?: string; }

export function LeaderboardModal({ isOpen, onClose, onSend: _ }: Props) {
  const { activeChat } = useSillytavern();
  const [boards, setBoards] = useState<Record<string, Record<string, LbEntry>>>({});
  const [tab, setTab] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const vars = (activeChat?.variables || {}) as Record<string, unknown>;
    setBoards((vars['武林榜单与悬赏'] || {}) as Record<string, Record<string, LbEntry>>);
  }, [isOpen, activeChat]);

  const keys = Object.keys(boards);
  const current = keys[tab];
  const persons = current ? boards[current] : {};

  return (
    <div className={`dz-modal ${isOpen ? 'on' : ''}`}>
      <div className="dz-modal-head"><h2>武林榜单与悬赏</h2><button className="dz-modal-close" onClick={onClose}>×</button></div>
      <div className="dz-modal-body">
        {keys.length === 0 ? (
          <div className="dz-empty"><div className="title">暂无榜单记录</div><div className="guide">在江湖中闯荡后，<br />各类榜单将随你的声望逐渐解锁。</div></div>
        ) : (
          <>
            <div className="dz-lb-tabs">{keys.map((k, i) => <button key={k} className={`dz-lb-tab ${i===tab?'on':''}`} onClick={() => setTab(i)}>{k}</button>)}</div>
            {Object.keys(persons).length === 0 ? (
              <div className="dz-empty"><div className="guide">此榜单暂无记录。</div></div>
            ) : (
              Object.entries(persons).map(([name, info]) => (
                <div key={name} className="dz-lb-entry">
                  <div className="top"><span className="name">{name}</span><span className="value">{info['排名或赏金'] || info.rank || '--'}</span></div>
                  <div className="reason">{info['上榜理由与罪状'] || info.reason || ''}</div>
                  <div className="loc">出没地：{info['最后出没地点'] || info.location || '--'}</div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
