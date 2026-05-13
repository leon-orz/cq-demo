import type { EquippedItems, StatBlock } from '@/types/item';
import type { MainAttribute, PlayerBaseStats, SkillNode } from '@/types/player';

function addStat(stats: StatBlock, key: keyof StatBlock, value: number): void {
  stats[key] = (stats[key] ?? 0) + value;
}

export function calculateTotalStats(
  baseStats: PlayerBaseStats,
  equipped: EquippedItems,
  skillNodes: SkillNode[] = [],
  trainingBonuses: StatBlock = {},
): PlayerBaseStats {
  const stats: StatBlock = { ...baseStats };

  Object.entries(trainingBonuses).forEach(([key, value]) => {
    addStat(stats, key as keyof StatBlock, value ?? 0);
  });

  Object.values(equipped).forEach((item) => {
    if (!item) return;

    Object.entries(item.baseStats).forEach(([key, value]) => {
      addStat(stats, key as keyof StatBlock, value ?? 0);
    });

    item.affixes.forEach((affix) => {
      addStat(stats, affix.stat, affix.value);
    });
  });

  skillNodes.forEach((node) => {
    if (node.active) {
      addStat(stats, node.stat, node.value);
    }
  });

  const totalStats: PlayerBaseStats = {
    str: stats.str ?? 0,
    dex: stats.dex ?? 0,
    int: stats.int ?? 0,
    hp: stats.hp ?? 1,
    attack: stats.attack ?? 0,
    attackSpeed: Math.min(stats.attackSpeed ?? 1, 5),
    critChance: Math.min(stats.critChance ?? 5, 75),
    critDamage: stats.critDamage ?? 150,
    dodgeChance: Math.min(stats.dodgeChance ?? 0, 60),
  };

  if (stats.armor !== undefined) totalStats.armor = stats.armor;
  if (stats.fireRes !== undefined) totalStats.fireRes = stats.fireRes;
  if (stats.iceRes !== undefined) totalStats.iceRes = stats.iceRes;
  if (stats.lightningRes !== undefined) totalStats.lightningRes = stats.lightningRes;
  if (stats.goldFind !== undefined) totalStats.goldFind = stats.goldFind;
  if (stats.magicFind !== undefined) totalStats.magicFind = stats.magicFind;

  return totalStats;
}

export function calculateDps(stats: PlayerBaseStats, mainAttribute: MainAttribute = 'str'): number {
  const mainStatBonus = 1 + stats[mainAttribute] * 0.005;
  const critChance = Math.min(stats.critChance, 75) / 100;
  const critDamage = stats.critDamage / 100;

  return stats.attack * mainStatBonus * Math.min(stats.attackSpeed, 5) * (1 + critChance * (critDamage - 1));
}

export function calculateEhp(stats: PlayerBaseStats, monsterLevel: number): number {
  const armor = stats.armor ?? 0;
  const resistance = Math.max(stats.fireRes ?? 0, stats.iceRes ?? 0, stats.lightningRes ?? 0);
  const dodgeChance = Math.min(stats.dodgeChance ?? 0, 60) / 100;
  const armorReduction = armor / (armor + monsterLevel * 50 + 500);
  const resistanceReduction = resistance / (resistance + 100);

  return stats.hp / ((1 - armorReduction) * (1 - resistanceReduction) * (1 - dodgeChance));
}

export function calculateGearScore(equipped: EquippedItems): number {
  return Object.values(equipped).reduce((score, item) => {
    if (!item) return score;

    const baseScore = Object.values(item.baseStats).reduce((sum, value) => sum + (value ?? 0), 0);
    const affixScore = item.affixes.reduce((sum, affix) => sum + affix.value * (affix.tier === 1 ? 1 : 1.5), 0);
    return Math.round(score + baseScore + affixScore);
  }, 0);
}
