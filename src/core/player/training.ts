import { createDefaultTrainingLevels, trainingDefinitions } from '@/data/training';
import type { StatBlock } from '@/types/item';
import type { TrainingDefinition, TrainingId, TrainingLevels } from '@/types/player';

export interface TrainingUpgradePreview {
  definition: TrainingDefinition;
  level: number;
  nextLevel: number;
  cost: number;
  gain: number;
  isMaxed: boolean;
  canAfford: boolean;
}

export function normalizeTrainingLevels(input: Partial<Record<string, number>> = {}): TrainingLevels {
  const levels = createDefaultTrainingLevels();
  trainingDefinitions.forEach((definition) => {
    const rawLevel = input[definition.id];
    const safeLevel = Number.isFinite(rawLevel) ? Math.floor(rawLevel ?? 0) : 0;
    levels[definition.id] = Math.min(definition.maxLevel, Math.max(0, safeLevel));
  });
  return levels;
}

export function findTrainingDefinition(id: string): TrainingDefinition | null {
  return trainingDefinitions.find((definition) => definition.id === id) ?? null;
}

export function calculateTrainingCost(definition: TrainingDefinition, currentLevel: number): number {
  const safeLevel = Math.max(0, Math.floor(currentLevel));
  return Math.round(definition.costBase * definition.costGrowth ** safeLevel);
}

export function calculateTrainingBonuses(trainingLevels: TrainingLevels): StatBlock {
  return trainingDefinitions.reduce((bonuses, definition) => {
    const level = trainingLevels[definition.id] ?? 0;
    bonuses[definition.stat] = (bonuses[definition.stat] ?? 0) + level * definition.valuePerLevel;
    return bonuses;
  }, {} as StatBlock);
}

export function getTrainingUpgradePreview(
  definition: TrainingDefinition,
  trainingLevels: TrainingLevels,
  gold: number,
): TrainingUpgradePreview {
  const level = trainingLevels[definition.id] ?? 0;
  const isMaxed = level >= definition.maxLevel;
  const cost = isMaxed ? 0 : calculateTrainingCost(definition, level);
  return {
    definition,
    level,
    nextLevel: Math.min(definition.maxLevel, level + 1),
    cost,
    gain: definition.valuePerLevel,
    isMaxed,
    canAfford: !isMaxed && gold >= cost,
  };
}

export function upgradeTrainingLevel(trainingLevels: TrainingLevels, id: TrainingId): TrainingLevels {
  const definition = findTrainingDefinition(id);
  if (!definition) return normalizeTrainingLevels(trainingLevels);

  const nextLevels = normalizeTrainingLevels(trainingLevels);
  nextLevels[id] = Math.min(definition.maxLevel, nextLevels[id] + 1);
  return nextLevels;
}
