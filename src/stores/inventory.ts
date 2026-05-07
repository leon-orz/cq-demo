import { defineStore } from 'pinia';
import type { EquipmentSlot, Item } from '@/types/item';
import { INVENTORY_CAPACITY } from '@/utils/constants';

interface InventoryState {
  items: Item[];
  gold: number;
  enhancementStones: number;
  lostDrops: number;
}

export const useInventoryStore = defineStore('inventory', {
  state: (): InventoryState => ({
    items: [],
    gold: 0,
    enhancementStones: 0,
    lostDrops: 0,
  }),

  getters: {
    capacity: () => INVENTORY_CAPACITY,
    isFull: (state) => state.items.length >= INVENTORY_CAPACITY,
    usedSlots: (state) => state.items.length,
    remainingSlots: (state) => Math.max(0, INVENTORY_CAPACITY - state.items.length),
  },

  actions: {
    addItem(item: Item): boolean {
      if (this.isFull) {
        this.lostDrops += 1;
        return false;
      }
      this.items.push(item);
      return true;
    },

    addItems(items: Item[]): { added: Item[]; rejected: Item[] } {
      const added: Item[] = [];
      const rejected: Item[] = [];

      items.forEach((item) => {
        if (this.addItem(item)) {
          added.push(item);
        } else {
          rejected.push(item);
        }
      });

      return { added, rejected };
    },

    removeItem(itemId: string): Item | null {
      const index = this.items.findIndex((item) => item.id === itemId);
      if (index < 0) return null;
      return this.items.splice(index, 1)[0] ?? null;
    },

    addGold(amount: number) {
      this.gold += amount;
    },

    decomposeLowRarity(): number {
      const before = this.items.length;
      this.items = this.items.filter((item) => {
        if (item.rarity === 'normal' || item.rarity === 'magic') {
          this.enhancementStones += item.rarity === 'normal' ? 1 : 2;
          return false;
        }
        return true;
      });
      return before - this.items.length;
    },

    findAvailableRingSlot(equipped: Record<EquipmentSlot, Item | null>): EquipmentSlot {
      return equipped.ring1 ? 'ring2' : 'ring1';
    },
  },

  persist: {
    key: 'inventory',
  },
});
