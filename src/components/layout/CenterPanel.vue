<template>
  <section class="rounded border border-line bg-panel p-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-xs uppercase text-slate-500">当前战斗</p>
        <h2 class="text-2xl font-semibold">{{ combat.stageConfig.name }}</h2>
        <p class="text-sm text-slate-400">
          推荐战力 {{ target.current.recommendedPower }} · 已解锁 {{ combat.highestUnlockedStage }} 层
        </p>
        <div class="mt-2 flex flex-wrap gap-1">
          <span
            v-for="tag in currentStageTags"
            :key="tag"
            class="rounded border border-line bg-slate-950 px-2 py-0.5 text-xs text-slate-300"
          >
            {{ tag }}
          </span>
        </div>
      </div>
      <div class="flex flex-wrap gap-2">
        <button
          class="rounded border border-amber-500 bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="inventory.isFull"
          @click="combat.runSingleCombat()"
        >
          挑战一次
        </button>
        <button
          class="rounded border px-4 py-2 text-sm font-semibold"
          :class="
            combat.isAutoFighting
              ? 'border-red-400 bg-red-500/20 text-red-200 hover:bg-red-500/30'
              : 'border-emerald-400 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
          "
          @click="combat.toggleAutoFighting()"
        >
          {{ combat.isAutoFighting ? '停止挂机' : '自动挂机' }}
        </button>
      </div>
    </div>

    <div class="mt-4 grid gap-3 md:grid-cols-3">
      <div class="rounded border border-line bg-ink p-3 text-sm">
        <p class="text-slate-500">推荐挂机</p>
        <p class="text-lg font-semibold text-emerald-300">第 {{ target.recommendedFarmStage }} 层</p>
        <p class="text-xs text-slate-500">{{ target.recommendedFarm.recommendReason }}</p>
        <div class="mt-2 grid grid-cols-3 gap-1 text-xs">
          <div>
            <p class="text-slate-500">金币/秒</p>
            <p class="text-amber-200">{{ target.recommendedFarm.rewardBreakdown.goldPerSecond }}</p>
          </div>
          <div>
            <p class="text-slate-500">经验/秒</p>
            <p class="text-sky-200">{{ target.recommendedFarm.rewardBreakdown.expPerSecond }}</p>
          </div>
          <div>
            <p class="text-slate-500">掉落/秒</p>
            <p class="text-violet-200">{{ target.recommendedFarm.rewardBreakdown.dropValuePerSecond }}</p>
          </div>
        </div>
        <p class="mt-1 text-xs text-slate-500">主收益：{{ rewardDominantText }}</p>
        <button
          class="mt-2 rounded border border-line px-2 py-1 text-xs text-slate-300 hover:border-slate-500"
          @click="combat.switchToRecommendedFarmStage()"
        >
          切换挂机层
        </button>
      </div>
      <div class="rounded border border-line bg-ink p-3 text-sm">
        <p class="text-slate-500">推层目标</p>
        <p class="text-lg font-semibold text-amber-300">第 {{ target.suggestedChallengeStage }} 层</p>
        <p class="text-xs text-slate-500">
          {{ challengeText }}
        </p>
        <button
          class="mt-2 rounded border border-line px-2 py-1 text-xs text-slate-300 hover:border-slate-500"
          @click="combat.switchToHighestUnlockedStage()"
        >
          前往最高已解锁层
        </button>
      </div>
      <div class="rounded border border-line bg-ink p-3 text-sm">
        <p class="text-slate-500">Boss 目标</p>
        <p class="text-lg font-semibold" :class="target.current.canClear ? 'text-emerald-300' : 'text-red-300'">
          第 {{ target.bossTarget.stage }} 层
        </p>
        <p class="text-xs text-slate-500">{{ bossTargetText }}</p>
      </div>
    </div>

    <div class="mt-5 grid gap-3 lg:grid-cols-[1fr_220px]">
      <div class="relative overflow-hidden rounded border border-line bg-ink p-4">
        <div class="absolute inset-0 opacity-30">
          <div class="h-full w-full bg-[radial-gradient(circle_at_center,#f59e0b22,transparent_55%)]"></div>
        </div>
        <div class="relative flex min-h-48 flex-col items-center justify-center">
          <div
            class="grid h-24 w-24 place-items-center rounded-full border text-4xl shadow-lg"
            :class="
              combat.isAutoFighting
                ? 'border-emerald-400 bg-emerald-500/10 shadow-emerald-900/50'
                : 'border-line bg-slate-950'
            "
            aria-label="怪物占位图"
          >
            {{ monsterSymbol }}
          </div>
          <h3 class="mt-4 text-lg font-semibold">{{ monster.name }}</h3>
          <p class="text-sm text-slate-500">
            {{ combat.isAutoFighting ? '自动战斗中' : '等待挑战' }}
          </p>
        </div>
      </div>

      <div class="rounded border border-line bg-ink p-4">
        <p class="text-sm text-slate-500">怪物</p>
        <h3 class="text-lg font-semibold">{{ monster.name }}</h3>
        <p class="text-xs text-slate-500">{{ monsterArchetypeText }}</p>
        <div class="mt-3 grid grid-cols-3 gap-2 text-sm lg:grid-cols-1">
          <div>
            <p class="text-slate-500">生命</p>
            <p>{{ monster.hp }}</p>
          </div>
          <div>
            <p class="text-slate-500">攻击</p>
            <p>{{ monster.attack }}</p>
          </div>
          <div>
            <p class="text-slate-500">等级</p>
            <p>{{ monster.level }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-3 grid gap-3 md:grid-cols-3">
      <div class="rounded border border-line bg-ink p-3 text-sm">
        <p class="text-slate-500">当前战力</p>
        <p class="text-lg font-semibold text-sky-300">{{ target.current.playerPower }}</p>
      </div>
      <div class="rounded border border-line bg-ink p-3 text-sm">
        <p class="text-slate-500">收益倍率</p>
        <p
          class="text-lg font-semibold"
          :class="target.current.rewardMultiplier < 1 ? 'text-amber-300' : 'text-emerald-300'"
        >
          {{ Math.round(target.current.rewardMultiplier * 100) }}%
        </p>
        <p class="text-xs text-slate-500">{{ target.current.rewardText }}</p>
      </div>
      <div class="rounded border border-line bg-ink p-3 text-sm">
        <p class="text-slate-500">击杀预估</p>
        <p class="text-lg font-semibold text-slate-100">{{ killTimeText }}</p>
        <p class="text-xs text-slate-500">挂机次数 {{ combat.totalAutoRuns }}</p>
      </div>
    </div>

    <div
      v-if="inventory.pressureLevel !== 'normal' || combat.stoppedReason"
      class="mt-3 rounded border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-200"
    >
      {{ combat.stoppedReason ?? inventory.pressureText }}
    </div>

    <div class="mt-3 rounded border border-line bg-ink p-3 text-sm">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p class="text-slate-500">当前评估</p>
          <p class="text-slate-300">{{ target.current.adviceText }}</p>
        </div>
        <p class="text-xs text-slate-500">收益评分 {{ target.current.rewardBreakdown.totalScore }}</p>
      </div>
    </div>

    <BattleLog class="mt-5" :logs="combat.logs" />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import BattleLog from '@/components/combat/BattleLog.vue';
import { useCombatStore } from '@/stores/combat';
import { useInventoryStore } from '@/stores/inventory';
import type { MonsterArchetype, RewardDominant, RewardFocus, StageTag } from '@/types/combat';

const combat = useCombatStore();
const inventory = useInventoryStore();
const monster = computed(() => combat.stageConfig.monsters[0]!);
const target = computed(() => combat.progressionSummary);
const stageTagTexts: Record<StageTag, string> = {
  gold: '金币层',
  exp: '经验层',
  gear: '装备层',
  boss: 'Boss 层',
};
const monsterArchetypeTexts: Record<MonsterArchetype, string> = {
  balanced: '均衡怪',
  highHp: '高血怪',
  highAttack: '高攻怪',
  reward: '奖励怪',
  boss: '首领',
};
const monsterSymbols: Record<MonsterArchetype, string> = {
  balanced: '衡',
  highHp: '盾',
  highAttack: '刃',
  reward: '宝',
  boss: '王',
};
const rewardDominantTexts: Record<RewardDominant, string> = {
  balanced: '均衡',
  gold: '金币',
  exp: '经验',
  gear: '装备',
};
const rewardFocusTexts: Record<RewardFocus, string> = {
  balanced: '均衡',
  gold: '金币',
  exp: '经验',
  gear: '装备',
};
const currentStageTags = computed(() => {
  const tags = target.value.current.tags.map((tag) => stageTagTexts[tag]);
  return tags.length > 0 ? tags : ['普通层'];
});
const monsterArchetypeText = computed(() => monsterArchetypeTexts[monster.value.archetype]);
const monsterSymbol = computed(() => monsterSymbols[monster.value.archetype]);
const killTimeText = computed(() => {
  const killTime = target.value.current.killTime;
  return Number.isFinite(killTime) ? `${killTime} 秒` : '无法击杀';
});
const challengeText = computed(() => {
  if (target.value.suggestedChallengeStage === target.value.nextUnlockStage) {
    return `下一目标第 ${target.value.nextUnlockStage} 层，当前预计可推进。`;
  }
  return `下一目标第 ${target.value.nextUnlockStage} 层，建议先回到推荐挂机层。`;
});
const rewardDominantText = computed(() => rewardDominantTexts[target.value.recommendedFarm.rewardBreakdown.dominant]);
const bossTargetText = computed(() => {
  const boss = target.value.bossTarget;
  const distanceText = boss.stagesAway > 0 ? `距离 ${boss.stagesAway} 层` : '已到达 Boss 区间';
  const gapText = boss.powerGap > 0 ? `战力差 ${boss.powerGap}` : '战力已达标';
  return `${distanceText} · ${rewardFocusTexts[boss.rewardFocus]}倾向 · ${gapText}。${boss.reason}`;
});
</script>
