import { useState } from 'react';
import { Maximize, Minimize } from 'lucide-react';

export function FullscreenToggle() {
  const [isFull, setIsFull] = useState(false);

  const toggle = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFull(true);
    } else {
      await document.exitFullscreen();
      setIsFull(false);
    }
  };

  // Listen for escape key / external fullscreen changes
  if (typeof document !== 'undefined') {
    document.onfullscreenchange = () => setIsFull(!!document.fullscreenElement);
  }

  return (
    <button
      className="fullscreen-btn"
      onClick={toggle}
      title={isFull ? '退出全屏' : '全屏'}
      style={{
        position: 'fixed', bottom: 16, right: 16, zIndex: 500,
        width: 36, height: 36, borderRadius: '50%',
        border: '1px solid var(--bdr-subtle)', background: 'var(--wx-card)',
        color: 'var(--wx-ink-dim)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: 0.5, transition: 'opacity 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
      onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
    >
      {isFull ? <Minimize size={16} /> : <Maximize size={16} />}
    </button>
  );
}
