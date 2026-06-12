import { useEffect, useState } from 'react'; import { useSillytavern } from '../../hooks/useSillytavern'; import { X } from 'lucide-react';
interface Props { isOpen: boolean; onClose: () => void; }
interface LbEntry { 排名或赏金?: string; 上榜理由与罪状?: string; 最后出没地点?: string; rank?: string; reason?: string; location?: string; }

export function LeaderboardModal({ isOpen, onClose }: Props) {
  const { activeChat } = useSillytavern(); const [boards, setBoards] = useState<Record<string, Record<string, LbEntry>>>({}); const [tab, setTab] = useState(0);
  useEffect(() => { if (!isOpen) return; setBoards(((activeChat?.variables||{}) as Record<string,unknown>)['武林榜单与悬赏'] as Record<string, Record<string, LbEntry>>||{}); }, [isOpen,activeChat]);
  const keys=Object.keys(boards); const cur=keys[tab]; const persons=cur?boards[cur]:{};
  return (<div className={`dz-modal ${isOpen?'on':''}`}><div className="dz-modal-halftone"/><div className="dz-modal-head"><h2>武林榜单与悬赏</h2><button className="dz-modal-close" onClick={onClose}><X size={18}/></button></div><div className="dz-modal-body">
    {keys.length===0?<div className="dz-empty"><div className="tl">暂无榜单记录</div><div className="gd">在江湖中闯荡后，<br />各类榜单将随声望逐渐解锁。</div></div>:<>
      <div className="dz-lb-tabs">{keys.map((k,i)=><button key={k} className={`dz-lb-tab ${i===tab?'on':''}`} onClick={()=>setTab(i)}>{k}</button>)}</div>
      {Object.keys(persons).length===0?<div className="dz-empty"><div className="gd">此榜单暂无记录。</div></div>:Object.entries(persons).map(([n,i])=><div key={n} className="dz-lb-card"><div className="top"><span className="name">{n}</span><span className="val">{i['排名或赏金']||i.rank||'--'}</span></div><div className="reason">{i['上榜理由与罪状']||i.reason||''}</div><div className="loc">出没地：{i['最后出没地点']||i.location||'--'}</div></div>)}
    </>}
  </div><div className="dz-modal-foot"/></div>);
}
