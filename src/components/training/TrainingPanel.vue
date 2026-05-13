<template>
  <section class="mt-5">
    <button
      class="mb-2 flex w-full items-center justify-between gap-3 text-left"
      :aria-expanded="isExpanded"
      @click="isExpanded = !isExpanded"
    >
      <span>
        <span class="block text-sm font-semibold text-slate-300">训练</span>
        <span class="block text-xs text-slate-500">总等级 {{ player.totalTrainingLevel }}</span>
      </span>
      <span class="text-xs text-slate-500">{{ isExpanded ? '收起' : '展开' }}</span>
    </button>

    <div v-if="isExpanded" class="space-y-2">
      <article
        v-for="preview in player.trainingPreviews"
        :key="preview.definition.id"
        class="rounded border border-line bg-ink p-3 text-sm"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 class="font-semibold text-slate-200">{{ preview.definition.name }}</h3>
            <p class="text-xs text-slate-500">{{ preview.definition.description }}</p>
          </div>
          <span class="shrink-0 text-xs text-slate-500">Lv {{ preview.level }}/{{ preview.definition.maxLevel }}</span>
        </div>
        <div class="mt-2 flex items-center justify-between gap-3">
          <p class="text-xs text-slate-500">+{{ preview.gain }} {{ statLabels[preview.definition.stat] }}</p>
          <button
            class="rounded border border-line px-2 py-1 text-xs text-slate-300 hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-45"
            :disabled="!preview.canAfford"
            @click="player.upgradeTraining(preview.definition.id)"
          >
            {{ preview.isMaxed ? '已满级' : `${preview.cost} 金币` }}
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { usePlayerStore } from '@/stores/player';

const player = usePlayerStore();
player.normalizeTraining();

const isExpanded = ref(false);
const statLabels = {
  attack: '攻击',
  hp: '生命',
  armor: '护甲',
};
</script>
