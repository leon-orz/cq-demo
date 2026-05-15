import type { GameState, SaveEnvelope } from '@/types';
import { debounce } from '@/utils/debounce';

export class SaveManager {
  private static readonly SAVE_KEY = 'idle_rift_save';

  private static readonly SAVE_VERSION = 1;

  private static debouncedSave = debounce((gameState: GameState) => {
    SaveManager.save(gameState);
  }, 5000);

  static save(gameState: GameState): void {
    if (typeof localStorage === 'undefined') return;
    const envelope: SaveEnvelope = {
      version: this.SAVE_VERSION,
      timestamp: Date.now(),
      data: gameState,
    };
    localStorage.setItem(this.SAVE_KEY, JSON.stringify(envelope));
  }

  static load(): SaveEnvelope | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(this.SAVE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as SaveEnvelope;
      if (parsed.version !== this.SAVE_VERSION) return this.migrate(parsed);
      return parsed;
    } catch {
      return null;
    }
  }

  static exportSave(): string {
    if (typeof localStorage === 'undefined') return '';
    return localStorage.getItem(this.SAVE_KEY) ?? '';
  }

  static importSave(jsonString: string): SaveEnvelope | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const parsed = JSON.parse(jsonString) as SaveEnvelope;
      if (!parsed.data || !parsed.version) return null;
      localStorage.setItem(this.SAVE_KEY, jsonString);
      return parsed;
    } catch {
      return null;
    }
  }

  static autoSave(gameState: GameState): void {
    this.debouncedSave(gameState);
  }

  static clear(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(this.SAVE_KEY);
  }

  private static migrate(_oldSave: SaveEnvelope): SaveEnvelope | null {
    return null;
  }
}
