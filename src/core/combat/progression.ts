import { getStageConfig } from '@/data/monsters';
import { calculateDps, calculateEhp } from '@/core/player/calculator';
import type { ProgressionTargetSummary, StageFailureReason, StageTargetEvaluation } from '@/types/combat';
import type { PlayerBuild } from '@/types/player';
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

function getAdviceText(evaluation: Omit<StageTargetEvaluation, 'adviceText'>): string {
  if (!evaluation.canClear) return `${evaluation.failureText} 建议先回到推荐挂机层积累装备。`;
  if (evaluation.rewardMultiplier < FARM_REWARD_THRESHOLD) return `${evaluation.rewardText} 建议降低挂机层数提高效率。`;
  return `预计 ${formatTime(evaluation.killTime)} 击杀，适合当前阶段。`;
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
  const goldPerSecond = failureReason === 'none' ? (monster.gold * rewardMultiplier) / effectiveKillTime : 0;
  const expPerSecond = failureReason === 'none' ? (monster.exp * rewardMultiplier) / effectiveKillTime : 0;
  const baseEvaluation = {
    stage: stageConfig.id,
    stageName: stageConfig.name,
    monsterName: monster.name,
    recommendedPower: stageConfig.recommendedPower,
    playerPower,
    rewardMultiplier,
    canClear: failureReason === 'none',
    killTime: roundTime(killTime),
    survivalTime: roundTime(survivalTime),
    goldPerSecond: Math.round(goldPerSecond * 100) / 100,
    expPerSecond: Math.round(expPerSecond * 100) / 100,
    farmScore: Math.round((goldPerSecond + expPerSecond) * 100) / 100,
    failureReason,
    failureText: getFailureText(failureReason),
    rewardText: getRewardText(rewardMultiplier),
  };

  return {
    ...baseEvaluation,
    adviceText: getAdviceText(baseEvaluation),
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
  };
}
