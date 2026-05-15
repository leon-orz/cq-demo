import { describe, expect, it } from 'vitest';
import type { EquipmentItem } from '@/types';
import { EnhancementSystem } from '@/core/EnhancementSystem';
import { Rarity, SlotType } from '@/types/enums';
import { GAME_CONSTANTS } from '@/utils/constants';

function createItem(overrides: Partial<EquipmentItem> = {}): EquipmentItem {
  return {
    id: 'item_test',
    name: '测试武器',
    slot: SlotType.WEAPON,
    rarity: Rarity.NORMAL,
    itemLevel: 1,
    baseStats: { atk: 10 },
    affixes: [],
    enhanceLevel: 0,
    locked: false,
    createdAt: 0,
    ...overrides,
  };
}

describe('EnhancementSystem', () => {
  it('强化达到 +5 上限时不消耗资源并返回明确消息', () => {
    const item = createItem({ enhanceLevel: GAME_CONSTANTS.MAX_ENHANCE_LEVEL });
    const result = EnhancementSystem.enhance(item, 99999, 99999);

    expect(result.success).toBe(false);
    expect(result.consumed).toBe(false);
    expect(result.newLevel).toBe(GAME_CONSTANTS.MAX_ENHANCE_LEVEL);
    expect(result.cost).toEqual({ gold: 0, stones: 0 });
    expect(result.message).toContain(`+${GAME_CONSTANTS.MAX_ENHANCE_LEVEL}`);
    expect(result.message).toContain('上限');
  });
});
