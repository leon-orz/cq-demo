<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useCombatStore } from '@/stores/combat';
import { usePlayerStore } from '@/stores/player';
import { formatNumber, formatPercent } from '@/utils/format';

const combatStore = useCombatStore();
const playerStore = usePlayerStore();
const targetFloor = ref(combatStore.currentFloor);

const monsterDps = computed(() => combatStore.currentMonster.atk * combatStore.currentMonster.atkSpd);

watch(
  () => combatStore.currentFloor,
  (floor) => {
    targetFloor.value = floor;
  },
);

function applyFloor(): void {
  combatStore.changeFloor(targetFloor.value);
}
</script>

<template>
  <section class="panel rounded-lg p-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="text-base font-semibold text-zinc-100">第 {{ combatStore.currentFloor }} 层</h2>
        <p class="text-sm text-zinc-400">{{ combatStore.currentMonster.name }}</p>
      </div>
      <button
        class="rounded px-4 py-2 text-sm font-semibold"
        :class="combatStore.isAutoCombat ? 'bg-red-500 text-white' : 'bg-ember text-zinc-950'"
        type="button"
        @click="combatStore.isAutoCombat ? combatStore.stopAutoCombat('manual') : combatStore.startAutoCombat()"
      >
        {{ combatStore.isAutoCombat ? '停止挂机' : '开始挂机' }}
      </button>
    </div>

    <div class="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
      <div class="rounded border border-zinc-700 p-3">
        <p class="text-xs text-zinc-500">DPS</p>
        <p class="text-lg font-semibold">{{ formatNumber(playerStore.dps) }}</p>
      </div>
      <div class="rounded border border-zinc-700 p-3">
        <p class="text-xs text-zinc-500">EHP</p>
        <p class="text-lg font-semibold">{{ formatNumber(playerStore.ehp) }}</p>
      </div>
      <div class="rounded border border-zinc-700 p-3">
        <p class="text-xs text-zinc-500">战力</p>
        <p class="text-lg font-semibold">{{ formatNumber(playerStore.power) }}</p>
      </div>
      <div class="rounded border border-zinc-700 p-3">
        <p class="text-xs text-zinc-500">收益</p>
        <p class="text-lg font-semibold">{{ formatPercent(combatStore.rewardMultiplier) }}</p>
      </div>
    </div>

    <div class="mt-4 grid gap-3 md:grid-cols-2">
      <div class="rounded border border-zinc-700 p-3 text-sm">
        <div class="flex justify-between text-zinc-400">
          <span>怪物生命</span>
          <span>{{ formatNumber(combatStore.currentMonster.hp) }}</span>
        </div>
        <div class="mt-2 flex justify-between text-zinc-400">
          <span>怪物DPS</span>
          <span>{{ formatNumber(monsterDps) }}</span>
        </div>
        <div class="mt-2 flex justify-between text-zinc-400">
          <span>推荐战力</span>
          <span>{{ formatNumber(combatStore.recommendedPower) }}</span>
        </div>
      </div>

      <div class="rounded border border-zinc-700 p-3">
        <label class="text-xs text-zinc-400" for="floor-input">目标层数</label>
        <div class="mt-2 flex gap-2">
          <input
            id="floor-input"
            v-model.number="targetFloor"
            class="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
            min="1"
            type="number"
          />
          <button
            class="rounded border border-zinc-600 px-3 py-2 text-sm text-zinc-100"
            type="button"
            @click="applyFloor"
          >
            切换
          </button>
        </div>
        <p class="mt-2 text-xs text-zinc-500">推荐挂机层：{{ combatStore.recommendedFloor }}</p>
      </div>
    </div>

    <div class="mt-4">
      <div class="mb-2 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-zinc-200">战斗日志</h3>
        <span class="text-xs text-zinc-500">击杀 {{ combatStore.killCount }}</span>
      </div>
      <ul class="h-40 space-y-1 overflow-auto rounded border border-zinc-700 bg-zinc-950/50 p-3 text-xs">
        <li v-for="log in combatStore.combatLog.slice(0, 8)" :key="log.id" class="text-zinc-300">{{ log.message }}</li>
        <li v-if="combatStore.combatLog.length === 0" class="text-zinc-500">暂无战斗记录</li>
      </ul>
    </div>
  </section>
</template>
