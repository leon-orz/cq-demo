import { defineStore } from 'pinia';
import { defaultInventoryViewFilter, hasActiveInventoryViewFilter } from '@/core/item/inventoryView';
import type { BaseSlot, InventorySortKey, InventoryViewFilter, Rarity, SortDirection } from '@/types/item';

interface InventoryViewState extends InventoryViewFilter {
  isFilterPanelOpen: boolean;
}

export const useInventoryViewStore = defineStore('inventoryView', {
  state: (): InventoryViewState => ({
    ...defaultInventoryViewFilter,
    rarities: [...defaultInventoryViewFilter.rarities],
    slots: [...defaultInventoryViewFilter.slots],
    isFilterPanelOpen: false,
  }),

  getters: {
    filter(state): InventoryViewFilter {
      return {
        sortKey: state.sortKey,
        sortDirection: state.sortDirection,
        rarities: state.rarities,
        slots: state.slots,
        onlyUpgrades: state.onlyUpgrades,
        hideLocked: state.hideLocked,
        minItemLevel: state.minItemLevel,
      };
    },

    hasActiveFilter(): boolean {
      return hasActiveInventoryViewFilter(this.filter);
    },
  },

  actions: {
    setSortKey(sortKey: InventorySortKey) {
      if (this.sortKey === sortKey) {
        this.toggleSortDirection();
        return;
      }

      this.sortKey = sortKey;
      this.sortDirection = sortKey === 'slot' ? 'asc' : 'desc';
    },

    setSortDirection(direction: SortDirection) {
      this.sortDirection = direction;
    },

    toggleSortDirection() {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    },

    toggleRarity(rarity: Rarity) {
      if (this.rarities.includes(rarity)) {
        this.rarities = this.rarities.filter((item) => item !== rarity);
      } else {
        this.rarities.push(rarity);
      }
    },

    toggleSlot(slot: BaseSlot) {
      if (this.slots.includes(slot)) {
        this.slots = this.slots.filter((item) => item !== slot);
      } else {
        this.slots.push(slot);
      }
    },

    setOnlyUpgrades(active: boolean) {
      this.onlyUpgrades = active;
    },

    setHideLocked(active: boolean) {
      this.hideLocked = active;
    },

    setMinItemLevel(level: number) {
      this.minItemLevel = Math.max(0, Math.floor(level));
    },

    setFilterPanelOpen(open: boolean) {
      this.isFilterPanelOpen = open;
    },

    resetViewFilter() {
      this.rarities = [];
      this.slots = [];
      this.onlyUpgrades = false;
      this.hideLocked = false;
      this.minItemLevel = 0;
    },
  },

  persist: {
    key: 'inventory-view',
  },
});
