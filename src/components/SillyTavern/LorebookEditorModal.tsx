import { useState, useEffect } from 'react';
import {
  getLorebook, saveLorebook,
  createDefaultEntry, updateEntry, removeEntry,
  type Lorebook, type LorebookEntry,
} from '../../sillytavern';
import { EntryForm } from './EntryForm';

interface Props {
  bookId: string;
  onClose: () => void;
}

export function LorebookEditorModal({ bookId, onClose }: Props) {
  const [book, setBook] = useState<Lorebook | null>(null);
  const [editingEntry, setEditingEntry] = useState<LorebookEntry | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    getLorebook(bookId).then(b => setBook(b ?? null));
  }, [bookId]);

  if (!book) return <div className="modal-overlay"><div className="modal">加载中...</div></div>;

  const handleSaveBook = async (updates: Partial<Lorebook>) => {
    const updated = { ...book, ...updates, updatedAt: Date.now() };
    await saveLorebook(updated);
    setBook(updated);
  };

  const handleSaveEntry = async (entry: LorebookEntry) => {
    const updated = updateEntry(book, entry.id, entry);
    await saveLorebook(updated);
    setBook(updated);
    setEditingEntry(null);
    setIsNew(false);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('删除此条目？')) return;
    const updated = removeEntry(book, entryId);
    await saveLorebook(updated);
    setBook(updated);
  };

  const startNew = () => {
    setEditingEntry(createDefaultEntry(book.id));
    setIsNew(true);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-xl" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✎ 编辑世界书</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="book-meta-editor">
            <label>书名：<input value={book.name} onChange={e => handleSaveBook({ name: e.target.value })} /></label>
            <label>描述：<input value={book.description || ''} onChange={e => handleSaveBook({ description: e.target.value })} /></label>
          </div>

          <button onClick={startNew}>+ 新增条目</button>

          <div className="entry-list">
            {book.entries.length === 0 && <div className="empty-hint">暂无条目</div>}
            {book.entries.map(entry => (
              <div key={entry.id} className={`entry-card ${!entry.enabled ? 'disabled' : ''}`}>
                <div className="entry-summary" onClick={() => { setEditingEntry(entry); setIsNew(false); }}>
                  <div className="entry-keys">
                    {entry.keys.length > 0 ? entry.keys.join(', ') : <i>无触发词</i>}
                    {entry.constant && <span className="badge">恒入</span>}
                  </div>
                  <div className="entry-preview">{entry.content.slice(0, 80)}{entry.content.length > 80 ? '…' : ''}</div>
                  <div className="entry-meta">
                    P{entry.priority} · O{entry.order} · {entry.position}
                  </div>
                </div>
                <div className="entry-card-actions">
                  <button onClick={() => handleDeleteEntry(entry.id)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {editingEntry && (
          <div className="entry-form-overlay">
            <div className="entry-form-container">
              <h3>{isNew ? '新建条目' : '编辑条目'}</h3>
              <EntryForm
                lorebookId={book.id}
                entry={isNew ? null : editingEntry}
                onSave={handleSaveEntry}
                onCancel={() => { setEditingEntry(null); setIsNew(false); }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
