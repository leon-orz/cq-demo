import { getStageConfig } from '@/data/monsters';
import { calculateDps, calculateEhp } from '@/core/player/calculator';
import type {
  BossTargetSummary,
  ProgressionTargetSummary,
  RewardDominant,
  RewardFocus,
  StageFailureReason,
  StageTargetEvaluation,
} from '@/types/combat';
import type { PlayerBuild } from '@/types/player';
import type { StatBlock } from '@/types/item';
import { getExpectedDropValue, getGoldWithFind } from './economy';
import { calculateKillTime, calculateMonsterDps, calculateRewardMultiplier } from './formula';
import { calculatePlayerPower } from './reward';

const MAX_STAGE_SCAN = 120;
const COMBAT_TIME_LIMIT = 60;
const FARM_REWARD_THRESHOLD = 0.8;
const FARM_SCORE_TIE_RATIO = 0.95;

function roundTime(value: number): number {
  if (!Number.isFinite(value)) return Number.POSITIVE_INFINITY;
  return Math.round(value * 10) / 10;
}

function formatTime(value: number): string {
  if (!Number.isFinite(value)) return '无法击杀';
  return `${roundTime(value)} 秒`;
}

function getFailureReason(killTime: number, survivalTime: number): StageFailureReason {
  const lacksDamage = killTime >= COMBAT_TIME_LIMIT;
  const lacksSurvival = killTime >= survivalTime;

  if (lacksDamage && lacksSurvival) return 'both';
  if (lacksDamage) return 'timeout';
  if (lacksSurvival) return 'survival';
  return 'none';
}

function getFailureText(reason: StageFailureReason): string {
  const texts: Record<StageFailureReason, string> = {
    none: '预计可以通关。',
    survival: '生存不足，会在击杀前倒下。',
    both: '输出和生存都不足。',
    timeout: '输出不足，无法在时限内击杀。',
  };
  return texts[reason];
}

function getRewardText(multiplier: number): string {
  if (multiplier >= 1) return '收益完整。';
  if (multiplier >= 0.8) return '战力略低，收益降至 80%。';
  if (multiplier >= 0.5) return '战力不足，收益降至 50%。';
  return '战力严重不足，收益降至 20%。';
}

function getAdviceText(evaluation: Omit<StageTargetEvaluation, 'adviceText' | 'recommendReason'>): string {
  if (!evaluation.canClear) return `${evaluation.failureText} 建议先回到推荐挂机层积累装备。`;
  if (evaluation.rewardMultiplier < FARM_REWARD_THRESHOLD) return `${evaluation.rewardText} 建议降低挂机层数提高效率。`;
  return `预计 ${formatTime(evaluation.killTime)} 击杀，适合当前阶段。`;
}

function getRecommendReason(
  evaluation: Omit<StageTargetEvaluation, 'adviceText' | 'recommendReason'>,
  stats: StatBlock,
): string {
  if (!evaluation.canClear) return evaluation.failureText;

  const hasGoldFind = (stats.goldFind ?? 0) > 0 && evaluation.goldPerSecond > 0;
  const hasMagicFind = (stats.magicFind ?? 0) > 0 && evaluation.dropValuePerSecond > 0;
  if (hasGoldFind && hasMagicFind) return '寻宝属性正在放大金币和掉落期望，适合稳定刷收益。';
  if (hasGoldFind) return '金币获取加成正在放大本层收益，适合补充养成消耗。';
  if (hasMagicFind) return '魔法发现正在放大掉落期望，适合刷装备替换。';

  const hasBossTag = evaluation.tags.includes('boss');
  if (evaluation.rewardFocus === 'gold') {
    return hasBossTag ? 'Boss 金币奖励集中，适合补充养成消耗。' : '金币收益更高，适合补充养成消耗。';
  }
  if (evaluation.rewardFocus === 'exp') {
    return hasBossTag ? 'Boss 经验奖励集中，适合提升角色等级。' : '经验收益更高，适合提升角色等级。';
  }
  if (evaluation.rewardFocus === 'gear') {
    return hasBossTag ? 'Boss 掉落价值更高，适合集中刷装备。' : '掉落价值更高，适合刷装备替换。';
  }
  if (evaluation.monsterArchetype === 'highHp') return '高血怪更考验输出，当前击杀效率仍然稳定。';
  if (evaluation.monsterArchetype === 'highAttack') return '高攻怪更考验生存，当前承伤压力可控。';
  return '收益和击杀效率均衡，适合稳定挂机。';
}

function getRewardDominant(goldPerSecond: number, expPerSecond: number, dropValuePerSecond: number): RewardDominant {
  const values: Array<{ focus: RewardFocus; value: number }> = [
    { focus: 'gold', value: goldPerSecond },
    { focus: 'exp', value: expPerSecond },
    { focus: 'gear', value: dropValuePerSecond },
  ];
  const sorted = [...values].sort((first, second) => second.value - first.value);
  const top = sorted[0]!;
  const second = sorted[1]!;
  if (top.value <= 0 || top.value < second.value * 1.2) return 'balanced';
  return top.focus;
}

export function evaluateStageTarget(player: PlayerBuild, stage: number): StageTargetEvaluation {
  const stageConfig = getStageConfig(Math.max(1, stage));
  const monster = stageConfig.monsters[0]!;
  const dps = calculateDps(player.baseStats, player.mainAttribute);
  const monsterDps = calculateMonsterDps(monster, player.baseStats);
  const killTime = calculateKillTime(monster.hp, dps);
  const survivalTime = calculateKillTime(player.baseStats.hp, monsterDps);
  const failureReason = getFailureReason(killTime, survivalTime);
  const ehp = calculateEhp(player.baseStats, monster.level);
  const playerPower = calculatePlayerPower(Math.round(dps), Math.round(ehp));
  const rewardMultiplier = calculateRewardMultiplier(playerPower, stageConfig.recommendedPower);
  const effectiveKillTime = Math.max(1, Math.min(COMBAT_TIME_LIMIT, roundTime(killTime)));
  const goldPerSecond =
    failureReason === 'none'
      ? (getGoldWithFind(monster.gold, player.baseStats) * rewardMultiplier) / effectiveKillTime
      : 0;
  const expPerSecond = failureReason === 'none' ? (monster.exp * rewardMultiplier) / effectiveKillTime : 0;
  const dropValue = getExpectedDropValue(monster, player.baseStats);
  const dropValuePerSecond = failureReason === 'none' ? (dropValue * rewardMultiplier) / effectiveKillTime : 0;
  const roundedGoldPerSecond = Math.round(goldPerSecond * 100) / 100;
  const roundedExpPerSecond = Math.round(expPerSecond * 100) / 100;
  const roundedDropValuePerSecond = Math.round(dropValuePerSecond * 100) / 100;
  const farmScore = Math.round((goldPerSecond + expPerSecond + dropValuePerSecond) * 100) / 100;
  const baseEvaluation = {
    stage: stageConfig.id,
    stageName: stageConfig.name,
    monsterName: monster.name,
    monsterArchetype: monster.archetype,
    tags: stageConfig.tags,
    rewardFocus: stageConfig.rewardFocus,
    recommendedPower: stageConfig.recommendedPower,
    playerPower,
    rewardMultiplier,
    canClear: failureReason === 'none',
    killTime: roundTime(killTime),
    survivalTime: roundTime(survivalTime),
    goldPerSecond: roundedGoldPerSecond,
    expPerSecond: roundedExpPerSecond,
    dropValuePerSecond: roundedDropValuePerSecond,
    rewardBreakdown: {
      goldPerSecond: roundedGoldPerSecond,
      expPerSecond: roundedExpPerSecond,
      dropValuePerSecond: roundedDropValuePerSecond,
      totalScore: farmScore,
      dominant: getRewardDominant(goldPerSecond, expPerSecond, dropValuePerSecond),
    },
    farmScore,
    failureReason,
    failureText: getFailureText(failureReason),
    rewardText: getRewardText(rewardMultiplier),
  };

  return {
    ...baseEvaluation,
    adviceText: getAdviceText(baseEvaluation),
    recommendReason: getRecommendReason(baseEvaluation, player.baseStats),
  };
}

function getNextBossStage(highestUnlockedStage: number): number {
  return Math.min(MAX_STAGE_SCAN, Math.max(10, Math.ceil((highestUnlockedStage + 1) / 10) * 10));
}

function getBossReason(evaluation: StageTargetEvaluation): string {
  if (!evaluation.canClear) return `${evaluation.failureText} 建议先在推荐层积累装备。`;
  const focusTexts: Record<RewardFocus, string> = {
    balanced: '奖励均衡',
    gold: '金币奖励集中',
    exp: '经验奖励集中',
    gear: '装备掉落集中',
  };
  return `${focusTexts[evaluation.rewardFocus]}，当前预计可以挑战。`;
}

function getBossTarget(player: PlayerBuild, highestUnlockedStage: number): BossTargetSummary {
  const bossStage = getNextBossStage(highestUnlockedStage);
  const evaluation = evaluateStageTarget(player, bossStage);
  return {
    stage: bossStage,
    rewardFocus: evaluation.rewardFocus,
    canClear: evaluation.canClear,
    recommendedPower: evaluation.recommendedPower,
    playerPower: evaluation.playerPower,
    powerGap: Math.max(0, evaluation.recommendedPower - evaluation.playerPower),
    stagesAway: Math.max(0, bossStage - highestUnlockedStage),
    reason: getBossReason(evaluation),
  };
}

function isBetterFarmTarget(candidate: StageTargetEvaluation, current: StageTargetEvaluation): boolean {
  if (!candidate.canClear) return false;
  if (!current.canClear) return true;
  if (candidate.farmScore > current.farmScore) return true;
  return candidate.farmScore >= current.farmScore * FARM_SCORE_TIE_RATIO && candidate.stage > current.stage;
}

export function getProgressionTargetSummary(
  player: PlayerBuild,
  currentStage: number,
  highestUnlockedStage: number,
): ProgressionTargetSummary {
  const safeCurrentStage = Math.max(1, currentStage);
  const safeHighestStage = Math.max(1, highestUnlockedStage);
  const current = evaluateStageTarget(player, safeCurrentStage);

  let recommendedFarm = evaluateStageTarget(player, 1);
  for (let stage = 1; stage <= safeHighestStage; stage += 1) {
    const evaluation = evaluateStageTarget(player, stage);
    if (isBetterFarmTarget(evaluation, recommendedFarm)) {
      recommendedFarm = evaluation;
    }
  }

  const nextUnlockStage = Math.min(safeHighestStage + 1, MAX_STAGE_SCAN);
  const nextChallenge = evaluateStageTarget(player, nextUnlockStage);
  const suggestedChallenge = nextChallenge.canClear ? nextChallenge : recommendedFarm;

  return {
    current,
    recommendedFarmStage: recommendedFarm.stage,
    recommendedFarm,
    suggestedChallengeStage: suggestedChallenge.stage,
    suggestedChallenge,
    nextUnlockStage,
    bossTarget: getBossTarget(player, safeHighestStage),
  };
}
