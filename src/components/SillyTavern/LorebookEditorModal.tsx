// ============================================================
// 大周日暮录 — LorebookEditorModal
// Entry list with search/filter + VisualEntryEditor integration
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import {
  getLorebook, saveLorebook,
  createDefaultEntry, updateEntry, removeEntry,
  type Lorebook, type LorebookEntry,
} from '../../sillytavern';
import { VisualEntryEditor } from './VisualEntryEditor';
import { Search, Plus, Trash2, X, ArrowUpDown } from 'lucide-react';

interface Props {
  bookId: string;
  onClose: () => void;
}

type SortKey = 'priority' | 'order' | 'alpha';

export function LorebookEditorModal({ bookId, onClose }: Props) {
  const [book, setBook] = useState<Lorebook | null>(null);
  const [editingEntry, setEditingEntry] = useState<LorebookEntry | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('priority');

  useEffect(() => {
    getLorebook(bookId).then(b => setBook(b ?? null));
  }, [bookId]);

  // Filtered + sorted entries
  const entries = useMemo(() => {
    if (!book) return [];
    let list = [...book.entries];

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(e =>
        e.keys.some(k => k.toLowerCase().includes(q)) ||
        e.content.toLowerCase().includes(q) ||
        (e.comment || '').toLowerCase().includes(q),
      );
    }

    // Sort
    if (sortKey === 'priority') {
      list.sort((a, b) => b.priority - a.priority);
    } else if (sortKey === 'order') {
      list.sort((a, b) => a.order - b.order);
    } else {
      list.sort((a, b) => (a.keys[0] || '').localeCompare(b.keys[0] || ''));
    }

    return list;
  }, [book, search, sortKey]);

  if (!book) {
    return (
      <div className="dz-modal-shell" onClick={onClose}>
        <div className="dz-modal-box" onClick={e => e.stopPropagation()}>
          <div className="dz-modal-head"><h2>加载中…</h2></div>
        </div>
      </div>
    );
  }

  const handleSaveBookMeta = async (updates: Partial<Lorebook>) => {
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

  const handleSaveAndNew = async (entry: LorebookEntry) => {
    const updated = updateEntry(book, entry.id, entry);
    await saveLorebook(updated);
    setBook(updated);
    // Reset form for next entry
    setEditingEntry(createDefaultEntry(bookId));
    setIsNew(true);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('删除此条目？此操作不可恢复。')) return;
    const updated = removeEntry(book, entryId);
    await saveLorebook(updated);
    setBook(updated);
  };

  const startNew = () => {
    setEditingEntry(createDefaultEntry(book.id));
    setIsNew(true);
  };

  const entryCount = entries.length;
  const totalCount = book.entries.length;

  return (
    <div className="dz-modal-shell" onClick={onClose}>
      <div className="dz-modal-box ve-editor-box" onClick={e => e.stopPropagation()}>
        {/* ---- Header ---- */}
        <div className="dz-modal-head">
          <h2>✎ {book.name}</h2>
          <button className="wx-btn-outline-sm" onClick={onClose}><X size={16} /></button>
        </div>

        {/* ---- Meta edit bar ---- */}
        <div className="ve-meta-bar">
          <input
            className="ve-input"
            value={book.name}
            onChange={e => handleSaveBookMeta({ name: e.target.value })}
            placeholder="世界书名称"
          />
          <input
            className="ve-input"
            value={book.description || ''}
            onChange={e => handleSaveBookMeta({ description: e.target.value })}
            placeholder="描述（可选）"
          />
        </div>

        {/* ---- Toolbar ---- */}
        <div className="ve-toolbar">
          <div className="ve-search-wrap">
            <Search size={14} className="ve-search-icon" />
            <input
              className="ve-search-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`搜索条目（共 ${totalCount} 条）${search ? ` — 匹配 ${entryCount} 条` : ''}`}
            />
            {search && (
              <button className="ve-search-clear" onClick={() => setSearch('')}><X size={12} /></button>
            )}
          </div>

          <div className="ve-sort-btns">
            <span className="ve-sort-label"><ArrowUpDown size={12} /></span>
            {(['priority', 'order', 'alpha'] as SortKey[]).map(k => (
              <button
                key={k}
                className={`ve-sort-btn ${sortKey === k ? 'active' : ''}`}
                onClick={() => setSortKey(k)}
              >
                {k === 'priority' ? '优先级' : k === 'order' ? '顺序' : '名称'}
              </button>
            ))}
          </div>

          <button className="wx-btn" onClick={startNew}>
            <Plus size={14} /> 新增条目
          </button>
        </div>

        {/* ---- Entry List ---- */}
        <div className="ve-entry-list">
          {entries.length === 0 && (
            <div className="ve-empty">
              {search ? '没有匹配的条目' : '暂无条目，点击"新增条目"开始创建'}
            </div>
          )}

          {entries.map(entry => (
            <div
              key={entry.id}
              className={`ve-entry-card ${!entry.enabled ? 'disabled' : ''} ${entry.constant ? 'constant' : ''}`}
              onClick={() => { setEditingEntry(entry); setIsNew(false); }}
            >
              <div className="ve-entry-body">
                {/* Key chips */}
                <div className="ve-entry-keys">
                  {entry.keys.length > 0
                    ? entry.keys.slice(0, 6).map(k => <span key={k} className="ve-chip-sm">{k}</span>)
                    : <span className="ve-no-keys">无触发词</span>}
                  {entry.keys.length > 6 && <span className="ve-chip-more">+{entry.keys.length - 6}</span>}
                </div>

                {/* Content preview */}
                <div className="ve-entry-preview">
                  {entry.content.slice(0, 120)}{entry.content.length > 120 ? '…' : ''}
                </div>

                {/* Meta badges */}
                <div className="ve-entry-meta">
                  <span className="ve-badge">P{entry.priority}</span>
                  <span className="ve-badge">O{entry.order}</span>
                  <span className="ve-badge ve-badge-pos">{entry.position.replace(/_/g, ' ')}</span>
                  {entry.constant && <span className="ve-badge ve-badge-const">恒入</span>}
                  {!entry.enabled && <span className="ve-badge ve-badge-off">已禁用</span>}
                  {entry.comment && <span className="ve-badge ve-badge-comment">{entry.comment}</span>}
                </div>
              </div>

              <button
                className="ve-entry-del"
                onClick={e => { e.stopPropagation(); handleDeleteEntry(entry.id); }}
                title="删除条目"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ---- Editor overlay ---- */}
      {editingEntry && (
        <VisualEntryEditor
          lorebookId={book.id}
          entry={isNew ? null : editingEntry}
          onSave={handleSaveEntry}
          onSaveAndNew={handleSaveAndNew}
          onCancel={() => { setEditingEntry(null); setIsNew(false); }}
        />
      )}
    </div>
  );
}
