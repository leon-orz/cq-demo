import { describe, expect, it } from 'vitest';
import { applyRewardDecay, calculatePlayerPower } from '@/core/combat/reward';

describe('收益衰减', () => {
  it('战力达到推荐值时应获得完整收益', () => {
    const reward = applyRewardDecay(100, 80, 120, 100);

    expect(reward.multiplier).toBe(1);
    expect(reward.gold).toBe(100);
    expect(reward.exp).toBe(80);
  });

  it('战力不足时应按档位衰减收益', () => {
    const reward = applyRewardDecay(100, 80, 70, 100);

    expect(reward.multiplier).toBe(0.5);
    expect(reward.gold).toBe(50);
    expect(reward.exp).toBe(40);
  });

  it('玩家战力应综合输出和生存', () => {
    expect(calculatePlayerPower(20, 100)).toBeGreaterThan(calculatePlayerPower(10, 80));
  });
});
