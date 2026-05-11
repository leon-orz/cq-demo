import { describe, expect, it } from 'vitest';
import { calculateDps, calculateEhp, calculateTotalStats } from '@/core/player/calculator';
import type { EquippedItems } from '@/types/item';
import type { PlayerBaseStats, SkillNode } from '@/types/player';

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

  it('激活天赋节点后应影响总属性、DPS 和 EHP', () => {
    const skillNodes: SkillNode[] = [
      {
        id: 'test_crit',
        name: '测试暴击',
        branch: 'crit',
        description: '测试',
        active: true,
        stat: 'critChance',
        value: 10,
      },
      {
        id: 'test_hp',
        name: '测试生命',
        branch: 'tank',
        description: '测试',
        active: true,
        stat: 'hp',
        value: 100,
      },
      {
        id: 'test_inactive',
        name: '未激活',
        branch: 'speed',
        description: '测试',
        active: false,
        stat: 'attackSpeed',
        value: 1,
      },
    ];

    const stats = calculateTotalStats(baseStats, emptyEquipped, skillNodes);

    expect(stats.critChance).toBe(15);
    expect(stats.hp).toBe(200);
    expect(stats.attackSpeed).toBe(1);
    expect(calculateDps(stats, 'str')).toBeGreaterThan(calculateDps(baseStats, 'str'));
    expect(calculateEhp(stats, 10)).toBeGreaterThan(calculateEhp(baseStats, 10));
  });

  it('寻宝天赋应进入总属性但不在此处改变收益公式', () => {
    const stats = calculateTotalStats(baseStats, emptyEquipped, [
      {
        id: 'test_treasure',
        name: '测试寻宝',
        branch: 'treasure',
        description: '测试',
        active: true,
        stat: 'magicFind',
        value: 12,
      },
    ]);

    expect(stats.magicFind).toBe(12);
  });
});
