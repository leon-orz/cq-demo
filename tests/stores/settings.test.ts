import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useSettingsStore } from '@/stores/settings';

describe('设置状态', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('应支持拾取过滤预设', () => {
    const settings = useSettingsStore();

    settings.applyLootFilterPreset('rarePlus');

    expect(settings.lootFilter.minRarity).toBe('rare');
    expect(settings.lootFilter.autoConvertRejected).toBe(true);
  });

  it('应支持重置拾取过滤', () => {
    const settings = useSettingsStore();
    settings.applyLootFilterPreset('rarePlus');

    settings.resetLootFilter();

    expect(settings.lootFilter.minRarity).toBe('normal');
    expect(settings.lootFilter.keepSlots).toHaveLength(0);
  });
});
