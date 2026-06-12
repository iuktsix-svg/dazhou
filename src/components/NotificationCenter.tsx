import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationCtx {
  notify: (n: Omit<Notification, 'id'>) => void;
}

const Ctx = createContext<NotificationCtx>({ notify: () => {} });
export const useNotify = () => useContext(Ctx);

export function NotificationCenter({ children }: { children: React.ReactNode }) {
  const [notifs, setNotifs] = useState<Notification[]>([]);

  const notify = useCallback((n: Omit<Notification, 'id'>) => {
    const id = crypto.randomUUID();
    const notification = { ...n, id, duration: n.duration ?? 3000 };
    setNotifs(prev => [...prev, notification]);
    setTimeout(() => setNotifs(prev => prev.filter(x => x.id !== id)), notification.duration);
  }, []);

  const colors: Record<string, string> = {
    success: 'var(--jade)',
    error: 'var(--vermillion)',
    info: 'var(--indigo)',
    warning: 'var(--warning)',
  };

  return (
    <Ctx.Provider value={{ notify }}>
      {children}
      <div
        className="notification-container"
        style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 'var(--z-notification, 400)',
          display: 'flex', flexDirection: 'column', gap: 8,
          pointerEvents: 'none',
        }}
      >
        <AnimatePresence>
          {notifs.map(n => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              style={{
                background: colors[n.type],
                color: '#fff',
                padding: '10px 20px',
                borderRadius: 'var(--radius-md)',
                boxShadow: `0 4px 16px ${colors[n.type]}40`,
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-ui)',
                pointerEvents: 'auto',
                minWidth: 200,
                textAlign: 'center',
                border: `1px solid ${colors[n.type]}80`,
              }}
            >
              <strong>{n.title}</strong>
              {n.message && <div style={{ marginTop: 4, opacity: 0.85, fontSize: 'var(--text-xs)' }}>{n.message}</div>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
