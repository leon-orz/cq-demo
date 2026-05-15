import { describe, expect, it } from 'vitest';
import type { EquipmentItem, Player } from '@/types';
import { CombatEngine } from '@/core/CombatEngine';
import { GearScore } from '@/core/GearScore';
import { ClassType, Rarity, ScoreMode, SlotType } from '@/types/enums';

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
    atk: 60,
    atkSpd: 1,
    critRate: 0,
    critDmg: 1.5,
    armor: 50,
    dodge: 0,
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

function createWeapon(overrides: Partial<EquipmentItem> = {}): EquipmentItem {
  return {
    id: 'item_weapon',
    name: '测试武器',
    slot: SlotType.WEAPON,
    rarity: Rarity.NORMAL,
    itemLevel: 1,
    baseStats: { atk: 0 },
    affixes: [],
    enhanceLevel: 0,
    locked: false,
    createdAt: 0,
    ...overrides,
  };
}

describe('GearScore', () => {
  it('compareEquipment 的 DPS/EHP 差值表示当前已装备状态替换为新装备后的变化', () => {
    const oldItem = createWeapon({ id: 'old', baseStats: { atk: 20 } });
    const newItem = createWeapon({ id: 'new', baseStats: { atk: 35 } });
    const player = createPlayer({ atk: 80 });

    const result = GearScore.compareEquipment(newItem, oldItem, player, ScoreMode.BALANCED);
    const expectedAfter = GearScore.applyItemStats(createPlayer({ atk: 60 }), newItem);

    expect(result.dpsDiff).toBeCloseTo(CombatEngine.calculateDPS(expectedAfter) - CombatEngine.calculateDPS(player));
    expect(result.dpsDiff).toBeGreaterThan(0);
    expect(result.ehpDiff).toBeCloseTo(0);
  });
});
