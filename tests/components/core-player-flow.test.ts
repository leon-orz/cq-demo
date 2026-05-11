import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import CenterPanel from '@/components/layout/CenterPanel.vue';
import ItemSlot from '@/components/inventory/ItemSlot.vue';
import RewardReport from '@/components/offline/RewardReport.vue';
import { useCombatStore } from '@/stores/combat';
import { useFeedbackStore } from '@/stores/feedback';
import { useInventoryStore } from '@/stores/inventory';
import { useOfflineStore } from '@/stores/offline';
import { usePlayerStore } from '@/stores/player';
import type { Item } from '@/types/item';
import type { OfflineReport } from '@/types/offline';

function createItem(): Item {
  return {
    id: 'flow_weapon_1',
    name: '流程测试战斧',
    slot: 'weapon',
    rarity: 'rare',
    itemLevel: 12,
    baseStats: { attack: 40 },
    affixes: [],
  };
}

function createOfflineReport(item: Item): OfflineReport {
  return {
    totalSeconds: 3600,
    actualSeconds: 900,
    cappedSeconds: 3600,
    monstersKilled: 20,
    gold: 500,
    exp: 180,
    items: [item],
    filteredItems: [],
    rejectedItems: 0,
    wasInterrupted: false,
    rewardMultiplier: 1,
    playerPower: 1000,
  };
}

function makeStrongPlayer() {
  usePlayerStore().$patch({
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

describe('核心玩家路径', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    makeStrongPlayer();
  });

  it('应能挑战推层、领取离线装备、对比并穿戴装备', async () => {
    const combat = useCombatStore();
    const inventory = useInventoryStore();
    const offline = useOfflineStore();
    const player = usePlayerStore();
    combat.$patch({ currentStage: 1, highestUnlockedStage: 1 });

    const center = mount(CenterPanel, {
      global: {
        stubs: {
          BattleLog: true,
        },
      },
    });
    await center
      .findAll('button')
      .find((button) => button.text() === '挑战一次')!
      .trigger('click');

    expect(combat.highestUnlockedStage).toBe(2);
    expect(useFeedbackStore().events.some((event) => event.title === '推层成功')).toBe(true);

    const item = createItem();
    offline.pendingReport = createOfflineReport(item);
    const report = mount(RewardReport);
    await report
      .findAll('button')
      .find((button) => button.text() === '稍后查看')!
      .trigger('click');
    expect(offline.pendingReport).not.toBeNull();
    await report.find('button').trigger('click');
    await report
      .findAll('button')
      .find((button) => button.text() === '领取奖励')!
      .trigger('click');

    expect(inventory.gold).toBeGreaterThanOrEqual(500);
    expect(inventory.items.some((target) => target.id === item.id)).toBe(true);

    const slot = mount(ItemSlot, {
      props: {
        item,
      },
    });
    await slot
      .findAll('button')
      .find((button) => button.text() === '对比')!
      .trigger('click');
    expect(slot.find('[role="dialog"]').exists()).toBe(true);
    await slot
      .find('[role="dialog"]')
      .findAll('button')
      .find((button) => button.text() === '穿戴')!
      .trigger('click');

    expect(player.equipped.weapon?.id).toBe(item.id);
    expect(slot.find('[role="dialog"]').exists()).toBe(false);
  });
});
