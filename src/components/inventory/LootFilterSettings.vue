<template>
  <section class="mb-4 rounded border border-line bg-ink p-3 text-sm">
    <div class="mb-3 flex items-center justify-between gap-3">
      <h3 class="font-semibold text-slate-200">拾取过滤</h3>
      <span class="text-xs text-slate-500">自动转化 {{ autoConvertedDrops }}</span>
    </div>
    <label class="block text-xs text-slate-500" for="min-rarity">最低品质</label>
    <div class="mb-2 mt-2 grid grid-cols-3 gap-1">
      <button
        v-for="preset in presetOptions"
        :key="preset.value"
        class="rounded border border-line px-2 py-1 text-xs text-slate-300"
        @click="$emit('applyPreset', preset.value)"
      >
        {{ preset.label }}
      </button>
    </div>
    <select
      id="min-rarity"
      class="mt-1 w-full rounded border border-line bg-panel px-2 py-2 text-sm text-slate-100"
      :value="minRarity"
      @change="$emit('setMinRarity', ($event.target as HTMLSelectElement).value as Rarity)"
    >
      <option value="normal">普通</option>
      <option value="magic">魔法</option>
      <option value="rare">稀有</option>
      <option value="legendary">传说</option>
    </select>
    <div class="mt-3 space-y-2">
      <label class="flex items-center gap-2 text-xs text-slate-300">
        <input
          type="checkbox"
          :checked="autoConvertRejected"
          @change="$emit('setAutoConvertRejected', ($event.target as HTMLInputElement).checked)"
        />
        未通过过滤的装备自动转化为强化石
      </label>
      <label class="flex items-center gap-2 text-xs text-slate-300">
        <input
          type="checkbox"
          :checked="protectRareAndAbove"
          @change="$emit('update:protectRareAndAbove', ($event.target as HTMLInputElement).checked)"
        />
        分解时保护稀有及以上装备
      </label>
      <label class="flex items-center gap-2 text-xs text-slate-300">
        <input
          type="checkbox"
          :checked="protectBetterItems"
          @change="$emit('update:protectBetterItems', ($event.target as HTMLInputElement).checked)"
        />
        分解时保护{{ scoreModeLabel }}评分更优装备
      </label>
    </div>
    <p class="mt-3 text-xs text-slate-500">分解候选 {{ candidateCount }} 件，已保护 {{ protectedCount }} 件。</p>
  </section>
</template>

<script setup lang="ts">
import type { Rarity } from '@/types/item';

type LootFilterPreset = 'loose' | 'magicPlus' | 'rarePlus';

defineProps<{
  autoConvertedDrops: number;
  minRarity: Rarity;
  autoConvertRejected: boolean;
  protectRareAndAbove: boolean;
  protectBetterItems: boolean;
  candidateCount: number;
  protectedCount: number;
  scoreModeLabel: string;
}>();

defineEmits<{
  applyPreset: [preset: LootFilterPreset];
  setMinRarity: [rarity: Rarity];
  setAutoConvertRejected: [active: boolean];
  'update:protectRareAndAbove': [active: boolean];
  'update:protectBetterItems': [active: boolean];
}>();

const presetOptions: Array<{ value: LootFilterPreset; label: string }> = [
  { value: 'loose', label: '宽松' },
  { value: 'magicPlus', label: '魔法+' },
  { value: 'rarePlus', label: '稀有+' },
];
</script>
