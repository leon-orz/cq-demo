import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import ItemSlot from '@/components/inventory/ItemSlot.vue';
import { useInventoryStore } from '@/stores/inventory';
import { usePlayerStore } from '@/stores/player';
import type { Item } from '@/types/item';

function createItem(): Item {
  return {
    id: 'weapon_1',
    name: '测试战斧',
    slot: 'weapon',
    rarity: 'magic',
    itemLevel: 8,
    baseStats: { attack: 20 },
    affixes: [],
  };
}

describe('ItemSlot', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('更优角标不应拦截按钮点击，穿戴按钮应装备物品', async () => {
    const item = createItem();
    const inventory = useInventoryStore();
    const player = usePlayerStore();
    inventory.addItem(item);

    const wrapper = mount(ItemSlot, {
      props: {
        item,
      },
      global: {
        stubs: {
          ItemCompareModal: true,
        },
      },
    });

    expect(wrapper.text()).toContain('更优');
    expect(wrapper.find('.pointer-events-none').text()).toBe('更优');

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '穿戴')!
      .trigger('click');

    expect(player.equipped.weapon?.id).toBe(item.id);
    expect(inventory.items).toHaveLength(0);
  });

  it('应能从对比弹窗穿戴并关闭弹窗', async () => {
    const item = createItem();
    const inventory = useInventoryStore();
    const player = usePlayerStore();
    inventory.addItem(item);

    const wrapper = mount(ItemSlot, {
      props: {
        item,
      },
    });

    await wrapper
      .findAll('button')
      .find((button) => button.text() === '对比')!
      .trigger('click');
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);

    await wrapper
      .find('[role="dialog"]')
      .findAll('button')
      .find((button) => button.text() === '穿戴')!
      .trigger('click');

    expect(player.equipped.weapon?.id).toBe(item.id);
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);
  });
});
