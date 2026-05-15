import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useEquipmentStore } from '@/stores/equipment';
import { usePlayerStore } from '@/stores/player';
import type { EquipmentItem } from '@/types';
import { Rarity, SlotType } from '@/types/enums';

function createItem(overrides: Partial<EquipmentItem> = {}): EquipmentItem {
  return {
    id: 'test-sword',
    name: '测试短剑',
    slot: SlotType.WEAPON,
    rarity: Rarity.MAGIC,
    itemLevel: 1,
    baseStats: {
      atk: 8,
    },
    affixes: [],
    enhanceLevel: 0,
    locked: false,
    createdAt: 1,
    ...overrides,
  };
}

describe('equipment store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('重复穿戴已装备物品不会复制到背包', () => {
    const equipmentStore = useEquipmentStore();
    const item = createItem();

    equipmentStore.addToInventory(item);
    equipmentStore.equip(item);
    const change = equipmentStore.equip(item);

    expect(change).toEqual({ slot: item.slot, equipped: item, unequipped: null });
    expect(equipmentStore.equipped[item.slot]?.id).toBe(item.id);
    expect(equipmentStore.inventory).toHaveLength(0);
  });

  it('重复穿戴已装备物品不会重复叠加属性', () => {
    const equipmentStore = useEquipmentStore();
    const playerStore = usePlayerStore();
    const item = createItem({ baseStats: { atk: 8, armor: 3 } });

    equipmentStore.addToInventory(item);
    equipmentStore.equip(item);
    const atkAfterFirstEquip = playerStore.player.atk;
    const armorAfterFirstEquip = playerStore.player.armor;

    equipmentStore.equip(item);

    expect(playerStore.player.atk).toBe(atkAfterFirstEquip);
    expect(playerStore.player.armor).toBe(armorAfterFirstEquip);
  });

  it('一键穿戴不会因为候选包含已装备物品产生重复或额外变更', () => {
    const equipmentStore = useEquipmentStore();
    const equippedItem = createItem({ id: 'equipped-sword', baseStats: { atk: 20 } });
    const weakerItem = createItem({ id: 'weaker-sword', baseStats: { atk: 1 } });

    equipmentStore.addToInventory(equippedItem);
    equipmentStore.addToInventory(weakerItem);
    equipmentStore.equip(equippedItem);

    const changes = equipmentStore.equipBestForScoreMode();

    expect(changes).toHaveLength(0);
    expect(equipmentStore.equipped[SlotType.WEAPON]?.id).toBe(equippedItem.id);
    expect(equipmentStore.inventory.map((item) => item.id)).toEqual([weakerItem.id]);
  });

  it('强化选中装备会消耗资源并提升强化等级', () => {
    const equipmentStore = useEquipmentStore();
    const playerStore = usePlayerStore();
    const item = createItem({ enhanceLevel: 0 });
    const goldBefore = playerStore.player.gold;
    const stonesBefore = playerStore.player.enhancementStones;
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const result = equipmentStore.enhance(item);

    expect(result).toContain('强化成功');
    expect(item.enhanceLevel).toBe(1);
    expect(playerStore.player.gold).toBeLessThan(goldBefore);
    expect(playerStore.player.enhancementStones).toBeLessThan(stonesBefore);
  });

  it('强化达到上限时不会消耗资源并返回上限提示', () => {
    const equipmentStore = useEquipmentStore();
    const playerStore = usePlayerStore();
    const item = createItem({ enhanceLevel: 5 });
    const goldBefore = playerStore.player.gold;
    const stonesBefore = playerStore.player.enhancementStones;

    const result = equipmentStore.enhance(item);

    expect(result).toContain('上限');
    expect(item.enhanceLevel).toBe(5);
    expect(playerStore.player.gold).toBe(goldBefore);
    expect(playerStore.player.enhancementStones).toBe(stonesBefore);
  });
});
