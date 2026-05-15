<script setup lang="ts">
import type { EquipmentItem, Player } from '@/types';
import { GearScore } from '@/core/GearScore';
import { ScoreMode } from '@/types/enums';
import { formatAffix, formatNumber, formatStatValue, getStatLabel, rarityLabel, slotLabel } from '@/utils/format';

const props = withDefaults(
  defineProps<{
    item: EquipmentItem;
    player?: Player;
    scoreMode?: ScoreMode;
    equipped?: boolean;
    selected?: boolean;
  }>(),
  {
    scoreMode: ScoreMode.BALANCED,
    equipped: false,
    selected: false,
  },
);

const emit = defineEmits<{
  equip: [item: EquipmentItem];
  disenchant: [item: EquipmentItem];
  lock: [item: EquipmentItem];
  click: [item: EquipmentItem];
}>();

const rarityClass: Record<EquipmentItem['rarity'], string> = {
  normal: 'border-zinc-400 text-zinc-100',
  magic: 'border-sky-400 text-sky-200',
  rare: 'border-amber-300 text-amber-200',
  legendary: 'border-orange-400 text-orange-200',
  ancient: 'border-red-500 text-red-200',
};
</script>

<template>
  <article
    class="rounded-lg border bg-zinc-950/45 p-3 transition hover:bg-zinc-900/70"
    :class="[rarityClass[item.rarity], selected ? 'ring-2 ring-ember/80' : '']"
    @click="emit('click', item)"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="truncate text-sm font-semibold">{{ item.name }}</h3>
          <span v-if="item.enhanceLevel > 0" class="text-xs font-semibold text-amber-300"
            >+{{ item.enhanceLevel }}</span
          >
          <span v-if="equipped" class="rounded border border-emerald-400/40 px-1.5 py-0.5 text-[11px] text-emerald-200"
            >已装备</span
          >
          <span v-if="item.locked" class="text-xs text-zinc-300" title="已锁定">锁</span>
        </div>
        <p class="mt-1 text-xs text-zinc-400">
          {{ rarityLabel(item.rarity) }} · {{ slotLabel(item.slot) }} · Lv.{{ item.itemLevel }}
        </p>
      </div>
      <div v-if="player" class="shrink-0 text-right text-xs text-zinc-300">
        评分
        <div class="text-sm font-semibold text-zinc-50">
          {{ formatNumber(GearScore.scoreEquipment(item, player, scoreMode)) }}
        </div>
      </div>
    </div>

    <dl class="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-zinc-300">
      <template v-for="(value, stat) in item.baseStats" :key="stat">
        <dt>{{ getStatLabel(stat as keyof Player) }}</dt>
        <dd class="text-right text-zinc-100">+{{ formatStatValue(stat as keyof Player, Number(value)) }}</dd>
      </template>
    </dl>

    <ul class="mt-3 space-y-1 text-xs text-emerald-200">
      <li v-for="affix in item.affixes" :key="`${item.id}-${affix.type}`">{{ formatAffix(affix) }}</li>
    </ul>

    <div class="mt-3 flex gap-2">
      <button
        class="rounded bg-ember px-2.5 py-1 text-xs font-semibold text-zinc-950"
        type="button"
        @click.stop="emit('equip', item)"
      >
        穿戴
      </button>
      <button
        class="rounded border border-zinc-600 px-2.5 py-1 text-xs text-zinc-200"
        type="button"
        :disabled="item.locked || equipped"
        @click.stop="emit('disenchant', item)"
      >
        分解
      </button>
      <button
        class="rounded border border-zinc-600 px-2.5 py-1 text-xs text-zinc-200"
        type="button"
        @click.stop="emit('lock', item)"
      >
        {{ item.locked ? '解锁' : '锁定' }}
      </button>
    </div>
  </article>
</template>
