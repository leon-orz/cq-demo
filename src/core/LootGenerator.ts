import type { Affix, EquipmentItem, Player } from '@/types';
import { AffixType, Rarity, SlotType } from '@/types/enums';
import {
  AFFIX_LABELS,
  ALL_SLOTS,
  GAME_CONSTANTS,
  RARITY_AFFIX_COUNTS,
  RARITY_LABELS,
  RARITY_MULTIPLIERS,
  SLOT_LABELS,
} from '@/utils/constants';
import { generateId, pickOne, randomInt, randomRange } from '@/utils/math';
import { FloorScaling } from './FloorScaling';

interface AffixDefinition {
  type: AffixType;
  slots: readonly SlotType[];
  stat: keyof Player;
  min: number;
  max: number;
  isPercentage: boolean;
}

const OFFENSIVE_SLOTS = [
  SlotType.WEAPON,
  SlotType.GLOVES,
  SlotType.NECKLACE,
  SlotType.RING_LEFT,
  SlotType.RING_RIGHT,
] as const;
const ALL_AFFIX_SLOTS = ALL_SLOTS;

export const AFFIX_POOL: readonly AffixDefinition[] = [
  { type: AffixType.SHARP, slots: [SlotType.WEAPON], stat: 'atk', min: 4, max: 9, isPercentage: false },
  {
    type: AffixType.CRUEL,
    slots: [SlotType.GLOVES, SlotType.NECKLACE],
    stat: 'critDmg',
    min: 0.08,
    max: 0.18,
    isPercentage: true,
  },
  {
    type: AffixType.EAGLE_EYE,
    slots: [SlotType.NECKLACE, SlotType.RING_LEFT, SlotType.RING_RIGHT],
    stat: 'critRate',
    min: 0.02,
    max: 0.06,
    isPercentage: true,
  },
  {
    type: AffixType.SWIFT,
    slots: [SlotType.GLOVES, SlotType.BOOTS],
    stat: 'atkSpd',
    min: 0.04,
    max: 0.12,
    isPercentage: true,
  },
  { type: AffixType.FIRE, slots: OFFENSIVE_SLOTS, stat: 'fireDamage', min: 0.05, max: 0.12, isPercentage: true },
  { type: AffixType.ICE, slots: OFFENSIVE_SLOTS, stat: 'iceDamage', min: 0.05, max: 0.12, isPercentage: true },
  {
    type: AffixType.LIGHTNING,
    slots: OFFENSIVE_SLOTS,
    stat: 'lightningDamage',
    min: 0.05,
    max: 0.12,
    isPercentage: true,
  },
  {
    type: AffixType.VITALITY,
    slots: [SlotType.ARMOR, SlotType.HELMET, SlotType.BOOTS],
    stat: 'maxHp',
    min: 20,
    max: 48,
    isPercentage: false,
  },
  {
    type: AffixType.GUARDIAN,
    slots: [SlotType.HELMET, SlotType.ARMOR, SlotType.OFFHAND],
    stat: 'armor',
    min: 6,
    max: 18,
    isPercentage: false,
  },
  {
    type: AffixType.NIMBLE,
    slots: [SlotType.BOOTS, SlotType.GLOVES],
    stat: 'dodge',
    min: 0.02,
    max: 0.06,
    isPercentage: true,
  },
  {
    type: AffixType.FIRE_RES,
    slots: [SlotType.NECKLACE, SlotType.ARMOR, SlotType.OFFHAND],
    stat: 'fireRes',
    min: 0.06,
    max: 0.16,
    isPercentage: true,
  },
  {
    type: AffixType.ICE_RES,
    slots: [SlotType.NECKLACE, SlotType.ARMOR, SlotType.OFFHAND],
    stat: 'iceRes',
    min: 0.06,
    max: 0.16,
    isPercentage: true,
  },
  {
    type: AffixType.LIGHTNING_RES,
    slots: [SlotType.NECKLACE, SlotType.ARMOR, SlotType.OFFHAND],
    stat: 'lightningRes',
    min: 0.06,
    max: 0.16,
    isPercentage: true,
  },
  {
    type: AffixType.GREED,
    slots: [SlotType.RING_LEFT, SlotType.RING_RIGHT],
    stat: 'goldFind',
    min: 0.04,
    max: 0.14,
    isPercentage: true,
  },
  {
    type: AffixType.FORTUNE,
    slots: [SlotType.RING_LEFT, SlotType.RING_RIGHT],
    stat: 'magicFind',
    min: 0.03,
    max: 0.1,
    isPercentage: true,
  },
  {
    type: AffixType.EXPERIENCE,
    slots: [SlotType.RING_LEFT, SlotType.RING_RIGHT, SlotType.NECKLACE],
    stat: 'expFind',
    min: 0.04,
    max: 0.12,
    isPercentage: true,
  },
  { type: AffixType.LEECH, slots: [SlotType.WEAPON], stat: 'lifeLeech', min: 0.01, max: 0.04, isPercentage: true },
  { type: AffixType.MOVE_SPEED, slots: [SlotType.BOOTS], stat: 'dodge', min: 0.01, max: 0.04, isPercentage: true },
];

export class LootGenerator {
  static generateDrop(floor: number, magicFind = 0): EquipmentItem {
    const itemLevel = FloorScaling.getItemLevelForFloor(floor);
    const rarity = this.rollRarity(itemLevel, magicFind);
    const slot = pickOne(ALL_SLOTS);
    const baseStats = this.calculateBaseStats(slot, itemLevel, rarity);
    const affixes = this.rollAffixes(slot, itemLevel, rarity);

    return {
      id: generateId('item'),
      name: this.generateName(slot, rarity),
      slot,
      rarity,
      itemLevel,
      baseStats,
      affixes,
      enhanceLevel: 0,
      locked: false,
      createdAt: Date.now(),
    };
  }

  static shouldDrop(magicFind = 0): boolean {
    return Math.random() < GAME_CONSTANTS.BASE_DROP_RATE * (1 + Math.min(magicFind, GAME_CONSTANTS.MAGIC_FIND_CAP));
  }

  static rollRarity(itemLevel: number, magicFind = 0): Rarity {
    const magicBonus = 1 + Math.min(magicFind, GAME_CONSTANTS.MAGIC_FIND_CAP);
    const legendaryRate = Math.min(0.001 + Math.log(Math.max(itemLevel, 1)) * 0.0025, 0.02) * magicBonus;
    const rareRate = 0.06 * magicBonus;
    const magicRate = 0.24 * magicBonus;
    const roll = Math.random();

    if (roll < legendaryRate) return Rarity.LEGENDARY;
    if (roll < legendaryRate + rareRate) return Rarity.RARE;
    if (roll < legendaryRate + rareRate + magicRate) return Rarity.MAGIC;
    return Rarity.NORMAL;
  }

  static getAffixStat(affixType: AffixType): keyof Player {
    return AFFIX_POOL.find((affix) => affix.type === affixType)?.stat ?? 'atk';
  }

  private static calculateBaseStats(slot: SlotType, itemLevel: number, rarity: Rarity): Partial<Player> {
    const scale = Math.pow(GAME_CONSTANTS.ITEM_SCALE_BASE, itemLevel) * RARITY_MULTIPLIERS[rarity];
    const stats: Partial<Player> = {};
    if (slot === SlotType.WEAPON) stats.atk = Math.floor(9 * scale);
    if (slot === SlotType.OFFHAND) stats.armor = Math.floor(10 * scale);
    if (slot === SlotType.HELMET) stats.armor = Math.floor(8 * scale);
    if (slot === SlotType.ARMOR) stats.maxHp = Math.floor(48 * scale);
    if (slot === SlotType.GLOVES) stats.critRate = Number((0.015 * scale).toFixed(3));
    if (slot === SlotType.BOOTS) stats.dodge = Number((0.012 * scale).toFixed(3));
    if (slot === SlotType.RING_LEFT || slot === SlotType.RING_RIGHT) stats.atk = Math.floor(3 * scale);
    if (slot === SlotType.NECKLACE) stats.critDmg = Number((0.08 * scale).toFixed(3));
    return stats;
  }

  private static rollAffixes(slot: SlotType, itemLevel: number, rarity: Rarity): Affix[] {
    const [minCount, maxCount] = RARITY_AFFIX_COUNTS[rarity];
    const count = randomInt(minCount, maxCount);
    const validAffixes = AFFIX_POOL.filter((affix) => affix.slots.includes(slot) || affix.slots === ALL_AFFIX_SLOTS);
    const selected = new Set<AffixType>();
    const affixes: Affix[] = [];

    while (affixes.length < count && selected.size < validAffixes.length) {
      const definition = pickOne(validAffixes);
      if (selected.has(definition.type)) continue;
      selected.add(definition.type);
      affixes.push({
        type: definition.type,
        value: this.rollAffixValue(definition, itemLevel, rarity),
        isPercentage: definition.isPercentage,
      });
    }

    return affixes;
  }

  private static rollAffixValue(definition: AffixDefinition, itemLevel: number, rarity: Rarity): number {
    const rarityMultiplier = RARITY_MULTIPLIERS[rarity];
    const levelMultiplier = Math.pow(GAME_CONSTANTS.ITEM_SCALE_BASE, itemLevel);
    const raw = randomRange(definition.min, definition.max) * rarityMultiplier * levelMultiplier;
    return definition.isPercentage ? Number(raw.toFixed(3)) : Math.floor(raw);
  }

  private static generateName(slot: SlotType, rarity: Rarity): string {
    const prefix = RARITY_LABELS[rarity];
    const affixWord = rarity === Rarity.NORMAL ? '' : `${pickOne(Object.values(AFFIX_LABELS))}之`;
    return `${prefix} ${affixWord}${SLOT_LABELS[slot]}`;
  }
}
