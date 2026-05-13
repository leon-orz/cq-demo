import { describe, expect, it } from 'vitest';
import { trainingDefinitions } from '@/data/training';
import {
  calculateTrainingBonuses,
  calculateTrainingCost,
  getTrainingUpgradePreview,
  normalizeTrainingLevels,
  upgradeTrainingLevel,
} from '@/core/player/training';

describe('训练系统纯逻辑', () => {
  it('应归一化缺失、负数和超上限训练等级', () => {
    const levels = normalizeTrainingLevels({ attack: 2, vitality: -1, guard: 999 });

    expect(levels.attack).toBe(2);
    expect(levels.vitality).toBe(0);
    expect(levels.guard).toBe(trainingDefinitions.find((definition) => definition.id === 'guard')!.maxLevel);
  });

  it('应按等级递增训练消耗', () => {
    const attack = trainingDefinitions.find((definition) => definition.id === 'attack')!;

    expect(calculateTrainingCost(attack, 0)).toBe(80);
    expect(calculateTrainingCost(attack, 1)).toBeGreaterThan(80);
  });

  it('应把训练等级转换为属性加成', () => {
    const bonuses = calculateTrainingBonuses(normalizeTrainingLevels({ attack: 2, vitality: 1, guard: 3 }));

    expect(bonuses.attack).toBe(4);
    expect(bonuses.hp).toBe(18);
    expect(bonuses.armor).toBe(9);
  });

  it('应给出升级预览并识别金币不足和满级', () => {
    const vitality = trainingDefinitions.find((definition) => definition.id === 'vitality')!;
    const levels = normalizeTrainingLevels({ vitality: 0 });

    expect(getTrainingUpgradePreview(vitality, levels, 0).canAfford).toBe(false);
    expect(getTrainingUpgradePreview(vitality, levels, 1000).canAfford).toBe(true);

    const maxed = normalizeTrainingLevels({ vitality: vitality.maxLevel });
    expect(getTrainingUpgradePreview(vitality, maxed, 999999).isMaxed).toBe(true);
    expect(getTrainingUpgradePreview(vitality, maxed, 999999).canAfford).toBe(false);
  });

  it('升级训练等级时不应超过上限', () => {
    const attack = trainingDefinitions.find((definition) => definition.id === 'attack')!;
    const levels = normalizeTrainingLevels({ attack: attack.maxLevel });

    expect(upgradeTrainingLevel(levels, 'attack').attack).toBe(attack.maxLevel);
  });
});
