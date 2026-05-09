<template>
  <div class="mb-4 grid grid-cols-3 gap-2 text-sm">
    <div class="rounded border border-line bg-ink p-3">
      <p class="text-slate-500">金币</p>
      <p class="text-lg font-semibold text-amber-300">{{ formatNumber(gold) }}</p>
    </div>
    <div class="rounded border border-line bg-ink p-3">
      <p class="text-slate-500">强化石</p>
      <p class="text-lg font-semibold text-cyan-300">{{ enhancementStones }}</p>
    </div>
    <div class="rounded border border-line bg-ink p-3">
      <p class="text-slate-500">丢失</p>
      <p class="text-lg font-semibold text-red-300">{{ lostDrops }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatNumber } from '@/utils/format';

defineProps<{
  gold: number;
  enhancementStones: number;
  lostDrops: number;
}>();
</script>
