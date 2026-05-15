import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useCombatStore } from '@/stores/combat';
import { useEquipmentStore } from '@/stores/equipment';
import { usePlayerStore } from '@/stores/player';
import type { EquipmentItem } from '@/types';
import { Rarity, SlotType } from '@/types/enums';

function createItem(id: string): EquipmentItem {
  return {
    id,
    name: '测试短剑',
    slot: SlotType.WEAPON,
    rarity: Rarity.NORMAL,
    itemLevel: 1,
    baseStats: { atk: 1 },
    affixes: [],
    enhanceLevel: 0,
    locked: false,
    createdAt: 1,
  };
}

describe('combat store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('背包满时 executeBattle 立即暂停且不发放奖励', () => {
    const playerStore = usePlayerStore();
    const equipmentStore = useEquipmentStore();
    const combatStore = useCombatStore();
    const goldBefore = playerStore.player.gold;
    const expBefore = playerStore.player.exp;

    equipmentStore.maxInventorySize = 1;
    equipmentStore.addToInventory(createItem('filled-slot'));

    const result = combatStore.executeBattle();

    expect(result.win).toBe(false);
    expect(result.goldEarned).toBe(0);
    expect(result.expEarned).toBe(0);
    expect(result.drops).toHaveLength(0);
    expect(playerStore.player.gold).toBe(goldBefore);
    expect(playerStore.player.exp).toBe(expBefore);
    expect(equipmentStore.inventoryCount).toBe(1);
    expect(combatStore.isPaused).toBe(true);
    expect(combatStore.pauseReason).toBe('inventory_full');
    expect(combatStore.combatLog[0]?.message).toBe('背包已满，挂机暂停');
  });
});
