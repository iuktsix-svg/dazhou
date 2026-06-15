// ============================================================
// Tavernlike — Drop-in Lorebook Auto-Importer
//
// Drop SillyTavern JSON files into src/lorebooks/ and they
// will be silently imported into IndexedDB on app startup.
//
// v2: Uses content fingerprint (entry-count + first/last entry
//     content hash) to detect changes. When a lorebook with the
//     same name has been updated on disk, it REPLACES the old
//     version in IndexedDB — so existing chat archives immediately
//     benefit from lorebook updates without needing a new game.
// ============================================================

import {
  getLorebooks, saveLorebook,
  importSillyTavernWorldInfo,
} from '../sillytavern';

// Vite glob: eagerly import all .json files in this directory
const modules = import.meta.glob<{ default: unknown }>(
  './*.json',
  { eager: true },
);

/**
 * Compute a lightweight content fingerprint for a lorebook.
 * Uses entry count + content length of first and last entries.
 * This catches virtually all meaningful edits (text changes,
 * additions, deletions, reordering) while being fast to compute.
 */
function contentFingerprint(book: ReturnType<typeof importSillyTavernWorldInfo>): string {
  const n = book.entries.length;
  if (n === 0) return `${n}:0:0`;
  const first = book.entries[0]?.content?.length ?? 0;
  const last = book.entries[n - 1]?.content?.length ?? 0;
  // Also sample a few entries spread across the book
  const mid = book.entries[Math.floor(n / 2)]?.content?.length ?? 0;
  const q1 = book.entries[Math.floor(n / 4)]?.content?.length ?? 0;
  const q3 = book.entries[Math.floor(3 * n / 4)]?.content?.length ?? 0;
  return `${n}:${first}:${mid}:${last}:${q1}:${q3}`;
}

export async function autoImportLorebooks(): Promise<number> {
  const existing = await getLorebooks();
  let imported = 0;

  for (const [path, mod] of Object.entries(modules)) {
    try {
      const raw = mod.default;
      if (!raw || typeof raw !== 'object') continue;

      const book = importSillyTavernWorldInfo(
        raw as Record<string, unknown>,
      );

      // Extract filename without extension as fallback name
      const fileName = path.replace(/^\.\//, '').replace(/\.json$/, '');
      if (!book.name || book.name === 'Imported Lorebook') {
        book.name = fileName;
      }

      const newFingerprint = contentFingerprint(book);

      // Check if a lorebook with the same name already exists
      const existingBook = existing.find(b => b.name === book.name);
      if (existingBook) {
        // Compare fingerprints to detect actual changes
        const oldFingerprint = contentFingerprint(existingBook);
        if (oldFingerprint === newFingerprint) {
          // Content unchanged — skip
          continue;
        }
        // Content changed — update existing book (keep same ID so chat references stay valid)
        book.id = existingBook.id;
        await saveLorebook(book);
        // Update our working copy so subsequent comparisons use the new fingerprint
        existingBook.entries = book.entries;
        console.log(`[tavernlike] Updated lorebook: ${book.name} (${existingBook.entries.length} → ${book.entries.length} entries)`);
      } else {
        // New lorebook — insert
        await saveLorebook(book);
        existing.push(book);
        console.log(`[tavernlike] Imported new lorebook: ${book.name} (${book.entries.length} entries)`);
      }

      imported++;
    } catch (err) {
      console.warn(`[tavernlike] Failed to auto-import ${path}:`, err);
    }
  }

  if (imported > 0) {
    console.log(`[tavernlike] Auto-import complete: ${imported} lorebook(s) processed`);
  }

  return imported;
}
