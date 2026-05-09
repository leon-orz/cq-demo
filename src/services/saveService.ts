import localforage from 'localforage';
import { cloneSaveSnapshot, migrateSaveSnapshot } from '@/core/save/migration';
import type { GameSaveSnapshot } from '@/types/save';

const SAVE_STORAGE_KEY = 'cq-demo:save-snapshot';

export interface SaveServiceResult<T> {
  ok: boolean;
  data: T | null;
  error?: string;
}

export async function writeSaveSnapshot(snapshot: GameSaveSnapshot): Promise<SaveServiceResult<GameSaveSnapshot>> {
  try {
    const clonedSnapshot = cloneSaveSnapshot(snapshot);
    await localforage.setItem(SAVE_STORAGE_KEY, clonedSnapshot);
    return { ok: true, data: clonedSnapshot };
  } catch {
    return { ok: false, data: null, error: '保存存档失败。' };
  }
}

export async function readSaveSnapshot(): Promise<SaveServiceResult<GameSaveSnapshot>> {
  try {
    const storedSnapshot = await localforage.getItem<unknown>(SAVE_STORAGE_KEY);
    if (!storedSnapshot) return { ok: true, data: null };

    const result = migrateSaveSnapshot(storedSnapshot);
    if (!result.ok) {
      return { ok: false, data: null, error: result.error ?? '存档迁移失败。' };
    }

    return { ok: true, data: result.snapshot };
  } catch {
    return { ok: false, data: null, error: '读取存档失败。' };
  }
}

export async function removeSaveSnapshot(): Promise<SaveServiceResult<null>> {
  try {
    await localforage.removeItem(SAVE_STORAGE_KEY);
    return { ok: true, data: null };
  } catch {
    return { ok: false, data: null, error: '删除存档失败。' };
  }
}

export function exportSaveSnapshot(snapshot: GameSaveSnapshot): SaveServiceResult<string> {
  try {
    return { ok: true, data: JSON.stringify(cloneSaveSnapshot(snapshot)) };
  } catch {
    return { ok: false, data: null, error: '导出存档失败。' };
  }
}

export function importSaveSnapshot(rawText: string): SaveServiceResult<GameSaveSnapshot> {
  try {
    const parsedSnapshot: unknown = JSON.parse(rawText);
    const result = migrateSaveSnapshot(parsedSnapshot);
    if (!result.ok) {
      return { ok: false, data: null, error: result.error ?? '存档迁移失败。' };
    }

    return { ok: true, data: result.snapshot };
  } catch {
    return { ok: false, data: null, error: '存档 JSON 格式错误。' };
  }
}
