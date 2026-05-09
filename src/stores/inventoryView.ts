import { defineStore } from 'pinia';
import {
  defaultInventoryViewFilter,
  getInventoryViewItems,
  hasActiveInventoryViewFilter,
} from '@/core/item/inventoryView';
import type {
  BaseSlot,
  EquippedItems,
  InventorySortKey,
  InventoryViewFilter,
  Item,
  Rarity,
  SortDirection,
} from '@/types/item';

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

    visibleItems(): (items: Item[], equipped: EquippedItems) => Item[] {
      return (items, equipped) => getInventoryViewItems(items, this.filter, equipped);
    },

    emptyText(): (totalCount: number) => string {
      return (totalCount) => {
        if (totalCount === 0) return '背包为空，挑战怪物获取装备。';
        return '没有符合当前筛选条件的装备。';
      };
    },

    showReset(): (totalCount: number) => boolean {
      return (totalCount) => totalCount > 0 && this.hasActiveFilter;
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
