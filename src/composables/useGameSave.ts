import { computed, ref, watch } from 'vue';
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
    lastOnlineTimestamp: Date.now(),
  }));

  function initialize(): void {
    const envelope = SaveManager.load();
    if (envelope) {
      applySave(envelope);
      calculateOffline(envelope.timestamp);
    }
    playerStore.recalculateStats();
    initialized.value = true;
  }

  function saveNow(): void {
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

  watch(
    gameState,
    (state) => {
      if (initialized.value) SaveManager.autoSave(state);
    },
    { deep: true },
  );

  return {
    offlineReport,
    initialize,
    saveNow,
    claimOfflineReport,
    exportSave,
    importSave,
  };
}
