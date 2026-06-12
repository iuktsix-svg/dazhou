// ============================================================
// Tavernlike — Drop-in Lorebook Auto-Importer
//
// Drop SillyTavern JSON files into src/lorebooks/ and they
// will be silently imported into IndexedDB on app startup.
// Already-imported books (matched by name) are skipped.
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

export async function autoImportLorebooks(): Promise<number> {
  const existing = await getLorebooks();
  const existingNames = new Set(existing.map(b => b.name));
  const existingEntryCounts = new Set(existing.map(b => `${b.name}:${b.entries.length}`));
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

      // Skip if already imported (match by name AND entry count)
      const fingerprint = `${book.name}:${book.entries.length}`;
      if (existingNames.has(book.name) || existingEntryCounts.has(fingerprint)) {
        continue;
      }

      await saveLorebook(book);
      existingNames.add(book.name);
      existingEntryCounts.add(fingerprint);
      imported++;
    } catch (err) {
      console.warn(`[tavernlike] Failed to auto-import ${path}:`, err);
    }
  }

  if (imported > 0) {
    console.log(`[tavernlike] Auto-imported ${imported} lorebook(s) from src/lorebooks/`);
  }

  return imported;
}
