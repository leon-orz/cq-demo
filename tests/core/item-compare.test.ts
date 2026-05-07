import { describe, expect, it } from 'vitest';
import { getItemCompareResult } from '@/core/item/filter';
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
    ...overrides,
  };

  if (overrides.score !== undefined) {
    item.score = overrides.score;
  }

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

describe('装备对比结果', () => {
  it('空槽位时应把新装备视为提升', () => {
    const result = getItemCompareResult(createItem({ baseStats: { attack: 10 } }), emptyEquipped);

    expect(result.equippedItem).toBeNull();
    expect(result.isUpgrade).toBe(true);
    expect(result.scoreDelta).toBeGreaterThan(0);
  });

  it('应返回属性差值列表', () => {
    const equipped = {
      ...emptyEquipped,
      weapon: createItem({ id: 'old', baseStats: { attack: 5, hp: 10 } }),
    };
    const result = getItemCompareResult(createItem({ id: 'new', baseStats: { attack: 20 } }), equipped);

    expect(result.lines.some((line) => line.stat === 'attack' && line.delta > 0)).toBe(true);
    expect(result.lines.some((line) => line.stat === 'hp' && line.delta < 0)).toBe(true);
  });

  it('戒指应选择较低评分的已穿戴戒指作为对比目标', () => {
    const equipped = {
      ...emptyEquipped,
      ring1: createItem({ id: 'ring_1', slot: 'ring', score: 100 }),
      ring2: createItem({ id: 'ring_2', slot: 'ring', score: 200 }),
    };

    const result = getItemCompareResult(createItem({ slot: 'ring', score: 150 }), equipped);

    expect(result.targetSlot).toBe('ring1');
    expect(result.scoreDelta).toBe(50);
  });
});
