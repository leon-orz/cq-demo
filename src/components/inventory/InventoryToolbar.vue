<template>
  <section class="mb-3 rounded border border-line bg-ink p-3 text-sm">
    <div class="mb-3 flex items-center justify-between gap-3">
      <div>
        <h3 class="font-semibold text-slate-200">背包整理</h3>
        <p class="text-xs text-slate-500">显示 {{ visibleCount }}/{{ totalCount }} 件</p>
      </div>
      <button
        class="relative rounded border border-line bg-panel px-3 py-2 text-xs text-slate-200 hover:border-slate-500"
        @click="inventoryView.setFilterPanelOpen(true)"
      >
        筛选
        <span v-if="inventoryView.hasActiveFilter" class="ml-1 text-emerald-300">已启用</span>
      </button>
    </div>

    <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <button
        v-for="option in sortOptions"
        :key="option.key"
        class="rounded border px-2 py-2 text-xs"
        :class="
          inventoryView.sortKey === option.key
            ? 'border-emerald-400 bg-emerald-950/40 text-emerald-200'
            : 'border-line text-slate-300'
        "
        @click="inventoryView.setSortKey(option.key)"
      >
        {{ option.label }}
        <span v-if="inventoryView.sortKey === option.key">
          {{ inventoryView.sortDirection === 'asc' ? '升' : '降' }}
        </span>
      </button>
    </div>

    <div class="mt-3 grid grid-cols-2 gap-2">
      <label class="flex min-h-11 items-center gap-2 rounded border border-line px-2 py-2 text-xs text-slate-300">
        <input
          type="checkbox"
          :checked="inventoryView.onlyUpgrades"
          @change="inventoryView.setOnlyUpgrades(($event.target as HTMLInputElement).checked)"
        />
        只看更优
      </label>
      <label class="flex min-h-11 items-center gap-2 rounded border border-line px-2 py-2 text-xs text-slate-300">
        <input
          type="checkbox"
          :checked="inventoryView.hideLocked"
          @change="inventoryView.setHideLocked(($event.target as HTMLInputElement).checked)"
        />
        隐藏锁定
      </label>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useInventoryViewStore } from '@/stores/inventoryView';
import type { InventorySortKey } from '@/types/item';

defineProps<{
  visibleCount: number;
  totalCount: number;
}>();

const inventoryView = useInventoryViewStore();

const sortOptions: Array<{ key: InventorySortKey; label: string }> = [
  { key: 'score', label: '评分' },
  { key: 'rarity', label: '品质' },
  { key: 'slot', label: '部位' },
  { key: 'itemLevel', label: '等级' },
];
</script>
