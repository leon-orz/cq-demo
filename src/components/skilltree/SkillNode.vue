<template>
  <article class="rounded border border-line bg-slate-950 p-3 text-sm">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h4 class="font-semibold text-slate-100">{{ node.name }}</h4>
        <p class="mt-1 text-xs text-slate-500">{{ node.description }}</p>
      </div>
      <span
        class="shrink-0 rounded border px-2 py-0.5 text-xs"
        :class="node.active ? 'border-emerald-400 text-emerald-200' : 'border-line text-slate-500'"
      >
        {{ node.active ? '已激活' : statText }}
      </span>
    </div>
    <button
      class="mt-3 w-full rounded border px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45"
      :class="
        node.active
          ? 'border-emerald-400 bg-emerald-500/10 text-emerald-200'
          : 'border-amber-500 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'
      "
      :disabled="node.active || !canActivate"
      @click="$emit('activate', node.id)"
    >
      {{ node.active ? '已生效' : canActivate ? '激活' : '点数不足' }}
    </button>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { SkillNode } from '@/types/player';

const props = defineProps<{
  node: SkillNode;
  canActivate: boolean;
}>();

defineEmits<{
  activate: [nodeId: string];
}>();

const statText = computed(() => {
  const sign = props.node.value > 0 ? '+' : '';
  return `${sign}${props.node.value}`;
});
</script>
