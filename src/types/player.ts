import type { EquippedItems, StatBlock } from './item';

export type MainAttribute = 'str' | 'dex' | 'int';

export interface PlayerBaseStats extends StatBlock {
  str: number;
  dex: number;
  int: number;
  hp: number;
  attack: number;
  attackSpeed: number;
  critChance: number;
  critDamage: number;
}

export interface SkillNode {
  id: string;
  name: string;
  active: boolean;
  stat: keyof StatBlock;
  value: number;
}

export interface PlayerBuild {
  level: number;
  mainAttribute: MainAttribute;
  baseStats: PlayerBaseStats;
  equipped: EquippedItems;
  skillNodes: SkillNode[];
}
