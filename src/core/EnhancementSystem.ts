import type { EnhanceResult, EquipmentItem, Player } from '@/types';
import { ENHANCE_RATES, GAME_CONSTANTS } from '@/utils/constants';

export class EnhancementSystem {
  static enhance(item: EquipmentItem, gold: number, stones: number): EnhanceResult {
    if (item.enhanceLevel >= GAME_CONSTANTS.MAX_ENHANCE_LEVEL) {
      return {
        success: false,
        consumed: false,
        newLevel: item.enhanceLevel,
        cost: { gold: 0, stones: 0 },
        message: `强化已达到上限 +${GAME_CONSTANTS.MAX_ENHANCE_LEVEL}`,
      };
    }

    const cost = this.getCost(item.enhanceLevel);
    if (gold < cost.gold || stones < cost.stones) {
      return {
        success: false,
        consumed: false,
        newLevel: item.enhanceLevel,
        cost,
        message: '金币或强化石不足',
      };
    }

    const rate = ENHANCE_RATES[Math.min(item.enhanceLevel, ENHANCE_RATES.length - 1)] ?? 0.3;
    if (Math.random() <= rate) {
      return {
        success: true,
        consumed: true,
        newLevel: item.enhanceLevel + 1,
        cost,
        message: `强化成功，提升到 +${item.enhanceLevel + 1}`,
      };
    }

    const newLevel =
      item.enhanceLevel >= 7 && item.enhanceLevel <= 9 ? Math.max(0, item.enhanceLevel - 1) : item.enhanceLevel;
    return {
      success: false,
      consumed: true,
      newLevel,
      cost,
      message: newLevel < item.enhanceLevel ? '强化失败，等级下降' : '强化失败',
    };
  }

  static getCost(level: number): { gold: number; stones: number } {
    return {
      gold: Math.floor(72 * Math.pow(GAME_CONSTANTS.ENHANCE_COST_GROWTH, level)),
      stones: Math.max(1, Math.floor(3 * Math.pow(1.25, level))),
    };
  }

  static getTotalStats(item: EquipmentItem): Partial<Player> {
    const multiplier = 1 + item.enhanceLevel * 0.1;
    const stats: Partial<Player> = {};
    for (const [key, value] of Object.entries(item.baseStats) as [keyof Player, Player[keyof Player]][]) {
      if (typeof value === 'number') {
        stats[key] = (
          Number.isInteger(value) ? Math.floor(value * multiplier) : Number((value * multiplier).toFixed(3))
        ) as never;
      }
    }
    return stats;
  }
}
