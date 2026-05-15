import type { GameState, SaveEnvelope } from '@/types';

export class SaveManager {
  private static readonly SAVE_KEY = 'idle_rift_save';

  private static readonly SAVE_VERSION = 1;

  private static autoSaveTimer: ReturnType<typeof setTimeout> | null = null;

  static save(gameState: GameState): void {
    if (typeof localStorage === 'undefined') return;
    this.cancelAutoSave();
    const timestamp = Date.now();
    const snapshot = this.cloneGameState(gameState);
    const envelope: SaveEnvelope = {
      version: this.SAVE_VERSION,
      timestamp,
      data: {
        ...snapshot,
        lastOnlineTimestamp: timestamp,
      },
    };
    localStorage.setItem(this.SAVE_KEY, JSON.stringify(envelope));
  }

  static load(): SaveEnvelope | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(this.SAVE_KEY);
    if (!raw) return null;
    return this.parseEnvelope(raw);
  }

  static exportSave(): string {
    if (typeof localStorage === 'undefined') return '';
    return localStorage.getItem(this.SAVE_KEY) ?? '';
  }

  static importSave(jsonString: string): SaveEnvelope | null {
    if (typeof localStorage === 'undefined') return null;
    const parsed = this.parseEnvelope(jsonString);
    if (!parsed) return null;
    localStorage.setItem(this.SAVE_KEY, JSON.stringify(parsed));
    return parsed;
  }

  static autoSave(gameState: GameState): void {
    this.cancelAutoSave();
    const snapshot = this.cloneGameState(gameState);
    this.autoSaveTimer = setTimeout(() => {
      this.save(snapshot);
    }, 5000);
  }

  static cancelAutoSave(): void {
    if (this.autoSaveTimer === null) return;
    clearTimeout(this.autoSaveTimer);
    this.autoSaveTimer = null;
  }

  static clear(): void {
    if (typeof localStorage === 'undefined') return;
    this.cancelAutoSave();
    localStorage.removeItem(this.SAVE_KEY);
  }

  private static parseEnvelope(raw: string): SaveEnvelope | null {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!this.isValidEnvelope(parsed)) return null;
      return {
        version: parsed.version,
        timestamp: parsed.timestamp,
        data: {
          ...parsed.data,
          lastOnlineTimestamp: this.resolveLastOnlineTimestamp(parsed),
        },
      };
    } catch {
      return null;
    }
  }

  private static resolveLastOnlineTimestamp(envelope: SaveEnvelope): number {
    return this.isFiniteNumber(envelope.data.lastOnlineTimestamp)
      ? envelope.data.lastOnlineTimestamp
      : envelope.timestamp;
  }

  private static isValidEnvelope(value: unknown): value is SaveEnvelope {
    if (!this.isPlainObject(value)) return false;
    if (value.version !== this.SAVE_VERSION) return false;
    if (!this.isFiniteNumber(value.timestamp)) return false;
    if (!this.isPlainObject(value.data)) return false;
    if (!this.isValidPlayer(value.data.player)) return false;
    if (!this.isValidCombat(value.data.combat)) return false;
    if (!this.isValidEquipment(value.data.equipment)) return false;
    return true;
  }

  private static isValidPlayer(value: unknown): boolean {
    if (!this.isPlainObject(value)) return false;
    return (
      typeof value.classType === 'string' &&
      this.isFiniteNumber(value.gold) &&
      this.isFiniteNumber(value.level) &&
      this.isFiniteNumber(value.exp) &&
      this.isFiniteNumber(value.expToNext) &&
      this.isFiniteNumber(value.currentFloor) &&
      this.isFiniteNumber(value.highestFloor) &&
      this.isPlainObject(value.training) &&
      this.isFiniteNumber(value.training.attack) &&
      this.isFiniteNumber(value.training.vitality) &&
      this.isFiniteNumber(value.training.defense)
    );
  }

  private static isValidCombat(value: unknown): boolean {
    if (!this.isPlainObject(value)) return false;
    return (
      this.isFiniteNumber(value.currentFloor) &&
      typeof value.isAutoCombat === 'boolean' &&
      this.isFiniteNumber(value.killCount) &&
      Array.isArray(value.combatLog)
    );
  }

  private static isValidEquipment(value: unknown): boolean {
    if (!this.isPlainObject(value)) return false;
    return (
      this.isPlainObject(value.equipped) &&
      Array.isArray(value.inventory) &&
      this.isFiniteNumber(value.maxInventorySize) &&
      typeof value.scoreMode === 'string'
    );
  }

  private static isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private static isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }

  private static migrate(_oldSave: SaveEnvelope): SaveEnvelope | null {
    return null;
  }

  private static cloneGameState(gameState: GameState): GameState {
    return JSON.parse(JSON.stringify(gameState)) as GameState;
  }
}
