<template>
  <aside class="rounded border border-line bg-panel p-4">
    <div class="mb-4">
      <p class="text-xs uppercase text-slate-500">角色</p>
      <h1 class="text-xl font-semibold text-slate-100">{{ player.name }}</h1>
      <p class="text-sm text-slate-400">等级 {{ player.level }} · 经验 {{ player.exp }}/{{ player.expToNext }}</p>
    </div>

    <div class="grid grid-cols-2 gap-2 text-sm">
      <div class="rounded border border-line bg-ink p-3">
        <p class="text-slate-500">DPS</p>
        <p class="text-lg font-semibold text-emerald-300">{{ player.dps }}</p>
      </div>
      <div class="rounded border border-line bg-ink p-3">
        <p class="text-slate-500">EHP</p>
        <p class="text-lg font-semibold text-sky-300">{{ player.ehp }}</p>
      </div>
      <div class="rounded border border-line bg-ink p-3">
        <p class="text-slate-500">生命</p>
        <p class="text-lg font-semibold">{{ player.totalStats.hp }}</p>
      </div>
      <div class="rounded border border-line bg-ink p-3">
        <p class="text-slate-500">评分</p>
        <p class="text-lg font-semibold text-ember">{{ player.gearScore }}</p>
      </div>
    </div>

    <section class="mt-5">
      <h2 class="mb-2 text-sm font-semibold text-slate-300">装备</h2>
      <div class="space-y-2">
        <button
          v-for="slot in slots"
          :key="slot.key"
          class="flex w-full items-center justify-between rounded border border-line bg-ink px-3 py-2 text-left text-sm"
          @click="player.unequipItem(slot.key)"
        >
          <span class="text-slate-500">{{ slot.label }}</span>
          <span class="truncate pl-3 text-slate-200">{{ player.equipped[slot.key]?.name ?? '空' }}</span>
        </button>
      </div>
    </section>
  </aside>
</template>

<script setup lang="ts">
import { usePlayerStore } from '@/stores/player';
import type { EquipmentSlot } from '@/types/item';

const player = usePlayerStore();

const slots: Array<{ key: EquipmentSlot; label: string }> = [
  { key: 'weapon', label: '武器' },
  { key: 'offhand', label: '副手' },
  { key: 'helmet', label: '头盔' },
  { key: 'armor', label: '护甲' },
  { key: 'gloves', label: '手套' },
  { key: 'shoes', label: '鞋子' },
  { key: 'ring1', label: '戒指 1' },
  { key: 'ring2', label: '戒指 2' },
  { key: 'necklace', label: '项链' },
];
</script>
