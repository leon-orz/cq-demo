<template>
  <aside class="rounded border border-line bg-panel p-4">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div>
        <p class="text-xs uppercase text-slate-500">背包</p>
        <h2 class="text-xl font-semibold">{{ inventory.usedSlots }}/{{ inventory.capacity }}</h2>
        <p class="text-xs text-slate-500">剩余 {{ inventory.remainingSlots }} 格</p>
      </div>
      <div class="text-right">
        <button
          class="rounded border border-line bg-ink px-3 py-2 text-sm text-slate-200 hover:border-slate-500"
          @click="showDecomposeConfirm = true"
        >
          分解低品
        </button>
        <p class="mt-1 text-xs text-slate-500">预计 {{ decomposePreview.materials }} 强化石</p>
      </div>
    </div>

    <div class="mb-4 grid grid-cols-3 gap-2 text-sm">
      <div class="rounded border border-line bg-ink p-3">
        <p class="text-slate-500">金币</p>
        <p class="text-lg font-semibold text-amber-300">{{ formatNumber(inventory.gold) }}</p>
      </div>
      <div class="rounded border border-line bg-ink p-3">
        <p class="text-slate-500">强化石</p>
        <p class="text-lg font-semibold text-cyan-300">{{ inventory.enhancementStones }}</p>
      </div>
      <div class="rounded border border-line bg-ink p-3">
        <p class="text-slate-500">丢失</p>
        <p class="text-lg font-semibold text-red-300">{{ inventory.lostDrops }}</p>
      </div>
    </div>

    <section class="mb-4 rounded border border-line bg-ink p-3 text-sm">
      <div class="mb-3 flex items-center justify-between gap-3">
        <h3 class="font-semibold text-slate-200">拾取过滤</h3>
        <span class="text-xs text-slate-500">自动转化 {{ inventory.autoConvertedDrops }}</span>
      </div>
      <label class="block text-xs text-slate-500" for="min-rarity">最低品质</label>
      <div class="mb-2 mt-2 grid grid-cols-3 gap-1">
        <button
          class="rounded border border-line px-2 py-1 text-xs text-slate-300"
          @click="settings.applyLootFilterPreset('loose')"
        >
          宽松
        </button>
        <button
          class="rounded border border-line px-2 py-1 text-xs text-slate-300"
          @click="settings.applyLootFilterPreset('magicPlus')"
        >
          魔法+
        </button>
        <button
          class="rounded border border-line px-2 py-1 text-xs text-slate-300"
          @click="settings.applyLootFilterPreset('rarePlus')"
        >
          稀有+
        </button>
      </div>
      <select
        id="min-rarity"
        class="mt-1 w-full rounded border border-line bg-panel px-2 py-2 text-sm text-slate-100"
        :value="settings.lootFilter.minRarity"
        @change="settings.setMinRarity(($event.target as HTMLSelectElement).value as Rarity)"
      >
        <option value="normal">普通</option>
        <option value="magic">魔法</option>
        <option value="rare">稀有</option>
        <option value="legendary">传说</option>
      </select>
      <div class="mt-3 space-y-2">
        <label class="flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            :checked="settings.lootFilter.autoConvertRejected"
            @change="settings.setAutoConvertRejected(($event.target as HTMLInputElement).checked)"
          />
          未通过过滤的装备自动转化为强化石
        </label>
        <label class="flex items-center gap-2 text-xs text-slate-300">
          <input v-model="settings.protectRareAndAbove" type="checkbox" />
          分解时保护稀有及以上装备
        </label>
        <label class="flex items-center gap-2 text-xs text-slate-300">
          <input v-model="settings.protectBetterItems" type="checkbox" />
          分解时保护评分更优装备
        </label>
      </div>
      <p class="mt-3 text-xs text-slate-500">
        分解候选 {{ decomposePreview.candidates.length }} 件，已保护 {{ decomposePreview.protectedItems.length }} 件。
      </p>
    </section>

    <InventoryToolbar :total-count="inventory.items.length" :visible-count="visibleItems.length" />
    <ItemGrid
      :empty-text="emptyText"
      :items="visibleItems"
      :show-reset="inventory.items.length > 0 && inventoryView.hasActiveFilter"
      @reset-filter="inventoryView.resetViewFilter"
    />
    <InventoryFilterPanel v-if="inventoryView.isFilterPanelOpen" />
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
import InventoryFilterPanel from '@/components/inventory/InventoryFilterPanel.vue';
import InventoryToolbar from '@/components/inventory/InventoryToolbar.vue';
import ItemGrid from '@/components/inventory/ItemGrid.vue';
import { getInventoryViewItems } from '@/core/item/inventoryView';
import { useInventoryStore } from '@/stores/inventory';
import { useInventoryViewStore } from '@/stores/inventoryView';
import { usePlayerStore } from '@/stores/player';
import { useSettingsStore } from '@/stores/settings';
import type { Rarity } from '@/types/item';
import { formatNumber } from '@/utils/format';

const inventory = useInventoryStore();
const inventoryView = useInventoryViewStore();
const player = usePlayerStore();
const settings = useSettingsStore();
const showDecomposeConfirm = ref(false);
const decomposePreview = computed(() => inventory.previewDecomposeLowRarity());
const visibleItems = computed(() => getInventoryViewItems(inventory.items, inventoryView.filter, player.equipped));
const emptyText = computed(() => {
  if (inventory.items.length === 0) return '背包为空，挑战怪物获取装备。';
  return '没有符合当前筛选条件的装备。';
});

function confirmDecompose() {
  if (decomposePreview.value.candidates.length === 0) return;
  inventory.decomposeLowRarity();
  showDecomposeConfirm.value = false;
}
</script>
