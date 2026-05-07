<template>
  <div class="grid grid-cols-1 gap-2">
    <ItemSlot v-for="item in items" :key="item.id" :item="item" />
    <div
      v-if="items.length === 0"
      class="rounded border border-dashed border-line p-6 text-center text-sm text-slate-500"
    >
      背包为空，挑战怪物获取装备。
    </div>
  </div>
</template>

<script setup lang="ts">
import ItemSlot from '@/components/inventory/ItemSlot.vue';
import type { Item } from '@/types/item';

defineProps<{
  items: Item[];
}>();
</script>
