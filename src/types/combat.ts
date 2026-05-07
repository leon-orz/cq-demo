import type { Item } from './item';

export interface Monster {
  id: string;
  name: string;
  level: number;
  hp: number;
  attack: number;
  gold: number;
  exp: number;
}

export interface StageConfig {
  id: number;
  name: string;
  recommendedPower: number;
  monsters: Monster[];
}

export interface DamageEvent {
  timestamp: number;
  damage: number;
  isCrit: boolean;
  isKill: boolean;
}

export interface CombatResult {
  win: boolean;
  duration: number;
  playerHpLost: number;
  drops: Item[];
  gold: number;
  exp: number;
  damageEvents: DamageEvent[];
}

export interface BatchResult {
  kills: number;
  gold: number;
  exp: number;
  drops: Item[];
  actualSeconds: number;
}
