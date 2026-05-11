import { computed, type MaybeRefOrGetter, toValue } from 'vue';
import {
  compareItemWithEquipped,
  getItemCompareResult,
  getItemScore,
  isBetterThanEquipped,
  itemScoreModeOptions,
} from '@/core/item/filter';
import { useSettingsStore } from '@/stores/settings';
import type { EquippedItems, Item } from '@/types/item';

export function useItemPresentation(item: MaybeRefOrGetter<Item>, equipped: MaybeRefOrGetter<EquippedItems>) {
  const settings = useSettingsStore();
  const scoreModeLabel = computed(() => {
    return itemScoreModeOptions.find((option) => option.value === settings.itemScoreMode)?.label ?? '均衡';
  });

  const itemScore = computed(() => {
    const currentItem = toValue(item);
    return getItemScore(currentItem, settings.itemScoreMode);
  });

  const scoreDiff = computed(() => compareItemWithEquipped(toValue(item), toValue(equipped), settings.itemScoreMode));
  const isUpgrade = computed(() => isBetterThanEquipped(toValue(item), toValue(equipped), settings.itemScoreMode));
  const compare = computed(() => getItemCompareResult(toValue(item), toValue(equipped), settings.itemScoreMode));

  return {
    itemScore,
    scoreDiff,
    isUpgrade,
    compare,
    scoreModeLabel,
  };
}
