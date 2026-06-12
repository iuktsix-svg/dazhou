import { useEffect, useState } from 'react'; import { useSillytavern } from '../../hooks/useSillytavern'; import { X } from 'lucide-react';
interface Props { isOpen: boolean; onClose: () => void; }
interface NewsItem { 情报来源?: string; 情报内容?: string; source?: string; content?: string; }

export function NewsModal({ isOpen, onClose }: Props) {
  const { activeChat } = useSillytavern(); const [news, setNews] = useState<Record<string, NewsItem>>({});
  useEffect(() => { if (!isOpen) return; setNews(((activeChat?.variables||{}) as Record<string,unknown>)['江湖风媒情报'] as Record<string,NewsItem>||{}); }, [isOpen,activeChat]);
  const e=Object.entries(news);
  return (<div className={`dz-modal ${isOpen?'on':''}`}><div className="dz-modal-halftone"/><div className="dz-modal-head"><h2>风媒情报</h2><button className="dz-modal-close" onClick={onClose}><X size={18}/></button></div><div className="dz-modal-body">
    {e.length===0?<div className="dz-empty"><div className="tl">暂无江湖传闻</div><div className="gd">在酒馆、客栈打探消息，<br />获取的情报将汇集于此。</div></div>:e.map(([t,i])=><div key={t} className="dz-news-card"><h4>{t}</h4><div className="src">来源：{i['情报来源']||i.source||'--'}</div><div className="txt">{i['情报内容']||i.content||''}</div></div>)}
  </div><div className="dz-modal-foot"/></div>);
}
