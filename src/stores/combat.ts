import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { CombatLogEntry, CombatResult } from '@/types';
import { CombatEngine } from '@/core/CombatEngine';
import { FloorScaling } from '@/core/FloorScaling';
import { LootGenerator } from '@/core/LootGenerator';
import { GAME_CONSTANTS } from '@/utils/constants';
import { generateId } from '@/utils/math';
import { useEquipmentStore } from './equipment';
import { usePlayerStore } from './player';

type PauseReason = '' | 'death' | 'inventory_full' | 'manual';

export const useCombatStore = defineStore('combat', () => {
  const currentFloor = ref(1);
  const isAutoCombat = ref(false);
  const combatLog = ref<CombatLogEntry[]>([]);
  const killCount = ref(0);
  const isPaused = ref(false);
  const pauseReason = ref<PauseReason>('');
  const lastCombatResult = ref<CombatResult | null>(null);
  const loopId = ref<ReturnType<typeof setInterval> | null>(null);

  const playerStore = usePlayerStore();
  const equipmentStore = useEquipmentStore();
  const currentMonster = computed(() => FloorScaling.getMonsterForFloor(currentFloor.value));
  const recommendedFloor = computed(() => FloorScaling.getRecommendedFloor(playerStore.player));
  const recommendedPower = computed(() => FloorScaling.getRecommendedPower(currentFloor.value));
  const rewardMultiplier = computed(() => FloorScaling.getRewardMultiplier(playerStore.power, recommendedPower.value));
  const canAdvanceFloor = computed(
    () => playerStore.power >= FloorScaling.getRecommendedPower(currentFloor.value + 1) * 0.6,
  );

  function startAutoCombat(): void {
    if (isAutoCombat.value) return;
    isAutoCombat.value = true;
    isPaused.value = false;
    pauseReason.value = '';
    addLog('system', '开始挂机战斗');
    loopId.value = setInterval(() => {
      executeBattle();
    }, GAME_CONSTANTS.COMBAT_INTERVAL_MS);
  }

  function stopAutoCombat(reason: PauseReason = 'manual'): void {
    if (loopId.value) window.clearInterval(loopId.value);
    loopId.value = null;
    isAutoCombat.value = false;
    isPaused.value = reason !== '';
    pauseReason.value = reason;
    if (reason === 'manual') addLog('system', '已停止挂机');
    else if (reason === 'inventory_full') addLog('system', '背包已满，挂机暂停');
    else if (reason) addLog('system', `挂机暂停：${reason}`);
  }

  function executeBattle(): CombatResult {
    if (equipmentStore.isInventoryFull) {
      stopAutoCombat('inventory_full');
      const result = createEmptyCombatResult();
      lastCombatResult.value = result;
      return result;
    }

    const monster = currentMonster.value;
    const result = CombatEngine.simulateBattle(playerStore.player, monster);
    const rewardRate = rewardMultiplier.value;

    if (result.win) {
      result.goldEarned = FloorScaling.getGoldReward(currentFloor.value, rewardRate, monster.type);
      result.expEarned = FloorScaling.getExpReward(currentFloor.value, rewardRate, monster.type);
      if (LootGenerator.shouldDrop(playerStore.player.magicFind) && !equipmentStore.isInventoryFull) {
        result.drops.push(LootGenerator.generateDrop(currentFloor.value, playerStore.player.magicFind));
      }
      playerStore.gainGold(result.goldEarned * (1 + playerStore.player.goldFind));
      playerStore.gainExp(result.expEarned * (1 + playerStore.player.expFind));
      result.drops.forEach((item) => equipmentStore.addToInventory(item));
      killCount.value += 1;
      playerStore.setFloor(Math.max(playerStore.player.highestFloor, currentFloor.value));
      addLog('win', `击杀 ${monster.name}，获得 ${result.goldEarned} 金币 / ${result.expEarned} 经验`);
      result.drops.forEach((item) => addLog('loot', `获得装备：${item.name}`));
    } else {
      addLog('loss', `${monster.name} 击败了你，建议降低层数或更换装备`);
      stopAutoCombat('death');
    }

    lastCombatResult.value = result;
    return result;
  }

  function createEmptyCombatResult(): CombatResult {
    return {
      win: false,
      rounds: 0,
      playerDmgTotal: 0,
      monsterDmgTotal: 0,
      playerHpRemaining: playerStore.player.hp,
      monsterHpRemaining: currentMonster.value.hp,
      drops: [],
      goldEarned: 0,
      expEarned: 0,
      killTime: 0,
      survivalTime: 0,
    };
  }

  function changeFloor(floor: number): boolean {
    const nextFloor = Math.max(1, Math.floor(floor));
    if (
      nextFloor > playerStore.player.highestFloor + 1 &&
      playerStore.power < FloorScaling.getRecommendedPower(nextFloor) * 0.6
    ) {
      return false;
    }
    currentFloor.value = nextFloor;
    playerStore.setFloor(nextFloor);
    addLog('system', `切换到第 ${nextFloor} 层`);
    return true;
  }

  function resumeCombat(): void {
    startAutoCombat();
  }

  function addLog(type: CombatLogEntry['type'], message: string): void {
    combatLog.value.unshift({
      id: generateId('log'),
      type,
      message,
      timestamp: Date.now(),
    });
    combatLog.value = combatLog.value.slice(0, 60);
  }

  function applySaveState(state: {
    currentFloor: number;
    isAutoCombat: boolean;
    killCount: number;
    combatLog: CombatLogEntry[];
  }): void {
    currentFloor.value = state.currentFloor;
    killCount.value = state.killCount;
    combatLog.value = structuredClone(state.combatLog);
    if (state.isAutoCombat) startAutoCombat();
  }

  function $reset(): void {
    stopAutoCombat('');
    currentFloor.value = 1;
    combatLog.value = [];
    killCount.value = 0;
    isPaused.value = false;
    pauseReason.value = '';
    lastCombatResult.value = null;
  }

  return {
    currentFloor,
    isAutoCombat,
    combatLog,
    killCount,
    isPaused,
    pauseReason,
    lastCombatResult,
    currentMonster,
    recommendedFloor,
    recommendedPower,
    rewardMultiplier,
    canAdvanceFloor,
    startAutoCombat,
    stopAutoCombat,
    executeBattle,
    changeFloor,
    resumeCombat,
    addLog,
    applySaveState,
    $reset,
  };
});
