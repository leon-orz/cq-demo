import { describe, expect, it } from 'vitest';
import { OfflineCalculator } from '@/core/OfflineCalculator';
import type { Player } from '@/types';
import { ClassType } from '@/types/enums';

const player: Player = {
  classType: ClassType.WARRIOR,
  level: 8,
  exp: 0,
  expToNext: 100,
  strength: 80,
  agility: 8,
  intelligence: 6,
  hp: 700,
  maxHp: 700,
  atk: 80,
  atkSpd: 1.4,
  critRate: 0.15,
  critDmg: 1.8,
  armor: 80,
  dodge: 0.03,
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
};

describe('OfflineCalculator', () => {
  it('计算 8 小时离线收益并保持 100% 倍率', () => {
    const report = OfflineCalculator.calculate(8 * 3600, 1, player, 20);

    expect(report.effectiveMultiplier).toBe(1);
    expect(report.totalKills).toBeGreaterThan(0);
    expect(report.totalGold).toBeGreaterThan(0);
    expect(report.totalDrops.length).toBeLessThanOrEqual(20);
  });

  it('慢击杀不会在短离线时长内按固定间隔刷出大量击杀', () => {
    const slowPlayer: Player = {
      ...player,
      strength: 0,
      atk: 2,
      atkSpd: 1,
      hp: 5000,
      maxHp: 5000,
      critRate: 0,
      fireDamage: 0,
      iceDamage: 0,
      lightningDamage: 0,
    };

    const shortReport = OfflineCalculator.calculate(10, 1, slowPlayer, 20);
    const longReport = OfflineCalculator.calculate(120, 1, slowPlayer, 20);

    expect(shortReport.totalKills).toBe(0);
    expect(longReport.totalKills).toBeGreaterThan(0);
    expect(longReport.totalKills).toBeLessThan(10);
  });
});
