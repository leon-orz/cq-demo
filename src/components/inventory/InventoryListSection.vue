<template>
  <section>
    <InventoryToolbar :total-count="totalCount" :visible-count="items.length" />
    <ItemGrid :empty-text="emptyText" :items="items" :show-reset="showReset" @reset-filter="$emit('resetFilter')" />
    <InventoryFilterPanel v-if="isFilterPanelOpen" />
  </section>
</template>

<script setup lang="ts">
import InventoryFilterPanel from '@/components/inventory/InventoryFilterPanel.vue';
import InventoryToolbar from '@/components/inventory/InventoryToolbar.vue';
import ItemGrid from '@/components/inventory/ItemGrid.vue';
import type { Item } from '@/types/item';

defineProps<{
  totalCount: number;
  items: Item[];
  emptyText: string;
  showReset: boolean;
  isFilterPanelOpen: boolean;
}>();

defineEmits<{
  resetFilter: [];
}>();
</script>
