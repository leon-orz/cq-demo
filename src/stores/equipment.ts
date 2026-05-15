import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { EquipChange, EquipmentComparison, EquipmentItem } from '@/types';
import { ScoreMode, SlotType, Rarity } from '@/types/enums';
import { EnhancementSystem } from '@/core/EnhancementSystem';
import { GearScore } from '@/core/GearScore';
import { ALL_SLOTS, GAME_CONSTANTS, RARITY_ORDER } from '@/utils/constants';
import { usePlayerStore } from './player';

export function createEmptyEquipmentSlots(): Record<SlotType, EquipmentItem | null> {
  return ALL_SLOTS.reduce(
    (slots, slot) => {
      slots[slot] = null;
      return slots;
    },
    {} as Record<SlotType, EquipmentItem | null>,
  );
}

export const useEquipmentStore = defineStore('equipment', () => {
  const equipped = ref<Record<SlotType, EquipmentItem | null>>(createEmptyEquipmentSlots());
  const inventory = ref<EquipmentItem[]>([]);
  const maxInventorySize = ref<number>(GAME_CONSTANTS.INVENTORY_SIZE);
  const scoreMode = ref<ScoreMode>(ScoreMode.BALANCED);

  const inventoryCount = computed(() => inventory.value.length);
  const inventoryPressure = computed(() => inventoryCount.value / maxInventorySize.value);
  const isInventoryFull = computed(() => inventoryCount.value >= maxInventorySize.value);
  const totalGearScore = computed(() => {
    const playerStore = usePlayerStore();
    return Object.values(equipped.value).reduce((sum, item) => {
      return sum + (item ? GearScore.scoreEquipment(item, playerStore.player, scoreMode.value) : 0);
    }, 0);
  });

  function equip(item: EquipmentItem): EquipChange {
    const playerStore = usePlayerStore();
    const oldItem = equipped.value[item.slot];
    if (oldItem?.id === item.id) {
      return { slot: item.slot, equipped: item, unequipped: null };
    }
    removeItemById(item.id);
    if (oldItem) inventory.value.push(oldItem);
    equipped.value[item.slot] = item;
    playerStore.recalculateStats();
    return { slot: item.slot, equipped: item, unequipped: oldItem };
  }

  function unequip(slot: SlotType): EquipmentItem | null {
    const playerStore = usePlayerStore();
    const oldItem = equipped.value[slot];
    if (!oldItem || isInventoryFull.value) return null;
    equipped.value[slot] = null;
    inventory.value.push(oldItem);
    playerStore.recalculateStats();
    return oldItem;
  }

  function addToInventory(item: EquipmentItem): boolean {
    if (isInventoryFull.value) return false;
    inventory.value.push(item);
    sortInventory();
    return true;
  }

  function addManyToInventory(items: EquipmentItem[]): number {
    let added = 0;
    for (const item of items) {
      if (!addToInventory(item)) break;
      added += 1;
    }
    return added;
  }

  function removeFromInventory(index: number): EquipmentItem | null {
    const item = inventory.value[index];
    if (!item) return null;
    inventory.value.splice(index, 1);
    return item;
  }

  function disenchant(item: EquipmentItem): number {
    if (item.locked) return 0;
    const removed = removeItemById(item.id);
    if (!removed) return 0;
    const stones = getDisenchantStones(item);
    const playerStore = usePlayerStore();
    playerStore.gainEnhancementStones(stones);
    return stones;
  }

  function disenchantAllBelow(minRarity: Rarity): number {
    const minOrder = RARITY_ORDER[minRarity];
    const targets = inventory.value.filter((item) => !item.locked && RARITY_ORDER[item.rarity] < minOrder);
    return targets.reduce((sum, item) => sum + disenchant(item), 0);
  }

  function enhance(item: EquipmentItem): string {
    const playerStore = usePlayerStore();
    const result = EnhancementSystem.enhance(item, playerStore.player.gold, playerStore.player.enhancementStones);
    if (result.consumed && playerStore.consumeEnhancementCost(result.cost.gold, result.cost.stones)) {
      item.enhanceLevel = result.newLevel;
      playerStore.recalculateStats();
    }
    return result.message;
  }

  function lockItem(itemId: string): void {
    const item = findItem(itemId);
    if (item) item.locked = true;
  }

  function unlockItem(itemId: string): void {
    const item = findItem(itemId);
    if (item) item.locked = false;
  }

  function compareWithEquipped(item: EquipmentItem): EquipmentComparison {
    const playerStore = usePlayerStore();
    return GearScore.compareEquipment(item, equipped.value[item.slot], playerStore.player, scoreMode.value);
  }

  function getItemsForSlot(slot: SlotType): EquipmentItem[] {
    return inventory.value.filter((item) => item.slot === slot);
  }

  function equipBestForScoreMode(mode = scoreMode.value): EquipChange[] {
    const playerStore = usePlayerStore();
    const changes: EquipChange[] = [];
    for (const slot of ALL_SLOTS) {
      const equippedItem = equipped.value[slot];
      const candidates = [...getItemsForSlot(slot), ...(equippedItem ? [equippedItem] : [])]
        .filter((item): item is EquipmentItem => item !== null)
        .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index);
      const best = candidates.sort(
        (a, b) =>
          GearScore.scoreEquipment(b, playerStore.player, mode) - GearScore.scoreEquipment(a, playerStore.player, mode),
      )[0];
      if (best && equippedItem?.id !== best.id) {
        changes.push(equip(best));
      }
    }
    return changes;
  }

  function setScoreMode(mode: ScoreMode): void {
    scoreMode.value = mode;
  }

  function sortInventory(): void {
    const playerStore = usePlayerStore();
    inventory.value.sort((a, b) => {
      const rarityDiff = RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity];
      if (rarityDiff !== 0) return rarityDiff;
      return (
        GearScore.scoreEquipment(b, playerStore.player, scoreMode.value) -
        GearScore.scoreEquipment(a, playerStore.player, scoreMode.value)
      );
    });
  }

  function applySaveState(state: {
    equipped: Record<SlotType, EquipmentItem | null>;
    inventory: EquipmentItem[];
    maxInventorySize: number;
    scoreMode: ScoreMode;
  }): void {
    equipped.value = structuredClone(state.equipped);
    inventory.value = structuredClone(state.inventory);
    maxInventorySize.value = state.maxInventorySize;
    scoreMode.value = state.scoreMode;
  }

  function $reset(): void {
    equipped.value = createEmptyEquipmentSlots();
    inventory.value = [];
    maxInventorySize.value = GAME_CONSTANTS.INVENTORY_SIZE;
    scoreMode.value = ScoreMode.BALANCED;
  }

  function findItem(itemId: string): EquipmentItem | null {
    return (
      inventory.value.find((item) => item.id === itemId) ??
      Object.values(equipped.value).find((item) => item?.id === itemId) ??
      null
    );
  }

  function removeItemById(itemId: string): EquipmentItem | null {
    const index = inventory.value.findIndex((item) => item.id === itemId);
    if (index < 0) return null;
    return inventory.value.splice(index, 1)[0] ?? null;
  }

  return {
    equipped,
    inventory,
    maxInventorySize,
    scoreMode,
    inventoryCount,
    inventoryPressure,
    isInventoryFull,
    totalGearScore,
    equip,
    unequip,
    addToInventory,
    addManyToInventory,
    removeFromInventory,
    disenchant,
    disenchantAllBelow,
    enhance,
    lockItem,
    unlockItem,
    compareWithEquipped,
    getItemsForSlot,
    equipBestForScoreMode,
    setScoreMode,
    sortInventory,
    applySaveState,
    $reset,
  };
});

function getDisenchantStones(item: EquipmentItem): number {
  return Math.max(1, RARITY_ORDER[item.rarity] + 1 + Math.floor(item.itemLevel / 12));
}
