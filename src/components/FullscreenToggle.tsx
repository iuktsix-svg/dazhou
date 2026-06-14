import { useState, useEffect } from 'react';
import { Maximize, Minimize } from 'lucide-react';

export function FullscreenToggle() {
  const [isFull, setIsFull] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show button after a short delay, then auto-hide after inactivity
    setVisible(true);
    let timer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      setVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => setVisible(false), 3000);
    };
    document.addEventListener('touchstart', resetTimer, { passive: true });
    document.addEventListener('scroll', resetTimer, { passive: true });
    timer = setTimeout(() => setVisible(false), 3000);
    return () => { clearTimeout(timer); document.removeEventListener('touchstart', resetTimer); document.removeEventListener('scroll', resetTimer); };
  }, []);

  const toggle = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFull(true);
    } else {
      await document.exitFullscreen();
      setIsFull(false);
    }
  };

  if (typeof document !== 'undefined') {
    document.onfullscreenchange = () => setIsFull(!!document.fullscreenElement);
  }

  return (
    <button
      className="fullscreen-btn"
      onClick={toggle}
      title={isFull ? '退出全屏' : '全屏'}
      style={{
        opacity: visible ? 0.25 : 0,
        visibility: visible ? 'visible' : 'hidden',
        position: 'fixed', bottom: 16, right: 16, zIndex: 500,
        width: 32, height: 32, borderRadius: '50%',
        border: '1px solid var(--bdr-subtle)', background: 'var(--wx-card)',
        color: 'var(--wx-ink-dim)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'opacity 0.4s, visibility 0.4s',
      }}
    >
      {isFull ? <Minimize size={14} /> : <Maximize size={14} />}
    </button>
  );
}
