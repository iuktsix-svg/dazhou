import type { ReactNode } from 'react';
import { AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface Props { isOpen: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean; }

export function P5RModal({ isOpen, onClose, title, children, wide }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="dz-modal on" style={{ position: 'fixed', bottom: 0, left: '50%', transform: isOpen ? 'translate(-50%, 0)' : 'translate(-50%, 100%)', width: '92%', maxWidth: wide ? 620 : 520, maxHeight: '82vh' }}>
          <div className="dz-modal-halftone" />
          <div className="dz-modal-head">
            <h2>{title}</h2>
            <button className="dz-modal-close" onClick={onClose}><X size={18} /></button>
          </div>
          <div className="dz-modal-body">{children}</div>
          <div className="dz-modal-foot" />
        </div>
      )}
    </AnimatePresence>
  );
}
