import type { Monster } from '@/types/combat';
import type { PlayerBaseStats } from '@/types/player';

export function calculateMonsterDps(monster: Monster, playerStats: PlayerBaseStats): number {
  const armor = playerStats.armor ?? 0;
  const armorReduction = armor / (armor + monster.level * 50 + 500);
  return Math.max(1, monster.attack * (1 - armorReduction));
}

export function calculateKillTime(targetHp: number, dps: number): number {
  if (dps <= 0) return Number.POSITIVE_INFINITY;
  return targetHp / dps;
}

export function calculateRewardMultiplier(power: number, recommendedPower: number): number {
  const ratio = power / recommendedPower;
  if (ratio >= 1) return 1;
  if (ratio >= 0.8) return 0.8;
  if (ratio >= 0.6) return 0.5;
  return 0.2;
}
