import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import type { EquipmentItem, Player } from '@/types';
import { ClassType } from '@/types/enums';
import { CombatEngine } from '@/core/CombatEngine';
import { GAME_CONSTANTS } from '@/utils/constants';
import { LootGenerator } from '@/core/LootGenerator';
import { EnhancementSystem } from '@/core/EnhancementSystem';
import { useEquipmentStore } from './equipment';

export function createDefaultPlayer(): Player {
  return {
    classType: ClassType.WARRIOR,
    level: 1,
    exp: 0,
    expToNext: 100,
    strength: 10,
    agility: 5,
    intelligence: 5,
    hp: 120,
    maxHp: 120,
    atk: 12,
    atkSpd: 1,
    critRate: 0.05,
    critDmg: 1.5,
    armor: 12,
    dodge: 0.02,
    fireDamage: 0,
    iceDamage: 0,
    lightningDamage: 0,
    fireRes: 0,
    iceRes: 0,
    lightningRes: 0,
    goldFind: 0,
    magicFind: 0,
    expFind: 0,
    lifeLeech: 0,
    gold: 120,
    enhancementStones: 8,
    ancientEssence: 0,
    currentFloor: 1,
    highestFloor: 1,
    training: {
      attack: 0,
      vitality: 0,
      defense: 0,
    },
  };
}

export const usePlayerStore = defineStore('player', () => {
  const player = ref<Player>(createDefaultPlayer());

  const dps = computed(() => CombatEngine.calculateDPS(player.value));
  const ehp = computed(() => CombatEngine.calculateEHP(player.value));
  const power = computed(() => CombatEngine.calculatePower(dps.value, ehp.value));
  const mainAttribute = computed(() => CombatEngine.getMainAttribute(player.value));

  function train(type: keyof Player['training']): boolean {
    if (player.value.training[type] >= GAME_CONSTANTS.MAX_TRAINING_LEVEL) return false;
    const cost = getTrainingCost(type);
    if (!spendGold(cost)) return false;
    player.value.training[type] += 1;
    recalculateStats();
    return true;
  }

  function getTrainingCost(type: keyof Player['training']): number {
    const baseCost = type === 'attack' ? 25 : type === 'vitality' ? 20 : 22;
    return Math.floor(baseCost * Math.pow(GAME_CONSTANTS.TRAINING_COST_GROWTH, player.value.training[type]));
  }

  function spendGold(amount: number): boolean {
    if (player.value.gold < amount) return false;
    player.value.gold -= amount;
    return true;
  }

  function gainGold(amount: number): void {
    player.value.gold += Math.max(0, Math.floor(amount));
  }

  function gainExp(amount: number): void {
    player.value.exp += Math.max(0, Math.floor(amount));
    while (player.value.exp >= player.value.expToNext) {
      player.value.exp -= player.value.expToNext;
      levelUp();
    }
  }

  function gainEnhancementStones(amount: number): void {
    player.value.enhancementStones += Math.max(0, Math.floor(amount));
  }

  function consumeEnhancementCost(gold: number, stones: number): boolean {
    if (player.value.gold < gold || player.value.enhancementStones < stones) return false;
    player.value.gold -= gold;
    player.value.enhancementStones -= stones;
    return true;
  }

  function levelUp(): void {
    player.value.level += 1;
    player.value.expToNext = Math.floor(player.value.expToNext * 1.18 + 20);
    player.value.strength += player.value.classType === ClassType.WARRIOR ? 3 : 1;
    player.value.agility += player.value.classType === ClassType.ROGUE ? 3 : 1;
    player.value.intelligence += player.value.classType === ClassType.MAGE ? 3 : 1;
    recalculateStats();
  }

  function changeClass(classType: ClassType): void {
    player.value.classType = classType;
    recalculateStats();
  }

  function setFloor(floor: number): void {
    const safeFloor = Math.max(1, Math.floor(floor));
    player.value.currentFloor = safeFloor;
    player.value.highestFloor = Math.max(player.value.highestFloor, safeFloor);
  }

  function applySaveState(savedPlayer: Player): void {
    player.value = structuredClone(savedPlayer);
    recalculateStats();
  }

  function recalculateStats(): void {
    const preserved = {
      gold: player.value.gold,
      enhancementStones: player.value.enhancementStones,
      ancientEssence: player.value.ancientEssence,
      currentFloor: player.value.currentFloor,
      highestFloor: player.value.highestFloor,
      level: player.value.level,
      exp: player.value.exp,
      expToNext: player.value.expToNext,
      classType: player.value.classType,
      training: { ...player.value.training },
    };
    const next = createDefaultPlayer();
    next.gold = preserved.gold;
    next.enhancementStones = preserved.enhancementStones;
    next.ancientEssence = preserved.ancientEssence;
    next.currentFloor = preserved.currentFloor;
    next.highestFloor = preserved.highestFloor;
    next.level = preserved.level;
    next.exp = preserved.exp;
    next.expToNext = preserved.expToNext;
    next.classType = preserved.classType;
    next.training = preserved.training;
    next.strength += (next.level - 1) * (next.classType === ClassType.WARRIOR ? 3 : 1);
    next.agility += (next.level - 1) * (next.classType === ClassType.ROGUE ? 3 : 1);
    next.intelligence += (next.level - 1) * (next.classType === ClassType.MAGE ? 3 : 1);
    next.atk += trainingBonus(next.training.attack, 2);
    next.maxHp += trainingBonus(next.training.vitality, 18);
    next.armor += trainingBonus(next.training.defense, 3);

    const equipmentStore = useEquipmentStore();
    Object.values(equipmentStore.equipped).forEach((item) => {
      if (item) applyItemToPlayer(next, item);
    });

    next.critRate = Math.min(next.critRate, GAME_CONSTANTS.MAX_CRIT_RATE);
    next.atkSpd = Math.min(next.atkSpd, GAME_CONSTANTS.MAX_ATK_SPD);
    next.dodge = Math.min(next.dodge, GAME_CONSTANTS.MAX_DODGE);
    next.goldFind = Math.min(next.goldFind, GAME_CONSTANTS.GOLD_FIND_CAP);
    next.magicFind = Math.min(next.magicFind, GAME_CONSTANTS.MAGIC_FIND_CAP);
    next.hp = next.maxHp;
    player.value = next;
  }

  function $reset(): void {
    player.value = createDefaultPlayer();
  }

  return {
    player,
    dps,
    ehp,
    power,
    mainAttribute,
    train,
    getTrainingCost,
    spendGold,
    gainGold,
    gainExp,
    gainEnhancementStones,
    consumeEnhancementCost,
    levelUp,
    changeClass,
    setFloor,
    applySaveState,
    recalculateStats,
    $reset,
  };
});

function trainingBonus(level: number, base: number): number {
  return Math.floor(base * level * (1 - Math.min(level, 200) * 0.0008));
}

function applyItemToPlayer(player: Player, item: EquipmentItem): void {
  for (const [stat, value] of Object.entries(EnhancementSystem.getTotalStats(item)) as [keyof Player, number][]) {
    addNumericStat(player, stat, value);
  }
  item.affixes.forEach((affix) => {
    addNumericStat(player, LootGenerator.getAffixStat(affix.type), affix.value);
  });
}

function addNumericStat(player: Player, stat: keyof Player, value: number): void {
  if (typeof player[stat] === 'number') {
    player[stat] = (player[stat] + value) as never;
  }
}
