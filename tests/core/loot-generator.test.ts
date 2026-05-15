import { afterEach, describe, expect, it, vi } from 'vitest';
import { LootGenerator } from '@/core/LootGenerator';
import { Rarity } from '@/types/enums';
import { RARITY_AFFIX_COUNTS } from '@/utils/constants';

describe('LootGenerator', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('生成装备时包含基础结构、部位和词缀', () => {
    const item = LootGenerator.generateDrop(10, 0);

    expect(item.id).toMatch(/^item_/);
    expect(item.itemLevel).toBe(15);
    expect(item.baseStats).toBeTruthy();
  });

  it('普通装备在低魔法发现下是主要掉落', () => {
    const drops = Array.from({ length: 100 }, () => LootGenerator.generateDrop(10, 0));
    const normalCount = drops.filter((item) => item.rarity === Rarity.NORMAL).length;

    expect(normalCount).toBeGreaterThan(45);
  });

  it('阶段一不会掷出远古装备', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);

    expect(LootGenerator.rollRarity(100, 50)).not.toBe(Rarity.ANCIENT);
  });

  it('普通装备不生成词缀', () => {
    vi.spyOn(LootGenerator, 'rollRarity').mockReturnValue(Rarity.NORMAL);

    const item = LootGenerator.generateDrop(10, 0);

    expect(item.rarity).toBe(Rarity.NORMAL);
    expect(item.affixes).toHaveLength(0);
  });

  it('魔法及以上装备保留合理词缀数量配置', () => {
    expect(RARITY_AFFIX_COUNTS[Rarity.MAGIC]).toEqual([2, 2]);
    expect(RARITY_AFFIX_COUNTS[Rarity.RARE]).toEqual([3, 4]);
    expect(RARITY_AFFIX_COUNTS[Rarity.LEGENDARY]).toEqual([4, 5]);
  });
});
