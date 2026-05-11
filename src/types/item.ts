export type Rarity = 'normal' | 'magic' | 'rare' | 'legendary' | 'ancient';

export type ItemScoreMode = 'balanced' | 'crit' | 'speed' | 'tank' | 'mainAttribute';

export type EquipmentSlot =
  | 'weapon'
  | 'offhand'
  | 'helmet'
  | 'armor'
  | 'gloves'
  | 'shoes'
  | 'ring1'
  | 'ring2'
  | 'necklace';

export type BaseSlot = Exclude<EquipmentSlot, 'ring1' | 'ring2'> | 'ring';

export type StatKey =
  | 'attack'
  | 'attackSpeed'
  | 'critChance'
  | 'critDamage'
  | 'hp'
  | 'armor'
  | 'dodgeChance'
  | 'fireRes'
  | 'iceRes'
  | 'lightningRes'
  | 'str'
  | 'dex'
  | 'int'
  | 'goldFind'
  | 'magicFind';

export interface StatBlock {
  attack?: number;
  attackSpeed?: number;
  critChance?: number;
  critDamage?: number;
  hp?: number;
  armor?: number;
  dodgeChance?: number;
  fireRes?: number;
  iceRes?: number;
  lightningRes?: number;
  str?: number;
  dex?: number;
  int?: number;
  goldFind?: number;
  magicFind?: number;
}

export interface Affix {
  id: string;
  name: string;
  stat: StatKey;
  value: number;
  valueType: 'flat' | 'percent';
  tier: number;
  isLegendary?: boolean;
}

export interface BaseItem {
  id: string;
  name: string;
  slot: BaseSlot;
  minLevel: number;
  baseStats: StatBlock;
}

export interface Item {
  id: string;
  name: string;
  slot: BaseSlot;
  rarity: Rarity;
  itemLevel: number;
  baseStats: StatBlock;
  affixes: Affix[];
  locked?: boolean;
  score?: number;
}

export type EquippedItems = Record<EquipmentSlot, Item | null>;

export interface LootFilterRule {
  minRarity: Rarity;
  keepSlots: BaseSlot[];
  requiredAffixStats: StatKey[];
  autoConvertRejected: boolean;
}

export type InventorySortKey = 'score' | 'rarity' | 'slot' | 'itemLevel' | 'newest';

export type SortDirection = 'asc' | 'desc';

export interface InventoryViewFilter {
  sortKey: InventorySortKey;
  sortDirection: SortDirection;
  rarities: Rarity[];
  slots: BaseSlot[];
  onlyUpgrades: boolean;
  hideLocked: boolean;
  minItemLevel: number;
}

export interface ItemCompareLine {
  stat: StatKey;
  currentValue: number;
  nextValue: number;
  delta: number;
}

export interface ItemCompareResult {
  targetSlot: EquipmentSlot;
  equippedItem: Item | null;
  itemScore: number;
  equippedScore: number;
  scoreDelta: number;
  isUpgrade: boolean;
  lines: ItemCompareLine[];
}
