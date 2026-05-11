import type {
  BaseSlot,
  EquipmentSlot,
  EquippedItems,
  Item,
  ItemCompareLine,
  ItemCompareResult,
  ItemScoreMode,
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

const statWeights: Record<ItemScoreMode, Record<StatKey, number>> = {
  balanced: {
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
  },
  crit: {
    attack: 2.3,
    attackSpeed: 12,
    critChance: 22,
    critDamage: 7,
    hp: 0.32,
    armor: 0.75,
    dodgeChance: 6,
    fireRes: 0.7,
    iceRes: 0.7,
    lightningRes: 0.7,
    str: 2.5,
    dex: 4,
    int: 2.5,
    goldFind: 0.5,
    magicFind: 1,
  },
  speed: {
    attack: 2.1,
    attackSpeed: 24,
    critChance: 10,
    critDamage: 3.4,
    hp: 0.34,
    armor: 0.8,
    dodgeChance: 10,
    fireRes: 0.7,
    iceRes: 0.7,
    lightningRes: 0.7,
    str: 2.4,
    dex: 4.5,
    int: 2.4,
    goldFind: 0.6,
    magicFind: 1,
  },
  tank: {
    attack: 1.2,
    attackSpeed: 7,
    critChance: 5,
    critDamage: 2,
    hp: 0.9,
    armor: 2.4,
    dodgeChance: 14,
    fireRes: 2.2,
    iceRes: 2.2,
    lightningRes: 2.2,
    str: 3.4,
    dex: 2.8,
    int: 2.8,
    goldFind: 0.4,
    magicFind: 0.7,
  },
  mainAttribute: {
    attack: 2,
    attackSpeed: 13,
    critChance: 11,
    critDamage: 3.8,
    hp: 0.42,
    armor: 1,
    dodgeChance: 8,
    fireRes: 0.9,
    iceRes: 0.9,
    lightningRes: 0.9,
    str: 6,
    dex: 6,
    int: 6,
    goldFind: 0.6,
    magicFind: 1,
  },
};

export const itemScoreModeOptions: Array<{ value: ItemScoreMode; label: string }> = [
  { value: 'balanced', label: '均衡' },
  { value: 'crit', label: '暴击' },
  { value: 'speed', label: '攻速' },
  { value: 'tank', label: '坚韧' },
  { value: 'mainAttribute', label: '主属性' },
];

export const defaultItemScoreMode: ItemScoreMode = 'balanced';

export function isItemScoreMode(value: unknown): value is ItemScoreMode {
  return typeof value === 'string' && value in statWeights;
}

function getStatWeight(mode: ItemScoreMode, stat: StatKey): number {
  return statWeights[mode][stat] ?? statWeights.balanced[stat] ?? 1;
}

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

export function calculateItemScore(item: Item, mode: ItemScoreMode = defaultItemScoreMode): number {
  const baseScore = Object.entries(item.baseStats).reduce((sum, [stat, value]) => {
    return sum + (value ?? 0) * getStatWeight(mode, stat as StatKey);
  }, 0);
  const affixScore = item.affixes.reduce((sum, affix) => {
    return sum + affix.value * getStatWeight(mode, affix.stat) * (affix.isLegendary ? 1.8 : 1);
  }, 0);
  const rarityBonus = 1 + rarityRank[item.rarity] * 0.12;

  return Math.round((baseScore + affixScore) * rarityBonus);
}

export function getItemScore(item: Item, mode: ItemScoreMode = defaultItemScoreMode): number {
  if (mode === defaultItemScoreMode) {
    return item.score ?? calculateItemScore(item, mode);
  }
  return calculateItemScore(item, mode);
}

export function getComparableEquipmentSlot(
  slot: BaseSlot,
  equipped: EquippedItems,
  mode: ItemScoreMode = defaultItemScoreMode,
): EquipmentSlot {
  if (slot !== 'ring') return slot;
  if (!equipped.ring1) return 'ring1';
  if (!equipped.ring2) return 'ring2';

  const ring1Score = getItemScore(equipped.ring1, mode);
  const ring2Score = getItemScore(equipped.ring2, mode);
  return ring1Score <= ring2Score ? 'ring1' : 'ring2';
}

export function compareItemWithEquipped(
  item: Item,
  equipped: EquippedItems,
  mode: ItemScoreMode = defaultItemScoreMode,
): number {
  const slot = getComparableEquipmentSlot(item.slot, equipped, mode);
  const equippedItem = equipped[slot];
  const itemScore = getItemScore(item, mode);

  if (!equippedItem) return itemScore;
  return itemScore - getItemScore(equippedItem, mode);
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

export function getItemCompareResult(
  item: Item,
  equipped: EquippedItems,
  mode: ItemScoreMode = defaultItemScoreMode,
): ItemCompareResult {
  const targetSlot = getComparableEquipmentSlot(item.slot, equipped, mode);
  const equippedItem = equipped[targetSlot];
  const itemScore = getItemScore(item, mode);
  const equippedScore = equippedItem ? getItemScore(equippedItem, mode) : 0;
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

export function isBetterThanEquipped(
  item: Item,
  equipped: EquippedItems,
  mode: ItemScoreMode = defaultItemScoreMode,
): boolean {
  return compareItemWithEquipped(item, equipped, mode) > 0;
}

export function getRejectedItemMaterialValue(item: Item): number {
  if (item.rarity === 'normal') return 1;
  if (item.rarity === 'magic') return 2;
  if (item.rarity === 'rare') return 4;
  return 8;
}
