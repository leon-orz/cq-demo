import type { BaseItem } from '@/types/item';

export const accessories: readonly BaseItem[] = [
  {
    id: 'copper_ring',
    name: '铜戒指',
    slot: 'ring',
    minLevel: 1,
    baseStats: { hp: 6 },
  },
  {
    id: 'focus_necklace',
    name: '专注项链',
    slot: 'necklace',
    minLevel: 4,
    baseStats: { str: 1, dex: 1, int: 1 },
  },
] as const;
