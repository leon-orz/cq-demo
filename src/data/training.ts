import type { TrainingDefinition, TrainingId, TrainingLevels } from '@/types/player';

export const trainingDefinitions: TrainingDefinition[] = [
  {
    id: 'attack',
    name: '攻击训练',
    description: '提高基础攻击，直接提升清怪速度。',
    stat: 'attack',
    valuePerLevel: 2,
    maxLevel: 20,
    costBase: 80,
    costGrowth: 1.22,
  },
  {
    id: 'vitality',
    name: '体魄训练',
    description: '提高基础生命，增加推层容错。',
    stat: 'hp',
    valuePerLevel: 18,
    maxLevel: 20,
    costBase: 70,
    costGrowth: 1.2,
  },
  {
    id: 'guard',
    name: '防御训练',
    description: '提高基础护甲，缓解高攻怪压力。',
    stat: 'armor',
    valuePerLevel: 3,
    maxLevel: 20,
    costBase: 75,
    costGrowth: 1.21,
  },
];

export const trainingIds = trainingDefinitions.map((definition) => definition.id) as TrainingId[];

export function createDefaultTrainingLevels(): TrainingLevels {
  return trainingDefinitions.reduce((levels, definition) => {
    levels[definition.id] = 0;
    return levels;
  }, {} as TrainingLevels);
}
