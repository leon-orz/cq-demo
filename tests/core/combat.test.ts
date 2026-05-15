import { describe, expect, it } from 'vitest';
import type { Player } from '@/types';
import { CombatEngine } from '@/core/CombatEngine';
import { FloorScaling } from '@/core/FloorScaling';
import { ClassType } from '@/types/enums';

function createPlayer(overrides: Partial<Player> = {}): Player {
  return {
    classType: ClassType.WARRIOR,
    level: 1,
    exp: 0,
    expToNext: 100,
    strength: 100,
    agility: 5,
    intelligence: 5,
    hp: 500,
    maxHp: 500,
    atk: 50,
    atkSpd: 1.5,
    critRate: 0.2,
    critDmg: 2,
    armor: 50,
    dodge: 0.05,
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
    gold: 0,
    enhancementStones: 0,
    ancientEssence: 0,
    currentFloor: 1,
    highestFloor: 1,
    training: { attack: 0, vitality: 0, defense: 0 },
    ...overrides,
  };
}

describe('CombatEngine', () => {
  it('按照文档公式计算 DPS、EHP 和战力', () => {
    const player = createPlayer();

    expect(CombatEngine.calculateDPS(player)).toBeCloseTo(180);
    expect(CombatEngine.calculateEHP(player)).toBeGreaterThan(570);
    expect(
      CombatEngine.calculatePower(CombatEngine.calculateDPS(player), CombatEngine.calculateEHP(player)),
    ).toBeGreaterThan(1000);
  });

  it('能模拟一场胜利战斗', () => {
    const player = createPlayer();
    const monster = FloorScaling.getMonsterForFloor(1);
    const result = CombatEngine.simulateBattle(player, monster);

    expect(result.win).toBe(true);
    expect(result.killTime).toBeLessThan(60);
  });
});
