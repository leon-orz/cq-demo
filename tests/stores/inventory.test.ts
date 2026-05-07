import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useInventoryStore } from '@/stores/inventory';
import { INVENTORY_CAPACITY } from '@/utils/constants';
import type { Item } from '@/types/item';

function createItem(index: number): Item {
  return {
    id: `item_${index}`,
    name: `测试装备 ${index}`,
    slot: 'weapon',
    rarity: 'normal',
    itemLevel: 1,
    baseStats: { attack: 1 },
    affixes: [],
  };
}

describe('背包状态', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('背包满时应拒绝新增装备并记录损失', () => {
    const inventory = useInventoryStore();

    for (let index = 0; index < INVENTORY_CAPACITY; index += 1) {
      expect(inventory.addItem(createItem(index))).toBe(true);
    }

    expect(inventory.isFull).toBe(true);
    expect(inventory.addItem(createItem(999))).toBe(false);
    expect(inventory.lostDrops).toBe(1);
  });
});
