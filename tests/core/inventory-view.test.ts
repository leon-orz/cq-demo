import { describe, expect, it } from 'vitest';
import {
  defaultInventoryViewFilter,
  filterInventoryItems,
  getInventoryViewItems,
  sortInventoryItems,
} from '@/core/item/inventoryView';
import type { EquippedItems, InventoryViewFilter, Item } from '@/types/item';

function createItem(overrides: Partial<Item> = {}): Item {
  const item: Item = {
    id: overrides.id ?? 'item_1',
    name: overrides.name ?? '测试装备',
    slot: overrides.slot ?? 'weapon',
    rarity: overrides.rarity ?? 'normal',
    itemLevel: overrides.itemLevel ?? 1,
    baseStats: overrides.baseStats ?? { attack: 5 },
    affixes: overrides.affixes ?? [],
  };

  if (overrides.locked !== undefined) item.locked = overrides.locked;
  if (overrides.score !== undefined) item.score = overrides.score;

  return item;
}

const emptyEquipped: EquippedItems = {
  weapon: null,
  offhand: null,
  helmet: null,
  armor: null,
  gloves: null,
  shoes: null,
  ring1: null,
  ring2: null,
  necklace: null,
};

function createFilter(overrides: Partial<InventoryViewFilter> = {}): InventoryViewFilter {
  return {
    ...defaultInventoryViewFilter,
    rarities: [],
    slots: [],
    ...overrides,
  };
}

describe('背包视图排序与筛选', () => {
  it('应按装备评分从高到低排序，且不改变原数组顺序', () => {
    const items = [
      createItem({ id: 'low', score: 10 }),
      createItem({ id: 'high', score: 30 }),
      createItem({ id: 'mid', score: 20 }),
    ];

    const sorted = sortInventoryItems(items, createFilter({ sortKey: 'score', sortDirection: 'desc' }));

    expect(sorted.map((item) => item.id)).toEqual(['high', 'mid', 'low']);
    expect(items.map((item) => item.id)).toEqual(['low', 'high', 'mid']);
  });

  it('应按品质和部位固定顺序排序', () => {
    const raritySorted = sortInventoryItems(
      [
        createItem({ id: 'magic', rarity: 'magic' }),
        createItem({ id: 'ancient', rarity: 'ancient' }),
        createItem({ id: 'rare', rarity: 'rare' }),
      ],
      createFilter({ sortKey: 'rarity', sortDirection: 'desc' }),
    );
    const slotSorted = sortInventoryItems(
      [
        createItem({ id: 'ring', slot: 'ring' }),
        createItem({ id: 'weapon', slot: 'weapon' }),
        createItem({ id: 'armor', slot: 'armor' }),
      ],
      createFilter({ sortKey: 'slot', sortDirection: 'asc' }),
    );

    expect(raritySorted.map((item) => item.id)).toEqual(['ancient', 'rare', 'magic']);
    expect(slotSorted.map((item) => item.id)).toEqual(['weapon', 'armor', 'ring']);
  });

  it('应按装备等级和新获得顺序排序', () => {
    const items = [
      createItem({ id: 'first', itemLevel: 3 }),
      createItem({ id: 'second', itemLevel: 8 }),
      createItem({ id: 'third', itemLevel: 5 }),
    ];

    expect(sortInventoryItems(items, createFilter({ sortKey: 'itemLevel' })).map((item) => item.id)).toEqual([
      'second',
      'third',
      'first',
    ]);
    expect(sortInventoryItems(items, createFilter({ sortKey: 'newest' })).map((item) => item.id)).toEqual([
      'third',
      'second',
      'first',
    ]);
  });

  it('应组合品质、部位、锁定和等级筛选', () => {
    const items = [
      createItem({ id: 'keep', rarity: 'rare', slot: 'weapon', itemLevel: 8 }),
      createItem({ id: 'low_level', rarity: 'rare', slot: 'weapon', itemLevel: 2 }),
      createItem({ id: 'locked', rarity: 'rare', slot: 'weapon', itemLevel: 8, locked: true }),
      createItem({ id: 'wrong_slot', rarity: 'rare', slot: 'ring', itemLevel: 8 }),
      createItem({ id: 'wrong_rarity', rarity: 'magic', slot: 'weapon', itemLevel: 8 }),
    ];

    const filtered = filterInventoryItems(
      items,
      createFilter({
        rarities: ['rare'],
        slots: ['weapon'],
        hideLocked: true,
        minItemLevel: 5,
      }),
      emptyEquipped,
    );

    expect(filtered.map((item) => item.id)).toEqual(['keep']);
  });

  it('只看更优装备时应只返回评分高于当前穿戴的装备', () => {
    const equipped: EquippedItems = {
      ...emptyEquipped,
      weapon: createItem({ id: 'equipped', score: 20 }),
    };
    const items = [createItem({ id: 'worse', score: 10 }), createItem({ id: 'better', score: 30 })];

    const visible = getInventoryViewItems(items, createFilter({ onlyUpgrades: true }), equipped);

    expect(visible.map((item) => item.id)).toEqual(['better']);
  });
});
