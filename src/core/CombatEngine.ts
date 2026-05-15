import type { CombatResult, Monster, Player } from '@/types';
import { ClassType } from '@/types/enums';
import { GAME_CONSTANTS } from '@/utils/constants';
import { clamp } from '@/utils/math';

export class CombatEngine {
  static getMainAttribute(player: Player): number {
    if (player.classType === ClassType.ROGUE) return player.agility;
    if (player.classType === ClassType.MAGE) return player.intelligence;
    return player.strength;
  }

  static calculateDPS(player: Player): number {
    const mainAttrBonus = 1 + this.getMainAttribute(player) * GAME_CONSTANTS.MAIN_ATTR_BONUS;
    const attackSpeed = clamp(player.atkSpd, 0.1, GAME_CONSTANTS.MAX_ATK_SPD);
    const critRate = clamp(player.critRate, 0, GAME_CONSTANTS.MAX_CRIT_RATE);
    const critMultiplier = 1 + critRate * Math.max(0, player.critDmg - 1);
    const elementBonus = 1 + Math.max(player.fireDamage, player.iceDamage, player.lightningDamage, 0);
    return player.atk * mainAttrBonus * attackSpeed * critMultiplier * elementBonus;
  }

  static calculateEHP(player: Player): number {
    const armorReduction = player.armor / (player.armor + 500);
    const dodge = clamp(player.dodge, 0, GAME_CONSTANTS.MAX_DODGE);
    return player.maxHp / ((1 - armorReduction) * (1 - dodge));
  }

  static calculatePower(dps: number, ehp: number): number {
    return Math.sqrt(Math.max(0, dps) * Math.max(0, ehp) * 10);
  }

  static simulateBattle(player: Player, monster: Monster): CombatResult {
    const playerDps = this.calculateDPS(player);
    const monsterDps = this.calculateMonsterDPS(monster, player);
    const killTime = monster.hp / Math.max(playerDps, 0.01);
    const survivalTime = player.maxHp / Math.max(monsterDps, 0.01);
    const win = killTime <= GAME_CONSTANTS.COMBAT_TIME_LIMIT_S && killTime < survivalTime && playerDps > 0;
    const battleTime = Math.min(killTime, survivalTime, GAME_CONSTANTS.COMBAT_TIME_LIMIT_S);
    const rounds = Math.ceil((battleTime * 1000) / GAME_CONSTANTS.COMBAT_INTERVAL_MS);
    const playerDmgTotal = Math.min(monster.hp, playerDps * battleTime);
    const monsterDmgTotal = Math.min(player.maxHp, monsterDps * battleTime);

    return {
      win,
      rounds,
      playerDmgTotal,
      monsterDmgTotal,
      playerHpRemaining: Math.max(0, player.maxHp - monsterDmgTotal),
      monsterHpRemaining: Math.max(0, monster.hp - playerDmgTotal),
      drops: [],
      goldEarned: 0,
      expEarned: 0,
      killTime,
      survivalTime,
    };
  }

  static simulateBatch(player: Player, monster: Monster, durationMs: number): CombatResult[] {
    const results: CombatResult[] = [];
    const battleCount = Math.floor(durationMs / GAME_CONSTANTS.COMBAT_INTERVAL_MS);
    for (let index = 0; index < battleCount; index += 1) {
      const result = this.simulateBattle(player, monster);
      results.push(result);
      if (!result.win) break;
    }
    return results;
  }

  private static calculateMonsterDPS(monster: Monster, player: Player): number {
    const critMultiplier = 1 + clamp(monster.critRate, 0, 0.5) * 0.5;
    const armorReduction = player.armor / (player.armor + 500 + monster.level * 12);
    return monster.atk * monster.atkSpd * critMultiplier * (1 - armorReduction);
  }
}
