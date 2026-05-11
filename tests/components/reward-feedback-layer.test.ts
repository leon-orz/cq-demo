import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import RewardFeedbackLayer from '@/components/feedback/RewardFeedbackLayer.vue';
import { useFeedbackStore } from '@/stores/feedback';
import type { RewardFeedbackEvent } from '@/types/combat';

function createFeedback(overrides: Partial<RewardFeedbackEvent> = {}): RewardFeedbackEvent {
  return {
    id: overrides.id ?? 1,
    kind: overrides.kind ?? 'item',
    level: overrides.level ?? 'success',
    title: overrides.title ?? '测试反馈',
    message: overrides.message ?? '获得测试奖励',
    ...overrides,
  };
}

describe('RewardFeedbackLayer', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('没有反馈事件时不渲染区域', () => {
    const wrapper = mount(RewardFeedbackLayer);

    expect(wrapper.find('[aria-label="奖励反馈"]').exists()).toBe(false);
  });

  it('应展示反馈事件并支持关闭', async () => {
    const feedback = useFeedbackStore();
    feedback.events = [
      createFeedback({ id: 1, kind: 'stage', title: '推层成功', message: '已解锁第 2 层。' }),
      createFeedback({ id: 2, kind: 'offline', title: '离线收益已领取', message: '获得 120 金币。' }),
    ];

    const wrapper = mount(RewardFeedbackLayer);

    expect(wrapper.text()).toContain('推层');
    expect(wrapper.text()).toContain('推层成功');
    expect(wrapper.text()).toContain('离线收益已领取');

    await wrapper.findAll('button')[0]!.trigger('click');

    expect(feedback.events.map((event) => event.id)).toEqual([2]);
    expect(wrapper.text()).not.toContain('推层成功');
  });
});
