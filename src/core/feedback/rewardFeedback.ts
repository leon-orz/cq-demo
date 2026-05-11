import type { RewardFeedbackEvent, RewardFeedbackLevel } from '@/types/combat';
import type { EquippedItems, Item, ItemScoreMode } from '@/types/item';
import type { OfflineReport } from '@/types/offline';
import { rarityLabel } from '@/utils/format';
import { isBetterThanEquipped } from '@/core/item/filter';

const HIGH_SCORE_THRESHOLD = 120;

function createFeedbackId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

function getItemFeedbackLevel(item: Item): RewardFeedbackLevel {
  if (item.rarity === 'legendary' || item.rarity === 'ancient') return 'legendary';
  return 'success';
}

export function isHighlightItem(item: Item, equipped?: EquippedItems, scoreMode?: ItemScoreMode): boolean {
  if (item.rarity === 'legendary' || item.rarity === 'ancient') return true;
  if (item.affixes.some((affix) => affix.isLegendary)) return true;
  if (item.rarity === 'rare' && equipped && scoreMode && isBetterThanEquipped(item, equipped, scoreMode)) return true;
  if (item.rarity === 'rare' && (item.score ?? 0) >= HIGH_SCORE_THRESHOLD) return true;
  return false;
}

export function createItemDropFeedback(
  item: Item,
  equipped?: EquippedItems,
  scoreMode?: ItemScoreMode,
): RewardFeedbackEvent | null {
  if (!isHighlightItem(item, equipped, scoreMode)) return null;

  return {
    id: createFeedbackId(),
    kind: 'item',
    level: getItemFeedbackLevel(item),
    title: `${rarityLabel(item.rarity)}装备掉落`,
    message: `${item.name} · iLv ${item.itemLevel} · 评分 ${item.score ?? 0}`,
    item,
  };
}

export function createFilteredHighlightFeedback(
  item: Item,
  equipped?: EquippedItems,
  scoreMode?: ItemScoreMode,
): RewardFeedbackEvent | null {
  if (!isHighlightItem(item, equipped, scoreMode)) return null;

  return {
    id: createFeedbackId(),
    kind: 'item',
    level: 'warning',
    title: '高价值装备被过滤',
    message: `${item.name} 未通过拾取过滤，已自动转化。`,
    item,
  };
}

export function createStageUnlockFeedback(stage: number): RewardFeedbackEvent {
  return {
    id: createFeedbackId(),
    kind: 'stage',
    level: 'success',
    title: '推层成功',
    message: `已解锁第 ${stage} 层。`,
  };
}

export function createInventoryFullFeedback(lostCount = 1): RewardFeedbackEvent {
  return {
    id: createFeedbackId(),
    kind: 'inventory',
    level: 'warning',
    title: '背包已满',
    message: `已有 ${lostCount} 件掉落未能拾取，请先整理背包。`,
  };
}

export function createOfflineClaimFeedback(
  report: OfflineReport,
  equipped?: EquippedItems,
  scoreMode?: ItemScoreMode,
): RewardFeedbackEvent {
  const bestItem = [...report.items].sort((first, second) => (second.score ?? 0) - (first.score ?? 0))[0] ?? null;
  const highValueItems = report.items.filter((item) => isHighlightItem(item, equipped, scoreMode));
  const lostText = report.rejectedItems > 0 ? `，未拾取 ${report.rejectedItems} 件` : '';
  const itemText = bestItem
    ? `，最佳掉落：${bestItem.name}`
    : report.items.length > 0
      ? `，获得 ${report.items.length} 件装备`
      : '';

  const event: RewardFeedbackEvent = {
    id: createFeedbackId(),
    kind: 'offline',
    level: highValueItems.length > 0 ? 'legendary' : report.wasInterrupted ? 'warning' : 'success',
    title: '离线收益已领取',
    message: `获得 ${report.gold} 金币、${report.exp} 经验${itemText}${lostText}。`,
  };
  if (bestItem) {
    event.item = bestItem;
  }
  return event;
}

export function createOfflineHighlightItemFeedback(
  report: OfflineReport,
  equipped?: EquippedItems,
  scoreMode?: ItemScoreMode,
): RewardFeedbackEvent | null {
  const highlightItem =
    report.items
      .filter((item) => isHighlightItem(item, equipped, scoreMode))
      .sort((first, second) => (second.score ?? 0) - (first.score ?? 0))[0] ?? null;

  if (!highlightItem) return null;
  return createItemDropFeedback(highlightItem, equipped, scoreMode);
}

export function createOfflineFilteredHighlightFeedback(
  report: OfflineReport,
  equipped?: EquippedItems,
  scoreMode?: ItemScoreMode,
): RewardFeedbackEvent | null {
  const highlightItem =
    report.filteredItems
      .filter((item) => isHighlightItem(item, equipped, scoreMode))
      .sort((first, second) => (second.score ?? 0) - (first.score ?? 0))[0] ?? null;

  if (!highlightItem) return null;
  return createFilteredHighlightFeedback(highlightItem, equipped, scoreMode);
}
