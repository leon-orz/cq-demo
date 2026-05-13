<template>
  <section
    v-if="feedback.events.length > 0"
    class="pointer-events-none fixed inset-x-3 bottom-3 z-30 max-h-[35vh] space-y-2 overflow-hidden sm:left-auto sm:right-4 sm:w-80"
    aria-label="奖励反馈"
  >
    <article
      v-for="event in feedback.events"
      :key="event.id"
      class="pointer-events-auto rounded border bg-ink p-3 text-sm shadow-xl shadow-black/40"
      :class="eventClass(event.level, event.item?.rarity)"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-xs text-slate-500">{{ kindLabel(event.kind) }}</p>
          <h3 class="truncate font-semibold">{{ event.title }}</h3>
          <p class="mt-1 text-xs text-slate-300">{{ event.message }}</p>
        </div>
        <button
          class="shrink-0 text-xs text-slate-500 hover:text-slate-200"
          @click="feedback.dismissFeedback(event.id)"
        >
          关闭
        </button>
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { useFeedbackStore } from '@/stores/feedback';
import type { RewardFeedbackEvent, RewardFeedbackKind, RewardFeedbackLevel } from '@/types/combat';
import type { Rarity } from '@/types/item';
import { rarityClass } from '@/utils/format';

const feedback = useFeedbackStore();

function kindLabel(kind: RewardFeedbackKind): string {
  const labels: Record<RewardFeedbackKind, string> = {
    item: '掉落',
    stage: '推层',
    offline: '离线',
    inventory: '背包',
    boss: 'Boss',
  };
  return labels[kind];
}

function eventClass(level: RewardFeedbackLevel, rarity?: Rarity): string {
  if (rarity) return rarityClass(rarity);

  const classes: Record<RewardFeedbackEvent['level'], string> = {
    info: 'border-slate-500 text-slate-200',
    success: 'border-emerald-500 text-emerald-200',
    warning: 'border-amber-500 text-amber-200',
    legendary: 'border-orange-500 text-orange-300',
  };
  return classes[level];
}
</script>
