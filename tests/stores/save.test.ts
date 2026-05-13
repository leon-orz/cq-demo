import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { CURRENT_SAVE_SCHEMA_VERSION } from '@/core/save/migration';
import type { Item } from '@/types/item';
import type { OfflineReport } from '@/types/offline';
import { useSaveStore } from '@/stores/save';
import { usePlayerStore } from '@/stores/player';
import { useInventoryStore } from '@/stores/inventory';
import { useSettingsStore } from '@/stores/settings';
import { useInventoryViewStore } from '@/stores/inventoryView';
import { useCombatStore } from '@/stores/combat';
import { useOfflineStore } from '@/stores/offline';

const localforageMock = vi.hoisted(() => {
  const store = new Map<string, unknown>();
  return {
    store,
    getItem: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    setItem: vi.fn((key: string, value: unknown) => {
      store.set(key, value);
      return Promise.resolve(value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
  };
});

vi.mock('localforage', () => ({
  default: {
    getItem: localforageMock.getItem,
    setItem: localforageMock.setItem,
    removeItem: localforageMock.removeItem,
  },
}));

function createItem(index: number): Item {
  return {
    id: `save_item_${index}`,
    name: `存档测试装备 ${index}`,
    slot: 'weapon',
    rarity: 'rare',
    itemLevel: 3,
    baseStats: { attack: 10 },
    affixes: [],
    locked: true,
  };
}

function createOfflineReport(): OfflineReport {
  return {
    totalSeconds: 3600,
    actualSeconds: 600,
    cappedSeconds: 3600,
    monstersKilled: 12,
    gold: 300,
    exp: 120,
    items: [createItem(99)],
    filteredItems: [],
    rejectedItems: 0,
    wasInterrupted: false,
    rewardMultiplier: 1,
    playerPower: 500,
  };
}

describe('存档时间戳', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localforageMock.store.clear();
    vi.clearAllMocks();
  });

  it('应记录最后活跃时间', () => {
    const save = useSaveStore();

    save.markActive(12345);

    expect(save.lastActiveTime).toBe(12345);
  });

  it('应创建包含长期状态的版本化快照', () => {
    const save = useSaveStore();
    const player = usePlayerStore();
    const inventory = useInventoryStore();
    const settings = useSettingsStore();
    const inventoryView = useInventoryViewStore();
    const combat = useCombatStore();
    const offline = useOfflineStore();

    player.name = '快照角色';
    player.trainingLevels.attack = 2;
    inventory.addItem(createItem(1));
    inventory.addGold(300);
    settings.setMinRarity('rare');
    inventoryView.toggleRarity('rare');
    combat.currentStage = 3;
    combat.highestUnlockedStage = 5;
    offline.pendingReport = createOfflineReport();
    offline.lastCheckedAt = 1500;
    save.markActive(1000);

    const snapshot = save.createSnapshot(2000);

    expect(snapshot.schemaVersion).toBe(CURRENT_SAVE_SCHEMA_VERSION);
    expect(snapshot.savedAt).toBe(2000);
    expect(snapshot.player.name).toBe('快照角色');
    expect(snapshot.player.trainingLevels.attack).toBe(2);
    expect(snapshot.inventory.items.map((item) => item.id)).toEqual(['save_item_1']);
    expect(snapshot.settings.lootFilter.minRarity).toBe('rare');
    expect(snapshot.inventoryView.rarities).toEqual(['rare']);
    expect(snapshot.combat).toEqual({ currentStage: 3, highestUnlockedStage: 5 });
    expect(snapshot.offline.pendingReport?.gold).toBe(300);
    expect(snapshot.offline.lastCheckedAt).toBe(1500);
    expect(snapshot.save.lastActiveTime).toBe(1000);
  });

  it('恢复快照时应写入白名单字段并清理运行态', () => {
    const save = useSaveStore();
    const combat = useCombatStore();
    const offline = useOfflineStore();

    combat.setAutoFighting(true);
    combat.addLog('临时日志');
    combat.stoppedReason = '临时原因';
    offline.lastCheckedAt = 111;

    const snapshot = save.createSnapshot(3000);
    snapshot.player.name = '恢复角色';
    snapshot.player.trainingLevels.attack = 3;
    snapshot.inventory.items = [createItem(2)];
    snapshot.inventory.gold = 900;
    snapshot.settings.lootFilter.keepSlots = ['weapon'];
    snapshot.inventoryView.rarities = ['rare'];
    snapshot.combat.currentStage = 4;
    snapshot.combat.highestUnlockedStage = 6;
    snapshot.offline.pendingReport = createOfflineReport();
    snapshot.offline.lastCheckedAt = 222;
    useInventoryViewStore().setFilterPanelOpen(true);

    save.restoreSnapshot(snapshot);

    expect(usePlayerStore().name).toBe('恢复角色');
    expect(usePlayerStore().trainingLevels.attack).toBe(3);
    expect(useInventoryStore().items.map((item) => item.id)).toEqual(['save_item_2']);
    expect(useInventoryStore().gold).toBe(900);
    expect(useSettingsStore().lootFilter.keepSlots).toEqual(['weapon']);
    expect(useInventoryViewStore().rarities).toEqual(['rare']);
    expect(useInventoryViewStore().isFilterPanelOpen).toBe(false);
    expect(combat.currentStage).toBe(4);
    expect(combat.highestUnlockedStage).toBe(6);
    expect(combat.isAutoFighting).toBe(false);
    expect(combat.logs).toHaveLength(0);
    expect(combat.stoppedReason).toBeNull();
    expect(offline.pendingReport?.gold).toBe(300);
    expect(offline.lastCheckedAt).toBe(222);
  });

  it('导出后应能导入并恢复状态', () => {
    const save = useSaveStore();
    usePlayerStore().name = '导出角色';
    useInventoryStore().addItem(createItem(3));
    useOfflineStore().pendingReport = createOfflineReport();

    const exported = save.exportSave(4000);
    expect(exported.ok).toBe(true);

    usePlayerStore().name = '被覆盖角色';
    useInventoryStore().items = [];

    const imported = save.importSave(exported.data!);

    expect(imported.ok).toBe(true);
    expect(usePlayerStore().name).toBe('导出角色');
    expect(useInventoryStore().items.map((item) => item.id)).toEqual(['save_item_3']);
    expect(useOfflineStore().pendingReport?.gold).toBe(300);
    expect(save.lastError).toBeNull();
  });

  it('导入旧快照缺少离线报告字段时应提供默认值', () => {
    const save = useSaveStore();
    const snapshot = save.createSnapshot(4100);
    const legacySnapshot = JSON.parse(JSON.stringify(snapshot)) as Record<string, unknown>;
    delete legacySnapshot.offline;

    const result = save.importSave(JSON.stringify(legacySnapshot));

    expect(result.ok).toBe(true);
    expect(useOfflineStore().pendingReport).toBeNull();
    expect(useOfflineStore().lastCheckedAt).toBeNull();
  });

  it('导入旧快照缺少训练字段时应提供默认训练等级', () => {
    const save = useSaveStore();
    const snapshot = save.createSnapshot(4200);
    const legacySnapshot = JSON.parse(JSON.stringify(snapshot)) as Record<string, unknown>;
    const player = legacySnapshot.player as Record<string, unknown>;
    delete player.trainingLevels;

    const result = save.importSave(JSON.stringify(legacySnapshot));

    expect(result.ok).toBe(true);
    expect(usePlayerStore().trainingLevels).toEqual({
      attack: 0,
      vitality: 0,
      guard: 0,
    });
  });

  it('导入非法 JSON 时应返回错误且不污染现有状态', () => {
    const save = useSaveStore();
    usePlayerStore().name = '原角色';

    const result = save.importSave('{bad json');

    expect(result.ok).toBe(false);
    expect(result.error).toContain('JSON');
    expect(save.lastError).toContain('JSON');
    expect(usePlayerStore().name).toBe('原角色');
  });

  it('导入高版本存档时应失败且不污染现有状态', () => {
    const save = useSaveStore();
    usePlayerStore().name = '当前角色';
    const snapshot = save.createSnapshot(4500);
    snapshot.schemaVersion = CURRENT_SAVE_SCHEMA_VERSION + 1;
    snapshot.player.name = '高版本角色';

    const result = save.importSave(JSON.stringify(snapshot));

    expect(result.ok).toBe(false);
    expect(result.error).toContain('高于当前客户端');
    expect(save.lastError).toContain('高于当前客户端');
    expect(usePlayerStore().name).toBe('当前角色');
  });

  it('应通过 localForage 保存和读取快照', async () => {
    const save = useSaveStore();
    usePlayerStore().name = '本地角色';

    const saved = await save.saveToLocal(5000);
    expect(saved.ok).toBe(true);
    expect(localforageMock.setItem).toHaveBeenCalledTimes(1);

    usePlayerStore().name = '待读取角色';

    const loaded = await save.loadFromLocal();

    expect(loaded.ok).toBe(true);
    expect(localforageMock.getItem).toHaveBeenCalledTimes(1);
    expect(usePlayerStore().name).toBe('本地角色');
    expect(save.lastSnapshotAt).toBe(5000);
  });
});
