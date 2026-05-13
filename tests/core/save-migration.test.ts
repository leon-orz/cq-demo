import { describe, expect, it } from 'vitest';
import { CURRENT_SAVE_SCHEMA_VERSION, migrateSaveSnapshot } from '@/core/save/migration';
import type { GameSaveSnapshot } from '@/types/save';

function createSnapshot(overrides: Partial<GameSaveSnapshot> = {}): GameSaveSnapshot {
  return {
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    savedAt: 1000,
    player: {
      name: '测试角色',
      level: 3,
      exp: 20,
      expToNext: 120,
      mainAttribute: 'str',
      baseStats: {
        str: 10,
        dex: 10,
        int: 10,
        hp: 120,
        attack: 12,
        attackSpeed: 1,
        critChance: 5,
        critDamage: 150,
        armor: 4,
      },
      equipped: {
        weapon: null,
        offhand: null,
        helmet: null,
        armor: null,
        gloves: null,
        shoes: null,
        ring1: null,
        ring2: null,
        necklace: null,
      },
      skillNodes: [],
      trainingLevels: {
        attack: 0,
        vitality: 0,
        guard: 0,
      },
    },
    inventory: {
      items: [],
      gold: 500,
      enhancementStones: 8,
      lostDrops: 1,
      autoConvertedDrops: 2,
    },
    settings: {
      itemScoreMode: 'balanced',
      lootFilter: {
        minRarity: 'magic',
        keepSlots: ['weapon'],
        requiredAffixStats: ['attack'],
        autoConvertRejected: true,
      },
      protectRareAndAbove: true,
      protectBetterItems: true,
    },
    inventoryView: {
      sortKey: 'score',
      sortDirection: 'desc',
      rarities: ['rare'],
      slots: ['weapon'],
      onlyUpgrades: true,
      hideLocked: false,
      minItemLevel: 2,
    },
    combat: {
      currentStage: 2,
      highestUnlockedStage: 4,
    },
    offline: {
      pendingReport: null,
      lastCheckedAt: null,
    },
    save: {
      version: CURRENT_SAVE_SCHEMA_VERSION,
      lastActiveTime: 900,
    },
    ...overrides,
  };
}

describe('存档迁移', () => {
  it('应接受当前版本存档并返回深拷贝', () => {
    const snapshot = createSnapshot();

    const result = migrateSaveSnapshot(snapshot);

    expect(result.ok).toBe(true);
    expect(result.snapshot).toEqual(snapshot);
    expect(result.snapshot).not.toBe(snapshot);
    expect(result.snapshot?.settings.lootFilter.keepSlots).not.toBe(snapshot.settings.lootFilter.keepSlots);
  });

  it('应剔除战斗运行态字段', () => {
    const snapshot = createSnapshot({
      combat: {
        currentStage: 3,
        highestUnlockedStage: 5,
        isAutoFighting: true,
        stoppedReason: '测试运行态',
      } as GameSaveSnapshot['combat'],
    });

    const result = migrateSaveSnapshot(snapshot);

    expect(result.ok).toBe(true);
    expect(result.snapshot?.combat).toEqual({
      currentStage: 3,
      highestUnlockedStage: 5,
    });
  });

  it('旧存档缺少评分偏好时应补均衡模式', () => {
    const snapshot = createSnapshot();
    const legacySettings = { ...snapshot.settings } as Partial<GameSaveSnapshot['settings']>;
    delete legacySettings.itemScoreMode;

    const result = migrateSaveSnapshot({ ...snapshot, settings: legacySettings });

    expect(result.ok).toBe(true);
    expect(result.snapshot?.settings.itemScoreMode).toBe('balanced');
  });

  it('旧存档缺少离线报告时应补默认离线状态', () => {
    const snapshot = createSnapshot();
    const legacySnapshot = { ...snapshot } as Partial<GameSaveSnapshot>;
    delete legacySnapshot.offline;

    const result = migrateSaveSnapshot(legacySnapshot);

    expect(result.ok).toBe(true);
    expect(result.snapshot?.offline).toEqual({
      pendingReport: null,
      lastCheckedAt: null,
    });
  });

  it('旧存档缺少训练等级时应补默认训练状态', () => {
    const snapshot = createSnapshot();
    const legacyPlayer = { ...snapshot.player } as Partial<GameSaveSnapshot['player']>;
    delete legacyPlayer.trainingLevels;

    const result = migrateSaveSnapshot({ ...snapshot, player: legacyPlayer });

    expect(result.ok).toBe(true);
    expect(result.snapshot?.player.trainingLevels).toEqual({
      attack: 0,
      vitality: 0,
      guard: 0,
    });
  });

  it('缺少版本号时应返回错误', () => {
    const result = migrateSaveSnapshot({ player: {} });

    expect(result.ok).toBe(false);
    expect(result.error).toContain('版本号');
  });

  it('版本高于当前客户端时应拒绝导入', () => {
    const result = migrateSaveSnapshot(createSnapshot({ schemaVersion: CURRENT_SAVE_SCHEMA_VERSION + 1 }));

    expect(result.ok).toBe(false);
    expect(result.error).toContain('高于当前客户端');
  });
});
