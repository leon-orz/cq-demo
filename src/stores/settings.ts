import { defineStore } from 'pinia';
import { defaultItemScoreMode, defaultLootFilterRule, itemScoreModeOptions } from '@/core/item/filter';
import type { BaseSlot, ItemScoreMode, LootFilterRule, Rarity, StatKey } from '@/types/item';

type LootFilterPreset = 'loose' | 'magicPlus' | 'rarePlus';

interface SettingsState {
  itemScoreMode: ItemScoreMode;
  lootFilter: LootFilterRule;
  protectRareAndAbove: boolean;
  protectBetterItems: boolean;
}

export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    itemScoreMode: defaultItemScoreMode,
    lootFilter: { ...defaultLootFilterRule },
    protectRareAndAbove: true,
    protectBetterItems: true,
  }),

  getters: {
    itemScoreModeLabel: (state) => {
      return itemScoreModeOptions.find((option) => option.value === state.itemScoreMode)?.label ?? '均衡';
    },
  },

  actions: {
    setItemScoreMode(mode: ItemScoreMode) {
      this.itemScoreMode = mode;
    },

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
