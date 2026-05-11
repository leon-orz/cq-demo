import { describe, expect, it } from 'vitest';
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
  });

  it('下一层不可通关时建议挑战应回退到推荐挂机层', () => {
    const summary = getProgressionTargetSummary(createPlayer({ attack: 4, hp: 40, armor: 0 }), 1, 3);

    expect(summary.suggestedChallengeStage).toBe(summary.recommendedFarmStage);
    expect(summary.nextUnlockStage).toBe(4);
  });
});
