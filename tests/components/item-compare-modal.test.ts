import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { nextTick } from 'vue';
import { beforeEach, describe, expect, it } from 'vitest';
import ItemCompareModal from '@/components/inventory/ItemCompareModal.vue';
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

describe('ItemCompareModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('关闭和取消按钮应触发关闭事件', async () => {
    const wrapper = mount(ItemCompareModal, {
      props: {
        item: createItem(),
      },
    });

    await wrapper.get('button').trigger('click');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '取消')!
      .trigger('click');

    expect(wrapper.emitted('close')).toHaveLength(2);
  });

  it('点击遮罩和按 Escape 应触发关闭事件', async () => {
    const wrapper = mount(ItemCompareModal, {
      props: {
        item: createItem(),
      },
    });

    await wrapper.get('[role="dialog"]').trigger('click');
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();

    expect(wrapper.emitted('close')).toHaveLength(2);
  });

  it('点击弹窗内容不应触发遮罩关闭', async () => {
    const wrapper = mount(ItemCompareModal, {
      props: {
        item: createItem(),
      },
    });

    await wrapper.get('section').trigger('click');

    expect(wrapper.emitted('close')).toBeUndefined();
  });
});
