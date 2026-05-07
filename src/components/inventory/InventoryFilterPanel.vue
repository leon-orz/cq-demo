<template>
  <div class="fixed inset-0 z-40 bg-black/60" @click.self="inventoryView.setFilterPanelOpen(false)">
    <section
      class="fixed bottom-0 left-0 right-0 max-h-[82vh] overflow-y-auto rounded-t border border-line bg-panel p-4 shadow-xl sm:left-auto sm:right-4 sm:top-20 sm:w-96 sm:rounded"
    >
      <div class="mb-4 flex items-center justify-between gap-3">
        <div>
          <p class="text-xs uppercase text-slate-500">背包筛选</p>
          <h3 class="text-lg font-semibold text-slate-100">筛选装备视图</h3>
        </div>
        <button
          class="rounded border border-line px-3 py-2 text-sm text-slate-300"
          @click="inventoryView.setFilterPanelOpen(false)"
        >
          关闭
        </button>
      </div>

      <div class="space-y-4 text-sm">
        <section>
          <h4 class="mb-2 font-semibold text-slate-200">品质</h4>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="rarity in rarityOptions"
              :key="rarity.value"
              class="min-h-11 rounded border px-2 py-2 text-xs"
              :class="
                inventoryView.rarities.includes(rarity.value)
                  ? 'border-emerald-400 bg-emerald-950/40 text-emerald-200'
                  : 'border-line text-slate-300'
              "
              @click="inventoryView.toggleRarity(rarity.value)"
            >
              {{ rarity.label }}
            </button>
          </div>
        </section>

        <section>
          <h4 class="mb-2 font-semibold text-slate-200">部位</h4>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="slot in slotOptions"
              :key="slot.value"
              class="min-h-11 rounded border px-2 py-2 text-xs"
              :class="
                inventoryView.slots.includes(slot.value)
                  ? 'border-sky-400 bg-sky-950/40 text-sky-200'
                  : 'border-line text-slate-300'
              "
              @click="inventoryView.toggleSlot(slot.value)"
            >
              {{ slot.label }}
            </button>
          </div>
        </section>

        <section>
          <label class="mb-2 block font-semibold text-slate-200" for="min-item-level">最低装备等级</label>
          <input
            id="min-item-level"
            class="w-full rounded border border-line bg-ink px-3 py-2 text-sm text-slate-100"
            min="0"
            type="number"
            :value="inventoryView.minItemLevel"
            @input="inventoryView.setMinItemLevel(Number(($event.target as HTMLInputElement).value))"
          />
        </section>
      </div>

      <div class="mt-5 grid grid-cols-2 gap-2">
        <button
          class="min-h-11 rounded border border-line px-3 py-2 text-sm text-slate-300"
          @click="inventoryView.resetViewFilter"
        >
          重置筛选
        </button>
        <button
          class="min-h-11 rounded border border-emerald-500 bg-emerald-500 px-3 py-2 text-sm font-semibold text-black"
          @click="inventoryView.setFilterPanelOpen(false)"
        >
          完成
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useInventoryViewStore } from '@/stores/inventoryView';
import type { BaseSlot, Rarity } from '@/types/item';

const inventoryView = useInventoryViewStore();

const rarityOptions: Array<{ value: Rarity; label: string }> = [
  { value: 'normal', label: '普通' },
  { value: 'magic', label: '魔法' },
  { value: 'rare', label: '稀有' },
  { value: 'legendary', label: '传说' },
  { value: 'ancient', label: '远古' },
];

const slotOptions: Array<{ value: BaseSlot; label: string }> = [
  { value: 'weapon', label: '武器' },
  { value: 'offhand', label: '副手' },
  { value: 'helmet', label: '头盔' },
  { value: 'armor', label: '护甲' },
  { value: 'gloves', label: '手套' },
  { value: 'shoes', label: '鞋子' },
  { value: 'ring', label: '戒指' },
  { value: 'necklace', label: '项链' },
];
</script>
