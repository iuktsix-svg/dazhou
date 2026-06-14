// ============================================================
// 大周日暮录 — 独立世界书编辑器
// Full-screen 3-panel layout, runs as a standalone page
// ============================================================

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSillytavern } from './hooks/useSillytavern';
import {
  getLorebook, saveLorebook as saveLorebookDB, deleteLorebook as deleteLorebookDB,
  createDefaultLorebook, createDefaultEntry, updateEntry, removeEntry,
  importSillyTavernWorldInfo, exportSillyTavernWorldInfo,
  type Lorebook, type LorebookEntry,
} from './sillytavern';
import { VisualEntryEditor } from './components/SillyTavern/VisualEntryEditor';
import {
  BookOpen, Plus, Upload, Download, Trash2, Search, X, ArrowUpDown,
  Edit3, ToggleLeft, ToggleRight,
} from 'lucide-react';
import './styles/tokens.css';
import './App.css';
import './LorebookEditorApp.css';

// Sync helper: notify the Vite dev server about entry changes
async function syncEntryChange(
  action: 'created' | 'updated',
  lorebookId: string,
  lorebookName: string,
  entry: LorebookEntry,
) {
  try {
    await fetch('/api/lorebook-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, lorebookId, lorebookName, entry }),
    });
  } catch {
    // Silently ignore — sync is best-effort, only works in dev
  }
}

type SortKey = 'priority' | 'order' | 'alpha';

export function LorebookEditorApp() {
  const { lorebooks, activeLorebookIds, toggleLorebook, saveLorebook: updateLorebook, deleteLorebook: removeLorebook, isLoading } = useSillytavern();

  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<LorebookEntry | null>(null);
  const [isNewEntry, setIsNewEntry] = useState(false);
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('priority');
  const [bookData, setBookData] = useState<Lorebook | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Load full book data when selection changes
  useEffect(() => {
    if (selectedBookId) {
      getLorebook(selectedBookId).then(b => setBookData(b ?? null));
      setEditingEntry(null);
      setIsNewEntry(false);
      setSearch('');
    } else {
      setBookData(null);
    }
  }, [selectedBookId]);

  // Filtered + sorted entries
  const entries = useMemo(() => {
    if (!bookData) return [];
    let list = [...bookData.entries];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(e =>
        e.keys.some(k => k.toLowerCase().includes(q)) ||
        e.content.toLowerCase().includes(q) ||
        (e.comment || '').toLowerCase().includes(q),
      );
    }

    if (sortKey === 'priority') {
      list.sort((a, b) => b.priority - a.priority);
    } else if (sortKey === 'order') {
      list.sort((a, b) => a.order - b.order);
    } else {
      list.sort((a, b) => (a.keys[0] || '').localeCompare(b.keys[0] || ''));
    }

    return list;
  }, [bookData, search, sortKey]);

  // ---- Book-level operations ----

  const handleCreateBook = useCallback(async () => {
    const book = createDefaultLorebook();
    await saveLorebookDB(book);
    updateLorebook(book);
    setSelectedBookId(book.id);
  }, [updateLorebook]);

  const handleDeleteBook = useCallback(async (id: string) => {
    if (!confirm('确定删除这本世界书？所有条目将被永久删除。')) return;
    await deleteLorebookDB(id);
    removeLorebook(id);
    if (selectedBookId === id) {
      setSelectedBookId(null);
      setBookData(null);
    }
  }, [removeLorebook, selectedBookId]);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const book = importSillyTavernWorldInfo(json, file.name.replace(/\.\w+$/, ''));
      await saveLorebookDB(book);
      updateLorebook(book);
      setSelectedBookId(book.id);
    } catch (err) {
      alert('导入失败：' + (err instanceof Error ? err.message : '无效的 JSON'));
    }
    if (fileRef.current) fileRef.current.value = '';
  }, [updateLorebook]);

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

  // ---- Entry-level operations ----

  const handleSaveEntry = useCallback(async (entry: LorebookEntry) => {
    if (!bookData) return;
    const isNew = !bookData.entries.some(e => e.id === entry.id);
    const updated = updateEntry(bookData, entry.id, entry);
    const persisted = { ...updated, updatedAt: Date.now() };
    await saveLorebookDB(persisted);
    setBookData(persisted);
    updateLorebook(persisted);
    // Sync to disk so Claude can see the change
    syncEntryChange(isNew ? 'created' : 'updated', bookData.id, bookData.name, entry);
    setEditingEntry(null);
    setIsNewEntry(false);
  }, [bookData, updateLorebook]);

  const handleSaveAndNew = useCallback(async (entry: LorebookEntry) => {
    if (!bookData) return;
    const isNew = !bookData.entries.some(e => e.id === entry.id);
    const updated = updateEntry(bookData, entry.id, entry);
    const persisted = { ...updated, updatedAt: Date.now() };
    await saveLorebookDB(persisted);
    setBookData(persisted);
    updateLorebook(persisted);
    // Sync to disk so Claude can see the change
    syncEntryChange(isNew ? 'created' : 'updated', bookData.id, bookData.name, entry);
    // Reset for next
    setEditingEntry(createDefaultEntry(bookData.id));
    setIsNewEntry(true);
  }, [bookData, updateLorebook]);

  const handleDeleteEntry = useCallback(async (entryId: string) => {
    if (!bookData || !confirm('删除此条目？')) return;
    const updated = removeEntry(bookData, entryId);
    const persisted = { ...updated, updatedAt: Date.now() };
    await saveLorebookDB(persisted);
    setBookData(persisted);
    updateLorebook(persisted);
  }, [bookData, updateLorebook]);

  const handleNewEntry = useCallback(() => {
    if (!bookData) return;
    setEditingEntry(createDefaultEntry(bookData.id));
    setIsNewEntry(true);
  }, [bookData]);

  const handleBookMetaSave = useCallback(async (updates: Partial<Lorebook>) => {
    if (!bookData) return;
    const updated = { ...bookData, ...updates, updatedAt: Date.now() };
    await saveLorebookDB(updated);
    setBookData(updated);
    updateLorebook(updated);
  }, [bookData, updateLorebook]);

  const selectedBook = bookData;

  if (isLoading) {
    return <div className="wx-loading">世界书编辑器</div>;
  }

  return (
    <div className="lea-root">
      {/* ====== Left Panel: Book List ====== */}
      <aside className="lea-panel lea-panel-left">
        <div className="lea-panel-head">
          <h1 className="lea-title">
            <BookOpen size={20} />
            世界书
          </h1>
        </div>

        <div className="lea-panel-actions">
          <button className="wx-btn wx-btn-sm" onClick={handleCreateBook} title="新建世界书">
            <Plus size={14} /> 新建
          </button>
          <button className="wx-btn-sm wx-btn-outline" onClick={() => fileRef.current?.click()} title="导入 SillyTavern JSON">
            <Upload size={14} />
          </button>
          <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
        </div>

        <div className="lea-book-list">
          {lorebooks.map(book => {
            const isActive = activeLorebookIds.includes(book.id);
            const isSelected = selectedBookId === book.id;
            return (
              <div
                key={book.id}
                className={`lea-book-item ${isSelected ? 'selected' : ''} ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedBookId(book.id)}
              >
                <div className="lea-book-item-head">
                  <span className="lea-book-name">{book.name}</span>
                  <span className="lea-book-count">{book.entries.length}</span>
                </div>
                <div className="lea-book-item-foot">
                  <button
                    className={`lea-book-toggle ${isActive ? 'on' : ''}`}
                    onClick={e => { e.stopPropagation(); toggleLorebook(book.id); }}
                    title={isActive ? '停用' : '启用'}
                  >
                    {isActive ? <ToggleRight size={12} /> : <ToggleLeft size={12} />}
                  </button>
                  <button className="lea-book-btn" onClick={e => { e.stopPropagation(); handleExport(book.id); }} title="导出">
                    <Download size={12} />
                  </button>
                  <button className="lea-book-btn danger" onClick={e => { e.stopPropagation(); handleDeleteBook(book.id); }} title="删除">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ====== Middle Panel: Entry List ====== */}
      <section className="lea-panel lea-panel-mid">
        {!selectedBook ? (
          <div className="lea-empty-state">
            <BookOpen size={48} strokeWidth={1} />
            <p>选择左侧世界书开始编辑</p>
          </div>
        ) : (
          <>
            <div className="lea-panel-head">
              <input
                className="lea-book-title-input"
                value={selectedBook.name}
                onChange={e => handleBookMetaSave({ name: e.target.value })}
                placeholder="世界书名称"
              />
              <input
                className="lea-book-desc-input"
                value={selectedBook.description || ''}
                onChange={e => handleBookMetaSave({ description: e.target.value })}
                placeholder="描述（可选）"
              />
            </div>

            {/* Search + Sort + New */}
            <div className="lea-toolbar">
              <div className="lea-search-wrap">
                <Search size={14} className="lea-search-icon" />
                <input
                  className="lea-search-input"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={`搜索 ${selectedBook.entries.length} 条…`}
                />
                {search && (
                  <button className="lea-search-clear" onClick={() => setSearch('')}><X size={12} /></button>
                )}
              </div>
              <div className="lea-sort-btns">
                <ArrowUpDown size={12} />
                {(['priority', 'order', 'alpha'] as SortKey[]).map(k => (
                  <button
                    key={k}
                    className={`lea-sort-btn ${sortKey === k ? 'active' : ''}`}
                    onClick={() => setSortKey(k)}
                  >
                    {k === 'priority' ? '优先级' : k === 'order' ? '顺序' : '名称'}
                  </button>
                ))}
              </div>
              <button className="wx-btn wx-btn-sm" onClick={handleNewEntry}>
                <Plus size={14} /> 新增
              </button>
            </div>

            {/* Entry list */}
            <div className="lea-entry-list">
              {entries.length === 0 && (
                <div className="lea-empty-state-sm">
                  {search ? '无匹配条目' : '暂无条目'}
                </div>
              )}
              {entries.map(entry => (
                <div
                  key={entry.id}
                  className={`lea-entry-card ${!entry.enabled ? 'disabled' : ''} ${editingEntry?.id === entry.id ? 'editing' : ''}`}
                  onClick={() => { setEditingEntry(entry); setIsNewEntry(false); }}
                >
                  <div className="lea-entry-body">
                    <div className="lea-entry-keys">
                      {entry.keys.length > 0
                        ? entry.keys.slice(0, 4).map(k => <span key={k} className="lea-entry-key-chip">{k}</span>)
                        : <span className="lea-no-keys">无触发词</span>}
                      {entry.keys.length > 4 && <span className="lea-chip-more">+{entry.keys.length - 4}</span>}
                    </div>
                    <div className="lea-entry-preview">
                      {entry.content.slice(0, 100)}{entry.content.length > 100 ? '…' : ''}
                    </div>
                    <div className="lea-entry-meta">
                      <span>P{entry.priority}</span>
                      <span>O{entry.order}</span>
                      <span>{entry.position.replace(/_/g, ' ')}</span>
                      {entry.constant && <span className="lea-tag-const">恒入</span>}
                      {!entry.enabled && <span className="lea-tag-off">禁用</span>}
                    </div>
                  </div>
                  <button
                    className="lea-entry-del"
                    onClick={e => { e.stopPropagation(); handleDeleteEntry(entry.id); }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* ====== Right Panel: Visual Editor ====== */}
      <section className="lea-panel lea-panel-right">
        {editingEntry && selectedBook ? (
          <div className="lea-editor-wrap">
            <VisualEntryEditor
              lorebookId={selectedBook.id}
              entry={isNewEntry ? null : editingEntry}
              inline
              onSave={handleSaveEntry}
              onSaveAndNew={handleSaveAndNew}
              onCancel={() => { setEditingEntry(null); setIsNewEntry(false); }}
            />
          </div>
        ) : (
          <div className="lea-empty-state">
            <Edit3 size={48} strokeWidth={1} />
            <p>{selectedBook ? '选择一个条目开始编辑' : '选择世界书和条目'}</p>
          </div>
        )}
      </section>
    </div>
  );
}
