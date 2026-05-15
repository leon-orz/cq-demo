import { describe, expect, it, vi } from 'vitest';
import type { Player } from '@/types';
import { CombatEngine } from '@/core/CombatEngine';
import { FloorScaling } from '@/core/FloorScaling';
import { LootGenerator } from '@/core/LootGenerator';
import { ClassType, MonsterType } from '@/types/enums';
import { GAME_CONSTANTS } from '@/utils/constants';

function createDefaultPlayer(): Player {
  return {
    classType: ClassType.WARRIOR,
    level: 1,
    exp: 0,
    expToNext: 100,
    strength: 10,
    agility: 5,
    intelligence: 5,
    hp: 120,
    maxHp: 120,
    atk: 12,
    atkSpd: 1,
    critRate: 0.05,
    critDmg: 1.5,
    armor: 12,
    dodge: 0.02,
    fireDamage: 0,
    iceDamage: 0,
    lightningDamage: 0,
    fireRes: 0,
    iceRes: 0,
    lightningRes: 0,
    goldFind: 0,
    magicFind: 0,
    expFind: 0,
    lifeLeech: 0,
    gold: 120,
    enhancementStones: 8,
    ancientEssence: 0,
    currentFloor: 1,
    highestFloor: 1,
    training: {
      attack: 0,
      vitality: 0,
      defense: 0,
    },
  };
}

describe('FloorScaling', () => {
  it('推荐战力单调增长且第10层处于合理范围', () => {
    const values = Array.from({ length: 10 }, (_, index) => FloorScaling.getRecommendedPower(index + 1));

    values.forEach((value, index) => {
      if (index === 0) return;
      expect(value).toBeGreaterThan(values[index - 1]!);
    });

    expect(values[2]!).toBeLessThan(130);
    expect(values[9]!).toBeGreaterThan(180);
    expect(values[9]!).toBeLessThan(260);
  });

  it('前10层普通怪物生命和攻击不会突增', () => {
    let previousHp = 0;
    let previousAtk = 0;

    for (let floor = 1; floor <= 10; floor += 1) {
      const monster = FloorScaling.getMonsterForFloor(floor, MonsterType.BALANCED);
      if (floor > 1) {
        expect(monster.hp).toBeGreaterThanOrEqual(previousHp);
        expect(monster.atk).toBeGreaterThanOrEqual(previousAtk);
        expect(monster.hp).toBeLessThanOrEqual(Math.ceil(previousHp * 1.5));
        expect(monster.atk).toBeLessThanOrEqual(Math.ceil(previousAtk * 1.5));
      }
      previousHp = monster.hp;
      previousAtk = monster.atk;
    }
  });

  it('默认角色在第3层仍保留推进空间', () => {
    const player = createDefaultPlayer();
    const power = CombatEngine.calculatePower(CombatEngine.calculateDPS(player), CombatEngine.calculateEHP(player));
    const floorThreeMonster = FloorScaling.getMonsterForFloor(3);

    expect(FloorScaling.getRecommendedPower(3)).toBeLessThan(power);
    expect(CombatEngine.simulateBattle(player, floorThreeMonster).win).toBe(true);
  });

  it('find cap 的量纲是小数百分比', () => {
    expect(GAME_CONSTANTS.GOLD_FIND_CAP).toBeCloseTo(0.5);
    expect(GAME_CONSTANTS.MAGIC_FIND_CAP).toBeCloseTo(0.5);

    const randomSpy = vi.spyOn(Math, 'random').mockReturnValue(0.7);
    expect(LootGenerator.shouldDrop(10)).toBe(false);
    randomSpy.mockRestore();
  });
});
