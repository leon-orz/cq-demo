import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import CombatPanel from '@/components/combat/CombatPanel.vue';
import EquipmentCard from '@/components/equipment/EquipmentCard.vue';
import EquipmentCompare from '@/components/equipment/EquipmentCompare.vue';
import MainView from '@/views/MainView.vue';
import type { EquipmentItem } from '@/types';
import { Rarity, ScoreMode, SlotType } from '@/types/enums';
import { createDefaultPlayer } from '@/stores/player';

function createTestItem(overrides: Partial<EquipmentItem> = {}): EquipmentItem {
  return {
    id: 'test-sword',
    name: '测试短剑',
    slot: SlotType.WEAPON,
    rarity: Rarity.MAGIC,
    itemLevel: 1,
    baseStats: {
      atk: 8,
    },
    affixes: [],
    enhanceLevel: 0,
    locked: false,
    createdAt: 1,
    ...overrides,
  };
}

describe('UI 冒烟测试', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('MainView 可以挂载', () => {
    const wrapper = mount(MainView, {
      global: {
        plugins: [createPinia()],
      },
    });

    expect(wrapper.text()).toContain('放置裂隙');
    expect(wrapper.text()).toContain('背包');
  });

  it('CombatPanel 能显示当前战斗信息', () => {
    const wrapper = mount(CombatPanel, {
      global: {
        plugins: [createPinia()],
      },
    });

    expect(wrapper.text()).toContain('第 1 层');
    expect(wrapper.text()).toContain('战斗日志');
  });

  it('EquipmentCard 点击不会崩溃并发出选择事件', async () => {
    const item = createTestItem();
    const wrapper = mount(EquipmentCard, {
      props: {
        item,
        player: createDefaultPlayer(),
        scoreMode: ScoreMode.BALANCED,
      },
    });

    await wrapper.trigger('click');

    expect(wrapper.emitted('click')?.[0]).toEqual([item]);
  });

  it('EquipmentCompare 选中已装备物品时不显示替换装备按钮', () => {
    const item = createTestItem();
    const wrapper = mount(EquipmentCompare, {
      props: {
        newItem: item,
        equippedItem: item,
        player: createDefaultPlayer(),
        scoreMode: ScoreMode.BALANCED,
      },
    });

    expect(wrapper.text()).toContain('该装备已穿戴在当前部位');
    expect(wrapper.text()).not.toContain('替换装备');
    expect(wrapper.find('button').text()).toBe('关闭');
  });
});
