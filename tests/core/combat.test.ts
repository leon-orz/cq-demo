import { describe, expect, it } from 'vitest';
import { simulateCombat } from '@/core/combat/engine';
import { SeededRandom } from '@/core/utils/random';
import type { Monster } from '@/types/combat';
import type { PlayerBuild } from '@/types/player';

function createPlayer(overrides: Partial<PlayerBuild['baseStats']>): PlayerBuild {
  return {
    level: 1,
    mainAttribute: 'str',
    baseStats: {
      str: 10,
      dex: 10,
      int: 10,
      hp: 100,
      attack: 20,
      attackSpeed: 1,
      critChance: 5,
      critDamage: 150,
      armor: 0,
      ...overrides,
    },
    equipped: {
      weapon: null,
      offhand: null,
      helmet: null,
      armor: null,
      gloves: null,
      shoes: null,
      ring1: null,
      ring2: null,
      necklace: null,
    },
    skillNodes: [],
  };
}

const monster: Monster = {
  id: 'test_monster',
  name: '测试怪物',
  archetype: 'balanced',
  level: 1,
  hp: 100,
  attack: 5,
  gold: 10,
  exp: 12,
};

describe('战斗引擎', () => {
  it('战力足够时应获胜', () => {
    const result = simulateCombat(createPlayer({ attack: 500, hp: 1000 }), monster, 60, new SeededRandom(1));

    expect(result.win).toBe(true);
    expect(result.gold).toBe(10);
    expect(result.exp).toBe(12);
    expect(result.duration).toBeLessThan(1);
  });

  it('战力不足时应失败', () => {
    const result = simulateCombat(createPlayer({ attack: 1, hp: 20 }), monster, 60, new SeededRandom(1));

    expect(result.win).toBe(false);
    expect(result.drops).toHaveLength(0);
  });

  it('magicFind 应提高有效掉落率', () => {
    const lowDropMonster: Monster = {
      ...monster,
      dropChance: 0.2,
    };
    const noMagicFind = simulateCombat(
      createPlayer({ attack: 500, hp: 1000, magicFind: 0 }),
      lowDropMonster,
      60,
      new SeededRandom(5),
    );
    const withMagicFind = simulateCombat(
      createPlayer({ attack: 500, hp: 1000, magicFind: 300 }),
      lowDropMonster,
      60,
      new SeededRandom(5),
    );

    expect(noMagicFind.drops).toHaveLength(0);
    expect(withMagicFind.drops).toHaveLength(1);
  });
});
