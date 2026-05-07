import { defineStore } from 'pinia';
import { calculateDps, calculateEhp, calculateGearScore, calculateTotalStats } from '@/core/player/calculator';
import type { EquipmentSlot, EquippedItems, Item } from '@/types/item';
import type { MainAttribute, PlayerBaseStats, SkillNode } from '@/types/player';
import { useInventoryStore } from './inventory';

interface PlayerState {
  name: string;
  level: number;
  exp: number;
  expToNext: number;
  mainAttribute: MainAttribute;
  baseStats: PlayerBaseStats;
  equipped: EquippedItems;
  skillNodes: SkillNode[];
}

function createEmptyEquipped(): EquippedItems {
  return {
    weapon: null,
    offhand: null,
    helmet: null,
    armor: null,
    gloves: null,
    shoes: null,
    ring1: null,
    ring2: null,
    necklace: null,
  };
}

export const usePlayerStore = defineStore('player', {
  state: (): PlayerState => ({
    name: '冒险者',
    level: 1,
    exp: 0,
    expToNext: 100,
    mainAttribute: 'str',
    baseStats: {
      str: 10,
      dex: 10,
      int: 10,
      hp: 120,
      attack: 12,
      attackSpeed: 1,
      critChance: 5,
      critDamage: 150,
      armor: 4,
    },
    equipped: createEmptyEquipped(),
    skillNodes: [],
  }),

  getters: {
    totalStats(state): PlayerBaseStats {
      return calculateTotalStats(state.baseStats, state.equipped, state.skillNodes);
    },

    dps(): number {
      return Math.round(calculateDps(this.totalStats, this.mainAttribute));
    },

    ehp(): number {
      return Math.round(calculateEhp(this.totalStats, this.level * 2 + 10));
    },

    gearScore(state): number {
      return calculateGearScore(state.equipped);
    },
  },

  actions: {
    gainExp(amount: number) {
      this.exp += amount;
      while (this.exp >= this.expToNext) {
        this.exp -= this.expToNext;
        this.level += 1;
        this.expToNext = Math.floor(this.expToNext * 1.2);
      }
    },

    equipItem(slot: EquipmentSlot, item: Item) {
      const inventory = useInventoryStore();
      const removed = inventory.removeItem(item.id);
      if (!removed) return;

      const current = this.equipped[slot];
      if (current) {
        inventory.addItem(current);
      }
      this.equipped[slot] = removed;
    },

    unequipItem(slot: EquipmentSlot) {
      const current = this.equipped[slot];
      if (!current) return;

      const inventory = useInventoryStore();
      if (inventory.addItem(current)) {
        this.equipped[slot] = null;
      }
    },
  },

  persist: {
    key: 'player',
  },
});
