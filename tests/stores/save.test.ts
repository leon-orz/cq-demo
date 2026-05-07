import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useSaveStore } from '@/stores/save';

describe('存档时间戳', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('应记录最后活跃时间', () => {
    const save = useSaveStore();

    save.markActive(12345);

    expect(save.lastActiveTime).toBe(12345);
  });
});
