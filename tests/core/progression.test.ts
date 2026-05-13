import { describe, expect, it } from 'vitest';
import { getStageConfig } from '@/data/monsters';
import { evaluateStageTarget, getProgressionTargetSummary } from '@/core/combat/progression';
import type { PlayerBuild } from '@/types/player';

function createPlayer(overrides: Partial<PlayerBuild['baseStats']> = {}): PlayerBuild {
  return {
    level: 1,
    mainAttribute: 'str',
    baseStats: {
      str: 10,
      dex: 10,
      int: 10,
      hp: 120,
      attack: 20,
      attackSpeed: 1,
      critChance: 5,
      critDamage: 150,
      armor: 4,
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
    trainingLevels: { attack: 0, vitality: 0, guard: 0 },
  };
}

describe('推层目标评估', () => {
  it('应能评估当前层是否可通关和收益倍率', () => {
    const evaluation = evaluateStageTarget(createPlayer({ attack: 120, hp: 1000, armor: 80 }), 1);

    expect(evaluation.stage).toBe(1);
    expect(evaluation.canClear).toBe(true);
    expect(evaluation.failureReason).toBe('none');
    expect(evaluation.rewardMultiplier).toBeGreaterThanOrEqual(0.8);
    expect(evaluation.adviceText).toContain('适合当前阶段');
  });

  it('输出不足时应给出时限失败原因', () => {
    const evaluation = evaluateStageTarget(createPlayer({ attack: 1, hp: 1000, armor: 80 }), 10);

    expect(evaluation.canClear).toBe(false);
    expect(evaluation.failureReason === 'timeout' || evaluation.failureReason === 'both').toBe(true);
    expect(evaluation.failureText).toContain('输出');
  });

  it('生存不足时应给出生存失败原因', () => {
    const evaluation = evaluateStageTarget(createPlayer({ attack: 500, hp: 1, armor: 0 }), 10);

    expect(evaluation.canClear).toBe(false);
    expect(evaluation.failureReason).toBe('survival');
    expect(evaluation.failureText).toContain('生存');
  });

  it('应推荐已解锁范围内最高的高效挂机层', () => {
    const summary = getProgressionTargetSummary(createPlayer({ attack: 200, hp: 1500, armor: 100 }), 1, 8);

    expect(summary.recommendedFarmStage).toBeGreaterThanOrEqual(1);
    expect(summary.recommendedFarmStage).toBeLessThanOrEqual(8);
    expect(summary.recommendedFarm.canClear).toBe(true);
    expect(summary.recommendedFarm.farmScore).toBeGreaterThan(0);
    expect(summary.recommendedFarm.dropValuePerSecond).toBeGreaterThanOrEqual(0);
  });

  it('下一层不可通关时建议挑战应回退到推荐挂机层', () => {
    const summary = getProgressionTargetSummary(createPlayer({ attack: 4, hp: 40, armor: 0 }), 1, 3);

    expect(summary.suggestedChallengeStage).toBe(summary.recommendedFarmStage);
    expect(summary.nextUnlockStage).toBe(4);
  });

  it('Boss 层应具备更高战力要求、奖励和掉落价值', () => {
    const beforeBoss = getStageConfig(9);
    const boss = getStageConfig(10);
    const bossEvaluation = evaluateStageTarget(createPlayer({ attack: 1000, hp: 5000, armor: 300 }), 10);

    expect(boss.monsters[0]?.isBoss).toBe(true);
    expect(boss.monsters[0]?.archetype).toBe('boss');
    expect(boss.tags).toContain('boss');
    expect(boss.recommendedPower).toBeGreaterThan(beforeBoss.recommendedPower);
    expect(boss.monsters[0]!.hp).toBeGreaterThan(beforeBoss.monsters[0]!.hp);
    expect(boss.monsters[0]!.gold).toBeGreaterThan(beforeBoss.monsters[0]!.gold);
    expect(boss.monsters[0]!.dropChance).toBeGreaterThan(beforeBoss.monsters[0]!.dropChance ?? 0);
    expect(bossEvaluation.dropValuePerSecond).toBeGreaterThan(0);
    expect(bossEvaluation.recommendReason).toContain('金币');
  });

  it('推荐挂机评分应包含掉落期望价值', () => {
    const evaluation = evaluateStageTarget(createPlayer({ attack: 1000, hp: 5000, armor: 300 }), 10);

    expect(evaluation.farmScore).toBeCloseTo(
      Math.round((evaluation.goldPerSecond + evaluation.expPerSecond + evaluation.dropValuePerSecond) * 100) / 100,
    );
    expect(evaluation.rewardBreakdown.totalScore).toBe(evaluation.farmScore);
    expect(evaluation.rewardBreakdown.dominant).toBe('gold');
    expect(evaluation.farmScore).toBeGreaterThan(evaluation.goldPerSecond + evaluation.expPerSecond);
  });

  it('普通层应轮换高血、高攻、均衡和奖励怪', () => {
    const balanced = getStageConfig(1);
    const highHp = getStageConfig(2);
    const highAttack = getStageConfig(3);
    const reward = getStageConfig(4);

    expect(balanced.monsters[0]?.archetype).toBe('balanced');
    expect(highHp.monsters[0]?.archetype).toBe('highHp');
    expect(highAttack.monsters[0]?.archetype).toBe('highAttack');
    expect(reward.monsters[0]?.archetype).toBe('reward');
    expect(highHp.monsters[0]!.hp).toBeGreaterThan(balanced.monsters[0]!.hp);
    expect(highAttack.monsters[0]!.attack).toBeGreaterThan(highHp.monsters[0]!.attack);
    expect(reward.tags).toContain('gear');
    expect(reward.monsters[0]!.dropValueMultiplier).toBeGreaterThan(balanced.monsters[0]!.dropValueMultiplier ?? 0);
  });

  it('第 10、20、30 层 Boss 应有不同奖励倾向', () => {
    const goldBoss = getStageConfig(10);
    const expBoss = getStageConfig(20);
    const gearBoss = getStageConfig(30);

    expect(goldBoss.rewardFocus).toBe('gold');
    expect(goldBoss.tags).toEqual(['boss', 'gold']);
    expect(expBoss.rewardFocus).toBe('exp');
    expect(expBoss.tags).toEqual(['boss', 'exp']);
    expect(gearBoss.rewardFocus).toBe('gear');
    expect(gearBoss.tags).toEqual(['boss', 'gear']);
    expect(goldBoss.monsters[0]!.gold).toBeGreaterThan(goldBoss.monsters[0]!.exp);
    expect(expBoss.monsters[0]!.exp).toBeGreaterThan(expBoss.monsters[0]!.gold);
    expect(gearBoss.monsters[0]!.dropValueMultiplier).toBeGreaterThan(goldBoss.monsters[0]!.dropValueMultiplier ?? 0);
  });

  it('推层摘要应包含下一个 Boss 目标', () => {
    const summary = getProgressionTargetSummary(createPlayer({ attack: 1000, hp: 5000, armor: 300 }), 1, 8);

    expect(summary.bossTarget.stage).toBe(10);
    expect(summary.bossTarget.rewardFocus).toBe('gold');
    expect(summary.bossTarget.stagesAway).toBe(2);
    expect(summary.bossTarget.reason).toContain('金币');
  });

  it('关卡评估应包含标签、收益倾向和推荐原因', () => {
    const gearEvaluation = evaluateStageTarget(createPlayer({ attack: 1000, hp: 5000, armor: 300 }), 30);
    const highAttackEvaluation = evaluateStageTarget(createPlayer({ attack: 1000, hp: 5000, armor: 300 }), 3);

    expect(gearEvaluation.tags).toContain('gear');
    expect(gearEvaluation.rewardFocus).toBe('gear');
    expect(gearEvaluation.recommendReason).toContain('装备');
    expect(highAttackEvaluation.monsterArchetype).toBe('highAttack');
    expect(highAttackEvaluation.recommendReason).toContain('生存');
  });

  it('寻宝属性应影响推荐挂机金币和掉落价值评分', () => {
    const base = evaluateStageTarget(createPlayer({ attack: 1000, hp: 5000, armor: 300 }), 4);
    const treasure = evaluateStageTarget(
      createPlayer({ attack: 1000, hp: 5000, armor: 300, goldFind: 100, magicFind: 100 }),
      4,
    );

    expect(treasure.canClear).toBe(base.canClear);
    expect(treasure.goldPerSecond).toBeGreaterThan(base.goldPerSecond);
    expect(treasure.dropValuePerSecond).toBeGreaterThan(base.dropValuePerSecond);
    expect(treasure.farmScore).toBeGreaterThan(base.farmScore);
    expect(treasure.recommendReason).toContain('寻宝属性');
  });
});
