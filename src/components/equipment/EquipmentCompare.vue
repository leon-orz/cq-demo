<script setup lang="ts">
import { computed } from 'vue';
import type { EquipmentComparison, EquipmentItem, Player } from '@/types';
import { ScoreMode } from '@/types/enums';
import { GearScore } from '@/core/GearScore';
import EquipmentCard from './EquipmentCard.vue';
import { formatNumber } from '@/utils/format';

const props = defineProps<{
  newItem: EquipmentItem;
  equippedItem: EquipmentItem | null;
  player: Player;
  scoreMode: ScoreMode;
}>();

const emit = defineEmits<{
  equip: [item: EquipmentItem];
  cancel: [];
}>();

const isSelectedEquipped = computed(() => props.equippedItem?.id === props.newItem.id);

const comparison = computed<EquipmentComparison>(() => {
  if (isSelectedEquipped.value) {
    return {
      slot: props.newItem.slot,
      dpsDiff: 0,
      ehpDiff: 0,
      scoreDiff: 0,
      isBetter: false,
    };
  }
  return GearScore.compareEquipment(props.newItem, props.equippedItem, props.player, props.scoreMode);
});
</script>

<template>
  <section class="panel rounded-lg p-4">
    <div class="mb-3 flex items-center justify-between gap-3">
      <h2 class="text-sm font-semibold text-zinc-100">装备对比</h2>
      <button
        class="rounded border border-zinc-600 px-2 py-1 text-xs text-zinc-300"
        type="button"
        @click="emit('cancel')"
      >
        关闭
      </button>
    </div>

    <div class="grid gap-3 md:grid-cols-2">
      <div>
        <p class="mb-2 text-xs text-zinc-400">当前装备</p>
        <EquipmentCard v-if="equippedItem" :item="equippedItem" :player="player" :score-mode="scoreMode" equipped />
        <div v-else class="rounded-lg border border-dashed border-zinc-700 p-4 text-sm text-zinc-500">该部位未装备</div>
      </div>
      <div>
        <p class="mb-2 text-xs text-zinc-400">候选装备</p>
        <EquipmentCard :item="newItem" :player="player" :score-mode="scoreMode" selected />
      </div>
    </div>

    <div class="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
      <div class="rounded border border-zinc-700 p-2">
        <div class="text-zinc-400">DPS</div>
        <div :class="comparison.dpsDiff >= 0 ? 'text-emerald-300' : 'text-red-300'">
          {{ comparison.dpsDiff >= 0 ? '+' : '' }}{{ formatNumber(comparison.dpsDiff) }}
        </div>
      </div>
      <div class="rounded border border-zinc-700 p-2">
        <div class="text-zinc-400">EHP</div>
        <div :class="comparison.ehpDiff >= 0 ? 'text-emerald-300' : 'text-red-300'">
          {{ comparison.ehpDiff >= 0 ? '+' : '' }}{{ formatNumber(comparison.ehpDiff) }}
        </div>
      </div>
      <div class="rounded border border-zinc-700 p-2">
        <div class="text-zinc-400">评分</div>
        <div :class="comparison.scoreDiff >= 0 ? 'text-emerald-300' : 'text-red-300'">
          {{ comparison.scoreDiff >= 0 ? '+' : '' }}{{ formatNumber(comparison.scoreDiff) }}
        </div>
      </div>
    </div>

    <button
      v-if="!isSelectedEquipped"
      class="mt-4 w-full rounded bg-ember px-3 py-2 text-sm font-semibold text-zinc-950"
      type="button"
      @click="emit('equip', newItem)"
    >
      替换装备
    </button>
    <p v-else class="mt-4 rounded border border-emerald-400/40 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-100">
      该装备已穿戴在当前部位
    </p>
  </section>
</template>
