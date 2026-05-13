import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CenterPanel from '@/components/layout/CenterPanel.vue';
import { useCombatStore } from '@/stores/combat';
import { useInventoryStore } from '@/stores/inventory';
import { usePlayerStore } from '@/stores/player';
import { INVENTORY_CAPACITY } from '@/utils/constants';
import type { Item } from '@/types/item';

function createItem(index: number): Item {
  return {
    id: `item_${index}`,
    name: `测试装备 ${index}`,
    slot: 'weapon',
    rarity: 'normal',
    itemLevel: 1,
    baseStats: { attack: 1 },
    affixes: [],
  };
}

function mountCenterPanel() {
  return mount(CenterPanel, {
    global: {
      stubs: {
        BattleLog: true,
      },
    },
  });
}

function makeStrongPlayer() {
  const player = usePlayerStore();
  player.$patch({
    baseStats: {
      str: 20,
      dex: 10,
      int: 10,
      hp: 2000,
      attack: 500,
      attackSpeed: 1,
      critChance: 5,
      critDamage: 150,
      armor: 100,
    },
  });
}

describe('CenterPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    makeStrongPlayer();
  });

  it('应展示推层目标、收益倍率和击杀预估', () => {
    const combat = useCombatStore();
    combat.$patch({ currentStage: 1, highestUnlockedStage: 3 });

    const wrapper = mountCenterPanel();

    expect(wrapper.text()).toContain('当前战斗');
    expect(wrapper.text()).toContain('推荐挂机');
    expect(wrapper.text()).toContain('推层目标');
    expect(wrapper.text()).toContain('Boss 目标');
    expect(wrapper.text()).toContain('金币/秒');
    expect(wrapper.text()).toContain('主收益');
    expect(wrapper.text()).toContain('当前评估');
    expect(wrapper.text()).toContain('收益倍率');
    expect(wrapper.text()).toContain('击杀预估');
  });

  it('点击战斗和挂机按钮应调用对应 action', async () => {
    const combat = useCombatStore();
    const runSpy = vi.spyOn(combat, 'runSingleCombat').mockReturnValue(null);
    const toggleSpy = vi.spyOn(combat, 'toggleAutoFighting').mockImplementation(() => {
      combat.isAutoFighting = !combat.isAutoFighting;
    });
    const wrapper = mountCenterPanel();

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '挑战一次')!
      .trigger('click');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '自动挂机')!
      .trigger('click');

    expect(runSpy).toHaveBeenCalledTimes(1);
    expect(toggleSpy).toHaveBeenCalledTimes(1);
    expect(wrapper.text()).toContain('停止挂机');
  });

  it('背包满时应禁用挑战按钮并显示提示', () => {
    const inventory = useInventoryStore();
    for (let index = 0; index < INVENTORY_CAPACITY; index += 1) {
      inventory.addItem(createItem(index));
    }

    const wrapper = mountCenterPanel();
    const challengeButton = wrapper.findAll('button').find((button) => button.text() === '挑战一次')!;

    expect(challengeButton.attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('背包已满，请先整理装备。');
  });

  it('应能切换推荐挂机层和最高已解锁层', async () => {
    const combat = useCombatStore();
    combat.$patch({ currentStage: 1, highestUnlockedStage: 4 });
    const farmSpy = vi.spyOn(combat, 'switchToRecommendedFarmStage');
    const highestSpy = vi.spyOn(combat, 'switchToHighestUnlockedStage');
    const wrapper = mountCenterPanel();

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '切换挂机层')!
      .trigger('click');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '前往最高已解锁层')!
      .trigger('click');

    expect(farmSpy).toHaveBeenCalledTimes(1);
    expect(highestSpy).toHaveBeenCalledTimes(1);
  });

  it('应显示停止原因', () => {
    const combat = useCombatStore();
    combat.stoppedReason = '战斗失败，自动挂机已暂停。';

    const wrapper = mountCenterPanel();

    expect(wrapper.text()).toContain('战斗失败，自动挂机已暂停。');
  });

  it('接近满包时应显示背包压力提示但不禁用挑战', () => {
    const inventory = useInventoryStore();
    for (let index = 0; index < INVENTORY_CAPACITY - 5; index += 1) {
      inventory.addItem(createItem(index));
    }

    const wrapper = mountCenterPanel();
    const challengeButton = wrapper.findAll('button').find((button) => button.text() === '挑战一次')!;

    expect(challengeButton.attributes('disabled')).toBeUndefined();
    expect(wrapper.text()).toContain('自动挂机可能很快暂停');
  });
});
