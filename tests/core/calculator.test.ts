import { describe, expect, it } from 'vitest';
import { calculateDps, calculateEhp, calculateTotalStats } from '@/core/player/calculator';
import type { EquippedItems } from '@/types/item';
import type { PlayerBaseStats } from '@/types/player';

const baseStats: PlayerBaseStats = {
  str: 10,
  dex: 10,
  int: 10,
  hp: 100,
  attack: 20,
  attackSpeed: 1,
  critChance: 5,
  critDamage: 150,
  armor: 0,
};

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

describe('角色计算器', () => {
  it('穿戴装备后总属性应增加', () => {
    const stats = calculateTotalStats(
      baseStats,
      {
        ...emptyEquipped,
        weapon: {
          id: 'weapon_1',
          name: '测试剑',
          slot: 'weapon',
          rarity: 'magic',
          itemLevel: 1,
          baseStats: { attack: 10 },
          affixes: [{ id: 'affix_1', name: '锋利', stat: 'attack', value: 5, valueType: 'flat', tier: 1 }],
        },
      },
      [],
    );

    expect(stats.attack).toBe(35);
  });

  it('DPS 与 EHP 应返回正数', () => {
    expect(calculateDps(baseStats, 'str')).toBeGreaterThan(0);
    expect(calculateEhp({ ...baseStats, armor: 50 }, 10)).toBeGreaterThan(baseStats.hp);
  });
});
