import { getStageConfig } from '@/data/monsters';
import { simulateBatchCombat } from '@/core/combat/engine';
import { applyRewardDecay } from '@/core/combat/reward';
import { shouldKeepItem as matchesLootFilter } from '@/core/item/filter';
import { clampOfflineSeconds } from '@/core/utils/time';
import { MAX_OFFLINE_HOURS } from '@/utils/constants';
import type { OfflineReport } from '@/types/offline';
import type { PlayerBuild } from '@/types/player';
import type { RandomSource } from '@/core/utils/random';
import { defaultRandom } from '@/core/utils/random';
import type { Item, LootFilterRule } from '@/types/item';

export interface OfflineRewardInput {
  lastActiveTime: number;
  now: number;
  playerBuild: PlayerBuild;
  stage: number;
  remainingSlots: number;
  playerPower: number;
  maxOfflineHours?: number;
  random?: RandomSource;
  shouldKeepItem?: (item: Item) => boolean;
  lootFilter?: LootFilterRule;
}

export function calculateOfflineReward(input: OfflineRewardInput): OfflineReport {
  const maxOfflineHours = input.maxOfflineHours ?? MAX_OFFLINE_HOURS;
  const cappedSeconds = clampOfflineSeconds(input.lastActiveTime, input.now, maxOfflineHours);

  if (cappedSeconds <= 0) {
    return {
      totalSeconds: cappedSeconds,
      actualSeconds: 0,
      cappedSeconds,
      monstersKilled: 0,
      gold: 0,
      exp: 0,
      items: [],
      filteredItems: [],
      rejectedItems: 0,
      wasInterrupted: false,
      rewardMultiplier: 1,
      playerPower: input.playerPower,
    };
  }

  const stageConfig = getStageConfig(input.stage);
  const batch = simulateBatchCombat(input.playerBuild, stageConfig, cappedSeconds, input.random ?? defaultRandom);

  if (batch.kills <= 0) {
    return {
      totalSeconds: cappedSeconds,
      actualSeconds: 0,
      cappedSeconds,
      monstersKilled: 0,
      gold: 0,
      exp: 0,
      items: [],
      filteredItems: [],
      rejectedItems: 0,
      wasInterrupted: false,
      rewardMultiplier: 1,
      playerPower: input.playerPower,
    };
  }

  const acceptedItems: Item[] = [];
  const filteredItems: Item[] = [];
  let rejectedItems = 0;
  let isInterrupted = false;
  let processedDropsBeforeInterrupted = batch.drops.length;
  const shouldKeepDroppedItem =
    input.shouldKeepItem ?? (input.lootFilter ? (item: Item) => matchesLootFilter(item, input.lootFilter!) : null);

  batch.drops.forEach((item, index) => {
    if (shouldKeepDroppedItem && !shouldKeepDroppedItem(item)) {
      if (!isInterrupted) {
        filteredItems.push(item);
      }
      return;
    }

    if (acceptedItems.length < input.remainingSlots) {
      acceptedItems.push(item);
      return;
    }

    isInterrupted = true;
    if (rejectedItems === 0) {
      processedDropsBeforeInterrupted = index;
    }
    rejectedItems += 1;
  });

  const wasInterrupted = rejectedItems > 0;
  const progressRatio =
    wasInterrupted && batch.drops.length > 0 ? processedDropsBeforeInterrupted / batch.drops.length : 1;
  const reward = applyRewardDecay(batch.gold, batch.exp, input.playerPower, stageConfig.recommendedPower);

  return {
    totalSeconds: cappedSeconds,
    actualSeconds: Math.floor(batch.actualSeconds * progressRatio),
    cappedSeconds,
    monstersKilled: Math.floor(batch.kills * progressRatio),
    gold: Math.floor(reward.gold * progressRatio),
    exp: Math.floor(reward.exp * progressRatio),
    items: acceptedItems,
    filteredItems,
    rejectedItems,
    wasInterrupted,
    rewardMultiplier: reward.multiplier,
    playerPower: input.playerPower,
  };
}
