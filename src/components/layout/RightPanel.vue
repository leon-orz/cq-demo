<template>
  <aside class="rounded border border-line bg-panel p-4">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div>
        <p class="text-xs uppercase text-slate-500">背包</p>
        <h2 class="text-xl font-semibold">{{ inventory.usedSlots }}/{{ inventory.capacity }}</h2>
        <p class="text-xs text-slate-500">剩余 {{ inventory.remainingSlots }} 格</p>
      </div>
      <button
        class="rounded border border-line bg-ink px-3 py-2 text-sm text-slate-200 hover:border-slate-500"
        @click="inventory.decomposeLowRarity()"
      >
        分解低品
      </button>
    </div>

    <div class="mb-4 grid grid-cols-3 gap-2 text-sm">
      <div class="rounded border border-line bg-ink p-3">
        <p class="text-slate-500">金币</p>
        <p class="text-lg font-semibold text-amber-300">{{ formatNumber(inventory.gold) }}</p>
      </div>
      <div class="rounded border border-line bg-ink p-3">
        <p class="text-slate-500">强化石</p>
        <p class="text-lg font-semibold text-cyan-300">{{ inventory.enhancementStones }}</p>
      </div>
      <div class="rounded border border-line bg-ink p-3">
        <p class="text-slate-500">丢失</p>
        <p class="text-lg font-semibold text-red-300">{{ inventory.lostDrops }}</p>
      </div>
    </div>

    <ItemGrid :items="inventory.items" />
  </aside>
</template>

<script setup lang="ts">
import ItemGrid from '@/components/inventory/ItemGrid.vue';
import { useInventoryStore } from '@/stores/inventory';
import { formatNumber } from '@/utils/format';

const inventory = useInventoryStore();
</script>
