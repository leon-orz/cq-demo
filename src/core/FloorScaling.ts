import type { Monster, Player } from '@/types';
import { MonsterType } from '@/types/enums';
import { GAME_CONSTANTS, MONSTER_TYPE_MODS } from '@/utils/constants';
import { CombatEngine } from './CombatEngine';

export class FloorScaling {
  static getRecommendedPower(floor: number): number {
    const safeFloor = Math.max(1, Math.floor(floor));
    const multiplier = safeFloor % 10 === 0 ? 1.5 : 1;
    return (
      GAME_CONSTANTS.BASE_RECOMMENDED_POWER * Math.pow(GAME_CONSTANTS.RECOMMENDED_GROWTH, safeFloor - 1) * multiplier
    );
  }

  static getMonsterForFloor(floor: number, type = this.getMonsterTypeForFloor(floor)): Monster {
    const safeFloor = Math.max(1, Math.floor(floor));
    const mods = MONSTER_TYPE_MODS[type];
    const scale = Math.pow(GAME_CONSTANTS.MONSTER_GROWTH, safeFloor - 1);
    const bossMod = safeFloor % 10 === 0 ? 1.6 : 1;

    return {
      name: `${mods.label} Lv.${safeFloor}`,
      hp: Math.floor(90 * scale * mods.hpMod * bossMod),
      atk: Math.floor(9 * scale * mods.atkMod * bossMod),
      atkSpd: type === MonsterType.HIGH_ATK ? 1.15 : 1,
      armor: safeFloor * 2,
      critRate: type === MonsterType.HIGH_ATK ? 0.08 : 0.04,
      level: safeFloor,
      type,
      affixes: [],
    };
  }

  static getRewardMultiplier(power: number, recommendedPower: number): number {
    if (recommendedPower <= 0) return 1;
    return Math.pow(Math.min(power / recommendedPower, 1), 1.5);
  }

  static getItemLevelForFloor(floor: number): number {
    return Math.floor(Math.max(1, floor) / 2) + 10;
  }

  static getRecommendedFloor(player: Player): number {
    const power = CombatEngine.calculatePower(CombatEngine.calculateDPS(player), CombatEngine.calculateEHP(player));
    let floor = 1;
    while (this.getRecommendedPower(floor + 1) <= power && floor < 1000) {
      floor += 1;
    }
    return floor;
  }

  static getGoldReward(floor: number, rewardMultiplier: number, monsterType: MonsterType): number {
    const mods = MONSTER_TYPE_MODS[monsterType];
    return Math.max(1, Math.floor((8 + floor * 2.2) * rewardMultiplier * mods.rewardMod));
  }

  static getExpReward(floor: number, rewardMultiplier: number, monsterType: MonsterType): number {
    const mods = MONSTER_TYPE_MODS[monsterType];
    return Math.max(1, Math.floor((5 + floor * 1.4) * rewardMultiplier * mods.rewardMod));
  }

  private static getMonsterTypeForFloor(floor: number): MonsterType {
    if (floor % 10 === 0) return MonsterType.HIGH_HP;
    if (floor % 4 === 0) return MonsterType.REWARD;
    if (floor % 3 === 0) return MonsterType.HIGH_ATK;
    if (floor % 2 === 0) return MonsterType.HIGH_HP;
    return MonsterType.BALANCED;
  }
}
