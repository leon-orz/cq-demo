import { computed, getCurrentInstance, onBeforeUnmount, ref, watch } from 'vue';
import type { GameState, OfflineReport, SaveEnvelope } from '@/types';
import { OfflineCalculator } from '@/core/OfflineCalculator';
import { SaveManager } from '@/services/SaveManager';
import { useCombatStore } from '@/stores/combat';
import { useEquipmentStore } from '@/stores/equipment';
import { usePlayerStore } from '@/stores/player';

export function useGameSave() {
  const playerStore = usePlayerStore();
  const combatStore = useCombatStore();
  const equipmentStore = useEquipmentStore();
  const offlineReport = ref<OfflineReport | null>(null);
  const initialized = ref(false);
  const lastOnlineTimestamp = ref(Date.now());
  const cleanupTasks: Array<() => void> = [];
  let stopAutoSaveWatch: (() => void) | null = null;

  const gameState = computed<GameState>(() => ({
    player: playerStore.player,
    combat: {
      currentFloor: combatStore.currentFloor,
      isAutoCombat: combatStore.isAutoCombat,
      killCount: combatStore.killCount,
      combatLog: combatStore.combatLog,
    },
    equipment: {
      equipped: equipmentStore.equipped,
      inventory: equipmentStore.inventory,
      maxInventorySize: equipmentStore.maxInventorySize,
      scoreMode: equipmentStore.scoreMode,
    },
    lastOnlineTimestamp: lastOnlineTimestamp.value,
  }));

  function initialize(): void {
    if (!stopAutoSaveWatch) {
      stopAutoSaveWatch = watch(
        gameState,
        (state) => {
          if (initialized.value) SaveManager.autoSave(state);
        },
        { deep: true },
      );
    }
    if (cleanupTasks.length === 0) {
      registerSaveListeners();
    }
    const envelope = SaveManager.load();
    if (envelope) {
      applySave(envelope);
      calculateOffline(getOfflineTimestamp(envelope));
    }
    playerStore.recalculateStats();
    initialized.value = true;
  }

  function saveNow(): void {
    lastOnlineTimestamp.value = Date.now();
    SaveManager.save(gameState.value);
  }

  function claimOfflineReport(): void {
    if (!offlineReport.value) return;
    playerStore.gainGold(offlineReport.value.totalGold);
    playerStore.gainExp(offlineReport.value.totalExp);
    equipmentStore.addManyToInventory(offlineReport.value.totalDrops);
    offlineReport.value = null;
    saveNow();
  }

  function exportSave(): string {
    saveNow();
    return SaveManager.exportSave();
  }

  function importSave(json: string): boolean {
    const envelope = SaveManager.importSave(json);
    if (!envelope) return false;
    applySave(envelope);
    return true;
  }

  function applySave(envelope: SaveEnvelope): void {
    equipmentStore.applySaveState(envelope.data.equipment);
    playerStore.applySaveState(envelope.data.player);
    combatStore.applySaveState(envelope.data.combat);
    lastOnlineTimestamp.value = getOfflineTimestamp(envelope);
  }

  function calculateOffline(lastTimestamp: number): void {
    const offlineSeconds = Math.floor((Date.now() - lastTimestamp) / 1000);
    if (offlineSeconds < 60) return;
    const freeSlots = equipmentStore.maxInventorySize - equipmentStore.inventoryCount;
    offlineReport.value = OfflineCalculator.calculate(
      offlineSeconds,
      Math.max(1, Math.floor(combatStore.currentFloor)),
      playerStore.player,
      Math.max(0, freeSlots),
    );
  }

  function registerSaveListeners(): void {
    const handlePageHide = (): void => {
      saveNow();
    };
    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'hidden') {
        saveNow();
      }
    };

    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    cleanupTasks.push(() => window.removeEventListener('pagehide', handlePageHide));
    cleanupTasks.push(() => document.removeEventListener('visibilitychange', handleVisibilityChange));
  }

  function getOfflineTimestamp(envelope: SaveEnvelope): number {
    return envelope.timestamp ?? envelope.data.lastOnlineTimestamp;
  }

  function cleanup(): void {
    stopAutoSaveWatch?.();
    stopAutoSaveWatch = null;
    cleanupTasks.splice(0).forEach((task) => task());
    SaveManager.cancelAutoSave();
  }

  if (getCurrentInstance()) {
    onBeforeUnmount(cleanup);
  }

  return {
    offlineReport,
    initialize,
    saveNow,
    claimOfflineReport,
    exportSave,
    importSave,
    cleanup,
  };
}
