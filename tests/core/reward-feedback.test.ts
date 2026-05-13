import { describe, expect, it } from 'vitest';
import {
  createBossClearFeedback,
  createBossFailedFeedback,
  createFilteredHighlightFeedback,
  createItemDropFeedback,
  isHighlightItem,
} from '@/core/feedback/rewardFeedback';
import type { EquippedItems, Item } from '@/types/item';

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

describe('奖励反馈规则', () => {
  it('传说和带传奇词缀装备应视为高价值', () => {
    expect(isHighlightItem(createItem({ rarity: 'legendary' }))).toBe(true);
    expect(
      isHighlightItem(
        createItem({
          affixes: [
            { id: 'a1', name: '传奇词缀', stat: 'attack', value: 10, valueType: 'flat', tier: 1, isLegendary: true },
          ],
        }),
      ),
    ).toBe(true);
  });

  it('当前评分偏好下更优的装备应视为高价值', () => {
    const equipped = {
      ...emptyEquipped,
      weapon: createItem({ id: 'old', baseStats: { attack: 30 } }),
    };
    const critItem = createItem({
      id: 'crit',
      rarity: 'rare',
      baseStats: {},
      affixes: [{ id: 'crit_affix', name: '鹰眼', stat: 'critChance', value: 4, valueType: 'flat', tier: 1 }],
    });

    expect(isHighlightItem(critItem, equipped, 'balanced')).toBe(false);
    expect(isHighlightItem(critItem, equipped, 'crit')).toBe(true);
  });

  it('普通和魔法装备仅因更优不应触发高价值反馈', () => {
    const equipped = {
      ...emptyEquipped,
      weapon: createItem({ id: 'old', baseStats: { attack: 1 } }),
    };

    expect(isHighlightItem(createItem({ rarity: 'normal', baseStats: { attack: 20 } }), equipped, 'balanced')).toBe(
      false,
    );
    expect(isHighlightItem(createItem({ rarity: 'magic', baseStats: { attack: 20 } }), equipped, 'balanced')).toBe(
      false,
    );
  });

  it('普通装备不应生成掉落反馈，高价值过滤装备应生成警示反馈', () => {
    expect(createItemDropFeedback(createItem())).toBeNull();

    const feedback = createFilteredHighlightFeedback(createItem({ rarity: 'legendary' }));

    expect(feedback?.level).toBe('warning');
    expect(feedback?.title).toContain('被过滤');
  });

  it('应生成 Boss 通关和失败反馈', () => {
    const clearFeedback = createBossClearFeedback(10);
    const failedFeedback = createBossFailedFeedback(20, '输出不足，无法在时限内击杀。');

    expect(clearFeedback.kind).toBe('boss');
    expect(clearFeedback.level).toBe('success');
    expect(clearFeedback.message).toContain('第 10 层');
    expect(failedFeedback.kind).toBe('boss');
    expect(failedFeedback.level).toBe('warning');
    expect(failedFeedback.message).toContain('输出不足');
  });
});
