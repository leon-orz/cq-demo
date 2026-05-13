import { defineStore } from 'pinia';
import {
  createOfflineClaimFeedback,
  createOfflineFilteredHighlightFeedback,
  createOfflineHighlightItemFeedback,
} from '@/core/feedback/rewardFeedback';
import { getRejectedItemMaterialValue, shouldKeepItem } from '@/core/item/filter';
import { calculateOfflineReward } from '@/core/offline/reward';
import type { OfflineReport } from '@/types/offline';
import { MIN_OFFLINE_SECONDS } from '@/utils/constants';
import { useCombatStore } from './combat';
import { useFeedbackStore } from './feedback';
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

      if (this.pendingReport) {
        this.lastCheckedAt = now;
        save.markActive(now);
        return this.pendingReport;
      }

      const playerBuild = {
        level: player.level,
        mainAttribute: player.mainAttribute,
        baseStats: player.totalStats,
        equipped: player.equipped,
        skillNodes: player.skillNodes,
        trainingLevels: player.trainingLevels,
      };
      const playerPower = combat.progressionSummary.current.playerPower;

      const report = calculateOfflineReward({
        lastActiveTime: save.lastActiveTime,
        now,
        playerBuild,
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
      const feedback = useFeedbackStore();
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
      combat.addLog(`离线收益已领取：${report.gold} 金币、${report.exp} 经验、${report.items.length} 件装备。`);
      feedback.pushFeedback(createOfflineClaimFeedback(report, player.equipped, settings.itemScoreMode));
      feedback.pushFeedback(createOfflineHighlightItemFeedback(report, player.equipped, settings.itemScoreMode));
      feedback.pushFeedback(createOfflineFilteredHighlightFeedback(report, player.equipped, settings.itemScoreMode));

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

  persist: {
    key: 'offline',
  },
});
