import { type ChatMessage, USER_ROLE, ASSISTANT_ROLE } from '../../sillytavern';

interface Props {
  messages: ChatMessage[];
  isOpen: boolean;
  onClose: () => void;
}

export function HistoryDrawer({ messages, isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="history-drawer-overlay" onClick={onClose}>
      <div className="history-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3>📜 对话历史</h3>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="drawer-body">
          {messages.length === 0 && <div className="empty-hint">暂无消息</div>}
          {messages.map(msg => (
            <div key={msg.id} className={`history-msg ${msg.role}`}>
              <span className="history-role">{msg.role === USER_ROLE ? '👤' : msg.role === ASSISTANT_ROLE ? '🤖' : '📋'}</span>
              <span className="history-content">{msg.content.slice(0, 200)}{msg.content.length > 200 ? '...' : ''}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
