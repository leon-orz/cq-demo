import type {
  BaseSlot,
  EquipmentSlot,
  EquippedItems,
  Item,
  ItemCompareLine,
  ItemCompareResult,
  LootFilterRule,
  Rarity,
  StatKey,
} from '@/types/item';

const rarityRank: Record<Rarity, number> = {
  normal: 0,
  magic: 1,
  rare: 2,
  legendary: 3,
  ancient: 4,
};

const statWeight: Record<StatKey, number> = {
  attack: 2,
  attackSpeed: 14,
  critChance: 12,
  critDamage: 4,
  hp: 0.45,
  armor: 1,
  dodgeChance: 8,
  fireRes: 1,
  iceRes: 1,
  lightningRes: 1,
  str: 3,
  dex: 3,
  int: 3,
  goldFind: 0.8,
  magicFind: 1.2,
};

export const defaultLootFilterRule: LootFilterRule = {
  minRarity: 'normal',
  keepSlots: [],
  requiredAffixStats: [],
  autoConvertRejected: true,
};

export function isRarityAtLeast(rarity: Rarity, minRarity: Rarity): boolean {
  return rarityRank[rarity] >= rarityRank[minRarity];
}

export function shouldKeepItem(item: Item, rule: LootFilterRule): boolean {
  if (!isRarityAtLeast(item.rarity, rule.minRarity)) return false;
  if (rule.keepSlots.length > 0 && !rule.keepSlots.includes(item.slot)) return false;
  if (rule.requiredAffixStats.length > 0) {
    return item.affixes.some((affix) => rule.requiredAffixStats.includes(affix.stat));
  }
  return true;
}

export function calculateItemScore(item: Item): number {
  const baseScore = Object.entries(item.baseStats).reduce((sum, [stat, value]) => {
    return sum + (value ?? 0) * (statWeight[stat as StatKey] ?? 1);
  }, 0);
  const affixScore = item.affixes.reduce((sum, affix) => {
    return sum + affix.value * (statWeight[affix.stat] ?? 1) * (affix.isLegendary ? 1.8 : 1);
  }, 0);
  const rarityBonus = 1 + rarityRank[item.rarity] * 0.12;

  return Math.round((baseScore + affixScore) * rarityBonus);
}

export function getComparableEquipmentSlot(slot: BaseSlot, equipped: EquippedItems): EquipmentSlot {
  if (slot !== 'ring') return slot;
  if (!equipped.ring1) return 'ring1';
  if (!equipped.ring2) return 'ring2';

  const ring1Score = equipped.ring1.score ?? calculateItemScore(equipped.ring1);
  const ring2Score = equipped.ring2.score ?? calculateItemScore(equipped.ring2);
  return ring1Score <= ring2Score ? 'ring1' : 'ring2';
}

export function compareItemWithEquipped(item: Item, equipped: EquippedItems): number {
  const slot = getComparableEquipmentSlot(item.slot, equipped);
  const equippedItem = equipped[slot];
  const itemScore = item.score ?? calculateItemScore(item);

  if (!equippedItem) return itemScore;
  return itemScore - (equippedItem.score ?? calculateItemScore(equippedItem));
}

function collectComparableStats(item: Item | null): Partial<Record<StatKey, number>> {
  const stats: Partial<Record<StatKey, number>> = {};
  if (!item) return stats;

  Object.entries(item.baseStats).forEach(([stat, value]) => {
    stats[stat as StatKey] = (stats[stat as StatKey] ?? 0) + (value ?? 0);
  });
  item.affixes.forEach((affix) => {
    stats[affix.stat] = (stats[affix.stat] ?? 0) + affix.value;
  });

  return stats;
}

export function getItemCompareResult(item: Item, equipped: EquippedItems): ItemCompareResult {
  const targetSlot = getComparableEquipmentSlot(item.slot, equipped);
  const equippedItem = equipped[targetSlot];
  const itemScore = item.score ?? calculateItemScore(item);
  const equippedScore = equippedItem ? (equippedItem.score ?? calculateItemScore(equippedItem)) : 0;
  const nextStats = collectComparableStats(item);
  const currentStats = collectComparableStats(equippedItem);
  const statKeys = Array.from(new Set([...Object.keys(nextStats), ...Object.keys(currentStats)])) as StatKey[];
  const lines: ItemCompareLine[] = statKeys
    .map((stat) => {
      const nextValue = nextStats[stat] ?? 0;
      const currentValue = currentStats[stat] ?? 0;
      return {
        stat,
        currentValue,
        nextValue,
        delta: Math.round((nextValue - currentValue) * 10) / 10,
      };
    })
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return {
    targetSlot,
    equippedItem,
    itemScore,
    equippedScore,
    scoreDelta: itemScore - equippedScore,
    isUpgrade: itemScore > equippedScore,
    lines,
  };
}

export function isBetterThanEquipped(item: Item, equipped: EquippedItems): boolean {
  return compareItemWithEquipped(item, equipped) > 0;
}

export function getRejectedItemMaterialValue(item: Item): number {
  if (item.rarity === 'normal') return 1;
  if (item.rarity === 'magic') return 2;
  if (item.rarity === 'rare') return 4;
  return 8;
}
