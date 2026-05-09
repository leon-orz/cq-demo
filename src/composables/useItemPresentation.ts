import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import {
  calculateItemScore,
  compareItemWithEquipped,
  getItemCompareResult,
  isBetterThanEquipped,
} from '@/core/item/filter';
import type { EquippedItems, Item } from '@/types/item';

export function useItemPresentation(item: MaybeRefOrGetter<Item>, equipped: MaybeRefOrGetter<EquippedItems>) {
  const itemScore = computed(() => {
    const currentItem = toValue(item);
    return currentItem.score ?? calculateItemScore(currentItem);
  });

  const scoreDiff = computed(() => compareItemWithEquipped(toValue(item), toValue(equipped)));
  const isUpgrade = computed(() => isBetterThanEquipped(toValue(item), toValue(equipped)));
  const compare = computed(() => getItemCompareResult(toValue(item), toValue(equipped)));

  return {
    itemScore,
    scoreDiff,
    isUpgrade,
    compare,
  };
}
