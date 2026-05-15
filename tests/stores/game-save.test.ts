import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useGameSave } from '@/composables/useGameSave';
import { OfflineCalculator } from '@/core/OfflineCalculator';
import { createEmptyEquipmentSlots, useEquipmentStore } from '@/stores/equipment';
import { createDefaultPlayer } from '@/stores/player';
import type { GameState, OfflineReport, SaveEnvelope } from '@/types';
import { Rarity, ScoreMode } from '@/types/enums';
import { SaveManager } from '@/services/SaveManager';

function createEmptyOfflineReport(offlineSeconds: number): OfflineReport {
  return {
    offlineSeconds,
    adjustedSeconds: offlineSeconds,
    totalKills: 0,
    totalGold: 0,
    totalExp: 0,
    totalDrops: [],
    qualityCounts: {
      [Rarity.NORMAL]: 0,
      [Rarity.MAGIC]: 0,
      [Rarity.RARE]: 0,
      [Rarity.LEGENDARY]: 0,
      [Rarity.ANCIENT]: 0,
    },
    effectiveMultiplier: 1,
    message: '离线结算完成，击杀 0 只怪物',
  };
}

describe('useGameSave', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-15T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('恢复存档后按保存的 currentFloor 计算离线收益并传入剩余背包容量', () => {
    const savedPlayer = createDefaultPlayer();
    savedPlayer.currentFloor = 1;
    savedPlayer.highestFloor = 1;
    const savedState: GameState = {
      player: savedPlayer,
      combat: {
        currentFloor: 9,
        isAutoCombat: false,
        killCount: 3,
        combatLog: [],
      },
      equipment: {
        equipped: createEmptyEquipmentSlots(),
        inventory: [],
        maxInventorySize: 5,
        scoreMode: ScoreMode.BALANCED,
      },
      lastOnlineTimestamp: Date.now() - 120_000,
    };
    const envelope: SaveEnvelope = {
      version: 1,
      timestamp: Date.now() - 120_000,
      data: savedState,
    };
    SaveManager.importSave(JSON.stringify(envelope));
    const calculateSpy = vi.spyOn(OfflineCalculator, 'calculate').mockReturnValue(createEmptyOfflineReport(120));

    const equipmentStore = useEquipmentStore();
    const gameSave = useGameSave();
    gameSave.initialize();

    expect(calculateSpy).toHaveBeenCalledOnce();
    expect(calculateSpy.mock.calls[0]?.[1]).toBe(9);
    expect(calculateSpy.mock.calls[0]?.[3]).toBe(5);
    expect(equipmentStore.maxInventorySize).toBe(5);
  });
});
