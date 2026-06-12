import { useState, useRef } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import {
  createDefaultLorebook, importSillyTavernWorldInfo, exportSillyTavernWorldInfo,
  saveLorebook, deleteLorebook,
} from '../../sillytavern';
import { LorebookEditorModal } from './LorebookEditorModal';

interface Props {
  onClose: () => void;
}

export function LorebookModal({ onClose }: Props) {
  const { lorebooks, activeLorebookIds, toggleLorebook } = useSillytavern();
  const [editingBook, setEditingBook] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const book = importSillyTavernWorldInfo(json, file.name.replace(/\.\w+$/, ''));
      await saveLorebook(book);
      window.location.reload(); // simple refresh
    } catch (err) {
      alert('导入失败：' + (err instanceof Error ? err.message : '无效的 JSON'));
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleExport = async (id: string) => {
    const book = lorebooks.find(b => b.id === id);
    if (!book) return;
    const json = exportSillyTavernWorldInfo(book);
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${book.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCreate = async () => {
    const book = createDefaultLorebook();
    await saveLorebook(book);
    window.location.reload();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这本世界书？')) return;
    await deleteLorebook(id);
    window.location.reload();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📚 世界书管理</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="toolbar">
            <button onClick={handleCreate}>+ 新建</button>
            <button onClick={() => fileRef.current?.click()}>📥 导入 ST JSON</button>
            <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          </div>

          {lorebooks.length === 0 && (
            <div className="empty-hint">暂无世界书，新建或导入 SillyTavern 格式 JSON</div>
          )}

          {lorebooks.map(book => (
            <div key={book.id} className={`lorebook-card ${activeLorebookIds.includes(book.id) ? 'active' : ''}`}>
              <div className="lorebook-info">
                <div className="lorebook-name">{book.name}</div>
                <div className="lorebook-meta">{book.entries.length} 条目 · {book.description}</div>
              </div>
              <div className="lorebook-actions">
                <button onClick={() => toggleLorebook(book.id)}>
                  {activeLorebookIds.includes(book.id) ? '✅ 启用中' : '⬜ 启用'}
                </button>
                <button onClick={() => setEditingBook(book.id)}>✎ 编辑</button>
                <button onClick={() => handleExport(book.id)}>📤 导出</button>
                <button onClick={() => handleDelete(book.id)}>🗑 删除</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingBook && (
        <LorebookEditorModal
          bookId={editingBook}
          onClose={() => { setEditingBook(null); window.location.reload(); }}
        />
      )}
    </div>
  );
}
