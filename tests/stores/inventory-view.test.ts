import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useInventoryViewStore } from '@/stores/inventoryView';

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
});
