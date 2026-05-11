import { getStageConfig } from '@/data/monsters';
import { generateItem } from '@/core/item/generator';
import { calculateDps } from '@/core/player/calculator';
import type { BatchResult, CombatResult, DamageEvent, Monster, StageConfig } from '@/types/combat';
import type { PlayerBuild } from '@/types/player';
import type { RandomSource } from '@/core/utils/random';
import { defaultRandom, pickOne } from '@/core/utils/random';
import { getEffectiveDropChance } from './economy';
import { calculateKillTime, calculateMonsterDps } from './formula';

function generateDamageTimeline(
  duration: number,
  dps: number,
  critChance: number,
  critDamage: number,
  random: RandomSource,
): DamageEvent[] {
  const events: DamageEvent[] = [];
  const eventCount = Math.max(1, Math.ceil(duration));

  for (let index = 0; index < eventCount; index += 1) {
    const isCrit = random.next() < critChance / 100;
    const damage = Math.round(dps * (isCrit ? critDamage / 100 : 1));
    events.push({
      timestamp: index * 1000,
      damage,
      isCrit,
      isKill: index === eventCount - 1,
    });
  }

  return events;
}

export function simulateCombat(
  player: PlayerBuild,
  monster: Monster,
  maxDuration = 60,
  random: RandomSource = defaultRandom,
): CombatResult {
  const dps = calculateDps(player.baseStats, player.mainAttribute);
  const monsterDps = calculateMonsterDps(monster, player.baseStats);
  const timeToKill = calculateKillTime(monster.hp, dps);
  const timeToDie = calculateKillTime(player.baseStats.hp, monsterDps);

  if (timeToKill >= maxDuration || timeToKill >= timeToDie) {
    return {
      win: false,
      duration: Math.min(maxDuration, timeToDie),
      playerHpLost: Math.round(monsterDps * Math.min(maxDuration, timeToDie)),
      drops: [],
      gold: 0,
      exp: 0,
      damageEvents: [],
    };
  }

  const shouldDrop = random.next() < getEffectiveDropChance(monster, player.baseStats);

  return {
    win: true,
    duration: Math.round(timeToKill * 100) / 100,
    playerHpLost: Math.round(monsterDps * timeToKill),
    drops: shouldDrop ? [generateItem(monster.level, undefined, random)] : [],
    gold: monster.gold,
    exp: monster.exp,
    damageEvents: generateDamageTimeline(
      timeToKill,
      dps,
      player.baseStats.critChance,
      player.baseStats.critDamage,
      random,
    ),
  };
}

export function simulateStageCombat(
  player: PlayerBuild,
  stage: number,
  random: RandomSource = defaultRandom,
): CombatResult {
  const stageConfig = getStageConfig(stage);
  return simulateCombat(player, pickOne(stageConfig.monsters, random), 60, random);
}

export function simulateBatchCombat(
  player: PlayerBuild,
  stageConfig: StageConfig,
  totalSeconds: number,
  random: RandomSource = defaultRandom,
): BatchResult {
  let remainingSeconds = totalSeconds;
  let kills = 0;
  let gold = 0;
  let exp = 0;
  const drops: BatchResult['drops'] = [];
  const encounters: BatchResult['encounters'] = [];
  let elapsedSeconds = 0;

  while (remainingSeconds > 0 && kills < 10000) {
    const result = simulateCombat(player, pickOne(stageConfig.monsters, random), remainingSeconds, random);
    if (!result.win) break;

    kills += 1;
    gold += result.gold;
    exp += result.exp;
    drops.push(...result.drops);
    remainingSeconds -= result.duration;
    elapsedSeconds += result.duration;
    encounters.push({
      elapsedSeconds,
      duration: result.duration,
      gold: result.gold,
      exp: result.exp,
      drops: result.drops,
    });
  }

  return {
    kills,
    gold,
    exp,
    drops,
    encounters,
    actualSeconds: totalSeconds - remainingSeconds,
  };
}
