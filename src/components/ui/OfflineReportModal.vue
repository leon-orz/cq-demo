<script setup lang="ts">
import type { OfflineReport } from '@/types';
import { Rarity } from '@/types/enums';
import { RARITY_LABELS } from '@/utils/constants';
import { formatDuration, formatNumber, formatPercent } from '@/utils/format';

defineProps<{
  report: OfflineReport;
}>();

const emit = defineEmits<{
  claim: [];
}>();

const rarities = [Rarity.NORMAL, Rarity.MAGIC, Rarity.RARE, Rarity.LEGENDARY, Rarity.ANCIENT];
</script>

<template>
  <div class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
    <section class="panel w-full max-w-lg rounded-lg p-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold text-zinc-100">离线收益</h2>
          <p class="mt-1 text-sm text-zinc-400">{{ report.message }}</p>
        </div>
        <span class="rounded border border-emerald-400/40 px-2 py-1 text-xs text-emerald-200">
          {{ formatPercent(report.effectiveMultiplier) }}
        </span>
      </div>

      <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div class="rounded border border-zinc-700 p-3">
          <div class="text-zinc-500">离线时长</div>
          <div class="font-semibold">{{ formatDuration(report.offlineSeconds) }}</div>
        </div>
        <div class="rounded border border-zinc-700 p-3">
          <div class="text-zinc-500">有效时长</div>
          <div class="font-semibold">{{ formatDuration(report.adjustedSeconds) }}</div>
        </div>
        <div class="rounded border border-zinc-700 p-3">
          <div class="text-zinc-500">击杀</div>
          <div class="font-semibold">{{ formatNumber(report.totalKills) }}</div>
        </div>
        <div class="rounded border border-zinc-700 p-3">
          <div class="text-zinc-500">金币 / 经验</div>
          <div class="font-semibold">{{ formatNumber(report.totalGold) }} / {{ formatNumber(report.totalExp) }}</div>
        </div>
      </div>

      <div class="mt-4 rounded border border-zinc-700 p-3">
        <h3 class="text-sm font-semibold text-zinc-200">装备掉落</h3>
        <div class="mt-2 grid grid-cols-5 gap-2 text-center text-xs">
          <div v-for="rarity in rarities" :key="rarity" class="rounded bg-zinc-950/70 p-2">
            <div class="text-zinc-500">{{ RARITY_LABELS[rarity] }}</div>
            <div class="text-zinc-100">{{ report.qualityCounts[rarity] }}</div>
          </div>
        </div>
      </div>

      <button
        class="mt-5 w-full rounded bg-ember px-4 py-2 text-sm font-semibold text-zinc-950"
        type="button"
        @click="emit('claim')"
      >
        领取全部
      </button>
    </section>
  </div>
</template>
