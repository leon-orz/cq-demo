<template>
  <div
    class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
    role="dialog"
    aria-modal="true"
    aria-label="装备对比"
  >
    <section class="w-full max-w-3xl rounded border border-line bg-panel p-5 shadow-2xl shadow-black/60">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs uppercase text-slate-500">装备对比</p>
          <h2 class="text-xl font-semibold text-slate-100">{{ item.name }}</h2>
          <p class="mt-1 text-sm text-slate-400">
            目标部位 {{ compare.targetSlot }} · 评分 {{ compare.itemScore }}
            <span :class="compare.scoreDelta >= 0 ? 'text-emerald-300' : 'text-red-300'">
              （{{ compare.scoreDelta >= 0 ? '+' : '' }}{{ compare.scoreDelta }}）
            </span>
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
        <div class="rounded border border-line bg-ink p-3">
          <p class="mb-2 text-sm text-slate-500">当前装备</p>
          <h3 class="font-semibold text-slate-200">{{ compare.equippedItem?.name ?? '空槽' }}</h3>
          <p class="text-sm text-slate-500">评分 {{ compare.equippedScore }}</p>
        </div>
        <div class="rounded border bg-ink p-3" :class="rarityClass(item.rarity)">
          <p class="mb-2 text-sm text-slate-500">新装备</p>
          <h3 class="font-semibold">{{ item.name }}</h3>
          <p class="text-sm text-slate-500">评分 {{ compare.itemScore }}</p>
        </div>
      </div>

      <div class="mt-4 max-h-72 overflow-y-auto rounded border border-line bg-ink">
        <div
          v-for="line in compare.lines"
          :key="line.stat"
          class="grid grid-cols-[1fr_80px_80px_80px] gap-2 border-b border-line px-3 py-2 text-sm last:border-b-0"
        >
          <span class="text-slate-300">{{ statLabel(line.stat) }}</span>
          <span class="text-right text-slate-500">{{ line.currentValue }}</span>
          <span class="text-right text-slate-200">{{ line.nextValue }}</span>
          <span class="text-right" :class="line.delta >= 0 ? 'text-emerald-300' : 'text-red-300'">
            {{ line.delta >= 0 ? '+' : '' }}{{ line.delta }}
          </span>
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
          class="rounded bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400"
          @click="$emit('equip')"
        >
          穿戴
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useItemPresentation } from '@/composables/useItemPresentation';
import { usePlayerStore } from '@/stores/player';
import type { Item, StatKey } from '@/types/item';
import { rarityClass } from '@/utils/format';

const props = defineProps<{
  item: Item;
}>();

defineEmits<{
  close: [];
  equip: [];
}>();

const player = usePlayerStore();
const { compare } = useItemPresentation(
  () => props.item,
  () => player.equipped,
);

function statLabel(stat: StatKey): string {
  const labels: Record<StatKey, string> = {
    attack: '攻击',
    attackSpeed: '攻速',
    critChance: '暴击率',
    critDamage: '暴击伤害',
    hp: '生命',
    armor: '护甲',
    dodgeChance: '闪避',
    fireRes: '火抗',
    iceRes: '冰抗',
    lightningRes: '雷抗',
    str: '力量',
    dex: '敏捷',
    int: '智力',
    goldFind: '金币获取',
    magicFind: '魔法发现',
  };
  return labels[stat];
}
</script>
