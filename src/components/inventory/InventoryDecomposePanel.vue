<template>
  <div class="mb-4 flex items-center justify-between gap-3">
    <div>
      <p class="text-xs uppercase text-slate-500">背包</p>
      <h2 class="text-xl font-semibold">{{ usedSlots }}/{{ capacity }}</h2>
      <p class="text-xs text-slate-500">剩余 {{ remainingSlots }} 格</p>
    </div>
    <div class="text-right">
      <button
        class="rounded border border-line bg-ink px-3 py-2 text-sm text-slate-200 hover:border-slate-500"
        @click="$emit('requestDecompose')"
      >
        分解低品
      </button>
      <p class="mt-1 text-xs text-slate-500">预计 {{ preview.materials }} 强化石</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DecomposePreview } from '@/stores/inventory';

defineProps<{
  usedSlots: number;
  capacity: number;
  remainingSlots: number;
  preview: DecomposePreview;
}>();

defineEmits<{
  requestDecompose: [];
}>();
</script>
