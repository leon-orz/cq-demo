import type { Monster, StageConfig } from '@/types/combat';

export function createMonster(stage: number): Monster {
  const level = stage * 2 + 8;
  const growth = Math.pow(1.1, stage - 1);

  return {
    id: `monster_${stage}`,
    name: stage % 10 === 0 ? `第 ${stage} 层首领` : `腐化行者`,
    level,
    hp: Math.round(70 * growth),
    attack: Math.round(8 * growth),
    gold: Math.round(10 * stage * growth),
    exp: Math.round(12 * stage * growth),
  };
}

export function getStageConfig(stage: number): StageConfig {
  const monster = createMonster(stage);

  return {
    id: stage,
    name: `第 ${stage} 层`,
    recommendedPower: Math.round(100 * Math.pow(1.12, stage - 1)),
    monsters: [monster],
  };
}
