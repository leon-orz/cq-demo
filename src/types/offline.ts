import type { Item } from './item';

export interface OfflineReport {
  totalSeconds: number;
  actualSeconds: number;
  cappedSeconds: number;
  monstersKilled: number;
  gold: number;
  exp: number;
  items: Item[];
  filteredItems: Item[];
  rejectedItems: number;
  wasInterrupted: boolean;
  rewardMultiplier: number;
  playerPower: number;
}
