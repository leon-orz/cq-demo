import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick, reactive } from 'vue';
import CombatPanel from '@/components/combat/CombatPanel.vue';
import EquipmentCard from '@/components/equipment/EquipmentCard.vue';
import EquipmentCompare from '@/components/equipment/EquipmentCompare.vue';
import MainView from '@/views/MainView.vue';
import type { EquipmentItem } from '@/types';
import { Rarity, ScoreMode, SlotType } from '@/types/enums';
import { createDefaultPlayer } from '@/stores/player';
import { useEquipmentStore } from '@/stores/equipment';
import { usePlayerStore } from '@/stores/player';
import { OfflineCalculator } from '@/core/OfflineCalculator';
import { createEmptyEquipmentSlots } from '@/stores/equipment';
import { SaveManager } from '@/services/SaveManager';

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

  it('训练按钮点击后会消耗金币并显示训练结果', async () => {
    const wrapper = mount(MainView, {
      global: {
        plugins: [createPinia()],
      },
    });
    const playerStore = usePlayerStore();
    const goldBefore = playerStore.player.gold;
    const attackLevelBefore = playerStore.player.training.attack;

    await wrapper.get('[data-testid="train-attack"]').trigger('click');

    expect(playerStore.player.gold).toBeLessThan(goldBefore);
    expect(playerStore.player.training.attack).toBe(attackLevelBefore + 1);
    expect(wrapper.text()).toContain('训练完成');
  });

  it('切层失败时主界面会显示提示', async () => {
    const wrapper = mount(MainView, {
      global: {
        plugins: [createPinia()],
      },
    });

    await wrapper.get('input#floor-input').setValue(999);
    await wrapper.get('[data-testid="floor-apply"]').trigger('click');

    expect(wrapper.text()).toContain('暂不可挑战');
  });

  it('强化选中装备后会显示资源变化或上限提示', async () => {
    const wrapper = mount(MainView, {
      global: {
        plugins: [createPinia()],
      },
    });
    const equipmentStore = useEquipmentStore();
    const playerStore = usePlayerStore();
    const item = createTestItem({
      id: 'enhance-item',
      name: '待强化短剑',
      enhanceLevel: 0,
    });
    equipmentStore.addToInventory(item);
    vi.spyOn(Math, 'random').mockReturnValue(0);
    await nextTick();

    await wrapper.getComponent(EquipmentCard).trigger('click');
    await wrapper.get('[data-testid="enhance-selected"]').trigger('click');

    expect(playerStore.player.gold).toBeLessThan(120);
    expect(playerStore.player.enhancementStones).toBeLessThan(8);
    expect(wrapper.text()).toMatch(/强化成功|强化失败|金币或强化石不足/);
  });

  it('领取离线收益后主界面会显示领取结果', async () => {
    const now = Date.now();
    const savedPlayer = createDefaultPlayer();
    const savedState = {
      player: savedPlayer,
      combat: {
        currentFloor: 1,
        isAutoCombat: false,
        killCount: 0,
        combatLog: [],
      },
      equipment: {
        equipped: createEmptyEquipmentSlots(),
        inventory: [],
        maxInventorySize: 10,
        scoreMode: ScoreMode.BALANCED,
      },
      lastOnlineTimestamp: now - 120_000,
    };
    SaveManager.importSave(
      JSON.stringify({
        version: 1,
        timestamp: now - 120_000,
        data: savedState,
      }),
    );
    vi.spyOn(OfflineCalculator, 'calculate').mockReturnValue({
      offlineSeconds: 120,
      adjustedSeconds: 120,
      totalKills: 0,
      totalGold: 88,
      totalExp: 44,
      totalDrops: [],
      qualityCounts: {
        normal: 0,
        magic: 0,
        rare: 0,
        legendary: 0,
        ancient: 0,
      } as never,
      effectiveMultiplier: 1,
      message: '离线结算完成',
    } as never);

    const wrapper = mount(MainView, {
      global: {
        plugins: [createPinia()],
      },
    });
    await nextTick();

    await wrapper.get('[data-testid="claim-offline-report"]').trigger('click');

    expect(wrapper.text()).toContain('已领取离线收益');
    expect(wrapper.text()).toContain('88 金币');
    expect(wrapper.text()).toContain('44 经验');
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

  it('CombatPanel 切层失败时会向外抛出结果', async () => {
    const wrapper = mount(CombatPanel, {
      global: {
        plugins: [createPinia()],
      },
    });

    await wrapper.get('input').setValue(999);
    await wrapper.get('[data-testid="floor-apply"]').trigger('click');

    expect(wrapper.emitted('floor-change')?.[0]).toEqual([false, 999]);
  });

  it('CombatPanel 切层成功时会向外抛出归一化后的层数', async () => {
    const wrapper = mount(CombatPanel, {
      global: {
        plugins: [createPinia()],
      },
    });

    await wrapper.get('input').setValue(1.8);
    await wrapper.get('[data-testid="floor-apply"]').trigger('click');

    expect(wrapper.emitted('floor-change')?.[0]).toEqual([true, 1]);
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

  it('EquipmentCompare 会响应玩家属性变化重新计算对比结果', async () => {
    const player = reactive(createDefaultPlayer());
    const wrapper = mount(EquipmentCompare, {
      props: {
        newItem: createTestItem(),
        equippedItem: null,
        player,
        scoreMode: ScoreMode.BALANCED,
      },
    });
    const initialText = wrapper.text();

    player.strength = 100;
    await nextTick();

    expect(wrapper.text()).not.toBe(initialText);
    expect(wrapper.text()).toContain('+16.4');
  });
});
