import { describe, expect, it } from 'vitest';
import { generateItem, rollRarity } from '@/core/item/generator';
import { SeededRandom } from '@/core/utils/random';
import type { RandomSource } from '@/core/utils/random';

class FixedRandom implements RandomSource {
  constructor(private readonly values: number[]) {}

  next(): number {
    return this.values.shift() ?? 0.5;
  }
}

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

  it('magicFind 应提高稀有品质判定权重', () => {
    const monsterLevel = 20;

    expect(rollRarity(monsterLevel, new FixedRandom([0.032]), { magicFind: 0 })).toBe('magic');
    expect(rollRarity(monsterLevel, new FixedRandom([0.032]), { magicFind: 100 })).toBe('rare');
  });

  it('magicFind 应提高传说品质判定权重', () => {
    const monsterLevel = 20;

    expect(rollRarity(monsterLevel, new FixedRandom([0.0021]), { magicFind: 0 })).toBe('rare');
    expect(rollRarity(monsterLevel, new FixedRandom([0.0021]), { magicFind: 100 })).toBe('legendary');
  });

  it('magicFind 品质加成应保持克制并提高高品质产出', () => {
    const monsterLevel = 30;
    const sampleSize = 10000;

    function collect(magicFind: number) {
      const counts = { normal: 0, magic: 0, rare: 0, legendary: 0, ancient: 0 };
      const random = new SeededRandom(20260513);
      for (let index = 0; index < sampleSize; index += 1) {
        counts[rollRarity(monsterLevel, random, { magicFind })] += 1;
      }
      return counts;
    }

    const base = collect(0);
    const boosted = collect(300);

    expect(boosted.rare).toBeGreaterThan(base.rare);
    expect(boosted.legendary).toBeGreaterThan(base.legendary);
    expect(boosted.rare / base.rare).toBeLessThanOrEqual(1.8);
    expect(boosted.legendary / base.legendary).toBeLessThanOrEqual(1.8);
  });
});
