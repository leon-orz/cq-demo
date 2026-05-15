import { AffixType, MonsterType, Rarity, ScoreMode, SlotType } from '@/types/enums';

export const GAME_CONSTANTS = {
  MAX_ATK_SPD: 5,
  MAX_CRIT_RATE: 0.75,
  MAX_DODGE: 0.6,
  ITEM_SCALE_BASE: 1.05,
  MONSTER_GROWTH: 1.08,
  RECOMMENDED_GROWTH: 1.09,
  TRAINING_COST_GROWTH: 1.22,
  ENHANCE_COST_GROWTH: 1.42,
  BASE_RECOMMENDED_POWER: 90,
  COMBAT_INTERVAL_MS: 1200,
  COMBAT_TIME_LIMIT_S: 60,
  OFFLINE_SOFT_CAP_HOURS: 12,
  OFFLINE_HARD_CAP_HOURS: 24,
  INVENTORY_SIZE: 50,
  MAX_TRAINING_LEVEL: 200,
  MAX_ENHANCE_LEVEL: 5,
  BASE_DROP_RATE: 0.42,
  MAIN_ATTR_BONUS: 0.01,
  GOLD_FIND_CAP: 0.5,
  MAGIC_FIND_CAP: 0.5,
} as const;

export const ALL_SLOTS = [
  SlotType.WEAPON,
  SlotType.OFFHAND,
  SlotType.HELMET,
  SlotType.ARMOR,
  SlotType.GLOVES,
  SlotType.BOOTS,
  SlotType.RING_LEFT,
  SlotType.RING_RIGHT,
  SlotType.NECKLACE,
] as const;

export const RARITY_ORDER: Record<Rarity, number> = {
  [Rarity.NORMAL]: 0,
  [Rarity.MAGIC]: 1,
  [Rarity.RARE]: 2,
  [Rarity.LEGENDARY]: 3,
  [Rarity.ANCIENT]: 4,
};

export const RARITY_LABELS: Record<Rarity, string> = {
  [Rarity.NORMAL]: '普通',
  [Rarity.MAGIC]: '魔法',
  [Rarity.RARE]: '稀有',
  [Rarity.LEGENDARY]: '传说',
  [Rarity.ANCIENT]: '远古',
};

export const SLOT_LABELS: Record<SlotType, string> = {
  [SlotType.WEAPON]: '武器',
  [SlotType.OFFHAND]: '副手',
  [SlotType.HELMET]: '头盔',
  [SlotType.ARMOR]: '护甲',
  [SlotType.GLOVES]: '手套',
  [SlotType.BOOTS]: '鞋子',
  [SlotType.RING_LEFT]: '左戒',
  [SlotType.RING_RIGHT]: '右戒',
  [SlotType.NECKLACE]: '项链',
};

export const RARITY_AFFIX_COUNTS: Record<Rarity, [number, number]> = {
  [Rarity.NORMAL]: [0, 0],
  [Rarity.MAGIC]: [2, 2],
  [Rarity.RARE]: [3, 4],
  [Rarity.LEGENDARY]: [4, 5],
  [Rarity.ANCIENT]: [5, 6],
};

export const RARITY_MULTIPLIERS: Record<Rarity, number> = {
  [Rarity.NORMAL]: 1,
  [Rarity.MAGIC]: 1.3,
  [Rarity.RARE]: 1.6,
  [Rarity.LEGENDARY]: 2,
  [Rarity.ANCIENT]: 2.5,
};

export const MONSTER_TYPE_MODS: Record<
  MonsterType,
  { hpMod: number; atkMod: number; rewardMod: number; label: string }
> = {
  [MonsterType.BALANCED]: { hpMod: 1, atkMod: 1, rewardMod: 1, label: '裂隙兽' },
  [MonsterType.HIGH_HP]: { hpMod: 1.2, atkMod: 0.9, rewardMod: 1.06, label: '厚皮裂隙兽' },
  [MonsterType.HIGH_ATK]: { hpMod: 0.9, atkMod: 1.08, rewardMod: 1.05, label: '狂暴裂隙兽' },
  [MonsterType.REWARD]: { hpMod: 0.85, atkMod: 0.85, rewardMod: 1.12, label: '藏宝裂隙兽' },
};

export const ENHANCE_RATES = [1, 1, 1, 0.85, 0.85, 0.85, 0.65, 0.65, 0.65, 0.45, 0.3] as const;

export const OFFLINE_MULTIPLIERS = [
  { hours: 12, multiplier: 1 },
  { hours: 18, multiplier: 0.5 },
  { hours: 24, multiplier: 0.25 },
  { hours: Number.POSITIVE_INFINITY, multiplier: 0.1 },
] as const;

export const AFFIX_LABELS: Record<AffixType, string> = {
  [AffixType.SHARP]: '锋利',
  [AffixType.CRUEL]: '残忍',
  [AffixType.EAGLE_EYE]: '鹰眼',
  [AffixType.SWIFT]: '疾风',
  [AffixType.FIRE]: '烈焰',
  [AffixType.ICE]: '冰霜',
  [AffixType.LIGHTNING]: '雷霆',
  [AffixType.VITALITY]: '活力',
  [AffixType.GUARDIAN]: '守护',
  [AffixType.NIMBLE]: '灵巧',
  [AffixType.FIRE_RES]: '烈焰抗性',
  [AffixType.ICE_RES]: '冰霜抗性',
  [AffixType.LIGHTNING_RES]: '雷霆抗性',
  [AffixType.GREED]: '贪婪',
  [AffixType.FORTUNE]: '寻宝',
  [AffixType.EXPERIENCE]: '历练',
  [AffixType.LEECH]: '吸血',
  [AffixType.MOVE_SPEED]: '迅捷',
};

export const SCORE_MODE_LABELS: Record<ScoreMode, string> = {
  [ScoreMode.BALANCED]: '均衡',
  [ScoreMode.CRIT]: '暴击',
  [ScoreMode.ATK_SPEED]: '攻速',
  [ScoreMode.TOUGHNESS]: '坚韧',
  [ScoreMode.MAIN_ATTR]: '主属性',
};
