import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SaveManager } from '@/services/SaveManager';
import { createDefaultPlayer } from '@/stores/player';
import { createEmptyEquipmentSlots } from '@/stores/equipment';
import type { GameState, SaveEnvelope } from '@/types';
import { ScoreMode } from '@/types/enums';

function createValidState(): GameState {
  return {
    player: createDefaultPlayer(),
    combat: {
      currentFloor: 3,
      isAutoCombat: false,
      killCount: 7,
      combatLog: [],
    },
    equipment: {
      equipped: createEmptyEquipmentSlots(),
      inventory: [],
      maxInventorySize: 20,
      scoreMode: ScoreMode.BALANCED,
    },
    lastOnlineTimestamp: Date.now() - 30_000,
  };
}

describe('SaveManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    SaveManager.cancelAutoSave();
  });

  it('会拒绝坏 JSON、缺字段和高版本存档，并且不污染现有 localStorage', () => {
    localStorage.setItem('idle_rift_save', 'keep-me');

    expect(SaveManager.importSave('not-json')).toBeNull();
    expect(SaveManager.importSave(JSON.stringify({ version: 1 }))).toBeNull();
    expect(
      SaveManager.importSave(
        JSON.stringify({
          version: 2,
          timestamp: Date.now(),
          data: createValidState(),
        }),
      ),
    ).toBeNull();

    expect(localStorage.getItem('idle_rift_save')).toBe('keep-me');
    expect(SaveManager.load()).toBeNull();
  });

  it('会接受结构完整的存档并写回 localStorage', () => {
    const envelope: SaveEnvelope = {
      version: 1,
      timestamp: Date.now(),
      data: createValidState(),
    };

    expect(SaveManager.importSave(JSON.stringify(envelope))).not.toBeNull();
    expect(localStorage.getItem('idle_rift_save')).toContain('"version":1');
    expect(SaveManager.load()).not.toBeNull();
  });
});
