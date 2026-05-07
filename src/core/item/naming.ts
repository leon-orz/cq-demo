import type { Affix, BaseItem, Rarity } from '@/types/item';

export function generateItemName(baseItem: BaseItem, affixes: Affix[], rarity: Rarity): string {
  if (rarity === 'normal' || affixes.length === 0) {
    return baseItem.name;
  }

  if (rarity === 'legendary') {
    return `雷铸${baseItem.name}`;
  }

  const firstAffix = affixes[0]?.name ?? '未知';
  if (rarity === 'magic') {
    return `${firstAffix}的${baseItem.name}`;
  }

  const lastAffix = affixes.at(-1)?.name ?? firstAffix;
  return `${firstAffix}${baseItem.name}·${lastAffix}`;
}
