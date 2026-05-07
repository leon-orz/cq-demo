import type { BaseItem } from '@/types/item';

export const weapons: readonly BaseItem[] = [
  {
    id: 'short_sword',
    name: '短剑',
    slot: 'weapon',
    minLevel: 1,
    baseStats: { attack: 8, attackSpeed: 1.15 },
  },
  {
    id: 'battle_axe',
    name: '战斧',
    slot: 'weapon',
    minLevel: 3,
    baseStats: { attack: 13, attackSpeed: 0.9 },
  },
  {
    id: 'apprentice_staff',
    name: '学徒法杖',
    slot: 'weapon',
    minLevel: 5,
    baseStats: { attack: 10, int: 3, attackSpeed: 1 },
  },
] as const;
