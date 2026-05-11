import { defineStore } from 'pinia';
import { defaultItemScoreMode, isItemScoreMode } from '@/core/item/filter';
import { CURRENT_SAVE_SCHEMA_VERSION, cloneSaveSnapshot } from '@/core/save/migration';
import {
  exportSaveSnapshot,
  importSaveSnapshot,
  readSaveSnapshot,
  writeSaveSnapshot,
  type SaveServiceResult,
} from '@/services/saveService';
import type { GameSaveSnapshot } from '@/types/save';
import { useCombatStore } from './combat';
import { useInventoryStore } from './inventory';
import { useInventoryViewStore } from './inventoryView';
import { useOfflineStore } from './offline';
import { usePlayerStore } from './player';
import { useSettingsStore } from './settings';

interface SaveState {
  version: number;
  lastActiveTime: number;
  lastSnapshotAt: number | null;
  lastError: string | null;
}

export const useSaveStore = defineStore('save', {
  state: (): SaveState => ({
    version: CURRENT_SAVE_SCHEMA_VERSION,
    lastActiveTime: Date.now(),
    lastSnapshotAt: null,
    lastError: null,
  }),

  actions: {
    markActive(now = Date.now()) {
      this.lastActiveTime = now;
    },

    createSnapshot(now = Date.now()): GameSaveSnapshot {
      const player = usePlayerStore();
      const inventory = useInventoryStore();
      const settings = useSettingsStore();
      const inventoryView = useInventoryViewStore();
      const combat = useCombatStore();

      return cloneSaveSnapshot({
        schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
        savedAt: now,
        player: {
          name: player.name,
          level: player.level,
          exp: player.exp,
          expToNext: player.expToNext,
          mainAttribute: player.mainAttribute,
          baseStats: player.baseStats,
          equipped: player.equipped,
          skillNodes: player.skillNodes,
        },
        inventory: {
          items: inventory.items,
          gold: inventory.gold,
          enhancementStones: inventory.enhancementStones,
          lostDrops: inventory.lostDrops,
          autoConvertedDrops: inventory.autoConvertedDrops,
        },
        settings: {
          itemScoreMode: settings.itemScoreMode,
          lootFilter: settings.lootFilter,
          protectRareAndAbove: settings.protectRareAndAbove,
          protectBetterItems: settings.protectBetterItems,
        },
        inventoryView: {
          sortKey: inventoryView.sortKey,
          sortDirection: inventoryView.sortDirection,
          rarities: inventoryView.rarities,
          slots: inventoryView.slots,
          onlyUpgrades: inventoryView.onlyUpgrades,
          hideLocked: inventoryView.hideLocked,
          minItemLevel: inventoryView.minItemLevel,
        },
        combat: {
          currentStage: combat.currentStage,
          highestUnlockedStage: combat.highestUnlockedStage,
        },
        save: {
          version: this.version,
          lastActiveTime: this.lastActiveTime,
        },
      });
    },

    restoreSnapshot(snapshot: GameSaveSnapshot) {
      const clonedSnapshot = cloneSaveSnapshot(snapshot);
      const player = usePlayerStore();
      const inventory = useInventoryStore();
      const settings = useSettingsStore();
      const inventoryView = useInventoryViewStore();
      const combat = useCombatStore();
      const offline = useOfflineStore();

      player.$patch(clonedSnapshot.player);
      inventory.$patch(clonedSnapshot.inventory);
      settings.$patch({
        itemScoreMode: isItemScoreMode(clonedSnapshot.settings.itemScoreMode)
          ? clonedSnapshot.settings.itemScoreMode
          : defaultItemScoreMode,
        lootFilter: {
          ...clonedSnapshot.settings.lootFilter,
          keepSlots: [...clonedSnapshot.settings.lootFilter.keepSlots],
          requiredAffixStats: [...clonedSnapshot.settings.lootFilter.requiredAffixStats],
        },
        protectRareAndAbove: clonedSnapshot.settings.protectRareAndAbove,
        protectBetterItems: clonedSnapshot.settings.protectBetterItems,
      });
      inventoryView.$patch({
        ...clonedSnapshot.inventoryView,
        rarities: [...clonedSnapshot.inventoryView.rarities],
        slots: [...clonedSnapshot.inventoryView.slots],
        isFilterPanelOpen: false,
      });
      combat.$patch({
        currentStage: clonedSnapshot.combat.currentStage,
        highestUnlockedStage: clonedSnapshot.combat.highestUnlockedStage,
        isAutoFighting: false,
        logs: [],
        lastResult: null,
        stoppedReason: null,
      });
      offline.$patch({
        pendingReport: null,
        lastCheckedAt: null,
      });
      this.$patch({
        version: clonedSnapshot.save.version,
        lastActiveTime: clonedSnapshot.save.lastActiveTime,
        lastSnapshotAt: clonedSnapshot.savedAt,
        lastError: null,
      });
    },

    async saveToLocal(now = Date.now()): Promise<SaveServiceResult<GameSaveSnapshot>> {
      const snapshot = this.createSnapshot(now);
      const result = await writeSaveSnapshot(snapshot);
      this.lastError = result.ok ? null : (result.error ?? '保存存档失败。');
      if (result.ok) {
        this.lastSnapshotAt = snapshot.savedAt;
      }
      return result;
    },

    async loadFromLocal(): Promise<SaveServiceResult<GameSaveSnapshot>> {
      const result = await readSaveSnapshot();
      this.lastError = result.ok ? null : (result.error ?? '读取存档失败。');
      if (result.ok && result.data) {
        this.restoreSnapshot(result.data);
      }
      return result;
    },

    exportSave(now = Date.now()): SaveServiceResult<string> {
      const result = exportSaveSnapshot(this.createSnapshot(now));
      this.lastError = result.ok ? null : (result.error ?? '导出存档失败。');
      return result;
    },

    importSave(rawText: string) {
      const result = importSaveSnapshot(rawText);
      this.lastError = result.ok ? null : (result.error ?? '导入存档失败。');
      if (result.ok && result.data) {
        this.restoreSnapshot(result.data);
      }
      return result;
    },
  },

  persist: {
    key: 'save',
  },
});
