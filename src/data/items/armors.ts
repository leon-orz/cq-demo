import type { BaseItem } from '@/types/item';

export const armors: readonly BaseItem[] = [
  {
    id: 'cloth_hood',
    name: '布质兜帽',
    slot: 'helmet',
    minLevel: 1,
    baseStats: { hp: 10, armor: 2 },
  },
  {
    id: 'leather_armor',
    name: '皮甲',
    slot: 'armor',
    minLevel: 1,
    baseStats: { hp: 22, armor: 5 },
  },
  {
    id: 'hunter_gloves',
    name: '猎手手套',
    slot: 'gloves',
    minLevel: 2,
    baseStats: { armor: 2, attackSpeed: 0.08 },
  },
  {
    id: 'traveler_boots',
    name: '旅者短靴',
    slot: 'shoes',
    minLevel: 2,
    baseStats: { armor: 2, dodgeChance: 2 },
  },
  {
    id: 'wooden_shield',
    name: '木盾',
    slot: 'offhand',
    minLevel: 3,
    baseStats: { hp: 18, armor: 8 },
  },
] as const;
