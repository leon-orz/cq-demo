import { defineStore } from 'pinia';
import { defaultLootFilterRule } from '@/core/item/filter';
import type { BaseSlot, LootFilterRule, Rarity, StatKey } from '@/types/item';

type LootFilterPreset = 'loose' | 'magicPlus' | 'rarePlus';

interface SettingsState {
  lootFilter: LootFilterRule;
  protectRareAndAbove: boolean;
  protectBetterItems: boolean;
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    lootFilter: { ...defaultLootFilterRule },
    protectRareAndAbove: true,
    protectBetterItems: true,
  }),

  actions: {
    setMinRarity(minRarity: Rarity) {
      this.lootFilter.minRarity = minRarity;
    },

    toggleKeepSlot(slot: BaseSlot) {
      if (this.lootFilter.keepSlots.includes(slot)) {
        this.lootFilter.keepSlots = this.lootFilter.keepSlots.filter((item) => item !== slot);
      } else {
        this.lootFilter.keepSlots.push(slot);
      }
    },

    toggleRequiredAffixStat(stat: StatKey) {
      if (this.lootFilter.requiredAffixStats.includes(stat)) {
        this.lootFilter.requiredAffixStats = this.lootFilter.requiredAffixStats.filter((item) => item !== stat);
      } else {
        this.lootFilter.requiredAffixStats.push(stat);
      }
    },

    setAutoConvertRejected(active: boolean) {
      this.lootFilter.autoConvertRejected = active;
    },

    applyLootFilterPreset(preset: LootFilterPreset) {
      const minRarityByPreset: Record<LootFilterPreset, Rarity> = {
        loose: 'normal',
        magicPlus: 'magic',
        rarePlus: 'rare',
      };

      this.lootFilter = {
        ...defaultLootFilterRule,
        minRarity: minRarityByPreset[preset],
        autoConvertRejected: true,
      };
    },

    resetLootFilter() {
      this.lootFilter = { ...defaultLootFilterRule };
    },
  },

  persist: {
    key: 'settings',
  },
});
