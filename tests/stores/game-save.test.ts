import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useGameSave } from '@/composables/useGameSave';
import { OfflineCalculator } from '@/core/OfflineCalculator';
import { createEmptyEquipmentSlots, useEquipmentStore } from '@/stores/equipment';
import { createDefaultPlayer } from '@/stores/player';
import { usePlayerStore } from '@/stores/player';
import type { GameState, OfflineReport, SaveEnvelope } from '@/types';
import { Rarity, ScoreMode } from '@/types/enums';
import { SaveManager } from '@/services/SaveManager';
import { useCombatStore } from '@/stores/combat';

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
  let gameSave: ReturnType<typeof useGameSave> | null = null;

  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.useFakeTimers();
    vi.clearAllTimers();
    vi.setSystemTime(new Date('2026-05-15T00:00:00.000Z'));
  });

  afterEach(() => {
    gameSave?.cleanup();
    gameSave = null;
    vi.clearAllTimers();
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
    savedState.lastOnlineTimestamp = Date.now() - 120_000;
    const envelope: SaveEnvelope = {
      version: 1,
      timestamp: Date.now() - 120_000,
      data: savedState,
    };
    SaveManager.importSave(JSON.stringify(envelope));
    const calculateSpy = vi.spyOn(OfflineCalculator, 'calculate').mockReturnValue(createEmptyOfflineReport(120));

    const equipmentStore = useEquipmentStore();
    gameSave = useGameSave();
    gameSave.initialize();

    expect(calculateSpy).toHaveBeenCalledOnce();
    expect(calculateSpy.mock.calls[0]?.[0]).toBe(120);
    expect(calculateSpy.mock.calls[0]?.[1]).toBe(9);
    expect(calculateSpy.mock.calls[0]?.[3]).toBe(5);
    expect(equipmentStore.maxInventorySize).toBe(5);
  });

  it('pagehide 和可见性变化会立即保存，清理后不再触发', () => {
    const saveSpy = vi.spyOn(SaveManager, 'save');
    gameSave = useGameSave();

    gameSave.initialize();
    window.dispatchEvent(new Event('pagehide'));
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));

    expect(saveSpy).toHaveBeenCalledTimes(2);

    gameSave.cleanup();
    gameSave = null;

    window.dispatchEvent(new Event('pagehide'));
    document.dispatchEvent(new Event('visibilitychange'));

    expect(saveSpy).toHaveBeenCalledTimes(2);
  });

  it('导入坏档、旧版本和高版本不会污染现有状态', () => {
    const playerStore = usePlayerStore();
    const combatStore = useCombatStore();
    const equipmentStore = useEquipmentStore();
    gameSave = useGameSave();

    playerStore.player.gold = 999;
    combatStore.currentFloor = 7;
    equipmentStore.maxInventorySize = 12;

    const snapshot = JSON.stringify({
      gold: playerStore.player.gold,
      floor: combatStore.currentFloor,
      maxInventorySize: equipmentStore.maxInventorySize,
      storage: localStorage.getItem('idle_rift_save'),
    });

    expect(gameSave.importSave('not-json')).toBe(false);
    expect(gameSave.importSave(JSON.stringify({ version: 0, timestamp: Date.now(), data: {} }))).toBe(false);
    expect(
      gameSave.importSave(
        JSON.stringify({
          version: 2,
          timestamp: Date.now(),
          data: {
            player: playerStore.player,
            combat: combatStore.$state,
            equipment: equipmentStore.$state,
          },
        }),
      ),
    ).toBe(false);

    expect(
      JSON.stringify({
        gold: playerStore.player.gold,
        floor: combatStore.currentFloor,
        maxInventorySize: equipmentStore.maxInventorySize,
        storage: localStorage.getItem('idle_rift_save'),
      }),
    ).toBe(snapshot);
  });

  it('重复恢复自动挂机时不会重复启动战斗计时器', () => {
    gameSave = useGameSave();

    const saveState: GameState = {
      player: createDefaultPlayer(),
      combat: {
        currentFloor: 2,
        isAutoCombat: true,
        killCount: 3,
        combatLog: [],
      },
      equipment: {
        equipped: createEmptyEquipmentSlots(),
        inventory: [],
        maxInventorySize: 10,
        scoreMode: ScoreMode.BALANCED,
      },
      lastOnlineTimestamp: Date.now(),
    };

    gameSave.importSave(JSON.stringify({ version: 1, timestamp: Date.now(), data: saveState }));
    const timerCountAfterFirstImport = vi.getTimerCount();
    gameSave.importSave(JSON.stringify({ version: 1, timestamp: Date.now(), data: saveState }));

    expect(vi.getTimerCount()).toBe(timerCountAfterFirstImport);
  });
});
