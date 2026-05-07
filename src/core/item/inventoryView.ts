import { calculateItemScore, isBetterThanEquipped } from '@/core/item/filter';
import type { BaseSlot, EquippedItems, InventoryViewFilter, Item, Rarity } from '@/types/item';

export const rarityOrder: Record<Rarity, number> = {
  normal: 0,
  magic: 1,
  rare: 2,
  legendary: 3,
  ancient: 4,
};

export const slotOrder: Record<BaseSlot, number> = {
  weapon: 0,
  offhand: 1,
  helmet: 2,
  armor: 3,
  gloves: 4,
  shoes: 5,
  ring: 6,
  necklace: 7,
};

export const defaultInventoryViewFilter: InventoryViewFilter = {
  sortKey: 'score',
  sortDirection: 'desc',
  rarities: [],
  slots: [],
  onlyUpgrades: false,
  hideLocked: false,
  minItemLevel: 0,
};

function getItemSortValue(item: Item, filter: InventoryViewFilter): number {
  if (filter.sortKey === 'score') return item.score ?? calculateItemScore(item);
  if (filter.sortKey === 'rarity') return rarityOrder[item.rarity];
  if (filter.sortKey === 'slot') return slotOrder[item.slot];
  if (filter.sortKey === 'itemLevel') return item.itemLevel;
  return 0;
}

export function filterInventoryItems(items: Item[], filter: InventoryViewFilter, equipped: EquippedItems): Item[] {
  return items.filter((item) => {
    if (filter.rarities.length > 0 && !filter.rarities.includes(item.rarity)) return false;
    if (filter.slots.length > 0 && !filter.slots.includes(item.slot)) return false;
    if (filter.onlyUpgrades && !isBetterThanEquipped(item, equipped)) return false;
    if (filter.hideLocked && item.locked) return false;
    if (item.itemLevel < filter.minItemLevel) return false;
    return true;
  });
}

export function sortInventoryItems(items: Item[], filter: InventoryViewFilter): Item[] {
  const direction = filter.sortDirection === 'asc' ? 1 : -1;

  return items
    .map((item, index) => ({ item, index }))
    .sort((first, second) => {
      const firstValue = filter.sortKey === 'newest' ? first.index : getItemSortValue(first.item, filter);
      const secondValue = filter.sortKey === 'newest' ? second.index : getItemSortValue(second.item, filter);
      const valueDiff = (firstValue - secondValue) * direction;

      if (valueDiff !== 0) return valueDiff;
      return first.item.id.localeCompare(second.item.id);
    })
    .map(({ item }) => item);
}

export function getInventoryViewItems(items: Item[], filter: InventoryViewFilter, equipped: EquippedItems): Item[] {
  return sortInventoryItems(filterInventoryItems(items, filter, equipped), filter);
}

export function hasActiveInventoryViewFilter(filter: InventoryViewFilter): boolean {
  return (
    filter.rarities.length > 0 ||
    filter.slots.length > 0 ||
    filter.onlyUpgrades ||
    filter.hideLocked ||
    filter.minItemLevel > 0
  );
}
