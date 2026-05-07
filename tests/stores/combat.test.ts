import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useCombatStore } from '@/stores/combat';
import { useInventoryStore } from '@/stores/inventory';
import { usePlayerStore } from '@/stores/player';
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

describe('战斗状态', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('背包满时不应启动自动挂机', () => {
    const inventory = useInventoryStore();
    const combat = useCombatStore();

    for (let index = 0; index < INVENTORY_CAPACITY; index += 1) {
      inventory.addItem(createItem(index));
    }

    combat.setAutoFighting(true);

    expect(combat.isAutoFighting).toBe(false);
    expect(combat.stoppedReason).toContain('背包已满');
  });

  it('背包满时单次战斗应被前置拦截', () => {
    const inventory = useInventoryStore();
    const combat = useCombatStore();

    for (let index = 0; index < INVENTORY_CAPACITY; index += 1) {
      inventory.addItem(createItem(index));
    }

    const result = combat.runSingleCombat();

    expect(result).toBeNull();
    expect(combat.stoppedReason).toContain('背包已满');
  });

  it('自动战斗失败时应暂停挂机', () => {
    const player = usePlayerStore();
    const combat = useCombatStore();

    player.$patch({
      baseStats: {
        str: 1,
        dex: 1,
        int: 1,
        hp: 1,
        attack: 1,
        attackSpeed: 1,
        critChance: 0,
        critDamage: 150,
        armor: 0,
      },
    });

    combat.setAutoFighting(true);
    const result = combat.runSingleCombat('auto');

    expect(result?.win).toBe(false);
    expect(combat.isAutoFighting).toBe(false);
    expect(combat.stoppedReason).toContain('战斗失败');
  });
});
