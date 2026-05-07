import { getStageConfig } from '@/data/monsters';
import { simulateBatchCombat } from '@/core/combat/engine';
import { applyRewardDecay } from '@/core/combat/reward';
import { clampOfflineSeconds } from '@/core/utils/time';
import { MAX_OFFLINE_HOURS } from '@/utils/constants';
import type { OfflineReport } from '@/types/offline';
import type { PlayerBuild } from '@/types/player';
import type { RandomSource } from '@/core/utils/random';
import { defaultRandom } from '@/core/utils/random';

export interface OfflineRewardInput {
  lastActiveTime: number;
  now: number;
  playerBuild: PlayerBuild;
  stage: number;
  remainingSlots: number;
  playerPower: number;
  maxOfflineHours?: number;
  random?: RandomSource;
}

export function calculateOfflineReward(input: OfflineRewardInput): OfflineReport {
  const maxOfflineHours = input.maxOfflineHours ?? MAX_OFFLINE_HOURS;
  const cappedSeconds = clampOfflineSeconds(input.lastActiveTime, input.now, maxOfflineHours);

  if (cappedSeconds <= 0 || input.remainingSlots <= 0) {
    return {
      totalSeconds: cappedSeconds,
      actualSeconds: 0,
      cappedSeconds,
      monstersKilled: 0,
      gold: 0,
      exp: 0,
      items: [],
      rejectedItems: 0,
      wasInterrupted: input.remainingSlots <= 0 && cappedSeconds > 0,
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
      rejectedItems: 0,
      wasInterrupted: false,
      rewardMultiplier: 1,
      playerPower: input.playerPower,
    };
  }

  const acceptedItems = batch.drops.slice(0, input.remainingSlots);
  const rejectedItems = Math.max(0, batch.drops.length - acceptedItems.length);
  const wasInterrupted = rejectedItems > 0;
  const progressRatio = wasInterrupted && batch.drops.length > 0 ? acceptedItems.length / batch.drops.length : 1;
  const reward = applyRewardDecay(batch.gold, batch.exp, input.playerPower, stageConfig.recommendedPower);

  return {
    totalSeconds: cappedSeconds,
    actualSeconds: Math.floor(batch.actualSeconds * progressRatio),
    cappedSeconds,
    monstersKilled: Math.floor(batch.kills * progressRatio),
    gold: Math.floor(reward.gold * progressRatio),
    exp: Math.floor(reward.exp * progressRatio),
    items: acceptedItems,
    rejectedItems,
    wasInterrupted,
    rewardMultiplier: reward.multiplier,
    playerPower: input.playerPower,
  };
}
