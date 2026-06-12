import { useEffect, useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';

interface Props { isOpen: boolean; onClose: () => void; }
interface NewsItem { 情报来源?: string; 情报内容?: string; }

export function NewsModal({ isOpen, onClose }: Props) {
  const { activeChat } = useSillytavern();
  const [news, setNews] = useState<Record<string, NewsItem>>({});
  useEffect(() => { if (!isOpen) return; setNews(((activeChat?.variables || {}) as Record<string, unknown>)['江湖风媒情报'] as Record<string, NewsItem> || {}); }, [isOpen, activeChat]);
  if (!isOpen) return null;
  const e = Object.entries(news);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      <div onClick={e2 => e2.stopPropagation()} style={{ position: 'relative', width: '100%', maxWidth: 520, maxHeight: '82vh', background: 'var(--dz-dark)', border: '1px solid var(--dz-gray-light)', boxShadow: '0 8px 40px rgba(0,0,0,0.8)', clipPath: 'polygon(10px 0, 100% 0, calc(100% - 10px) 100%, 0 100%)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(197,48,48,0.06) 1px, transparent 1px)', backgroundSize: '8px 8px', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--dz-gray-light)', background: 'rgba(197,48,48,0.08)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--dz-white)', letterSpacing: 1, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 4, height: 22, background: 'var(--dz-red)', clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }} />风媒情报</h2>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 2, background: 'none', border: 'none', color: 'var(--dz-text)', cursor: 'pointer', fontSize: 20 }}>×</button>
        </div>
        <div style={{ position: 'relative', zIndex: 1, flex: 1, overflow: 'auto', padding: 16 }}>
          {e.length === 0 ? <div style={{ textAlign: 'center', padding: 40 }}><div style={{ fontSize: 15, color: 'var(--dz-text-dim)', marginBottom: 8 }}>暂无江湖传闻</div><div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--dz-text-dim)', opacity: 0.7 }}>在酒馆、客栈打探消息后汇集于此。</div></div>
            : e.map(([t, i]) => <div key={t} style={{ padding: 14, marginBottom: 12, background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid var(--dz-gold)', border: '1px solid var(--dz-gray-light)', clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)' }}><div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontWeight: 600, color: 'var(--dz-gold)', marginBottom: 6 }}>{t}</div><div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--dz-text-dim)', marginBottom: 8 }}>来源：{i['情报来源'] || '--'}</div><div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--dz-text)', lineHeight: 1.7 }}>{i['情报内容'] || ''}</div></div>)}
        </div>
        <div style={{ position: 'relative', zIndex: 1, height: 3, flexShrink: 0, background: 'linear-gradient(90deg, var(--dz-red), var(--dz-gold), var(--dz-red))' }} />
      </div>
    </div>
  );
}
