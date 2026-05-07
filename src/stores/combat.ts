import { defineStore } from 'pinia';
import { getStageConfig } from '@/data/monsters';
import { simulateStageCombat } from '@/core/combat/engine';
import { applyRewardDecay, calculatePlayerPower } from '@/core/combat/reward';
import type { CombatResult } from '@/types/combat';
import { MAX_LOG_ENTRIES } from '@/utils/constants';
import { useInventoryStore } from './inventory';
import { usePlayerStore } from './player';

interface CombatLog {
  id: number;
  message: string;
}

interface CombatState {
  currentStage: number;
  highestUnlockedStage: number;
  isAutoFighting: boolean;
  logs: CombatLog[];
  lastResult: CombatResult | null;
  lastRewardMultiplier: number;
  playerPower: number;
  totalAutoRuns: number;
  stoppedReason: string | null;
}

export const useCombatStore = defineStore('combat', {
  state: (): CombatState => ({
    currentStage: 1,
    highestUnlockedStage: 1,
    isAutoFighting: false,
    logs: [],
    lastResult: null,
    lastRewardMultiplier: 1,
    playerPower: 0,
    totalAutoRuns: 0,
    stoppedReason: null,
  }),

  getters: {
    stageConfig: (state) => getStageConfig(state.currentStage),
    isRewardDecayed: (state) => state.lastRewardMultiplier < 1,
  },

  actions: {
    addLog(message: string) {
      this.logs.push({ id: Date.now() + this.logs.length, message });
      if (this.logs.length > MAX_LOG_ENTRIES) {
        this.logs = this.logs.slice(-MAX_LOG_ENTRIES);
      }
    },

    setAutoFighting(active: boolean) {
      const inventory = useInventoryStore();
      if (active && inventory.isFull) {
        this.isAutoFighting = false;
        this.stoppedReason = '背包已满，自动挂机未启动。';
        this.addLog(this.stoppedReason);
        return;
      }

      this.isAutoFighting = active;
      this.stoppedReason = active ? null : '手动停止自动挂机。';
      this.addLog(active ? '自动挂机已启动。' : '自动挂机已停止。');
    },

    toggleAutoFighting() {
      this.setAutoFighting(!this.isAutoFighting);
    },

    runSingleCombat(source: 'manual' | 'auto' = 'manual') {
      const player = usePlayerStore();
      const inventory = useInventoryStore();

      if (inventory.isFull) {
        this.isAutoFighting = false;
        this.stoppedReason = '背包已满，收益已停止。';
        this.addLog(this.stoppedReason);
        return null;
      }

      const result = simulateStageCombat(
        {
          level: player.level,
          mainAttribute: player.mainAttribute,
          baseStats: player.totalStats,
          equipped: player.equipped,
          skillNodes: player.skillNodes,
        },
        this.currentStage,
      );

      this.lastResult = result;
      this.totalAutoRuns += source === 'auto' ? 1 : 0;

      if (!result.win) {
        this.addLog(`挑战 ${this.stageConfig.name} 失败，当前收益暂停。`);
        if (source === 'auto') {
          this.isAutoFighting = false;
          this.stoppedReason = '战斗失败，自动挂机已暂停。';
        }
        return result;
      }

      this.playerPower = calculatePlayerPower(player.dps, player.ehp);
      const reward = applyRewardDecay(result.gold, result.exp, this.playerPower, this.stageConfig.recommendedPower);
      this.lastRewardMultiplier = reward.multiplier;

      inventory.addGold(reward.gold);
      player.gainExp(reward.exp);

      const { added, rejected } = inventory.addItems(result.drops);
      added.forEach((item) => {
        this.addLog(`击败怪物，获得 ${item.name}。`);
      });

      rejected.forEach((item) => {
        this.addLog(`背包已满，${item.name} 未能拾取。`);
      });

      if (rejected.length > 0 || inventory.isFull) {
        this.isAutoFighting = false;
        this.stoppedReason = '背包已满，自动挂机已暂停。';
        this.addLog(this.stoppedReason);
      }

      if (result.drops.length === 0) {
        this.addLog(`击败怪物，获得 ${reward.gold} 金币和 ${reward.exp} 经验。`);
      }

      if (reward.multiplier < 1) {
        this.addLog(`战力低于推荐值，本次收益为 ${Math.round(reward.multiplier * 100)}%。`);
      }

      if (this.currentStage === this.highestUnlockedStage && player.dps > this.stageConfig.recommendedPower * 0.25) {
        this.highestUnlockedStage += 1;
      }

      return result;
    },
  },
});
