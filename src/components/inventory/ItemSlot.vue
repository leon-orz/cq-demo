<template>
  <article class="rounded border bg-ink p-3 text-sm" :class="rarityClass(item.rarity)">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="truncate font-semibold">{{ item.name }}</h3>
        <p class="text-xs text-slate-500">{{ rarityLabel(item.rarity) }} · iLv {{ item.itemLevel }}</p>
      </div>
      <button class="shrink-0 rounded border border-line px-2 py-1 text-xs text-slate-200" @click="equip">穿戴</button>
    </div>

    <div class="mt-2 space-y-1 text-xs text-slate-400">
      <p v-for="(value, key) in item.baseStats" :key="key">+{{ value }} {{ key }}</p>
      <p v-for="affix in item.affixes" :key="affix.id" class="text-slate-300">+{{ affix.value }} {{ affix.name }}</p>
    </div>
  </article>
</template>

<script setup lang="ts">
import { useInventoryStore } from '@/stores/inventory';
import { usePlayerStore } from '@/stores/player';
import type { EquipmentSlot, Item } from '@/types/item';
import { rarityClass, rarityLabel } from '@/utils/format';

const props = defineProps<{
  item: Item;
}>();

const player = usePlayerStore();
const inventory = useInventoryStore();

function equip() {
  const slot =
    props.item.slot === 'ring' ? inventory.findAvailableRingSlot(player.equipped) : (props.item.slot as EquipmentSlot);
  player.equipItem(slot, props.item);
}
</script>
