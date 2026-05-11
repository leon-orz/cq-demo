import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useCombatStore } from '@/stores/combat';
import { useFeedbackStore } from '@/stores/feedback';
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

  it('应提供推层目标摘要并支持切换推荐挂机层', () => {
    const player = usePlayerStore();
    const combat = useCombatStore();
    player.$patch({
      baseStats: {
        str: 20,
        dex: 10,
        int: 10,
        hp: 1500,
        attack: 220,
        attackSpeed: 1,
        critChance: 5,
        critDamage: 150,
        armor: 100,
      },
    });
    combat.$patch({ currentStage: 1, highestUnlockedStage: 8 });

    const summary = combat.progressionSummary;

    expect(summary.recommendedFarmStage).toBeGreaterThanOrEqual(1);
    expect(summary.recommendedFarmStage).toBeLessThanOrEqual(8);

    combat.switchToRecommendedFarmStage();

    expect(combat.currentStage).toBe(summary.recommendedFarmStage);
    expect(combat.logs.at(-1)?.message).toContain('推荐挂机层');
  });

  it('最高已解锁层挑战胜利后应解锁下一层', () => {
    const player = usePlayerStore();
    const combat = useCombatStore();
    player.$patch({
      baseStats: {
        str: 20,
        dex: 10,
        int: 10,
        hp: 2000,
        attack: 500,
        attackSpeed: 1,
        critChance: 5,
        critDamage: 150,
        armor: 100,
      },
    });
    combat.$patch({ currentStage: 1, highestUnlockedStage: 1 });

    const result = combat.runSingleCombat();

    expect(result?.win).toBe(true);
    expect(combat.highestUnlockedStage).toBe(2);
    expect(combat.logs.some((log) => log.message.includes('推层成功'))).toBe(true);
    expect(useFeedbackStore().latestEvent?.title).toBe('推层成功');
  });

  it('非最高层挑战胜利不应重复解锁层数', () => {
    const player = usePlayerStore();
    const combat = useCombatStore();
    player.$patch({
      baseStats: {
        str: 20,
        dex: 10,
        int: 10,
        hp: 2000,
        attack: 500,
        attackSpeed: 1,
        critChance: 5,
        critDamage: 150,
        armor: 100,
      },
    });
    combat.$patch({ currentStage: 1, highestUnlockedStage: 3 });

    const result = combat.runSingleCombat();

    expect(result?.win).toBe(true);
    expect(combat.highestUnlockedStage).toBe(3);
  });
});
