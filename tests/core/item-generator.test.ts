import { describe, expect, it } from 'vitest';
import { generateItem } from '@/core/item/generator';
import { SeededRandom } from '@/core/utils/random';

describe('装备生成器', () => {
  it('应按指定品质生成装备', () => {
    const item = generateItem(10, 'rare', new SeededRandom(2));

    expect(item.rarity).toBe('rare');
    expect(item.affixes.length).toBeGreaterThan(0);
    expect(item.itemLevel).toBeGreaterThan(0);
  });

  it('传说装备应包含传奇词缀', () => {
    const item = generateItem(20, 'legendary', new SeededRandom(3));

    expect(item.rarity).toBe('legendary');
    expect(item.affixes.some((affix) => affix.isLegendary)).toBe(true);
  });
});
