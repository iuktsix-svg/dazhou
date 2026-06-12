import { useEffect, useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';

interface Props { isOpen: boolean; onClose: () => void; }
interface NewsItem { 情报来源?: string; 情报内容?: string; source?: string; content?: string; }

export function NewsModal({ isOpen, onClose }: Props) {
  const { activeChat } = useSillytavern();
  const [news, setNews] = useState<Record<string, NewsItem>>({});

  useEffect(() => {
    if (!isOpen) return;
    const vars = (activeChat?.variables || {}) as Record<string, unknown>;
    setNews((vars['江湖风媒情报'] || {}) as Record<string, NewsItem>);
  }, [isOpen, activeChat]);

  const entries = Object.entries(news);

  return (
    <div className={`dz-modal ${isOpen ? 'on' : ''}`}>
      <div className="dz-modal-head"><h2>风媒情报</h2><button className="dz-modal-close" onClick={onClose}>×</button></div>
      <div className="dz-modal-body">
        {entries.length === 0 ? (
          <div className="dz-empty">
            <div className="title">暂无江湖传闻</div>
            <div className="guide">在酒馆、客栈打探消息，或向江湖中人打听，<br />获取的情报将汇集于此。</div>
          </div>
        ) : (
          entries.map(([title, info]) => (
            <div key={title} className="dz-news-card">
              <h4>{title}</h4>
              <div className="src">来源：{info['情报来源'] || info.source || '--'}</div>
              <div className="text">{info['情报内容'] || info.content || ''}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
