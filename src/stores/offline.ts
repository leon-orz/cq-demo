import { defineStore } from 'pinia';
import { calculatePlayerPower } from '@/core/combat/reward';
import { getRejectedItemMaterialValue, shouldKeepItem } from '@/core/item/filter';
import { calculateOfflineReward } from '@/core/offline/reward';
import type { OfflineReport } from '@/types/offline';
import { MIN_OFFLINE_SECONDS } from '@/utils/constants';
import { useCombatStore } from './combat';
import { useInventoryStore } from './inventory';
import { usePlayerStore } from './player';
import { useSaveStore } from './save';
import { useSettingsStore } from './settings';

interface OfflineState {
  pendingReport: OfflineReport | null;
  lastCheckedAt: number | null;
}

export const useOfflineStore = defineStore('offline', {
  state: (): OfflineState => ({
    pendingReport: null,
    lastCheckedAt: null,
  }),

  getters: {
    hasPendingReport: (state) => state.pendingReport !== null,
  },

  actions: {
    checkOfflineReward(now = Date.now()) {
      const player = usePlayerStore();
      const inventory = useInventoryStore();
      const combat = useCombatStore();
      const save = useSaveStore();
      const settings = useSettingsStore();
      const playerPower = calculatePlayerPower(player.dps, player.ehp);

      const report = calculateOfflineReward({
        lastActiveTime: save.lastActiveTime,
        now,
        playerBuild: {
          level: player.level,
          mainAttribute: player.mainAttribute,
          baseStats: player.totalStats,
          equipped: player.equipped,
          skillNodes: player.skillNodes,
        },
        stage: combat.currentStage,
        remainingSlots: inventory.remainingSlots,
        playerPower,
        shouldKeepItem: (item) => shouldKeepItem(item, settings.lootFilter),
      });

      this.lastCheckedAt = now;
      save.markActive(now);

      if (
        report.totalSeconds < MIN_OFFLINE_SECONDS ||
        (report.monstersKilled === 0 &&
          report.gold === 0 &&
          report.items.length === 0 &&
          report.filteredItems.length === 0)
      ) {
        this.pendingReport = null;
        return null;
      }

      this.pendingReport = report;
      return report;
    },

    claimPendingReport() {
      if (!this.pendingReport) return null;

      const report = this.pendingReport;
      const player = usePlayerStore();
      const inventory = useInventoryStore();
      const combat = useCombatStore();
      const settings = useSettingsStore();

      inventory.addGold(report.gold);
      if (settings.lootFilter.autoConvertRejected) {
        inventory.enhancementStones += report.filteredItems.reduce(
          (sum, item) => sum + getRejectedItemMaterialValue(item),
          0,
        );
        inventory.autoConvertedDrops += report.filteredItems.length;
      }
      report.items.forEach((item) => inventory.addItem(item));
      inventory.lostDrops += report.rejectedItems;
      player.gainExp(report.exp);
      combat.playerPower = report.playerPower;
      combat.lastRewardMultiplier = report.rewardMultiplier;
      combat.addLog(`离线收益已领取：${report.gold} 金币、${report.exp} 经验、${report.items.length} 件装备。`);

      if (report.wasInterrupted) {
        combat.stoppedReason = '离线期间背包已满，收益提前停止。';
        combat.addLog(combat.stoppedReason);
      }

      this.pendingReport = null;
      return report;
    },

    dismissPendingReport() {
      this.pendingReport = null;
    },
  },
});
