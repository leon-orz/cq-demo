import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import TrainingPanel from '@/components/training/TrainingPanel.vue';
import { useInventoryStore } from '@/stores/inventory';
import { usePlayerStore } from '@/stores/player';

describe('TrainingPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('默认折叠并展示训练总等级', () => {
    const wrapper = mount(TrainingPanel);

    expect(wrapper.text()).toContain('训练');
    expect(wrapper.text()).toContain('总等级 0');
    expect(wrapper.text()).not.toContain('攻击训练');
  });

  it('展开后应展示训练项和金币消耗', async () => {
    const inventory = useInventoryStore();
    inventory.gold = 500;
    const wrapper = mount(TrainingPanel);

    await wrapper.get('button').trigger('click');

    expect(wrapper.text()).toContain('攻击训练');
    expect(wrapper.text()).toContain('体魄训练');
    expect(wrapper.text()).toContain('防御训练');
    expect(wrapper.text()).toContain('80 金币');
  });

  it('金币足够时点击训练应扣除金币并更新等级', async () => {
    const player = usePlayerStore();
    const inventory = useInventoryStore();
    inventory.gold = 500;
    const wrapper = mount(TrainingPanel);

    await wrapper.get('button').trigger('click');
    await wrapper
      .findAll('button')
      .find((button) => button.text() === '80 金币')!
      .trigger('click');

    expect(player.trainingLevels.attack).toBe(1);
    expect(inventory.gold).toBe(420);
    expect(wrapper.text()).toContain('Lv 1/20');
  });
});
