import { useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';

interface Props {
  onClose: () => void;
}

export function ChatModal({ onClose }: Props) {
  const { chats, activeChatId, createChat, loadChat, deleteChat } = useSillytavern();
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    await createChat(newName.trim() || undefined);
    setNewName('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>💬 对话列表</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="chat-create-row">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="新对话名称（可选）"
            />
            <button onClick={handleCreate}>+ 创建</button>
          </div>

          <div className="chat-list">
            {chats.length === 0 && (
              <div className="empty-hint">暂无对话，创建一个吧</div>
            )}
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${chat.id === activeChatId ? 'active' : ''}`}
                onClick={() => { loadChat(chat.id); onClose(); }}
              >
                <div className="chat-item-info">
                  <div className="chat-item-name">{chat.name}</div>
                  <div className="chat-item-meta">
                    {chat.messages.length} 条消息 · {new Date(chat.updatedAt).toLocaleString()}
                  </div>
                </div>
                <button
                  className="chat-item-delete"
                  onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
