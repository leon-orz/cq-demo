import type { GameSaveSnapshot } from '@/types/save';

export const CURRENT_SAVE_SCHEMA_VERSION = 1;

export interface SaveMigrationResult {
  ok: boolean;
  snapshot: GameSaveSnapshot | null;
  error?: string;
}

export function cloneSaveSnapshot(snapshot: GameSaveSnapshot): GameSaveSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as GameSaveSnapshot;
}

export function migrateSaveSnapshot(input: unknown): SaveMigrationResult {
  if (!isRecord(input)) {
    return { ok: false, snapshot: null, error: '存档格式无效。' };
  }

  const schemaVersion = input.schemaVersion;
  if (typeof schemaVersion !== 'number') {
    return { ok: false, snapshot: null, error: '存档缺少版本号。' };
  }

  if (schemaVersion > CURRENT_SAVE_SCHEMA_VERSION) {
    return { ok: false, snapshot: null, error: '存档版本高于当前客户端，无法导入。' };
  }

  if (schemaVersion === 1) {
    return normalizeV1Snapshot(input);
  }

  return { ok: false, snapshot: null, error: '不支持的存档版本。' };
}

function normalizeV1Snapshot(input: Record<string, unknown>): SaveMigrationResult {
  const requiredKeys = ['player', 'inventory', 'settings', 'inventoryView', 'combat', 'save'] as const;
  const missingKey = requiredKeys.find((key) => !isRecord(input[key]));
  if (missingKey) {
    return { ok: false, snapshot: null, error: `存档缺少 ${missingKey} 数据。` };
  }

  const savedAt = typeof input.savedAt === 'number' ? input.savedAt : Date.now();
  const combat = input.combat as Record<string, unknown>;
  const snapshot = {
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    savedAt,
    player: input.player,
    inventory: input.inventory,
    settings: input.settings,
    inventoryView: input.inventoryView,
    combat: {
      currentStage: combat.currentStage,
      highestUnlockedStage: combat.highestUnlockedStage,
    },
    save: input.save,
  } as GameSaveSnapshot;

  return { ok: true, snapshot: cloneSaveSnapshot(snapshot) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
