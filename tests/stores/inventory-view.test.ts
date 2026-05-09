import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useInventoryViewStore } from '@/stores/inventoryView';
import type { EquippedItems, Item } from '@/types/item';

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

describe('背包视图状态', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('应支持切换排序字段和方向', () => {
    const inventoryView = useInventoryViewStore();

    inventoryView.setSortKey('rarity');
    inventoryView.setSortKey('rarity');

    expect(inventoryView.sortKey).toBe('rarity');
    expect(inventoryView.sortDirection).toBe('asc');
  });

  it('应支持品质、部位和开关筛选', () => {
    const inventoryView = useInventoryViewStore();

    inventoryView.toggleRarity('rare');
    inventoryView.toggleSlot('weapon');
    inventoryView.setOnlyUpgrades(true);
    inventoryView.setHideLocked(true);
    inventoryView.setMinItemLevel(8);

    expect(inventoryView.filter.rarities).toEqual(['rare']);
    expect(inventoryView.filter.slots).toEqual(['weapon']);
    expect(inventoryView.filter.onlyUpgrades).toBe(true);
    expect(inventoryView.filter.hideLocked).toBe(true);
    expect(inventoryView.filter.minItemLevel).toBe(8);
    expect(inventoryView.hasActiveFilter).toBe(true);
  });

  it('应重置筛选条件但保留排序方式', () => {
    const inventoryView = useInventoryViewStore();
    inventoryView.setSortKey('slot');
    inventoryView.toggleRarity('magic');
    inventoryView.setHideLocked(true);

    inventoryView.resetViewFilter();

    expect(inventoryView.sortKey).toBe('slot');
    expect(inventoryView.rarities).toHaveLength(0);
    expect(inventoryView.hideLocked).toBe(false);
    expect(inventoryView.hasActiveFilter).toBe(false);
  });

  it('应提供筛选排序后的可见装备且不改变背包原始顺序', () => {
    const inventoryView = useInventoryViewStore();
    const items = [
      createItem({ id: 'low', rarity: 'rare', score: 10 }),
      createItem({ id: 'hidden', rarity: 'magic', score: 40 }),
      createItem({ id: 'high', rarity: 'rare', score: 30 }),
    ];

    inventoryView.toggleRarity('rare');

    const visibleItems = inventoryView.visibleItems(items, emptyEquipped);

    expect(visibleItems.map((item) => item.id)).toEqual(['high', 'low']);
    expect(items.map((item) => item.id)).toEqual(['low', 'hidden', 'high']);
  });

  it('应根据背包总数提供空列表文案', () => {
    const inventoryView = useInventoryViewStore();

    expect(inventoryView.emptyText(0)).toBe('背包为空，挑战怪物获取装备。');
    expect(inventoryView.emptyText(3)).toBe('没有符合当前筛选条件的装备。');
  });

  it('应仅在背包非空且存在筛选条件时显示重置入口', () => {
    const inventoryView = useInventoryViewStore();

    expect(inventoryView.showReset(0)).toBe(false);
    expect(inventoryView.showReset(2)).toBe(false);

    inventoryView.setHideLocked(true);

    expect(inventoryView.showReset(0)).toBe(false);
    expect(inventoryView.showReset(2)).toBe(true);
  });
});
