// ============================================================
// Tavernlike — Dexie IndexedDB Persistence Layer
// ============================================================

import Dexie, { type Table } from 'dexie';
import type { Lorebook, ChatPreset, AppSettings, ChatSession } from './types';

export class TavernDB extends Dexie {
  lorebooks!: Table<Lorebook, string>;
  presets!: Table<ChatPreset, string>;
  settings!: Table<AppSettings, string>;
  chats!: Table<ChatSession, string>;

  constructor() {
    super('tavernlike-db');
    this.version(1).stores({
      lorebooks: 'id, name, updatedAt',
      presets: 'id, name, updatedAt',
      settings: 'id',
      chats: 'id, name, characterName, updatedAt',
    });
  }
}

const db = new TavernDB();

let initialized = false;

export async function initializeDatabase(): Promise<void> {
  if (initialized) return;
  await db.open();
  initialized = true;
}

// ---- Lorebooks ----

export async function getLorebooks(): Promise<Lorebook[]> {
  return db.lorebooks.orderBy('updatedAt').reverse().toArray();
}

export async function getLorebook(id: string): Promise<Lorebook | undefined> {
  return db.lorebooks.get(id);
}

export async function saveLorebook(lorebook: Lorebook): Promise<void> {
  await db.lorebooks.put({ ...lorebook, updatedAt: Date.now() });
}

export async function deleteLorebook(id: string): Promise<void> {
  await db.lorebooks.delete(id);
}

// ---- Presets ----

export async function getPresets(): Promise<ChatPreset[]> {
  return db.presets.orderBy('updatedAt').reverse().toArray();
}

export async function getPreset(id: string): Promise<ChatPreset | undefined> {
  return db.presets.get(id);
}

export async function savePreset(preset: ChatPreset): Promise<void> {
  await db.presets.put({ ...preset, updatedAt: Date.now() });
}

export async function deletePreset(id: string): Promise<void> {
  await db.presets.delete(id);
}

// ---- Settings ----

const SETTINGS_ID = 'app-settings';

export async function getSettings(): Promise<AppSettings | undefined> {
  return db.settings.get(SETTINGS_ID);
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await db.settings.put({ ...settings, id: SETTINGS_ID, updatedAt: Date.now() });
}

// ---- Chats ----

export async function getChats(): Promise<ChatSession[]> {
  return db.chats.orderBy('updatedAt').reverse().toArray();
}

export async function getChat(id: string): Promise<ChatSession | undefined> {
  return db.chats.get(id);
}

export async function saveChat(chat: ChatSession): Promise<void> {
  await db.chats.put({ ...chat, updatedAt: Date.now() });
}

export async function deleteChat(id: string): Promise<void> {
  await db.chats.delete(id);
}

// ---- Bulk operations ----

export async function exportAllData(): Promise<{
  lorebooks: Lorebook[];
  presets: ChatPreset[];
  settings: AppSettings | undefined;
  chats: ChatSession[];
}> {
  const [lorebooks, presets, settings, chats] = await Promise.all([
    getLorebooks(),
    getPresets(),
    getSettings(),
    getChats(),
  ]);
  return { lorebooks, presets, settings, chats };
}

export async function importAllData(data: {
  lorebooks?: Lorebook[];
  presets?: ChatPreset[];
  settings?: AppSettings;
  chats?: ChatSession[];
}): Promise<void> {
  await db.transaction('rw', db.lorebooks, db.presets, db.settings, db.chats, async () => {
    if (data.lorebooks) {
      for (const lb of data.lorebooks) await saveLorebook(lb);
    }
    if (data.presets) {
      for (const p of data.presets) await savePreset(p);
    }
    if (data.settings) {
      await saveSettings(data.settings);
    }
    if (data.chats) {
      for (const c of data.chats) await saveChat(c);
    }
  });
}
