<template>
  <div
    v-if="report"
    class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
    role="dialog"
    aria-modal="true"
    aria-label="离线收益报告"
  >
    <section class="w-full max-w-2xl rounded border border-amber-500/40 bg-panel p-5 shadow-2xl shadow-black/60">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p class="text-xs uppercase text-amber-300">离线报告</p>
          <h2 class="text-2xl font-semibold text-slate-100">欢迎回来</h2>
          <p class="mt-1 text-sm text-slate-400">你离线了 {{ formatDuration(report.totalSeconds) }}</p>
        </div>

        <div class="grid h-24 w-24 place-items-center rounded border border-amber-500/50 bg-amber-500/10 text-4xl">
          箱
        </div>
      </div>

      <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded border border-line bg-ink p-3">
          <p class="text-sm text-slate-500">击杀</p>
          <p class="text-xl font-semibold">{{ report.monstersKilled }}</p>
        </div>
        <div class="rounded border border-line bg-ink p-3">
          <p class="text-sm text-slate-500">金币</p>
          <p class="text-xl font-semibold text-amber-300">{{ formatNumber(report.gold) }}</p>
        </div>
        <div class="rounded border border-line bg-ink p-3">
          <p class="text-sm text-slate-500">经验</p>
          <p class="text-xl font-semibold text-sky-300">{{ formatNumber(report.exp) }}</p>
        </div>
        <div class="rounded border border-line bg-ink p-3">
          <p class="text-sm text-slate-500">装备</p>
          <p class="text-xl font-semibold text-emerald-300">{{ report.items.length }}</p>
        </div>
      </div>

      <div class="mt-4 rounded border border-line bg-ink p-3 text-sm text-slate-300">
        <p>实际收益时间：{{ formatDuration(report.actualSeconds) }}</p>
        <p>收益倍率：{{ Math.round(report.rewardMultiplier * 100) }}%</p>
        <p v-if="report.wasInterrupted" class="mt-2 text-amber-200">
          背包空间不足，离线收益已提前截断，未拾取装备 {{ report.rejectedItems }} 件。
        </p>
        <p v-if="report.filteredItems.length > 0" class="mt-2 text-cyan-200">
          拾取过滤自动转化 {{ report.filteredItems.length }} 件装备。
        </p>
      </div>

      <div v-if="report.items.length > 0" class="mt-4 max-h-48 space-y-2 overflow-y-auto pr-1">
        <article
          v-for="item in report.items"
          :key="item.id"
          class="rounded border bg-ink px-3 py-2 text-sm"
          :class="rarityClass(item.rarity)"
        >
          <div class="flex items-center justify-between gap-3">
            <span class="truncate font-semibold">{{ item.name }}</span>
            <span class="text-xs text-slate-500">iLv {{ item.itemLevel }}</span>
          </div>
        </article>
      </div>

      <div class="mt-5 flex justify-end gap-2">
        <button
          class="rounded border border-line px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
          @click="dismiss"
        >
          稍后查看
        </button>
        <button
          class="rounded bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400"
          @click="claim"
        >
          领取奖励
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useOfflineStore } from '@/stores/offline';
import { formatDuration, formatNumber, rarityClass } from '@/utils/format';

const offline = useOfflineStore();
const report = computed(() => offline.pendingReport);

function claim() {
  offline.claimPendingReport();
}

function dismiss() {
  offline.dismissPendingReport();
}
</script>
