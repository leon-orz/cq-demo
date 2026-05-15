import type { EquipmentComparison, EquipmentItem, Player } from '@/types';
import { AffixType, ScoreMode } from '@/types/enums';
import { RARITY_ORDER } from '@/utils/constants';
import { CombatEngine } from './CombatEngine';
import { EnhancementSystem } from './EnhancementSystem';
import { LootGenerator } from './LootGenerator';

type WeightMap = Record<string, number>;

const SCORE_MODE_WEIGHTS: Record<ScoreMode, WeightMap> = {
  [ScoreMode.BALANCED]: {
    atk: 2,
    maxHp: 0.2,
    armor: 0.7,
    critRate: 180,
    critDmg: 80,
    atkSpd: 120,
    dodge: 140,
  },
  [ScoreMode.CRIT]: {
    atk: 2,
    maxHp: 0.12,
    armor: 0.4,
    critRate: 360,
    critDmg: 180,
    atkSpd: 100,
  },
  [ScoreMode.ATK_SPEED]: {
    atk: 2,
    maxHp: 0.12,
    armor: 0.4,
    critRate: 160,
    critDmg: 70,
    atkSpd: 260,
  },
  [ScoreMode.TOUGHNESS]: {
    atk: 1,
    maxHp: 0.45,
    armor: 1.6,
    dodge: 280,
    critRate: 60,
  },
  [ScoreMode.MAIN_ATTR]: {
    atk: 2,
    strength: 4,
    agility: 4,
    intelligence: 4,
    maxHp: 0.2,
    armor: 0.7,
  },
};

export class GearScore {
  static scoreEquipment(item: EquipmentItem, player: Player, mode: ScoreMode): number {
    const weights = SCORE_MODE_WEIGHTS[mode];
    const rarityMultiplier = 1 + RARITY_ORDER[item.rarity] * 0.12;
    let score = 0;

    for (const [stat, value] of Object.entries(EnhancementSystem.getTotalStats(item)) as [keyof Player, number][]) {
      score += value * (weights[stat] ?? 1);
    }

    for (const affix of item.affixes) {
      const stat = LootGenerator.getAffixStat(affix.type);
      score += affix.value * (weights[affix.type] ?? weights[stat] ?? 1) * rarityMultiplier;
    }

    const hasCritCombo =
      item.affixes.some((affix) => affix.type === AffixType.EAGLE_EYE) &&
      item.affixes.some((affix) => affix.type === AffixType.CRUEL);
    return Math.floor(score * (hasCritCombo ? 1.2 : 1));
  }

  static compareEquipment(
    newItem: EquipmentItem,
    oldItem: EquipmentItem | null,
    player: Player,
    mode: ScoreMode,
  ): EquipmentComparison {
    const beforePlayer = clonePlayer(player);
    const afterPlayer = this.applyEquipmentDelta(player, oldItem, newItem);
    const beforeDps = CombatEngine.calculateDPS(beforePlayer);
    const beforeEhp = CombatEngine.calculateEHP(beforePlayer);
    const afterDps = CombatEngine.calculateDPS(afterPlayer);
    const afterEhp = CombatEngine.calculateEHP(afterPlayer);
    const scoreDiff =
      this.scoreEquipment(newItem, player, mode) - (oldItem ? this.scoreEquipment(oldItem, player, mode) : 0);

    return {
      slot: newItem.slot,
      dpsDiff: afterDps - beforeDps,
      ehpDiff: afterEhp - beforeEhp,
      scoreDiff,
      isBetter: scoreDiff > 0,
    };
  }

  static applyItemStats(player: Player, item: EquipmentItem): Player {
    return this.applyEquipmentDelta(player, null, item);
  }

  private static applyEquipmentDelta(
    player: Player,
    removeItem: EquipmentItem | null,
    addItem: EquipmentItem | null,
  ): Player {
    const next = clonePlayer(player);
    if (removeItem) this.applyItem(next, removeItem, -1);
    if (addItem) this.applyItem(next, addItem, 1);
    next.hp = next.maxHp;
    return next;
  }

  private static applyItem(player: Player, item: EquipmentItem, direction: 1 | -1): void {
    const applyStat = (stat: keyof Player, value: number) => {
      const currentValue = player[stat];
      if (typeof currentValue === 'number') {
        player[stat] = (currentValue + value * direction) as never;
      }
    };

    for (const [stat, value] of Object.entries(EnhancementSystem.getTotalStats(item)) as [keyof Player, number][]) {
      applyStat(stat, value);
    }

    for (const affix of item.affixes) {
      applyStat(LootGenerator.getAffixStat(affix.type), affix.value);
    }
  }
}

function clonePlayer(player: Player): Player {
  return {
    ...player,
    training: { ...player.training },
  };
}
