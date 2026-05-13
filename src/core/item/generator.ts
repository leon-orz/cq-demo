import { accessories } from '@/data/items/accessories';
import { armors } from '@/data/items/armors';
import { weapons } from '@/data/items/weapons';
import type { BaseItem, Item, Rarity, StatBlock } from '@/types/item';
import { createId } from '@/core/utils/id';
import type { RandomSource } from '@/core/utils/random';
import { defaultRandom, pickOne } from '@/core/utils/random';
import { getMagicFindRarityMultipliers } from '@/core/combat/economy';
import { calculateItemScore } from './filter';
import { rollAffixes } from './affixRoll';
import { generateItemName } from './naming';

const baseItems: readonly BaseItem[] = [...weapons, ...armors, ...accessories];

export function rollRarity(monsterLevel: number, random: RandomSource = defaultRandom, stats: StatBlock = {}): Rarity {
  const roll = random.next();
  const rarityMultipliers = getMagicFindRarityMultipliers(stats);
  const legendaryChance = (0.001 + Math.floor(monsterLevel / 10) * 0.0005) * rarityMultipliers.legendary;
  const rareChance = 0.03 * rarityMultipliers.rare;

  if (roll < legendaryChance) return 'legendary';
  if (roll < rareChance) return 'rare';
  if (roll < 0.18) return 'magic';
  return 'normal';
}

export function pickBaseItem(monsterLevel: number, random: RandomSource = defaultRandom): BaseItem {
  const available = baseItems.filter((item) => item.minLevel <= monsterLevel);
  return pickOne(available, random);
}

export function generateItem(
  monsterLevel: number,
  rarityOverride?: Rarity,
  random: RandomSource = defaultRandom,
  stats: StatBlock = {},
): Item {
  const rarity = rarityOverride ?? rollRarity(monsterLevel, random, stats);
  const baseItem = pickBaseItem(monsterLevel, random);
  const itemLevel = Math.max(1, Math.floor(monsterLevel / 2 + 10));
  const affixes = rollAffixes(rarity, itemLevel, baseItem.slot, random);
  const scale = 1 + itemLevel * 0.08;
  const scaledBaseStats = Object.fromEntries(
    Object.entries(baseItem.baseStats).map(([key, value]) => [key, Math.round((value ?? 0) * scale * 10) / 10]),
  );

  const item: Item = {
    id: createId('item'),
    name: generateItemName(baseItem, affixes, rarity),
    slot: baseItem.slot,
    rarity,
    itemLevel,
    baseStats: scaledBaseStats,
    affixes,
  };

  item.score = calculateItemScore(item);
  return item;
}
