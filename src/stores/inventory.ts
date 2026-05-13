import { defineStore } from 'pinia';
import {
  calculateItemScore,
  getRejectedItemMaterialValue,
  isBetterThanEquipped,
  shouldKeepItem,
} from '@/core/item/filter';
import type { EquipmentSlot, Item } from '@/types/item';
import { INVENTORY_CAPACITY } from '@/utils/constants';
import { usePlayerStore } from './player';
import { useSettingsStore } from './settings';

interface InventoryState {
  items: Item[];
  gold: number;
  enhancementStones: number;
  lostDrops: number;
  autoConvertedDrops: number;
}

export interface DecomposePreview {
  candidates: Item[];
  protectedItems: Array<{ item: Item; reason: string }>;
  materials: number;
}

export type InventoryPressureLevel = 'normal' | 'warning' | 'critical' | 'full';

export const useInventoryStore = defineStore('inventory', {
  state: (): InventoryState => ({
    items: [],
    gold: 0,
    enhancementStones: 0,
    lostDrops: 0,
    autoConvertedDrops: 0,
  }),

  getters: {
    capacity: () => INVENTORY_CAPACITY,
    isFull: (state) => state.items.length >= INVENTORY_CAPACITY,
    usedSlots: (state) => state.items.length,
    remainingSlots: (state) => Math.max(0, INVENTORY_CAPACITY - state.items.length),
    usageRatio(state): number {
      return state.items.length / INVENTORY_CAPACITY;
    },
    pressureLevel(): InventoryPressureLevel {
      if (this.isFull) return 'full';
      if (this.remainingSlots <= Math.ceil(INVENTORY_CAPACITY * 0.1)) return 'critical';
      if (this.remainingSlots <= Math.ceil(INVENTORY_CAPACITY * 0.2)) return 'warning';
      return 'normal';
    },
    suggestedCleanupCount(): number {
      if (this.pressureLevel === 'normal') return 0;
      return Math.max(1, Math.ceil(INVENTORY_CAPACITY * 0.25) - this.remainingSlots);
    },
    pressureText(): string {
      if (this.pressureLevel === 'full') return '背包已满，请先整理装备。';
      if (this.pressureLevel === 'critical') return `背包仅剩 ${this.remainingSlots} 格，自动挂机可能很快暂停。`;
      if (this.pressureLevel === 'warning') return `背包剩余 ${this.remainingSlots} 格，建议提前分解低品质装备。`;
      return '背包空间充足。';
    },
  },

  actions: {
    addItem(item: Item): boolean {
      if (this.isFull) {
        this.lostDrops += 1;
        return false;
      }
      item.score = item.score ?? calculateItemScore(item);
      this.items.push(item);
      return true;
    },

    processDroppedItem(item: Item): { kept: boolean; reason: 'kept' | 'filtered' | 'full'; item: Item } {
      const settings = useSettingsStore();
      item.score = item.score ?? calculateItemScore(item);

      if (!shouldKeepItem(item, settings.lootFilter)) {
        if (settings.lootFilter.autoConvertRejected) {
          this.enhancementStones += getRejectedItemMaterialValue(item);
          this.autoConvertedDrops += 1;
        }
        return { kept: false, reason: 'filtered', item };
      }

      if (!this.addItem(item)) {
        return { kept: false, reason: 'full', item };
      }

      return { kept: true, reason: 'kept', item };
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
      const preview = this.previewDecomposeLowRarity();
      const before = this.items.length;
      this.items = this.items.filter((item) => {
        return !preview.candidates.some((candidate) => candidate.id === item.id);
      });
      this.enhancementStones += preview.materials;
      return before - this.items.length;
    },

    previewDecomposeLowRarity(): DecomposePreview {
      const player = usePlayerStore();
      const settings = useSettingsStore();
      const candidates: Item[] = [];
      const protectedItems: Array<{ item: Item; reason: string }> = [];

      this.items.forEach((item) => {
        const isLowRarity = item.rarity === 'normal' || item.rarity === 'magic';
        if (!isLowRarity) return;

        const protectionReason = item.locked
          ? '锁定保护'
          : settings.protectRareAndAbove &&
              (item.rarity === 'rare' || item.rarity === 'legendary' || item.rarity === 'ancient')
            ? '品质保护'
            : settings.protectBetterItems && isBetterThanEquipped(item, player.equipped, settings.itemScoreMode)
              ? '更优保护'
              : null;

        if (protectionReason) {
          protectedItems.push({ item, reason: protectionReason });
        } else {
          candidates.push(item);
        }
      });

      return {
        candidates,
        protectedItems,
        materials: candidates.reduce((sum, item) => sum + (item.rarity === 'normal' ? 1 : 2), 0),
      };
    },

    toggleLock(itemId: string) {
      const item = this.items.find((target) => target.id === itemId);
      if (item) {
        item.locked = !item.locked;
      }
    },

    findAvailableRingSlot(equipped: Record<EquipmentSlot, Item | null>): EquipmentSlot {
      return equipped.ring1 ? 'ring2' : 'ring1';
    },
  },

  persist: {
    key: 'inventory',
  },
});
