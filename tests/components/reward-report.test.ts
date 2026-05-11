import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import RewardReport from '@/components/offline/RewardReport.vue';
import { useInventoryStore } from '@/stores/inventory';
import { useOfflineStore } from '@/stores/offline';
import type { Item } from '@/types/item';
import type { OfflineReport } from '@/types/offline';

function createItem(index: number): Item {
  return {
    id: `item_${index}`,
    name: `离线装备 ${index}`,
    slot: 'weapon',
    rarity: 'rare',
    itemLevel: 5,
    baseStats: { attack: 10 },
    affixes: [],
  };
}

function createReport(overrides: Partial<OfflineReport> = {}): OfflineReport {
  return {
    totalSeconds: 3661,
    actualSeconds: 3600,
    cappedSeconds: 3661,
    monstersKilled: 12,
    gold: 1200,
    exp: 450,
    items: [createItem(1)],
    filteredItems: [],
    rejectedItems: 0,
    wasInterrupted: false,
    rewardMultiplier: 0.8,
    playerPower: 500,
    ...overrides,
  };
}

describe('RewardReport', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('没有离线报告时不渲染弹窗', () => {
    const wrapper = mount(RewardReport);

    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });

  it('应展示离线报告内容和截断提示', () => {
    const offline = useOfflineStore();
    offline.pendingReport = createReport({
      wasInterrupted: true,
      rejectedItems: 2,
      filteredItems: [createItem(2)],
    });

    const wrapper = mount(RewardReport);

    expect(wrapper.text()).toContain('欢迎回来');
    expect(wrapper.text()).toContain('12');
    expect(wrapper.text()).toContain('1.2K');
    expect(wrapper.text()).toContain('450');
    expect(wrapper.text()).toContain('80%');
    expect(wrapper.text()).toContain('未拾取装备 2 件');
    expect(wrapper.text()).toContain('拾取过滤自动转化 1 件装备');
    expect(wrapper.text()).toContain('离线装备 1');
  });

  it('点击稍后查看应折叠弹窗但保留待领取报告', async () => {
    const offline = useOfflineStore();
    offline.pendingReport = createReport();

    const wrapper = mount(RewardReport);
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '稍后查看')!
      .trigger('click');

    expect(offline.pendingReport).not.toBeNull();
    expect(useInventoryStore().gold).toBe(0);
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('离线收益待领取');

    await wrapper.find('button').trigger('click');

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('领取奖励');
  });

  it('点击领取奖励应入账并清空报告', async () => {
    const offline = useOfflineStore();
    offline.pendingReport = createReport();
    const wrapper = mount(RewardReport);

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '领取奖励')!
      .trigger('click');

    expect(offline.pendingReport).toBeNull();
    expect(useInventoryStore().gold).toBe(1200);
  });
});
