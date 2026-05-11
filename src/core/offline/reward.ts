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
  let actualSeconds = 0;
  let monstersKilled = 0;
  let gold = 0;
  let exp = 0;
  const shouldKeepDroppedItem =
    input.shouldKeepItem ?? (input.lootFilter ? (item: Item) => matchesLootFilter(item, input.lootFilter!) : null);

  for (const encounter of batch.encounters) {
    actualSeconds = encounter.elapsedSeconds;
    monstersKilled += 1;
    gold += encounter.gold;
    exp += encounter.exp;

    for (const item of encounter.drops) {
      if (shouldKeepDroppedItem && !shouldKeepDroppedItem(item)) {
        filteredItems.push(item);
        continue;
      }

      if (acceptedItems.length < input.remainingSlots) {
        acceptedItems.push(item);
        continue;
      }

      rejectedItems += 1;
      isInterrupted = true;
      break;
    }

    if (isInterrupted) {
      break;
    }
  }

  const wasInterrupted = rejectedItems > 0;
  const reward = applyRewardDecay(gold, exp, input.playerPower, stageConfig.recommendedPower);

  return {
    totalSeconds: cappedSeconds,
    actualSeconds: Math.floor(actualSeconds),
    cappedSeconds,
    monstersKilled,
    gold: reward.gold,
    exp: reward.exp,
    items: acceptedItems,
    filteredItems,
    rejectedItems,
    wasInterrupted,
    rewardMultiplier: reward.multiplier,
    playerPower: input.playerPower,
  };
}
