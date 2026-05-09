import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useInventoryStore } from '@/stores/inventory';
import { useOfflineStore } from '@/stores/offline';
import { usePlayerStore } from '@/stores/player';
import { useSaveStore } from '@/stores/save';
import { useSettingsStore } from '@/stores/settings';
import { INVENTORY_CAPACITY } from '@/utils/constants';
import type { Item } from '@/types/item';
import type { OfflineReport } from '@/types/offline';

function createItem(index: number, rarity: Item['rarity'] = 'normal'): Item {
  return {
    id: `offline_item_${index}`,
    name: `离线测试装备 ${index}`,
    slot: 'weapon',
    rarity,
    itemLevel: 1,
    baseStats: { attack: 1 },
    affixes: [],
  };
}

function createReport(overrides: Partial<OfflineReport> = {}): OfflineReport {
  return {
    totalSeconds: 3600,
    actualSeconds: 3600,
    cappedSeconds: 3600,
    monstersKilled: 10,
    gold: 120,
    exp: 45,
    items: [],
    filteredItems: [],
    rejectedItems: 0,
    wasInterrupted: false,
    rewardMultiplier: 1,
    playerPower: 2000,
    ...overrides,
  };
}

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

  it('领取离线收益时应把过滤装备自动转化为材料且不占用背包', () => {
    const offline = useOfflineStore();
    const inventory = useInventoryStore();
    const settings = useSettingsStore();
    settings.setMinRarity('rare');
    settings.setAutoConvertRejected(true);
    offline.pendingReport = createReport({
      items: [createItem(2, 'rare')],
      filteredItems: [createItem(1, 'normal')],
    });

    const claimed = offline.claimPendingReport();

    expect(claimed).not.toBeNull();
    expect(inventory.items.map((item) => item.id)).toEqual(['offline_item_2']);
    expect(inventory.enhancementStones).toBe(1);
    expect(inventory.autoConvertedDrops).toBe(1);
    expect(inventory.lostDrops).toBe(0);
    expect(inventory.gold).toBe(120);
    expect(usePlayerStore().exp).toBeGreaterThanOrEqual(45);
  });

  it('背包空间不足时应只丢失过滤后仍需入包的离线装备', () => {
    const offline = useOfflineStore();
    const inventory = useInventoryStore();
    const settings = useSettingsStore();
    settings.setMinRarity('rare');
    settings.setAutoConvertRejected(true);

    for (let index = 0; index < INVENTORY_CAPACITY - 1; index += 1) {
      expect(inventory.addItem(createItem(1000 + index, 'rare'))).toBe(true);
    }

    offline.pendingReport = createReport({
      items: [createItem(2, 'rare')],
      filteredItems: [createItem(1, 'normal')],
      rejectedItems: 1,
      wasInterrupted: true,
    });

    const claimed = offline.claimPendingReport();

    expect(claimed).not.toBeNull();
    expect(inventory.items).toHaveLength(INVENTORY_CAPACITY);
    expect(inventory.items.some((item) => item.id === 'offline_item_2')).toBe(true);
    expect(inventory.items.some((item) => item.id === 'offline_item_1')).toBe(false);
    expect(inventory.items.some((item) => item.id === 'offline_item_3')).toBe(false);
    expect(inventory.enhancementStones).toBe(1);
    expect(inventory.autoConvertedDrops).toBe(1);
    expect(inventory.lostDrops).toBe(1);
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
