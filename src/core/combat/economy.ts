import { economyTuning } from '@/data/economy';
import type { Monster } from '@/types/combat';
import type { Rarity, StatBlock } from '@/types/item';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getSafeStat(stats: StatBlock, stat: 'goldFind' | 'magicFind'): number {
  const value = stats[stat] ?? 0;
  return Number.isFinite(value) ? value : 0;
}

export function getGoldFindMultiplier(stats: StatBlock): number {
  const goldFind = clamp(getSafeStat(stats, 'goldFind'), 0, economyTuning.maxGoldFind);
  return 1 + goldFind * economyTuning.goldFindMultiplierPerPoint;
}

export function getMagicFindDropChanceMultiplier(stats: StatBlock): number {
  const magicFind = clamp(getSafeStat(stats, 'magicFind'), 0, economyTuning.maxMagicFind);
  return 1 + magicFind * economyTuning.magicFindDropChanceMultiplierPerPoint;
}

export function getMagicFindRarityMultipliers(stats: StatBlock): Pick<Record<Rarity, number>, 'rare' | 'legendary'> {
  const magicFind = clamp(getSafeStat(stats, 'magicFind'), 0, economyTuning.maxMagicFind);
  return {
    rare: Math.min(
      economyTuning.maxMagicFindRarityMultiplier,
      1 + magicFind * economyTuning.magicFindRareChanceMultiplierPerPoint,
    ),
    legendary: Math.min(
      economyTuning.maxMagicFindRarityMultiplier,
      1 + magicFind * economyTuning.magicFindLegendaryChanceMultiplierPerPoint,
    ),
  };
}

export function getGoldWithFind(baseGold: number, stats: StatBlock): number {
  return Math.max(0, Math.round(baseGold * getGoldFindMultiplier(stats)));
}

export function getEffectiveDropChance(monster: Monster, stats: StatBlock): number {
  const baseDropChance = monster.dropChance ?? 0.35;
  return Math.min(economyTuning.maxDropChance, baseDropChance * getMagicFindDropChanceMultiplier(stats));
}

export function getExpectedDropValue(monster: Monster, stats: StatBlock): number {
  const rarityMultipliers = getMagicFindRarityMultipliers(stats);
  const qualityValueMultiplier = (rarityMultipliers.rare + rarityMultipliers.legendary) / 2;

  return (
    getEffectiveDropChance(monster, stats) *
    (monster.dropValueMultiplier ?? 1) *
    economyTuning.baseDropValue *
    (1 + monster.level / 80) *
    qualityValueMultiplier
  );
}
