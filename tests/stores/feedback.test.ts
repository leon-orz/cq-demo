import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useFeedbackStore } from '@/stores/feedback';
import type { RewardFeedbackEvent } from '@/types/combat';

function createFeedback(id: number): RewardFeedbackEvent {
  return {
    id,
    kind: 'item',
    level: 'success',
    title: `反馈 ${id}`,
    message: '测试反馈',
  };
}

describe('奖励反馈状态', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('应保留最近三条反馈并支持关闭', () => {
    const feedback = useFeedbackStore();

    feedback.pushFeedback(createFeedback(1));
    feedback.pushFeedback(createFeedback(2));
    feedback.pushFeedback(createFeedback(3));
    feedback.pushFeedback(createFeedback(4));

    expect(feedback.events.map((event) => event.id)).toEqual([4, 3, 2]);
    expect(feedback.latestEvent?.id).toBe(4);

    feedback.dismissFeedback(3);

    expect(feedback.events.map((event) => event.id)).toEqual([4, 2]);
  });
});
