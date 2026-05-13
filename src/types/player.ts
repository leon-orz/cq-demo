import type { EquippedItems, StatBlock } from './item';

export type MainAttribute = 'str' | 'dex' | 'int';

export type SkillBranch = 'crit' | 'speed' | 'tank' | 'treasure';

export type TrainingId = 'attack' | 'vitality' | 'guard';

export interface TrainingDefinition {
  id: TrainingId;
  name: string;
  description: string;
  stat: 'attack' | 'hp' | 'armor';
  valuePerLevel: number;
  maxLevel: number;
  costBase: number;
  costGrowth: number;
}

export type TrainingLevels = Record<TrainingId, number>;

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
  branch: SkillBranch;
  description: string;
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
  trainingLevels: TrainingLevels;
}
