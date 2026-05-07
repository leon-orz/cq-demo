import { affixPool, legendaryAffixes } from '@/data/affixes';
import type { Affix, BaseSlot, Rarity } from '@/types/item';
import { createId } from '@/core/utils/id';
import type { RandomSource } from '@/core/utils/random';
import { defaultRandom, pickOne } from '@/core/utils/random';

const affixCountByRarity: Record<Rarity, number> = {
  normal: 0,
  magic: 1,
  rare: 3,
  legendary: 4,
  ancient: 5,
};

export function getAffixCount(rarity: Rarity): number {
  return affixCountByRarity[rarity];
}

export function rollAffixes(
  rarity: Rarity,
  itemLevel: number,
  slot: BaseSlot,
  random: RandomSource = defaultRandom,
): Affix[] {
  const count = getAffixCount(rarity);
  if (count === 0) return [];

  const available = affixPool.filter((template) => template.slots.includes(slot));
  const affixes: Affix[] = [];
  const usedIds = new Set<string>();

  while (affixes.length < count && usedIds.size < available.length) {
    const template = pickOne(available, random);
    if (usedIds.has(template.id)) continue;

    usedIds.add(template.id);
    const scaledMax = template.max + Math.floor(itemLevel * 0.6);
    const value = Math.round(template.min + random.next() * (scaledMax - template.min));

    affixes.push({
      id: createId(template.id),
      name: template.name,
      stat: template.stat,
      value,
      valueType: template.valueType,
      tier: template.tier,
    });
  }

  if (rarity === 'legendary') {
    affixes[0] = { ...pickOne(legendaryAffixes, random), id: createId('legend') };
  }

  return affixes;
}
