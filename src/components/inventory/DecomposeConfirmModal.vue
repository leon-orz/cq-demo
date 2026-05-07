<template>
  <div
    class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
    role="dialog"
    aria-modal="true"
    aria-label="分解确认"
  >
    <section class="w-full max-w-2xl rounded border border-amber-500/40 bg-panel p-5 shadow-2xl shadow-black/60">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs uppercase text-amber-300">分解确认</p>
          <h2 class="text-xl font-semibold text-slate-100">确认分解低品质装备</h2>
          <p class="mt-1 text-sm text-slate-400">
            将分解 {{ preview.candidates.length }} 件，获得 {{ preview.materials }} 个强化石；已保护
            {{ preview.protectedItems.length }} 件。
          </p>
        </div>
        <button
          class="rounded border border-line px-3 py-1 text-sm text-slate-300 hover:border-slate-500"
          @click="$emit('close')"
        >
          关闭
        </button>
      </div>

      <div class="mt-4 grid gap-3 md:grid-cols-2">
        <div class="rounded border border-red-500/40 bg-red-500/10 p-3">
          <h3 class="mb-2 text-sm font-semibold text-red-200">将被分解</h3>
          <div class="max-h-56 space-y-2 overflow-y-auto">
            <p v-if="preview.candidates.length === 0" class="text-sm text-slate-500">没有可分解装备。</p>
            <p
              v-for="item in preview.candidates"
              :key="item.id"
              class="truncate rounded bg-ink px-2 py-1 text-sm text-slate-300"
            >
              {{ item.name }}
            </p>
          </div>
        </div>
        <div class="rounded border border-emerald-500/40 bg-emerald-500/10 p-3">
          <h3 class="mb-2 text-sm font-semibold text-emerald-200">已保护</h3>
          <div class="max-h-56 space-y-2 overflow-y-auto">
            <p v-if="preview.protectedItems.length === 0" class="text-sm text-slate-500">没有被保护的低品质装备。</p>
            <p
              v-for="protectedItem in preview.protectedItems"
              :key="protectedItem.item.id"
              class="flex items-center justify-between gap-3 rounded bg-ink px-2 py-1 text-sm text-slate-300"
            >
              <span class="truncate">{{ protectedItem.item.name }}</span>
              <span class="shrink-0 text-xs text-emerald-300">{{ protectedItem.reason }}</span>
            </p>
          </div>
        </div>
      </div>

      <div class="mt-5 flex justify-end gap-2">
        <button
          class="rounded border border-line px-4 py-2 text-sm text-slate-300 hover:border-slate-500"
          @click="$emit('close')"
        >
          取消
        </button>
        <button
          class="rounded bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="preview.candidates.length === 0"
          @click="$emit('confirm')"
        >
          确认分解
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { DecomposePreview } from '@/stores/inventory';

defineProps<{
  preview: DecomposePreview;
}>();

defineEmits<{
  close: [];
  confirm: [];
}>();
</script>
