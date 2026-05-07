<template>
  <section class="rounded border border-line bg-ink p-3">
    <div class="mb-2 flex items-center justify-between">
      <h3 class="text-sm font-semibold text-slate-300">战斗日志</h3>
      <span class="text-xs text-slate-600">{{ logs.length }}</span>
    </div>
    <div class="h-72 space-y-2 overflow-y-auto pr-1 text-sm">
      <p v-if="logs.length === 0" class="text-slate-500">尚未开始战斗。</p>
      <p v-for="log in [...logs].reverse()" :key="log.id" class="rounded bg-slate-950 px-3 py-2 text-slate-300">
        {{ log.message }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  logs: Array<{ id: number; message: string }>;
}>();
</script>
