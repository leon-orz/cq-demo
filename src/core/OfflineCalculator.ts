import type { EquipmentItem, OfflineReport, Player } from '@/types';
import { Rarity } from '@/types/enums';
import { GAME_CONSTANTS, OFFLINE_MULTIPLIERS } from '@/utils/constants';
import { CombatEngine } from './CombatEngine';
import { FloorScaling } from './FloorScaling';
import { LootGenerator } from './LootGenerator';

export class OfflineCalculator {
  static calculate(
    offlineSeconds: number,
    floor: number,
    player: Player,
    maxDrops: number = GAME_CONSTANTS.INVENTORY_SIZE,
  ): OfflineReport {
    const adjustedSeconds = Math.min(Math.max(0, offlineSeconds), GAME_CONSTANTS.OFFLINE_HARD_CAP_HOURS * 3600);
    const effectiveMultiplier = this.softCapMultiplier(adjustedSeconds);
    const monster = FloorScaling.getMonsterForFloor(floor);
    const recommendedPower = FloorScaling.getRecommendedPower(floor);
    const power = CombatEngine.calculatePower(CombatEngine.calculateDPS(player), CombatEngine.calculateEHP(player));
    const rewardMultiplier = FloorScaling.getRewardMultiplier(power, recommendedPower) * effectiveMultiplier;
    const battleCount = Math.floor((adjustedSeconds * 1000) / GAME_CONSTANTS.COMBAT_INTERVAL_MS);
    let totalKills = 0;
    let totalGold = 0;
    let totalExp = 0;
    const totalDrops: EquipmentItem[] = [];

    for (let index = 0; index < battleCount; index += 1) {
      const result = CombatEngine.simulateBattle(player, monster);
      if (!result.win) break;
      totalKills += 1;
      totalGold += FloorScaling.getGoldReward(floor, rewardMultiplier, monster.type) * (1 + player.goldFind);
      totalExp += FloorScaling.getExpReward(floor, rewardMultiplier, monster.type) * (1 + player.expFind);
      if (totalDrops.length < maxDrops && LootGenerator.shouldDrop(player.magicFind)) {
        totalDrops.push(LootGenerator.generateDrop(floor, player.magicFind));
      }
    }

    return {
      offlineSeconds,
      adjustedSeconds,
      totalKills,
      totalGold: Math.floor(totalGold),
      totalExp: Math.floor(totalExp),
      totalDrops,
      qualityCounts: this.countByQuality(totalDrops),
      effectiveMultiplier,
      message: `离线结算完成，击杀 ${totalKills} 只怪物`,
    };
  }

  static softCapMultiplier(seconds: number): number {
    const hours = seconds / 3600;
    return OFFLINE_MULTIPLIERS.find((item) => hours <= item.hours)?.multiplier ?? 0.1;
  }

  private static countByQuality(drops: EquipmentItem[]): Record<Rarity, number> {
    return {
      [Rarity.NORMAL]: drops.filter((item) => item.rarity === Rarity.NORMAL).length,
      [Rarity.MAGIC]: drops.filter((item) => item.rarity === Rarity.MAGIC).length,
      [Rarity.RARE]: drops.filter((item) => item.rarity === Rarity.RARE).length,
      [Rarity.LEGENDARY]: drops.filter((item) => item.rarity === Rarity.LEGENDARY).length,
      [Rarity.ANCIENT]: drops.filter((item) => item.rarity === Rarity.ANCIENT).length,
    };
  }
}
