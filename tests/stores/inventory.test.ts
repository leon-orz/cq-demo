import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useInventoryStore } from '@/stores/inventory';
import { usePlayerStore } from '@/stores/player';
import { useSettingsStore } from '@/stores/settings';
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

  it('自动拾取过滤应把低品质装备转化为材料', () => {
    const inventory = useInventoryStore();
    const settings = useSettingsStore();
    settings.setMinRarity('rare');

    const result = inventory.processDroppedItem(createItem(1));

    expect(result.kept).toBe(false);
    expect(result.reason).toBe('filtered');
    expect(inventory.items).toHaveLength(0);
    expect(inventory.enhancementStones).toBeGreaterThan(0);
  });

  it('分解低品时应保护锁定和更优装备', () => {
    const inventory = useInventoryStore();
    const player = usePlayerStore();
    const settings = useSettingsStore();
    settings.protectBetterItems = true;

    inventory.addItem(createItem(1));
    inventory.addItem({ ...createItem(2), locked: true });
    inventory.addItem({ ...createItem(3), baseStats: { attack: 100 } });
    player.equipped.weapon = createItem(99);

    const decomposed = inventory.decomposeLowRarity();

    expect(decomposed).toBe(1);
    const preview = inventory.previewDecomposeLowRarity();

    expect(inventory.items.some((item) => item.locked)).toBe(true);
    expect(inventory.items.some((item) => item.baseStats.attack === 100)).toBe(true);
    expect(preview.protectedItems.some((entry) => entry.reason === '锁定保护')).toBe(true);
  });

  it('分解保护应按当前评分偏好判断更优装备', () => {
    const inventory = useInventoryStore();
    const player = usePlayerStore();
    const settings = useSettingsStore();
    settings.protectBetterItems = true;
    settings.setItemScoreMode('crit');
    player.equipped.weapon = { ...createItem(99), baseStats: { attack: 10 } };

    inventory.addItem(createItem(1));
    inventory.addItem({
      ...createItem(2),
      baseStats: {},
      affixes: [{ id: 'crit_affix', name: '鹰眼', stat: 'critChance', value: 3, valueType: 'flat', tier: 1 }],
    });

    const decomposed = inventory.decomposeLowRarity();

    expect(decomposed).toBe(1);
    expect(inventory.items.map((item) => item.id)).toEqual(['item_2']);
  });
});
