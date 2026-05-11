import { calculateRewardMultiplier } from './formula';
import { getGoldWithFind } from './economy';
import type { StatBlock } from '@/types/item';

export interface RewardPreview {
  power: number;
  multiplier: number;
  gold: number;
  exp: number;
}

export function calculatePlayerPower(dps: number, ehp: number): number {
  return Math.max(1, Math.round(dps * 4 + ehp * 0.35));
}

export function applyRewardDecay(
  gold: number,
  exp: number,
  power: number,
  recommendedPower: number,
  stats: StatBlock = {},
): RewardPreview {
  const multiplier = calculateRewardMultiplier(power, recommendedPower);
  const goldWithFind = getGoldWithFind(gold, stats);

  return {
    power,
    multiplier,
    gold: Math.max(0, Math.floor(goldWithFind * multiplier)),
    exp: Math.max(0, Math.floor(exp * multiplier)),
  };
}
