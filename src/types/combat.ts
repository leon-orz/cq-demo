import type { Item } from './item';

export type MonsterArchetype = 'balanced' | 'highHp' | 'highAttack' | 'reward' | 'boss';

export type StageTag = 'gold' | 'exp' | 'gear' | 'boss';

export type RewardFocus = 'balanced' | 'gold' | 'exp' | 'gear';

export interface Monster {
  id: string;
  name: string;
  archetype: MonsterArchetype;
  level: number;
  hp: number;
  attack: number;
  gold: number;
  exp: number;
  isBoss?: boolean;
  dropChance?: number;
  dropValueMultiplier?: number;
}

export interface StageConfig {
  id: number;
  name: string;
  recommendedPower: number;
  tags: StageTag[];
  rewardFocus: RewardFocus;
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
  encounters: BatchEncounterResult[];
  actualSeconds: number;
}

export interface BatchEncounterResult {
  elapsedSeconds: number;
  duration: number;
  gold: number;
  exp: number;
  drops: Item[];
}

export type StageFailureReason = 'none' | 'survival' | 'both' | 'timeout';

export interface StageTargetEvaluation {
  stage: number;
  stageName: string;
  monsterName: string;
  monsterArchetype: MonsterArchetype;
  tags: StageTag[];
  rewardFocus: RewardFocus;
  recommendedPower: number;
  playerPower: number;
  rewardMultiplier: number;
  canClear: boolean;
  killTime: number;
  survivalTime: number;
  goldPerSecond: number;
  expPerSecond: number;
  dropValuePerSecond: number;
  farmScore: number;
  failureReason: StageFailureReason;
  failureText: string;
  rewardText: string;
  adviceText: string;
  recommendReason: string;
}

export interface ProgressionTargetSummary {
  current: StageTargetEvaluation;
  recommendedFarmStage: number;
  recommendedFarm: StageTargetEvaluation;
  suggestedChallengeStage: number;
  suggestedChallenge: StageTargetEvaluation;
  nextUnlockStage: number;
}

export type RewardFeedbackKind = 'item' | 'stage' | 'offline' | 'inventory';

export type RewardFeedbackLevel = 'info' | 'success' | 'warning' | 'legendary';

export interface RewardFeedbackEvent {
  id: number;
  kind: RewardFeedbackKind;
  level: RewardFeedbackLevel;
  title: string;
  message: string;
  item?: Item;
}
