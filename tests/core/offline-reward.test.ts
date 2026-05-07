import { describe, expect, it } from 'vitest';
import { calculateOfflineReward } from '@/core/offline/reward';
import { SeededRandom } from '@/core/utils/random';
import type { PlayerBuild } from '@/types/player';

function createPlayer(overrides: Partial<PlayerBuild['baseStats']> = {}): PlayerBuild {
  return {
    level: 1,
    mainAttribute: 'str',
    baseStats: {
      str: 10,
      dex: 10,
      int: 10,
      hp: 1000,
      attack: 300,
      attackSpeed: 1,
      critChance: 5,
      critDamage: 150,
      armor: 20,
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

describe('离线收益计算', () => {
  it('离线时间超过上限时应裁剪', () => {
    const report = calculateOfflineReward({
      lastActiveTime: 0,
      now: 20 * 3600 * 1000,
      playerBuild: createPlayer(),
      stage: 1,
      remainingSlots: 50,
      playerPower: 2000,
      maxOfflineHours: 8,
      random: new SeededRandom(1),
    });

    expect(report.totalSeconds).toBe(8 * 3600);
    expect(report.monstersKilled).toBeGreaterThan(0);
  });

  it('无法击败怪物时应没有收益', () => {
    const report = calculateOfflineReward({
      lastActiveTime: 0,
      now: 3600 * 1000,
      playerBuild: createPlayer({ attack: 1, hp: 1 }),
      stage: 1,
      remainingSlots: 50,
      playerPower: 1,
      random: new SeededRandom(1),
    });

    expect(report.monstersKilled).toBe(0);
    expect(report.gold).toBe(0);
    expect(report.items).toHaveLength(0);
  });

  it('背包剩余空间不足时应截断装备', () => {
    const report = calculateOfflineReward({
      lastActiveTime: 0,
      now: 3600 * 1000,
      playerBuild: createPlayer(),
      stage: 1,
      remainingSlots: 1,
      playerPower: 2000,
      random: new SeededRandom(2),
    });

    expect(report.items.length).toBeLessThanOrEqual(1);
    expect(report.wasInterrupted).toBe(report.rejectedItems > 0);
  });

  it('收益倍率应影响金币和经验', () => {
    const full = calculateOfflineReward({
      lastActiveTime: 0,
      now: 600 * 1000,
      playerBuild: createPlayer(),
      stage: 1,
      remainingSlots: 50,
      playerPower: 2000,
      random: new SeededRandom(3),
    });
    const decayed = calculateOfflineReward({
      lastActiveTime: 0,
      now: 600 * 1000,
      playerBuild: createPlayer(),
      stage: 1,
      remainingSlots: 50,
      playerPower: 50,
      random: new SeededRandom(3),
    });

    expect(decayed.rewardMultiplier).toBeLessThan(full.rewardMultiplier);
    expect(decayed.gold).toBeLessThan(full.gold);
    expect(decayed.exp).toBeLessThan(full.exp);
  });
});
