import type {
  AffixType,
  ClassType,
  MonsterAffix,
  MonsterType,
  Rarity,
  ScoreMode,
  SlotType,
  TalentBranch,
} from './enums';

export interface TrainingState {
  attack: number;
  vitality: number;
  defense: number;
}

export interface Player {
  classType: ClassType;
  level: number;
  exp: number;
  expToNext: number;
  strength: number;
  agility: number;
  intelligence: number;
  hp: number;
  maxHp: number;
  atk: number;
  atkSpd: number;
  critRate: number;
  critDmg: number;
  armor: number;
  dodge: number;
  fireDamage: number;
  iceDamage: number;
  lightningDamage: number;
  fireRes: number;
  iceRes: number;
  lightningRes: number;
  goldFind: number;
  magicFind: number;
  expFind: number;
  lifeLeech: number;
  gold: number;
  enhancementStones: number;
  ancientEssence: number;
  currentFloor: number;
  highestFloor: number;
  training: TrainingState;
}

export interface Affix {
  type: AffixType;
  value: number;
  isPercentage: boolean;
}

export interface EquipmentItem {
  id: string;
  name: string;
  slot: SlotType;
  rarity: Rarity;
  itemLevel: number;
  baseStats: Partial<Player>;
  affixes: Affix[];
  enhanceLevel: number;
  locked: boolean;
  createdAt: number;
}

export interface Monster {
  name: string;
  hp: number;
  atk: number;
  atkSpd: number;
  armor: number;
  critRate: number;
  level: number;
  type: MonsterType;
  affixes: MonsterAffix[];
}

export interface CombatResult {
  win: boolean;
  rounds: number;
  playerDmgTotal: number;
  monsterDmgTotal: number;
  playerHpRemaining: number;
  monsterHpRemaining: number;
  drops: EquipmentItem[];
  goldEarned: number;
  expEarned: number;
  killTime: number;
  survivalTime: number;
}

export interface CombatLogEntry {
  id: string;
  type: 'win' | 'loss' | 'loot' | 'system';
  message: string;
  timestamp: number;
}

export interface OfflineReport {
  offlineSeconds: number;
  adjustedSeconds: number;
  totalKills: number;
  totalGold: number;
  totalExp: number;
  totalDrops: EquipmentItem[];
  qualityCounts: Record<Rarity, number>;
  effectiveMultiplier: number;
  message: string;
}

export interface EnhanceCost {
  gold: number;
  stones: number;
}

export interface EnhanceResult {
  success: boolean;
  consumed: boolean;
  newLevel: number;
  cost: EnhanceCost;
  message: string;
}

export interface EquipmentComparison {
  slot: SlotType;
  dpsDiff: number;
  ehpDiff: number;
  scoreDiff: number;
  isBetter: boolean;
}

export interface EquipChange {
  slot: SlotType;
  equipped: EquipmentItem | null;
  unequipped: EquipmentItem | null;
}

export interface GameState {
  player: Player;
  combat: {
    currentFloor: number;
    isAutoCombat: boolean;
    killCount: number;
    combatLog: CombatLogEntry[];
  };
  equipment: {
    equipped: Record<SlotType, EquipmentItem | null>;
    inventory: EquipmentItem[];
    maxInventorySize: number;
    scoreMode: ScoreMode;
  };
  lastOnlineTimestamp: number;
}

export interface SaveEnvelope {
  version: number;
  timestamp: number;
  data: GameState;
}

export interface SoulBonus {
  type: string;
  level: number;
  value: number;
}

export interface TalentNode {
  id: string;
  branch: TalentBranch;
  tier: number;
  name: string;
  description: string;
  unlocked: boolean;
  purchased: boolean;
  prerequisites: string[];
}

export interface DailyTask {
  id: string;
  type: string;
  target: number;
  current: number;
  completed: boolean;
  reward: {
    gold?: number;
    stones?: number;
    essence?: number;
  };
}

export interface PrestigeState {
  count: number;
  souls: number;
  soulBonuses: SoulBonus[];
  canPrestige: boolean;
}
