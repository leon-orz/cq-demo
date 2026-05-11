import type {
  BaseSlot,
  EquippedItems,
  InventorySortKey,
  Item,
  ItemScoreMode,
  LootFilterRule,
  Rarity,
  SortDirection,
} from './item';
import type { MainAttribute, PlayerBaseStats, SkillNode } from './player';

export interface PlayerSaveState {
  name: string;
  level: number;
  exp: number;
  expToNext: number;
  mainAttribute: MainAttribute;
  baseStats: PlayerBaseStats;
  equipped: EquippedItems;
  skillNodes: SkillNode[];
}

export interface InventorySaveState {
  items: Item[];
  gold: number;
  enhancementStones: number;
  lostDrops: number;
  autoConvertedDrops: number;
}

export interface SettingsSaveState {
  itemScoreMode: ItemScoreMode;
  lootFilter: LootFilterRule;
  protectRareAndAbove: boolean;
  protectBetterItems: boolean;
}

export interface InventoryViewSaveState {
  sortKey: InventorySortKey;
  sortDirection: SortDirection;
  rarities: Rarity[];
  slots: BaseSlot[];
  onlyUpgrades: boolean;
  hideLocked: boolean;
  minItemLevel: number;
}

export interface CombatSaveState {
  currentStage: number;
  highestUnlockedStage: number;
}

export interface SaveMetaState {
  version: number;
  lastActiveTime: number;
}

export interface GameSaveSnapshot {
  schemaVersion: number;
  savedAt: number;
  player: PlayerSaveState;
  inventory: InventorySaveState;
  settings: SettingsSaveState;
  inventoryView: InventoryViewSaveState;
  combat: CombatSaveState;
  save: SaveMetaState;
}
