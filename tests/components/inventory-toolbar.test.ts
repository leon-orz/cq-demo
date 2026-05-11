import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import InventoryToolbar from '@/components/inventory/InventoryToolbar.vue';
import { useInventoryViewStore } from '@/stores/inventoryView';
import { useSettingsStore } from '@/stores/settings';

describe('InventoryToolbar', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('应显示背包数量并打开筛选面板', async () => {
    const inventoryView = useInventoryViewStore();
    const wrapper = mount(InventoryToolbar, {
      props: {
        visibleCount: 3,
        totalCount: 10,
      },
    });

    expect(wrapper.text()).toContain('显示 3/10 件');

    await wrapper.get('button').trigger('click');

    expect(inventoryView.isFilterPanelOpen).toBe(true);
  });

  it('应能切换评分偏好、排序和筛选开关', async () => {
    const inventoryView = useInventoryViewStore();
    const settings = useSettingsStore();
    const wrapper = mount(InventoryToolbar, {
      props: {
        visibleCount: 3,
        totalCount: 10,
      },
    });

    await wrapper.get('select').setValue('crit');
    expect(settings.itemScoreMode).toBe('crit');

    const sortButtons = wrapper.findAll('button');
    await sortButtons.find((button) => button.text().includes('品质'))!.trigger('click');
    expect(inventoryView.sortKey).toBe('rarity');

    const checkboxes = wrapper.findAll('input[type="checkbox"]');
    await checkboxes[0]!.setValue(true);
    await checkboxes[1]!.setValue(true);

    expect(inventoryView.onlyUpgrades).toBe(true);
    expect(inventoryView.hideLocked).toBe(true);
  });
});
