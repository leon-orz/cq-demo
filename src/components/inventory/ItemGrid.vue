<template>
  <div class="grid grid-cols-1 gap-2">
    <ItemSlot v-for="item in items" :key="item.id" :item="item" />
    <div
      v-if="items.length === 0"
      class="rounded border border-dashed border-line p-6 text-center text-sm text-slate-500"
    >
      <p>{{ emptyText }}</p>
      <button
        v-if="showReset"
        class="mt-3 rounded border border-line px-3 py-2 text-xs text-slate-300 hover:border-slate-500"
        @click="$emit('resetFilter')"
      >
        重置筛选
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import ItemSlot from '@/components/inventory/ItemSlot.vue';
import type { Item } from '@/types/item';

defineProps<{
  items: Item[];
  emptyText?: string;
  showReset?: boolean;
}>();

defineEmits<{
  resetFilter: [];
}>();
</script>
