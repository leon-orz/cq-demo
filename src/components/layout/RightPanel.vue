<template>
  <aside class="rounded border border-line bg-panel p-4">
    <InventoryDecomposePanel
      :capacity="inventory.capacity"
      :preview="decomposePreview"
      :remaining-slots="inventory.remainingSlots"
      :pressure-level="inventory.pressureLevel"
      :pressure-text="inventory.pressureText"
      :suggested-cleanup-count="inventory.suggestedCleanupCount"
      :used-slots="inventory.usedSlots"
      @request-decompose="showDecomposeConfirm = true"
    />
    <InventoryResourceSummary
      :enhancement-stones="inventory.enhancementStones"
      :gold="inventory.gold"
      :lost-drops="inventory.lostDrops"
    />
    <SaveManagementPanel />
    <LootFilterSettings
      :auto-convert-rejected="settings.lootFilter.autoConvertRejected"
      :auto-converted-drops="inventory.autoConvertedDrops"
      :candidate-count="decomposePreview.candidates.length"
      :min-rarity="settings.lootFilter.minRarity"
      :protect-better-items="settings.protectBetterItems"
      :protect-rare-and-above="settings.protectRareAndAbove"
      :protected-count="decomposePreview.protectedItems.length"
      :score-mode-label="settings.itemScoreModeLabel"
      @apply-preset="settings.applyLootFilterPreset"
      @set-auto-convert-rejected="settings.setAutoConvertRejected"
      @set-min-rarity="settings.setMinRarity"
      @update:protect-better-items="settings.protectBetterItems = $event"
      @update:protect-rare-and-above="settings.protectRareAndAbove = $event"
    />
    <InventoryListSection
      :empty-text="emptyText"
      :is-filter-panel-open="inventoryView.isFilterPanelOpen"
      :items="visibleItems"
      :show-reset="showReset"
      :total-count="inventory.items.length"
      @reset-filter="inventoryView.resetViewFilter"
    />
    <DecomposeConfirmModal
      v-if="showDecomposeConfirm"
      :preview="decomposePreview"
      @close="showDecomposeConfirm = false"
      @confirm="confirmDecompose"
    />
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import DecomposeConfirmModal from '@/components/inventory/DecomposeConfirmModal.vue';
import InventoryDecomposePanel from '@/components/inventory/InventoryDecomposePanel.vue';
import InventoryListSection from '@/components/inventory/InventoryListSection.vue';
import InventoryResourceSummary from '@/components/inventory/InventoryResourceSummary.vue';
import LootFilterSettings from '@/components/inventory/LootFilterSettings.vue';
import SaveManagementPanel from '@/components/save/SaveManagementPanel.vue';
import { useInventoryStore } from '@/stores/inventory';
import { useInventoryViewStore } from '@/stores/inventoryView';
import { usePlayerStore } from '@/stores/player';
import { useSettingsStore } from '@/stores/settings';

const inventory = useInventoryStore();
const inventoryView = useInventoryViewStore();
const player = usePlayerStore();
const settings = useSettingsStore();
const showDecomposeConfirm = ref(false);
const decomposePreview = computed(() => inventory.previewDecomposeLowRarity());
const visibleItems = computed(() =>
  inventoryView.visibleItems(inventory.items, player.equipped, settings.itemScoreMode),
);
const emptyText = computed(() => inventoryView.emptyText(inventory.items.length));
const showReset = computed(() => inventoryView.showReset(inventory.items.length));

function confirmDecompose() {
  if (decomposePreview.value.candidates.length === 0) return;
  inventory.decomposeLowRarity();
  showDecomposeConfirm.value = false;
}
</script>
