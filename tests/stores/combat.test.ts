import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useCombatStore } from '@/stores/combat';
import { useEquipmentStore } from '@/stores/equipment';
import { usePlayerStore } from '@/stores/player';
import type { EquipmentItem } from '@/types';
import { Rarity, SlotType } from '@/types/enums';
import { FloorScaling } from '@/core/FloorScaling';

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

  it('击杀日志显示实际发放的金币和经验', () => {
    const playerStore = usePlayerStore();
    const combatStore = useCombatStore();

    playerStore.player.atk = 999;
    playerStore.player.strength = 0;
    playerStore.player.goldFind = 0.25;
    playerStore.player.expFind = 0.5;
    vi.spyOn(FloorScaling, 'getGoldReward').mockReturnValue(100);
    vi.spyOn(FloorScaling, 'getExpReward').mockReturnValue(40);

    combatStore.executeBattle();

    expect(playerStore.player.gold).toBe(120 + 125);
    expect(playerStore.player.exp).toBe(60);
    expect(combatStore.combatLog.some((entry) => entry.message === '击杀 裂隙兽 Lv.1，获得 125 金币 / 60 经验')).toBe(
      true,
    );
  });
});
