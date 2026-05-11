import type { Monster, MonsterArchetype, RewardFocus, StageConfig, StageTag } from '@/types/combat';

interface ArchetypeProfile {
  archetype: MonsterArchetype;
  name: string;
  hpMultiplier: number;
  attackMultiplier: number;
  goldMultiplier: number;
  expMultiplier: number;
  dropChance: number;
  dropValueMultiplier: number;
}

interface BossProfile extends ArchetypeProfile {
  archetype: 'boss';
}

interface RewardFocusProfile {
  tags: StageTag[];
  goldMultiplier: number;
  expMultiplier: number;
  dropChanceMultiplier: number;
  dropValueMultiplier: number;
}

const ARCHETYPE_PROFILES: Record<Exclude<MonsterArchetype, 'boss'>, ArchetypeProfile> = {
  balanced: {
    archetype: 'balanced',
    name: '腐化行者',
    hpMultiplier: 1,
    attackMultiplier: 1,
    goldMultiplier: 1,
    expMultiplier: 1,
    dropChance: 0.35,
    dropValueMultiplier: 1,
  },
  highHp: {
    archetype: 'highHp',
    name: '腐化巨躯',
    hpMultiplier: 1.45,
    attackMultiplier: 0.88,
    goldMultiplier: 1.08,
    expMultiplier: 1.05,
    dropChance: 0.35,
    dropValueMultiplier: 1.05,
  },
  highAttack: {
    archetype: 'highAttack',
    name: '裂刃袭击者',
    hpMultiplier: 0.9,
    attackMultiplier: 1.42,
    goldMultiplier: 1.02,
    expMultiplier: 1.1,
    dropChance: 0.35,
    dropValueMultiplier: 1,
  },
  reward: {
    archetype: 'reward',
    name: '藏宝仆从',
    hpMultiplier: 1.05,
    attackMultiplier: 0.95,
    goldMultiplier: 1.25,
    expMultiplier: 1.18,
    dropChance: 0.46,
    dropValueMultiplier: 1.28,
  },
};

const REWARD_FOCUS_PROFILES: Record<RewardFocus, RewardFocusProfile> = {
  balanced: {
    tags: [],
    goldMultiplier: 1,
    expMultiplier: 1,
    dropChanceMultiplier: 1,
    dropValueMultiplier: 1,
  },
  gold: {
    tags: ['gold'],
    goldMultiplier: 1.75,
    expMultiplier: 1,
    dropChanceMultiplier: 1,
    dropValueMultiplier: 1,
  },
  exp: {
    tags: ['exp'],
    goldMultiplier: 1,
    expMultiplier: 1.75,
    dropChanceMultiplier: 1,
    dropValueMultiplier: 1,
  },
  gear: {
    tags: ['gear'],
    goldMultiplier: 1,
    expMultiplier: 1,
    dropChanceMultiplier: 1.25,
    dropValueMultiplier: 1.6,
  },
};

function getNormalArchetype(stage: number): Exclude<MonsterArchetype, 'boss'> {
  const sequence: Exclude<MonsterArchetype, 'boss'>[] = ['balanced', 'highHp', 'highAttack', 'reward'];
  return sequence[(stage - 1) % sequence.length]!;
}

function getBossRewardFocus(stage: number): RewardFocus {
  const bossIndex = Math.max(1, Math.floor(stage / 10));
  const sequence: RewardFocus[] = ['gold', 'exp', 'gear'];
  return sequence[(bossIndex - 1) % sequence.length]!;
}

function getNormalRewardFocus(archetype: MonsterArchetype): RewardFocus {
  return archetype === 'reward' ? 'gear' : 'balanced';
}

export function createMonster(stage: number): Monster {
  const level = stage * 2 + 8;
  const growth = Math.pow(1.1, stage - 1);
  const isBoss = stage % 10 === 0;
  const normalArchetype = getNormalArchetype(stage);
  const bossProfile: BossProfile = {
    archetype: 'boss',
    name: `第 ${stage} 层首领`,
    hpMultiplier: 1.8,
    attackMultiplier: 1.35,
    goldMultiplier: 2.5,
    expMultiplier: 2.5,
    dropChance: 0.65,
    dropValueMultiplier: 2.2,
  };
  const profile = isBoss ? bossProfile : ARCHETYPE_PROFILES[normalArchetype];
  const archetype = profile.archetype;
  const rewardFocus = isBoss ? getBossRewardFocus(stage) : getNormalRewardFocus(archetype);
  const rewardFocusProfile = REWARD_FOCUS_PROFILES[rewardFocus];

  return {
    id: `monster_${stage}`,
    name: profile.name,
    archetype,
    level,
    hp: Math.round(70 * growth * profile.hpMultiplier),
    attack: Math.round(8 * growth * profile.attackMultiplier),
    gold: Math.round(10 * stage * growth * profile.goldMultiplier * rewardFocusProfile.goldMultiplier),
    exp: Math.round(12 * stage * growth * profile.expMultiplier * rewardFocusProfile.expMultiplier),
    isBoss,
    dropChance: Math.min(0.95, profile.dropChance * rewardFocusProfile.dropChanceMultiplier),
    dropValueMultiplier: profile.dropValueMultiplier * rewardFocusProfile.dropValueMultiplier,
  };
}

export function getStageConfig(stage: number): StageConfig {
  const monster = createMonster(stage);
  const rewardFocus = monster.isBoss ? getBossRewardFocus(stage) : getNormalRewardFocus(monster.archetype);
  const rewardFocusProfile = REWARD_FOCUS_PROFILES[rewardFocus];
  const tags: StageTag[] = monster.isBoss ? ['boss', ...rewardFocusProfile.tags] : [...rewardFocusProfile.tags];
  const archetypePowerMultiplier =
    monster.archetype === 'highHp'
      ? 1.08
      : monster.archetype === 'highAttack'
        ? 1.1
        : monster.archetype === 'reward'
          ? 1.04
          : 1;
  const recommendedPower = Math.round(
    100 * Math.pow(1.12, stage - 1) * (monster.isBoss ? 1.35 : archetypePowerMultiplier),
  );

  return {
    id: stage,
    name: `第 ${stage} 层`,
    recommendedPower,
    tags,
    rewardFocus,
    monsters: [monster],
  };
}
