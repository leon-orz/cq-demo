<template>
  <article
    class="relative rounded border bg-ink p-3 text-sm"
    :class="[rarityClass(item.rarity), isUpgrade ? 'shadow-lg shadow-emerald-900/40 ring-1 ring-emerald-400/60' : '']"
  >
    <span
      v-if="isUpgrade"
      class="absolute right-2 top-2 rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-black"
    >
      更优
    </span>
    <span
      v-if="item.locked"
      class="absolute left-2 top-2 rounded bg-sky-500 px-1.5 py-0.5 text-[10px] font-semibold text-black"
    >
      锁
    </span>
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="truncate pr-10 font-semibold">{{ item.name }}</h3>
        <p class="text-xs text-slate-500">{{ rarityLabel(item.rarity) }} · iLv {{ item.itemLevel }}</p>
        <p class="text-xs" :class="scoreDiff >= 0 ? 'text-emerald-300' : 'text-red-300'">
          评分 {{ itemScore }}（{{ scoreDiff >= 0 ? '+' : '' }}{{ scoreDiff }}）
        </p>
      </div>
      <div class="flex shrink-0 flex-col gap-1">
        <button class="rounded border border-line px-2 py-1 text-xs text-slate-200" @click="equip">穿戴</button>
        <button class="rounded border border-line px-2 py-1 text-xs text-slate-300" @click="showCompare = true">
          对比
        </button>
        <button
          class="rounded border border-line px-2 py-1 text-xs text-slate-400"
          @click="inventory.toggleLock(item.id)"
        >
          {{ item.locked ? '解锁' : '锁定' }}
        </button>
      </div>
    </div>

    <div class="mt-2 space-y-1 text-xs text-slate-400">
      <p v-for="(value, key) in item.baseStats" :key="key">+{{ value }} {{ key }}</p>
      <p v-for="affix in item.affixes" :key="affix.id" class="text-slate-300">+{{ affix.value }} {{ affix.name }}</p>
    </div>
    <ItemCompareModal v-if="showCompare" :item="item" @close="showCompare = false" @equip="equipFromCompare" />
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import ItemCompareModal from '@/components/inventory/ItemCompareModal.vue';
import { useItemPresentation } from '@/composables/useItemPresentation';
import { useInventoryStore } from '@/stores/inventory';
import { usePlayerStore } from '@/stores/player';
import type { EquipmentSlot, Item } from '@/types/item';
import { rarityClass, rarityLabel } from '@/utils/format';

const props = defineProps<{
  item: Item;
}>();

const player = usePlayerStore();
const inventory = useInventoryStore();
const showCompare = ref(false);
const { itemScore, scoreDiff, isUpgrade } = useItemPresentation(
  () => props.item,
  () => player.equipped,
);

function equip() {
  const slot =
    props.item.slot === 'ring' ? inventory.findAvailableRingSlot(player.equipped) : (props.item.slot as EquipmentSlot);
  player.equipItem(slot, props.item);
}

function equipFromCompare() {
  equip();
  showCompare.value = false;
}
</script>
