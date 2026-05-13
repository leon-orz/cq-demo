import { describe, expect, it } from 'vitest';
import {
  getEffectiveDropChance,
  getExpectedDropValue,
  getGoldFindMultiplier,
  getGoldWithFind,
  getMagicFindDropChanceMultiplier,
  getMagicFindRarityMultipliers,
} from '@/core/combat/economy';
import type { Monster } from '@/types/combat';

const monster: Monster = {
  id: 'economy_monster',
  name: '经济测试怪',
  archetype: 'balanced',
  level: 20,
  hp: 100,
  attack: 10,
  gold: 100,
  exp: 100,
  dropChance: 0.4,
  dropValueMultiplier: 1.2,
};

describe('经济调参工具', () => {
  it('goldFind 应提升金币倍率并封顶', () => {
    expect(getGoldFindMultiplier({ goldFind: 0 })).toBe(1);
    expect(getGoldFindMultiplier({ goldFind: 50 })).toBe(1.5);
    expect(getGoldFindMultiplier({ goldFind: 999 })).toBe(4);
    expect(getGoldFindMultiplier({ goldFind: -20 })).toBe(1);
  });

  it('应按 goldFind 计算金币收益', () => {
    expect(getGoldWithFind(100, { goldFind: 50 })).toBe(150);
    expect(getGoldWithFind(100, { goldFind: 999 })).toBe(400);
  });

  it('magicFind 应提升掉落率倍率并封顶有效掉落率', () => {
    expect(getMagicFindDropChanceMultiplier({ magicFind: 0 })).toBe(1);
    expect(getMagicFindDropChanceMultiplier({ magicFind: 100 })).toBe(1.5);
    expect(getMagicFindDropChanceMultiplier({ magicFind: 999 })).toBe(2.5);
    expect(getEffectiveDropChance({ ...monster, dropChance: 0.5 }, { magicFind: 999 })).toBe(0.95);
  });

  it('magicFind 应小幅提高稀有和传说品质权重并封顶', () => {
    expect(getMagicFindRarityMultipliers({ magicFind: 0 })).toEqual({ rare: 1, legendary: 1 });
    expect(getMagicFindRarityMultipliers({ magicFind: 100 })).toEqual({ rare: 1.2, legendary: 1.1 });
    expect(getMagicFindRarityMultipliers({ magicFind: 999 })).toEqual({ rare: 1.6, legendary: 1.3 });
  });

  it('期望掉落价值应随 magicFind 增加', () => {
    const base = getExpectedDropValue(monster, {});
    const boosted = getExpectedDropValue(monster, { magicFind: 100 });

    expect(boosted).toBeGreaterThan(base);
  });
});
