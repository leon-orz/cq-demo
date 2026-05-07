import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useInventoryStore } from '@/stores/inventory';
import { useOfflineStore } from '@/stores/offline';
import { usePlayerStore } from '@/stores/player';
import { useSaveStore } from '@/stores/save';

describe('离线收益状态', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('离线时间足够时应生成报告', () => {
    const save = useSaveStore();
    const offline = useOfflineStore();
    save.markActive(0);

    const report = offline.checkOfflineReward(3600 * 1000);

    expect(report).not.toBeNull();
    expect(offline.pendingReport).not.toBeNull();
  });

  it('领取报告后应入账并清空报告', () => {
    const save = useSaveStore();
    const offline = useOfflineStore();
    const inventory = useInventoryStore();
    const player = usePlayerStore();
    save.markActive(0);

    const report = offline.checkOfflineReward(3600 * 1000);
    expect(report).not.toBeNull();

    const claimed = offline.claimPendingReport();

    expect(claimed).not.toBeNull();
    expect(offline.pendingReport).toBeNull();
    expect(inventory.gold).toBe(claimed!.gold);
    expect(player.exp).toBeGreaterThanOrEqual(0);
  });

  it('离线时间过短时不应弹报告', () => {
    const save = useSaveStore();
    const offline = useOfflineStore();
    save.markActive(0);

    const report = offline.checkOfflineReward(10 * 1000);

    expect(report).toBeNull();
    expect(offline.pendingReport).toBeNull();
  });
});
