import { useState } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { VariablePanel } from './VariablePanel';
import { USER_ROLE } from '../../sillytavern';

export function Chat() {
  const { activeChat, isSending, sendMessage, editMessage, deleteMessagesFrom, branchFromMessage, cancelGeneration, streamingText } = useSillytavern();
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const handleSend = async () => {
    if (!input.trim() || isSending) return;
    await sendMessage(input);
    setInput('');
  };

  const startEdit = (msg: { id: string; content: string }) => {
    setEditingId(msg.id);
    setEditDraft(msg.content);
  };

  const confirmEdit = async () => {
    if (!editingId || !editDraft.trim()) return;
    await editMessage(editingId, editDraft);
    setEditingId(null);
    setEditDraft('');
  };

  if (!activeChat) {
    return <div className="chat-empty">选择一个聊天或创建新对话</div>;
  }

  const showStreaming = isSending && streamingText;

  return (
    <div className="chat">
      <VariablePanel />
      <div className="messages">
        {activeChat.messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            {editingId === msg.id ? (
              <div className="edit-row">
                <input value={editDraft} onChange={(e) => setEditDraft(e.target.value)} autoFocus />
                <button onClick={confirmEdit}>重新生成</button>
                <button onClick={() => setEditingId(null)}>取消</button>
              </div>
            ) : (
              <>
                <div className="bubble">{msg.content}</div>
                <div className="msg-actions">
                  {msg.role === USER_ROLE && (
                    <button onClick={() => startEdit(msg)}>编辑并重新生成</button>
                  )}
                  <button onClick={() => deleteMessagesFrom(msg.id)}>删除后续</button>
                  <button onClick={() => branchFromMessage(msg.id)}>从此分支</button>
                </div>
              </>
            )}
          </div>
        ))}
        {showStreaming && (
          <div className="message assistant streaming">
            <div className="bubble">
              {streamingText || '思考中...'}
              <span className="cursor-blink">▌</span>
            </div>
          </div>
        )}
      </div>
      <div className="input-bar">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          disabled={isSending}
          placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
        />
        {isSending ? (
          <button onClick={cancelGeneration}>⏹ 停止</button>
        ) : (
          <button onClick={handleSend} disabled={!input.trim()}>发送</button>
        )}
      </div>
    </div>
  );
}
