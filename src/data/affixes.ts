import type { Affix, BaseSlot, StatKey } from '@/types/item';

export interface AffixTemplate {
  id: string;
  name: string;
  stat: StatKey;
  valueType: 'flat' | 'percent';
  min: number;
  max: number;
  slots: readonly BaseSlot[];
  tier: number;
}

export const affixPool: readonly AffixTemplate[] = [
  {
    id: 'sharp',
    name: '锋利',
    stat: 'attack',
    valueType: 'flat',
    min: 2,
    max: 8,
    slots: ['weapon', 'gloves', 'ring'],
    tier: 1,
  },
  {
    id: 'cruel',
    name: '残忍',
    stat: 'critDamage',
    valueType: 'flat',
    min: 8,
    max: 20,
    slots: ['weapon', 'gloves', 'ring', 'necklace'],
    tier: 1,
  },
  {
    id: 'eagle',
    name: '鹰眼',
    stat: 'critChance',
    valueType: 'flat',
    min: 2,
    max: 7,
    slots: ['weapon', 'gloves', 'ring', 'necklace'],
    tier: 1,
  },
  {
    id: 'vital',
    name: '活力',
    stat: 'hp',
    valueType: 'flat',
    min: 10,
    max: 35,
    slots: ['helmet', 'armor', 'shoes', 'offhand', 'ring', 'necklace'],
    tier: 1,
  },
  {
    id: 'guarded',
    name: '守护',
    stat: 'armor',
    valueType: 'flat',
    min: 3,
    max: 12,
    slots: ['helmet', 'armor', 'gloves', 'shoes', 'offhand'],
    tier: 1,
  },
  {
    id: 'greedy',
    name: '贪婪',
    stat: 'goldFind',
    valueType: 'flat',
    min: 4,
    max: 12,
    slots: ['ring', 'necklace'],
    tier: 1,
  },
] as const;

export const legendaryAffixes: readonly Affix[] = [
  {
    id: 'legend_chain_lightning',
    name: '连锁闪电',
    stat: 'attack',
    value: 18,
    valueType: 'flat',
    tier: 0,
    isLegendary: true,
  },
];
