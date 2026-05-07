<template>
  <section class="rounded border border-line bg-panel p-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-xs uppercase text-slate-500">当前战斗</p>
        <h2 class="text-2xl font-semibold">{{ combat.stageConfig.name }}</h2>
        <p class="text-sm text-slate-400">
          推荐战力 {{ combat.stageConfig.recommendedPower }} · 已解锁 {{ combat.highestUnlockedStage }} 层
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          class="rounded border border-amber-500 bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="inventory.isFull"
          @click="combat.runSingleCombat()"
        >
          挑战一次
        </button>
        <button
          class="rounded border px-4 py-2 text-sm font-semibold"
          :class="
            combat.isAutoFighting
              ? 'border-red-400 bg-red-500/20 text-red-200 hover:bg-red-500/30'
              : 'border-emerald-400 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
          "
          @click="combat.toggleAutoFighting()"
        >
          {{ combat.isAutoFighting ? '停止挂机' : '自动挂机' }}
        </button>
      </div>
    </div>

    <div class="mt-5 grid gap-3 lg:grid-cols-[1fr_220px]">
      <div class="relative overflow-hidden rounded border border-line bg-ink p-4">
        <div class="absolute inset-0 opacity-30">
          <div class="h-full w-full bg-[radial-gradient(circle_at_center,#f59e0b22,transparent_55%)]"></div>
        </div>
        <div class="relative flex min-h-48 flex-col items-center justify-center">
          <div
            class="grid h-24 w-24 place-items-center rounded-full border text-4xl shadow-lg"
            :class="
              combat.isAutoFighting
                ? 'border-emerald-400 bg-emerald-500/10 shadow-emerald-900/50'
                : 'border-line bg-slate-950'
            "
            aria-label="怪物占位图"
          >
            魔
          </div>
          <h3 class="mt-4 text-lg font-semibold">{{ monster.name }}</h3>
          <p class="text-sm text-slate-500">
            {{ combat.isAutoFighting ? '自动战斗中' : '等待挑战' }}
          </p>
        </div>
      </div>

      <div class="rounded border border-line bg-ink p-4">
        <p class="text-sm text-slate-500">怪物</p>
        <h3 class="text-lg font-semibold">{{ monster.name }}</h3>
        <div class="mt-3 grid grid-cols-3 gap-2 text-sm lg:grid-cols-1">
          <div>
            <p class="text-slate-500">生命</p>
            <p>{{ monster.hp }}</p>
          </div>
          <div>
            <p class="text-slate-500">攻击</p>
            <p>{{ monster.attack }}</p>
          </div>
          <div>
            <p class="text-slate-500">等级</p>
            <p>{{ monster.level }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-3 grid gap-3 md:grid-cols-3">
      <div class="rounded border border-line bg-ink p-3 text-sm">
        <p class="text-slate-500">当前战力</p>
        <p class="text-lg font-semibold text-sky-300">{{ combat.playerPower || '待计算' }}</p>
      </div>
      <div class="rounded border border-line bg-ink p-3 text-sm">
        <p class="text-slate-500">收益倍率</p>
        <p class="text-lg font-semibold" :class="combat.isRewardDecayed ? 'text-amber-300' : 'text-emerald-300'">
          {{ Math.round(combat.lastRewardMultiplier * 100) }}%
        </p>
      </div>
      <div class="rounded border border-line bg-ink p-3 text-sm">
        <p class="text-slate-500">挂机次数</p>
        <p class="text-lg font-semibold text-slate-100">{{ combat.totalAutoRuns }}</p>
      </div>
    </div>

    <div
      v-if="inventory.isFull || combat.stoppedReason"
      class="mt-3 rounded border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
    >
      {{ inventory.isFull ? '背包已满，请先分解或穿戴装备。' : combat.stoppedReason }}
    </div>

    <BattleLog class="mt-5" :logs="combat.logs" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BattleLog from '@/components/combat/BattleLog.vue';
import { useCombatStore } from '@/stores/combat';
import { useInventoryStore } from '@/stores/inventory';

const combat = useCombatStore();
const inventory = useInventoryStore();
const monster = computed(() => combat.stageConfig.monsters[0]!);
</script>
