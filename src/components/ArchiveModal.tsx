import { useState } from 'react';
import { useSillytavern } from '../hooks/useSillytavern';
import { Archive, Plus, Trash2, MessageSquare } from 'lucide-react';

interface Props { onClose: () => void; }

export function ArchiveModal({ onClose }: Props) {
  const { chats, createChat, loadChat, deleteChat, activeChatId } = useSillytavern();
  const [newName, setNewName] = useState('');

  const handleCreate = async () => {
    await createChat(newName.trim() || undefined);
    setNewName('');
  };

  return (
    <div className="dz-modal-shell" onClick={onClose}>
      <div className="dz-modal-box" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div className="dz-modal-head">
          <h2>前尘旧事</h2>
          <button className="dz-modal-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="dz-modal-body">
          {/* New save */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
              placeholder="新存档名称（可选）"
              style={{ flex: 1, padding: '9px 14px', border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-md)', background: 'var(--wx-surface)', color: 'var(--wx-ink)', fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', outline: 'none' }}
            />
            <button onClick={handleCreate} className="wx-btn wx-btn-red" style={{ padding: '9px 16px', whiteSpace: 'nowrap' }}>
              <Plus size={15} /> 新存档
            </button>
          </div>

          {/* Save list */}
          {chats.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 48 }}>
              <Archive size={36} style={{ color: 'var(--wx-ink-dim)', opacity: 0.25, marginBottom: 12 }} />
              <div style={{ fontFamily: 'var(--font-title)', fontSize: 'var(--text-lg)', color: 'var(--wx-ink-dim)', marginBottom: 8 }}>暂无存档</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-sm)', color: 'var(--wx-ink-dim)', opacity: 0.6 }}>创建新存档开始江湖之旅</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 360, overflow: 'auto' }}>
              {chats.map(chat => (
                <div
                  key={chat.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 16px',
                    background: chat.id === activeChatId ? 'var(--wx-vermillion-dim)' : 'var(--wx-card)',
                    border: `1px solid ${chat.id === activeChatId ? 'var(--wx-vermillion-dim)' : 'var(--bdr-subtle)'}`,
                    borderRadius: 'var(--rd-md)', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }} onClick={() => { loadChat(chat.id); onClose(); }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 600, color: 'var(--wx-ink)', fontSize: 'var(--text-base)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MessageSquare size={14} style={{ color: 'var(--wx-vermillion)' }} />
                      {chat.name}
                      {chat.id === activeChatId && (
                        <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--wx-vermillion)', background: 'var(--wx-vermillion-dim)', padding: '2px 8px', borderRadius: 'var(--rd-full)' }}>当前</span>
                      )}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 'var(--text-xs)', color: 'var(--wx-ink-dim)', marginTop: 4 }}>
                      {chat.messages.length} 条消息 · {new Date(chat.updatedAt).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (confirm('确定删除此存档？此操作不可撤销。')) deleteChat(chat.id); }}
                    style={{ padding: '4px 12px', background: 'none', border: '1px solid var(--bdr-subtle)', borderRadius: 'var(--rd-sm)', color: 'var(--wx-ink-dim)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-body)' }}
                  >
                    <Trash2 size={13} /> 删除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="dz-modal-foot" />
      </div>
    </div>
  );
}
