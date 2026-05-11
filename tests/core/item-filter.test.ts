import { describe, expect, it } from 'vitest';
import { calculateItemScore, compareItemWithEquipped, defaultLootFilterRule, shouldKeepItem } from '@/core/item/filter';
import type { EquippedItems, Item, LootFilterRule } from '@/types/item';

function createItem(overrides: Partial<Item> = {}): Item {
  return {
    id: overrides.id ?? 'item_1',
    name: overrides.name ?? '测试装备',
    slot: overrides.slot ?? 'weapon',
    rarity: overrides.rarity ?? 'normal',
    itemLevel: overrides.itemLevel ?? 1,
    baseStats: overrides.baseStats ?? { attack: 5 },
    affixes: overrides.affixes ?? [],
    ...overrides,
  };
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

describe('装备过滤与对比', () => {
  it('低于最低品质的装备应被过滤', () => {
    const rule: LootFilterRule = { ...defaultLootFilterRule, minRarity: 'rare' };

    expect(shouldKeepItem(createItem({ rarity: 'magic' }), rule)).toBe(false);
    expect(shouldKeepItem(createItem({ rarity: 'rare' }), rule)).toBe(true);
  });

  it('要求词缀时应只保留命中词缀的装备', () => {
    const rule: LootFilterRule = { ...defaultLootFilterRule, requiredAffixStats: ['critChance'] };

    expect(
      shouldKeepItem(
        createItem({
          rarity: 'rare',
          affixes: [{ id: 'a1', name: '鹰眼', stat: 'critChance', value: 5, valueType: 'flat', tier: 1 }],
        }),
        rule,
      ),
    ).toBe(true);
    expect(shouldKeepItem(createItem({ rarity: 'rare' }), rule)).toBe(false);
  });

  it('应能比较新装备和已穿戴装备评分差', () => {
    const equipped = {
      ...emptyEquipped,
      weapon: createItem({ id: 'old', baseStats: { attack: 5 } }),
    };
    const better = createItem({ id: 'new', baseStats: { attack: 20 } });

    expect(calculateItemScore(better)).toBeGreaterThan(calculateItemScore(equipped.weapon!));
    expect(compareItemWithEquipped(better, equipped)).toBeGreaterThan(0);
  });

  it('不同评分偏好应改变装备推荐结果', () => {
    const critItem = createItem({
      id: 'crit',
      baseStats: {},
      affixes: [{ id: 'crit_affix', name: '鹰眼', stat: 'critChance', value: 10, valueType: 'flat', tier: 1 }],
    });
    const tankItem = createItem({
      id: 'tank',
      baseStats: { hp: 140, armor: 18 },
      affixes: [],
    });

    expect(calculateItemScore(critItem, 'crit')).toBeGreaterThan(calculateItemScore(tankItem, 'crit'));
    expect(calculateItemScore(tankItem, 'tank')).toBeGreaterThan(calculateItemScore(critItem, 'tank'));
  });

  it('更优判断应使用传入的评分偏好', () => {
    const equipped = {
      ...emptyEquipped,
      weapon: createItem({ id: 'old', baseStats: { attack: 30 } }),
    };
    const critItem = createItem({
      id: 'crit',
      baseStats: {},
      affixes: [{ id: 'crit_affix', name: '鹰眼', stat: 'critChance', value: 4, valueType: 'flat', tier: 1 }],
    });

    expect(compareItemWithEquipped(critItem, equipped, 'balanced')).toBeLessThan(0);
    expect(compareItemWithEquipped(critItem, equipped, 'crit')).toBeGreaterThan(0);
  });
});
