// ============================================================
// 大周日暮录 — LorebookModal
// Lorebook list with import/export, quick-add entry flow
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import {
  createDefaultLorebook, importSillyTavernWorldInfo, exportSillyTavernWorldInfo,
  saveLorebook, deleteLorebook as deleteLorebookDB,
} from '../../sillytavern';
import { LorebookEditorModal } from './LorebookEditorModal';
import { BookOpen, ToggleLeft, ToggleRight, Download, Upload, Trash2, Plus, Edit3, X } from 'lucide-react';

interface Props {
  onClose: () => void;
  quickAddId?: string | null; // '__auto__' = auto-open selector, or a specific book ID
}

export function LorebookModal({ onClose, quickAddId }: Props) {
  const { lorebooks, activeLorebookIds, toggleLorebook, saveLorebook: updateLorebook, deleteLorebook: removeLorebook } = useSillytavern();
  const [editingBook, setEditingBook] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Handle quick-add on mount
  useEffect(() => {
    if (quickAddId) {
      if (quickAddId === '__auto__' && lorebooks.length > 0) {
        // If only one lorebook, open it directly
        if (lorebooks.length === 1) {
          setEditingBook(lorebooks[0].id);
        } else {
          setQuickAddOpen(true);
        }
      } else if (lorebooks.some(b => b.id === quickAddId)) {
        setEditingBook(quickAddId);
      }
    }
    // Only run on mount / quickAddId change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickAddId]);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const book = importSillyTavernWorldInfo(json, file.name.replace(/\.\w+$/, ''));
      await saveLorebook(book);
      updateLorebook(book);
    } catch (err) {
      alert('导入失败：' + (err instanceof Error ? err.message : '无效的 JSON'));
    }
    if (fileRef.current) fileRef.current.value = '';
  }, [saveLorebook, updateLorebook]);

  const handleExport = useCallback((id: string) => {
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
  }, [lorebooks]);

  const handleCreate = useCallback(async () => {
    const book = createDefaultLorebook();
    await saveLorebook(book);
    updateLorebook(book);
  }, [saveLorebook, updateLorebook]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('确定删除这本世界书？所有条目将被永久删除。')) return;
    await deleteLorebookDB(id);
    removeLorebook(id);
  }, [removeLorebook]);

  return (
    <div className="dz-modal-shell" onClick={onClose}>
      <div className="dz-modal-box ve-lorebook-box" onClick={e => e.stopPropagation()}>
        {/* ---- Header ---- */}
        <div className="dz-modal-head">
          <h2><BookOpen size={18} style={{ marginRight: 8 }} /> 世界书管理</h2>
          <button className="wx-btn-outline-sm" onClick={onClose}><X size={16} /></button>
        </div>

        {/* ---- Toolbar ---- */}
        <div className="ve-toolbar">
          <div className="ve-toolbar-left">
            <button className="wx-btn" onClick={handleCreate}><Plus size={14} /> 新建</button>
            <button className="wx-btn-outline" onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> 导入 ST JSON
            </button>
            <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          </div>
          <div className="ve-toolbar-right">
            <span className="ve-count">{lorebooks.length} 本世界书</span>
          </div>
        </div>

        {/* ---- Book List ---- */}
        <div className="ve-entry-list">
          {lorebooks.length === 0 && (
            <div className="ve-empty">暂无世界书，请新建或导入 SillyTavern 格式的 JSON 文件</div>
          )}

          {lorebooks.map(book => {
            const isActive = activeLorebookIds.includes(book.id);
            return (
              <div key={book.id} className={`ve-book-card ${isActive ? 'active' : ''}`}>
                <div className="ve-book-info">
                  <div className="ve-book-name">
                    {book.name}
                    {isActive && <span className="ve-badge ve-badge-active">启用中</span>}
                  </div>
                  <div className="ve-book-meta">
                    {book.entries.length} 条目
                    {book.description ? ` · ${book.description}` : ''}
                  </div>
                </div>
                <div className="ve-book-actions">
                  <button
                    className={`wx-btn-sm ${isActive ? 'wx-btn-accent' : 'wx-btn-ghost'}`}
                    onClick={() => toggleLorebook(book.id)}
                    title={isActive ? '点击停用' : '点击启用'}
                  >
                    {isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                    {isActive ? '启用中' : '启用'}
                  </button>
                  <button className="wx-btn-sm wx-btn-outline" onClick={() => setEditingBook(book.id)}>
                    <Edit3 size={14} /> 编辑
                  </button>
                  <button className="wx-btn-sm wx-btn-ghost" onClick={() => handleExport(book.id)}>
                    <Download size={14} /> 导出
                  </button>
                  <button className="wx-btn-sm wx-btn-danger" onClick={() => handleDelete(book.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ---- Quick-add popover ---- */}
      {quickAddOpen && (
        <div className="dz-modal-shell" onClick={() => setQuickAddOpen(false)}>
          <div className="ve-quickadd-popover" onClick={e => e.stopPropagation()}>
            <h3>选择要录入的世界书</h3>
            {lorebooks.map(book => (
              <button
                key={book.id}
                className="ve-quickadd-item"
                onClick={() => { setQuickAddOpen(false); setEditingBook(book.id); }}
              >
                <BookOpen size={14} /> {book.name}
                <span className="ve-quickadd-count">{book.entries.length} 条目</span>
              </button>
            ))}
            <button className="ve-quickadd-cancel" onClick={() => setQuickAddOpen(false)}>取消</button>
          </div>
        </div>
      )}

      {/* ---- Editor ---- */}
      {editingBook && (
        <LorebookEditorModal
          bookId={editingBook}
          onClose={() => setEditingBook(null)}
        />
      )}
    </div>
  );
}
