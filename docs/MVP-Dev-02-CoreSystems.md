# MVP-Dev-02：战斗引擎 + 装备系统

> **MVP模块说明**
> - **前置依赖**：`MVP-Dev-01-Foundation.md`（类型定义、Store、常量）
> - **产出文件**：`core/CombatEngine.ts`, `core/FloorScaling.ts`, `core/OfflineCalculator.ts`, `composables/useCombat.ts`, `core/LootGenerator.ts`, `core/GearScore.ts`, `core/EnhancementSystem.ts`
> - **对应设计文档章节**：第5章（战斗循环）、第6章（装备系统）、第7章（关卡与成长）
> - **MVP边界**：完整保留战斗引擎三件套（CombatEngine/FloorScaling/OfflineCalculator）；完整保留装备系统核心（LootGenerator 18词缀、GearScore 5档评分、装备对比）；强化系统只保留+1~+5（+6~+10标注第二阶段）；去掉策略模式代码、爆发技能代码、套装检测代码、传奇触发特效代码、远古装备生成。

---

## 第4章 战斗引擎（MVP精简版）

### 4.1 核心战斗引擎 `CombatEngine.ts`

MVP保留完整战斗循环，去掉策略模式（激进/稳健/平衡）和爆发技能的加成逻辑。挂机速度固定1x。

```typescript
/**
 * @file core/CombatEngine.ts
 * @description 核心战斗引擎 - MVP精简版
 * 负责回合制战斗计算、伤害公式、暴击判定、战斗结果生成
 * 
 * MVP变更说明：
 * - 移除了策略模式加成（激进/稳健/平衡）
 * - 移除了爆发技能伤害加成
 * - 移除了药水效果加成
 * - 移除了怪物词缀生效逻辑（荆棘/狂怒/护盾等MVP不触发）
 * - 挂机速度固定1x（不做加速）
 */
import { usePlayerStore } from '@/stores/player';
import { useCombatStore } from '@/stores/combat';
import { useEquipmentStore } from '@/stores/equipment';
import type { Monster, CombatResult, AttackRecord } from '@/types';
import { COMBAT_CONSTANTS, FLOOR_CONSTANTS } from '@/utils/constants';

export class CombatEngine {
  /** 当前战斗中的怪物 */
  private monster: Monster | null = null;
  /** 玩家攻击计时器(ms累计) */
  private playerAttackTimer = 0;
  /** 怪物攻击计时器(ms累计) */
  private monsterAttackTimer = 0;
  /** 战斗开始时间戳 */
  private fightStartTime = 0;
  /** 攻击记录 */
  private attackRecords: AttackRecord[] = [];
  /** 总伤害统计 */
  private totalDamageDealt = 0;
  private totalDamageTaken = 0;
  /** 暴击/闪避计数 */
  private critCount = 0;
  private totalHits = 0;
  private dodgeCount = 0;

  /** 
   * 执行单轮战斗（玩家攻击 + 怪物攻击）
   * @param deltaMs 距离上一帧的时间间隔(ms)
   * @returns 是否战斗结束（怪物死亡或玩家死亡）
   */
  tick(deltaMs: number): boolean {
    const player = usePlayerStore();
    const combat = useCombatStore();
    
    if (!this.monster) return true;

    const isPlayerDead = player.player.defense.currentHealth <= 0;
    const isMonsterDead = this.monster.state.currentHealth <= 0;
    if (isPlayerDead || isMonsterDead) return true;

    // 玩家攻击
    this.playerAttackTimer += deltaMs;
    const playerAttackInterval = 1000 / player.player.combat.attackSpeed;
    while (this.playerAttackTimer >= playerAttackInterval) {
      this.playerAttackTimer -= playerAttackInterval;
      this.playerAttack(player, combat);
    }

    // 怪物攻击
    this.monsterAttackTimer += deltaMs;
    const monsterInterval = 1000 / this.monster.attackSpeed;
    while (this.monsterAttackTimer >= monsterInterval) {
      this.monsterAttackTimer -= monsterInterval;
      this.monsterAttack(player);
    }

    return false;
  }

  /** 玩家发起攻击 */
  private playerAttack(player: ReturnType<typeof usePlayerStore>, combat: ReturnType<typeof useCombatStore>): void {
    if (!this.monster) return;

    const stats = player.player.combat;
    const monsterState = this.monster.state;

    // 闪避判定
    if (Math.random() < this.monster.baseDodge) {
      this.dodgeCount++;
      return;
    }

    this.totalHits++;

    // 基础伤害
    let damage = stats.baseAttack;

    // 暴击判定
    let isCrit = false;
    if (Math.random() < stats.critChance) {
      isCrit = true;
      damage *= stats.critDamage;
      this.critCount++;
    }

    // 护甲减伤
    const armorReduction = this.monster.baseArmor / 
      (this.monster.baseArmor + COMBAT_CONSTANTS.ARMOR_REDUCTION_DENOMINATOR);
    damage *= (1 - armorReduction);

    // 最终伤害取整
    damage = Math.max(1, Math.floor(damage));
    
    // 应用伤害
    monsterState.currentHealth -= damage;
    this.totalDamageDealt += damage;

    // 生命偷取
    const lifeSteal = player.player.defense.lifeSteal;
    if (lifeSteal > 0) {
      const healAmount = Math.floor(damage * lifeSteal);
      player.setCurrentHealth(player.player.defense.currentHealth + healAmount);
    }

    // 记录
    this.attackRecords.push({
      timestamp: Date.now() - this.fightStartTime,
      attacker: 'player',
      isCrit,
      rawDamage: damage,
      finalDamage: damage,
      targetRemainingHealth: Math.max(0, monsterState.currentHealth),
      triggeredEffects: [],
    });

    // 怪物死亡判定
    if (monsterState.currentHealth <= 0) {
      combat.onMonsterKilled();
    }
  }

  /** 怪物发起攻击 */
  private monsterAttack(player: ReturnType<typeof usePlayerStore>): void {
    if (!this.monster) return;

    // [第二阶段] 怪物词缀效果在此触发：
    // - THORNS: 反弹伤害（MVP不生效）
    // - FRENZY: 低血量狂暴（MVP不生效）
    // - SHIELD: 护盾生成（MVP不生效）
    // - LEECH: 怪物吸血（MVP不生效）
    // - POISON: 中毒Debuff（MVP不生效）
    // - FORTIFIED: 额外减伤（MVP不生效）

    let damage = this.monster.baseAttack;

    // 护甲减伤
    const playerArmor = player.player.defense.armor;
    const reduction = playerArmor / (playerArmor + COMBAT_CONSTANTS.ARMOR_REDUCTION_DENOMINATOR);
    damage *= (1 - reduction);
    damage = Math.max(1, Math.floor(damage));

    player.setCurrentHealth(player.player.defense.currentHealth - damage);
    this.totalDamageTaken += damage;
  }

  /** 开始一场新战斗 */
  startFight(monster: Monster): void {
    this.monster = monster;
    this.playerAttackTimer = 0;
    this.monsterAttackTimer = 0;
    this.fightStartTime = Date.now();
    this.attackRecords = [];
    this.totalDamageDealt = 0;
    this.totalDamageTaken = 0;
    this.critCount = 0;
    this.totalHits = 0;
    this.dodgeCount = 0;

    const combat = useCombatStore();
    combat.setMonster(monster);
    combat.isFighting = true;
  }

  /** 获取战斗结果 */
  getResult(): CombatResult {
    const player = usePlayerStore();
    const isVictory = this.monster ? this.monster.state.currentHealth <= 0 : false;
    const duration = (Date.now() - this.fightStartTime) / 1000;

    return {
      combatId: `combat_${Date.now()}`,
      monsterId: this.monster?.instanceId ?? '',
      floor: this.monster?.floor ?? 1,
      isVictory,
      duration,
      totalDamageDealt: this.totalDamageDealt,
      totalDamageTaken: this.totalDamageTaken,
      critCount: this.critCount,
      totalHits: this.totalHits,
      dodgeCount: this.dodgeCount,
      goldReward: isVictory ? this.monster?.goldReward ?? 0 : 0,
      expReward: isVictory ? this.monster?.expReward ?? 0 : 0,
      drops: [], // 掉落由LootGenerator在战斗结束后生成
      endedAt: Date.now(),
    };
  }

  /** 获取当前怪物 */
  getMonster(): Monster | null {
    return this.monster;
  }

  /** 重置引擎 */
  reset(): void {
    this.monster = null;
    this.attackRecords = [];
  }
}
```

### 4.2 关卡缩放系统 `FloorScaling.ts`

MVP完整保留关卡缩放系统。

```typescript
/**
 * @file core/FloorScaling.ts
 * @description 关卡缩放系统 - MVP完整保留
 * 根据层数计算怪物属性、金币/经验奖励
 */
import type { Monster, MonsterState } from '@/types';
import { MonsterType, Rarity } from '@/types/enums';
import { FLOOR_CONSTANTS } from '@/utils/constants';

export class FloorScaling {
  /** 怪物名称前缀池 */
  private static MONSTER_PREFIXES = ['腐朽', '暗影', '狂暴', '堕落', '深渊'];
  private static MONSTER_NAMES = ['骷髅', '僵尸', '蝙蝠', '蜘蛛', '恶魔', '幽灵', '史莱姆', '狼人'];

  /** 
   * 根据层数生成怪物
   * @param floor 关卡层数
   * @returns 生成的怪物
   */
  static generateMonster(floor: number): Monster {
    const isBoss = floor % FLOOR_CONSTANTS.BOSS_INTERVAL === 0;
    const level = floor;

    // 基础属性计算
    const growth = Math.pow(FLOOR_CONSTANTS.FLOOR_GROWTH_RATE, floor - 1);
    const baseHealth = Math.floor(100 * growth * (isBoss ? FLOOR_CONSTANTS.BOSS_HP_MULTIPLIER : 1));
    const baseAttack = Math.floor(10 * growth * (isBoss ? FLOOR_CONSTANTS.BOSS_ATK_MULTIPLIER : 1));
    const baseArmor = Math.floor(5 * Math.pow(1.06, floor - 1));
    const baseDodge = Math.min(0.3, floor * 0.002);

    // 金币/经验奖励
    const goldReward = Math.floor(10 * growth * (isBoss ? FLOOR_CONSTANTS.BOSS_GOLD_MULTIPLIER : 1));
    const expReward = Math.floor(5 * growth * (isBoss ? 5 : 1));

    // 怪物名称
    const prefix = this.MONSTER_PREFIXES[Math.floor(Math.random() * this.MONSTER_PREFIXES.length)];
    const name = this.MONSTER_NAMES[Math.floor(Math.random() * this.MONSTER_NAMES.length)];
    const displayName = isBoss ? `${prefix}·Boss·${name}` : `${prefix}${name}`;

    // MVP只生成BALANCED类型怪物，[第二阶段] 才有HIGH_HP/HIGH_ATK/REWARD
    const monsterType = MonsterType.BALANCED;

    const state: MonsterState = {
      currentHealth: baseHealth,
      shieldValue: 0,
      isEnraged: false,
      thornsPercent: 0,
      splitGeneration: 0,
      debuffs: [],
    };

    return {
      instanceId: `monster_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      templateId: `template_${monsterType}`,
      displayName,
      type: monsterType,
      affixes: [], // MVP怪物不带词缀
      level,
      baseAttack,
      baseHealth,
      baseArmor,
      baseDodge,
      attackSpeed: 1.0 + floor * 0.005,
      goldReward,
      expReward,
      dropWeights: {},
      state,
      floor,
    };
  }

  /**
   * 计算通关后推进的层数
   * @param playerPower 玩家战力
   * @param monsterPower 怪物战力
   * @returns 层数推进步长
   */
  static calculateFloorProgress(playerPower: number, monsterPower: number): number {
    const ratio = playerPower / monsterPower;
    if (ratio > 3) return 3;      // 碾压：跳3层
    if (ratio > 2) return 2;       // 优势：跳2层
    if (ratio > 1) return 1;       // 均势：跳1层
    if (ratio > 0.5) return 0;     // 劣势：保持
    return -1;                     // 被碾压：退回上一层
  }

  /**
   * 计算离线战斗次数
   * @param offlineSeconds 离线秒数
   * @param avgCombatDuration 平均战斗时长(秒)
   * @returns 可进行的战斗次数
   */
  static calculateOfflineCombats(offlineSeconds: number, avgCombatDuration: number): number {
    return Math.floor(offlineSeconds / Math.max(1, avgCombatDuration));
  }
}
```

### 4.3 离线收益计算器 `OfflineCalculator.ts`

MVP完整保留离线收益计算。

```typescript
/**
 * @file core/OfflineCalculator.ts
 * @description 离线收益计算器 - MVP完整保留
 * 计算玩家离线期间的金币、经验、装备收益
 */
import type { OfflineReport, OfflineBreakdown, EquipmentItem } from '@/types';
import { OFFLINE_CONSTANTS } from '@/utils/constants';
import { FloorScaling } from './FloorScaling';
import { CombatEngine } from './CombatEngine';
import { LootGenerator } from './LootGenerator';

export class OfflineCalculator {
  /**
   * 计算离线收益
   * @param playerLevel 玩家等级
   * @param playerPower 玩家战力（DPS × EHP）
   * @param currentFloor 离线前所在层数
   * @param offlineSeconds 离线秒数
   * @returns 离线收益报告
   */
  static calculate(
    playerLevel: number,
    playerPower: number,
    currentFloor: number,
    offlineSeconds: number
  ): OfflineReport {
    // 限制离线时间上限（防作弊+防溢出）
    const effectiveSeconds = Math.min(offlineSeconds, OFFLINE_CONSTANTS.MAX_OFFLINE_SECONDS);
    const wasCapped = offlineSeconds > OFFLINE_CONSTANTS.MAX_OFFLINE_SECONDS;

    // 离线效率（默认80%在线效率）
    const efficiency = OFFLINE_CONSTANTS.OFFLINE_EFFICIENCY;

    // 估算平均战斗时长（简化模型）
    const avgCombatDuration = this.estimateAvgCombatDuration(playerPower, currentFloor);
    
    // 计算总战斗次数
    const totalCombats = Math.floor(effectiveSeconds / avgCombatDuration);
    
    // 模拟离线战斗
    const breakdown: OfflineBreakdown = {
      normalKills: 0,
      eliteKills: 0,
      rewardKills: 0,
      deathCount: 0,
      successfulCombats: 0,
      goldSources: [],
      notableDrops: [],
    };

    let totalKills = 0;
    let totalGold = 0;
    let totalExp = 0;
    let currentFloorSim = currentFloor;
    let floorsCleared = 0;
    let maxFloorReached = currentFloor;

    // 批量模拟战斗
    for (let i = 0; i < totalCombats; i++) {
      const monster = FloorScaling.generateMonster(currentFloorSim);
      
      // 简化战斗判定：玩家战力 vs 怪物战力
      const monsterPower = monster.baseAttack * monster.baseHealth;
      const winChance = this.calculateWinChance(playerPower, monsterPower);
      
      if (Math.random() < winChance) {
        // 胜利
        totalKills++;
        breakdown.normalKills++;
        
        const goldGain = Math.floor(monster.goldReward * efficiency);
        const expGain = Math.floor(monster.expReward * efficiency);
        totalGold += goldGain;
        totalExp += expGain;
        breakdown.successfulCombats++;

        // 层数推进
        const progress = FloorScaling.calculateFloorProgress(playerPower, monsterPower);
        currentFloorSim += progress;
        if (currentFloorSim > maxFloorReached) maxFloorReached = currentFloorSim;
        if (progress > 0) floorsCleared += progress;
      } else {
        // 失败：回退一层
        breakdown.deathCount++;
        currentFloorSim = Math.max(1, currentFloorSim - 1);
      }
    }

    // 生成离线掉落（简化：只生成少量高价值装备用于展示）
    const dropCount = Math.min(totalKills, 50); // 最多模拟50件掉落
    for (let i = 0; i < dropCount; i++) {
      if (Math.random() < 0.15) { // 15%掉率
        // [第二阶段] 使用完整的LootGenerator生成装备
        // MVP简化：不生成具体装备，只记录数量
      }
    }

    return {
      offlineSeconds,
      effectiveSeconds,
      totalKills,
      totalGold: Math.floor(totalGold),
      totalExp: Math.floor(totalExp),
      floorsCleared,
      maxFloorReached,
      levelsGained: 0, // 由playerStore在加载时计算
      breakdown,
      generatedAt: Date.now(),
      wasCapped,
      decayRate: efficiency,
    };
  }

  /**
   * 估算平均战斗时长
   */
  private static estimateAvgCombatDuration(playerPower: number, floor: number): number {
    // 简化模型：假设玩家战力碾压则战斗短，反之则长
    const baseDuration = 5; // 基础5秒
    const monsterGrowth = Math.pow(1.08, floor - 1);
    const monsterPower = 1000 * monsterGrowth;
    const ratio = playerPower / monsterPower;
    return Math.max(2, baseDuration / Math.max(0.5, ratio));
  }

  /**
   * 计算胜率
   */
  private static calculateWinChance(playerPower: number, monsterPower: number): number {
    const ratio = playerPower / monsterPower;
    return Math.min(0.95, Math.max(0.1, ratio * 0.5));
  }
}
```

### 4.4 战斗组合式函数 `useCombat.ts`（MVP基础版）

去掉策略模式切换、爆发技能按钮、药水栏。

```typescript
/**
 * @file composables/useCombat.ts
 * @description 战斗组合式函数 - MVP基础版
 * 封装战斗循环的启动、暂停、自动战斗逻辑
 * 
 * MVP变更：
 * - 移除了策略模式切换
 * - 移除了爆发技能
 * - 移除了挂机加速（固定1x）
 * - 移除了药水使用
 */
import { ref, computed } from 'vue';
import { usePlayerStore } from '@/stores/player';
import { useCombatStore } from '@/stores/combat';
import { useEquipmentStore } from '@/stores/equipment';
import { CombatEngine } from '@/core/CombatEngine';
import { FloorScaling } from '@/core/FloorScaling';
import { LootGenerator } from '@/core/LootGenerator';

/** 游戏主循环帧率 */
const TICK_RATE = 100; // 每100ms一个tick

export function useCombat() {
  const playerStore = usePlayerStore();
  const combatStore = useCombatStore();
  const equipmentStore = useEquipmentStore();
  
  const engine = new CombatEngine();
  
  /** 游戏主循环ID */
  let gameLoopId: ReturnType<typeof setInterval> | null = null;
  /** 是否已初始化 */
  const isInitialized = ref(false);
  /** 玩家DPS（实时计算） */
  const playerDPS = computed(() => {
    const stats = playerStore.player.combat;
    return stats.baseAttack * stats.attackSpeed * 
      (1 + stats.critChance * (stats.critDamage - 1));
  });

  /** 初始化战斗系统 */
  function init(): void {
    if (isInitialized.value) return;
    isInitialized.value = true;
    
    // 启动游戏主循环
    startGameLoop();
  }

  /** 启动游戏主循环 */
  function startGameLoop(): void {
    if (gameLoopId) return;
    
    gameLoopId = setInterval(() => {
      tick(TICK_RATE);
    }, TICK_RATE);
  }

  /** 停止游戏主循环 */
  function stopGameLoop(): void {
    if (gameLoopId) {
      clearInterval(gameLoopId);
      gameLoopId = null;
    }
  }

  /** 单帧更新 */
  function tick(deltaMs: number): void {
    if (!combatStore.autoCombat && !combatStore.isFighting) return;
    
    if (!combatStore.isFighting) {
      // 开始新战斗
      startNewCombat();
    } else if (combatStore.currentMonster) {
      // 执行战斗tick
      const finished = engine.tick(deltaMs);
      combatStore.updateMonsterHp(0); // 触发响应式更新
      
      if (finished) {
        // 战斗结束
        onCombatEnd();
      }
    }
  }

  /** 开始一场新战斗 */
  function startNewCombat(): void {
    const floor = playerStore.currentFloor;
    const monster = FloorScaling.generateMonster(floor);
    engine.startFight(monster);
    combatStore.isFighting = true;
    combatStore.addLog(`遭遇 ${monster.displayName} (Lv.${monster.level})`);
  }

  /** 战斗结束处理 */
  function onCombatEnd(): void {
    const result = engine.getResult();
    combatStore.recordResult(result);

    if (result.isVictory) {
      // 胜利：获得奖励
      combatStore.addLog(`击杀！获得 ${result.goldReward}金币 ${result.expReward}经验`);
      playerStore.addGold(result.goldReward);
      playerStore.addExperience(result.expReward);
      
      // 掉落判定
      const dropRoll = Math.random();
      const dropRate = 0.15 + playerStore.player.combat.critChance * 0.1; // 基础15% + 暴击率加成
      if (dropRoll < dropRate) {
        const item = LootGenerator.generate(
          playerStore.currentFloor,
          playerStore.player.progress.level
        );
        if (equipmentStore.addToInventory(item)) {
          combatStore.addLog(`掉落: ${item.name}`);
        }
      }

      // 恢复生命
      const regen = playerStore.player.defense.healthRegen;
      playerStore.setCurrentHealth(playerStore.player.defense.currentHealth + regen);

      // 层数推进判定
      const playerPower = playerStore.totalPower;
      const monsterPower = result.totalDamageDealt * 100; // 简化估算
      const progress = FloorScaling.calculateFloorProgress(playerPower, monsterPower);
      if (progress > 0) {
        playerStore.setFloor(playerStore.currentFloor + progress);
        combatStore.addLog(`向下推进 ${progress} 层 → 第${playerStore.currentFloor}层`);
      }
    } else {
      // 失败
      combatStore.addLog('战斗失败，退回上一层');
      playerStore.setFloor(Math.max(1, playerStore.currentFloor - 1));
      playerStore.fullHeal(); // 死亡恢复满血
    }

    combatStore.isFighting = false;
    engine.reset();
  }

  /** 切换自动战斗 */
  function toggleAutoCombat(): void {
    combatStore.autoCombat = !combatStore.autoCombat;
    combatStore.isFighting = combatStore.autoCombat;
  }

  /** 清理 */
  function dispose(): void {
    stopGameLoop();
    engine.reset();
  }

  return {
    init, dispose,
    startGameLoop, stopGameLoop,
    toggleAutoCombat,
    playerDPS,
    isInitialized,
  };
}
```

---

## 第5章 装备系统（MVP精简版）

### 5.1 装备生成器 `LootGenerator.ts`

MVP保留完整的18词缀体系，去掉远古装备生成和传奇触发特效。

```typescript
/**
 * @file core/LootGenerator.ts
 * @description 装备生成器 - MVP精简版
 * 根据关卡和等级生成随机装备
 * 
 * MVP保留：
 * - 完整的18种词缀生成逻辑
 * - 完整的品质权重体系
 * - 基础属性基于层数缩放
 * MVP去掉：
 * - 远古装备生成（Rarity.ANCIENT在MVP掉落池中不出现）
 * - 传奇触发特效（RIFT等传说词缀的触发效果不做）
 * - 套装检测
 */
import type { EquipmentItem, AffixRoll } from '@/types';
import { SlotType, Rarity, AffixType } from '@/types/enums';
import { EQUIPMENT_CONSTANTS } from '@/utils/constants';

/** 词缀定义：类型 → 名称/描述/数值范围生成函数 */
interface AffixDefinition {
  type: AffixType;
  name: string;
  description: string;
  /** 生成数值范围基于关卡 */
  rollValue: (floor: number) => { min: number; max: number };
  /** 是否百分比属性 */
  isPercent: boolean;
  /** 适用品质（null=所有品质） */
  minRarity: Rarity | null;
}

/** 完整的18词缀定义表 */
const AFFIX_TABLE: AffixDefinition[] = [
  // 攻击类 (6种)
  { type: AffixType.SHARP, name: '锋利', description: '增加{value}点攻击力', isPercent: false, minRarity: null, rollValue: (f) => ({ min: f * 2, max: f * 5 }) },
  { type: AffixType.CRUEL, name: '残忍', description: '增加{value}%暴击伤害', isPercent: true, minRarity: null, rollValue: (f) => ({ min: 5, max: 15 + f * 0.5 }) },
  { type: AffixType.EAGLE_EYE, name: '鹰眼', description: '增加{value}%暴击率', isPercent: true, minRarity: null, rollValue: (f) => ({ min: 2, max: 8 + f * 0.1 }) },
  { type: AffixType.SWIFT, name: '迅捷', description: '增加{value}%攻击速度', isPercent: true, minRarity: Rarity.MAGIC, rollValue: (f) => ({ min: 3, max: 12 + f * 0.2 }) },
  { type: AffixType.ACCURATE, name: '精准', description: '增加{value}%命中率', isPercent: true, minRarity: Rarity.MAGIC, rollValue: (f) => ({ min: 2, max: 10 }) },
  { type: AffixType.PENETRATING, name: '穿透', description: '增加{value}%护甲穿透', isPercent: true, minRarity: Rarity.RARE, rollValue: (f) => ({ min: 3, max: 15 + f * 0.1 }) },
  
  // 防御类 (6种)
  { type: AffixType.STURDY, name: '坚固', description: '增加{value}点护甲', isPercent: false, minRarity: null, rollValue: (f) => ({ min: f, max: f * 3 }) },
  { type: AffixType.VITAL, name: '生命', description: '增加{value}点最大生命', isPercent: false, minRarity: null, rollValue: (f) => ({ min: f * 5, max: f * 15 }) },
  { type: AffixType.ELUSIVE, name: '闪避', description: '增加{value}%闪避率', isPercent: true, minRarity: null, rollValue: (f) => ({ min: 1, max: 5 + f * 0.05 }) },
  { type: AffixType.RESISTANT, name: '抗性', description: '增加{value}%元素抗性', isPercent: true, minRarity: Rarity.MAGIC, rollValue: (f) => ({ min: 2, max: 10 }) },
  { type: AffixType.REGENERATING, name: '再生', description: '每秒恢复{value}点生命', isPercent: false, minRarity: Rarity.RARE, rollValue: (f) => ({ min: 1, max: 3 + f * 0.1 }) },
  { type: AffixType.LEECHING, name: '吸血', description: '攻击时恢复{value}%造成伤害的生命', isPercent: true, minRarity: Rarity.RARE, rollValue: (f) => ({ min: 2, max: 8 + f * 0.1 }) },
  
  // 属性类 (3种)
  { type: AffixType.STRONG, name: '力量', description: '增加{value}点力量', isPercent: false, minRarity: null, rollValue: (f) => ({ min: 1, max: 3 + Math.floor(f / 10) }) },
  { type: AffixType.AGILE, name: '敏捷', description: '增加{value}点敏捷', isPercent: false, minRarity: null, rollValue: (f) => ({ min: 1, max: 3 + Math.floor(f / 10) }) },
  { type: AffixType.WISE, name: '智慧', description: '增加{value}点智力', isPercent: false, minRarity: null, rollValue: (f) => ({ min: 1, max: 3 + Math.floor(f / 10) }) },
  
  // 传说独有 (3种) - 保留生成，但触发效果在第二阶段实现
  { type: AffixType.RIFT, name: '裂隙', description: '[第二阶段]击杀后移速+{value}%', isPercent: true, minRarity: Rarity.LEGENDARY, rollValue: (f) => ({ min: 10, max: 25 }) },
  { type: AffixType.GREEDY, name: '贪婪', description: '增加{value}%金币获取', isPercent: true, minRarity: Rarity.LEGENDARY, rollValue: (f) => ({ min: 10, max: 30 }) },
  { type: AffixType.LUCKY, name: '幸运', description: '增加{value}%装备掉率', isPercent: true, minRarity: Rarity.LEGENDARY, rollValue: (f) => ({ min: 5, max: 20 }) },
];

/** 部位名称映射 */
const SLOT_NAMES: Record<SlotType, string> = {
  [SlotType.WEAPON]: '长剑',
  [SlotType.OFFHAND]: '盾牌',
  [SlotType.HELMET]: '头盔',
  [SlotType.ARMOR]: '胸甲',
  [SlotType.GLOVES]: '手套',
  [SlotType.BOOTS]: '靴子',
  [SlotType.RING_LEFT]: '戒指',
  [SlotType.RING_RIGHT]: '指环',
  [SlotType.NECKLACE]: '项链',
};

export class LootGenerator {
  /**
   * 生成一件装备
   * @param floor 掉落层数
   * @param playerLevel 玩家等级
   * @returns 生成的装备
   */
  static generate(floor: number, playerLevel: number): EquipmentItem {
    // 随机部位
    const slots = Object.values(SlotType).filter(v => typeof v === 'number') as SlotType[];
    const slot = slots[Math.floor(Math.random() * slots.length)];
    
    // 随机品质（MVP中不会出现远古ANCIENT）
    // [第二阶段] 远古装备可在高层极小概率出现
    const rarity = this.rollRarity(floor);
    
    // 基础属性
    const baseValue = this.calculateBaseValue(slot, floor, rarity);
    
    // 词缀
    const affixCount = this.getAffixCount(rarity);
    const affixes = this.rollAffixes(affixCount, floor, rarity);
    
    // 装备评分
    const score = this.calculateScore(baseValue, affixes, rarity);

    const rarityNames = ['', '普通', '魔法', '稀有', '传说', '远古'];
    const name = `${rarityNames[rarity]}${SLOT_NAMES[slot]}`;

    return {
      instanceId: `equip_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      templateId: `template_${slot}_${rarity}`,
      name,
      slot,
      rarity,
      requiredLevel: Math.max(1, playerLevel - 5 + Math.floor(Math.random() * 10)),
      baseValue,
      affixes,
      enhancement: {
        level: 0,
        totalGoldSpent: 0,
        currentSuccessRate: 100,
        failureCount: 0,
      },
      score,
      droppedAt: Date.now(),
      droppedFloor: floor,
    };
  }

  /**
   * 随机品质
   * MVP只生成NORMAL~LEGENDARY，不生成ANCIENT
   */
  private static rollRarity(floor: number): Rarity {
    // [第二阶段] floor > 200时有极小概率出远古
    const weights = [...EQUIPMENT_CONSTANTS.RARITY_WEIGHTS];
    // MVP：将远古权重转移到传说上
    weights[4] = 0; // ANCIENT权重设为0
    weights[3] += 5; // 传说权重增加
    
    const total = weights.reduce((s, w) => s + w, 0);
    let roll = Math.random() * total;
    
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return i + 1 as Rarity;
    }
    return Rarity.NORMAL;
  }

  /**
   * 计算基础属性值
   */
  private static calculateBaseValue(slot: SlotType, floor: number, rarity: Rarity): number {
    const growth = Math.pow(1.08, floor - 1);
    const rarityMult = [1, 1, 1.2, 1.5, 2.0, 3.0][rarity - 1];
    
    const baseValues: Record<SlotType, number> = {
      [SlotType.WEAPON]: 10, [SlotType.OFFHAND]: 5, [SlotType.HELMET]: 5,
      [SlotType.ARMOR]: 8, [SlotType.GLOVES]: 3, [SlotType.BOOTS]: 3,
      [SlotType.RING_LEFT]: 2, [SlotType.RING_RIGHT]: 2, [SlotType.NECKLACE]: 4,
    };
    
    return Math.floor(baseValues[slot] * growth * rarityMult);
  }

  /**
   * 获取指定品质装备的词缀数量
   */
  private static getAffixCount(rarity: Rarity): number {
    switch (rarity) {
      case Rarity.NORMAL: return 0;
      case Rarity.MAGIC: return 1 + Math.floor(Math.random() * 2); // 1-2
      case Rarity.RARE: return 3 + Math.floor(Math.random() * 2);  // 3-4
      case Rarity.LEGENDARY: return 4 + Math.floor(Math.random() * 2); // 4-5（必有1传说词缀）
      case Rarity.ANCIENT: return 6; // [第二阶段] MVP不生成
      default: return 0;
    }
  }

  /**
   * 随机词缀
   */
  private static rollAffixes(count: number, floor: number, rarity: Rarity): AffixRoll[] {
    const affixes: AffixRoll[] = [];
    const usedTypes = new Set<AffixType>();
    
    // 传说装备至少1条传说独有词缀
    if (rarity === Rarity.LEGENDARY) {
      const legendaryAffixes = AFFIX_TABLE.filter(a => a.minRarity === Rarity.LEGENDARY);
      const chosen = legendaryAffixes[Math.floor(Math.random() * legendaryAffixes.length)];
      affixes.push(this.createAffixRoll(chosen, floor));
      usedTypes.add(chosen.type);
    }
    
    // 剩余词缀随机选择
    while (affixes.length < count) {
      const candidates = AFFIX_TABLE.filter(a => 
        !usedTypes.has(a.type) && 
        (a.minRarity === null || a.minRarity <= rarity) &&
        a.type < AffixType.RIFT // MVP阶段不生成传说独有词缀（已在上面处理）
      );
      
      if (candidates.length === 0) break;
      
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      affixes.push(this.createAffixRoll(chosen, floor));
      usedTypes.add(chosen.type);
    }
    
    return affixes;
  }

  private static createAffixRoll(def: AffixDefinition, floor: number): AffixRoll {
    const range = def.rollValue(floor);
    const value = range.min + Math.random() * (range.max - range.min);
    const rollTier = (value - range.min) / (range.max - range.min); // 0.0-1.0
    
    return {
      type: def.type,
      value: def.isPercent ? Math.round(value * 10) / 10 : Math.floor(value),
      isLegendary: def.minRarity === Rarity.LEGENDARY,
      rollTier: Math.round(rollTier * 100) / 100,
    };
  }

  /**
   * 计算装备评分
   */
  private static calculateScore(baseValue: number, affixes: AffixRoll[], rarity: Rarity): number {
    let score = baseValue;
    for (const a of affixes) {
      score += Math.floor(a.value * (a.isPercent ? 2 : 1));
    }
    score *= [1, 1, 1.1, 1.3, 1.6, 2.0][rarity - 1];
    return Math.floor(score);
  }
}
```

### 5.2 装备评分系统 `GearScore.ts`

MVP完整保留5档评分模式。

```typescript
/**
 * @file core/GearScore.ts
 * @description 装备评分系统 - MVP完整保留5档评分
 * 支持BALANCED/CRIT/ATK_SPEED/TOUGHNESS/MAIN_ATTR五种评分模式
 */
import type { EquipmentItem } from '@/types';
import { ScoreMode, AffixType, SlotType } from '@/types/enums';

/** 评分权重配置 */
const SCORE_WEIGHTS: Record<ScoreMode, Record<string, number>> = {
  [ScoreMode.BALANCED]: {
    attack: 1.0, defense: 1.0, health: 1.0, crit: 1.0, speed: 1.0, special: 0.8,
  },
  [ScoreMode.CRIT]: {
    attack: 0.8, defense: 0.5, health: 0.5, crit: 2.0, speed: 0.8, special: 0.6,
  },
  [ScoreMode.ATK_SPEED]: {
    attack: 0.8, defense: 0.5, health: 0.5, crit: 0.8, speed: 2.0, special: 0.6,
  },
  [ScoreMode.TOUGHNESS]: {
    attack: 0.5, defense: 2.0, health: 2.0, crit: 0.3, speed: 0.3, special: 0.5,
  },
  [ScoreMode.MAIN_ATTR]: {
    attack: 1.5, defense: 0.8, health: 0.8, crit: 0.8, speed: 0.8, special: 1.0,
  },
};

/** 词缀分类映射 */
const AFFIX_CATEGORIES: Record<number, string> = {
  [AffixType.SHARP]: 'attack',
  [AffixType.CRUEL]: 'crit',
  [AffixType.EAGLE_EYE]: 'crit',
  [AffixType.SWIFT]: 'speed',
  [AffixType.ACCURATE]: 'attack',
  [AffixType.PENETRATING]: 'attack',
  [AffixType.STURDY]: 'defense',
  [AffixType.VITAL]: 'health',
  [AffixType.ELUSIVE]: 'defense',
  [AffixType.RESISTANT]: 'defense',
  [AffixType.REGENERATING]: 'health',
  [AffixType.LEECHING]: 'special',
  [AffixType.STRONG]: 'attack',
  [AffixType.AGILE]: 'speed',
  [AffixType.WISE]: 'special',
  [AffixType.RIFT]: 'special',
  [AffixType.GREEDY]: 'special',
  [AffixType.LUCKY]: 'special',
};

export class GearScore {
  /**
   * 计算装备评分
   * @param item 装备
   * @param mode 评分模式
   * @returns 评分值
   */
  static calculate(item: EquipmentItem, mode: ScoreMode = ScoreMode.BALANCED): number {
    const weights = SCORE_WEIGHTS[mode];
    let score = 0;
    
    // 基础属性得分
    score += item.baseValue * weights.attack * 2;
    
    // 词缀得分
    for (const affix of item.affixes) {
      const category = AFFIX_CATEGORIES[affix.type] || 'special';
      const weight = weights[category] || 0.5;
      score += affix.value * weight * (affix.isPercent ? 3 : 1);
    }
    
    // 强化加成
    score *= (1 + item.enhancement.level * 0.1);
    
    return Math.floor(score);
  }

  /**
   * 对比两件装备（用于"是否替换"决策）
   * @param current 当前装备
   * @param candidate 候选装备
   * @param mode 评分模式
   * @returns 差异对象
   */
  static compare(current: EquipmentItem, candidate: EquipmentItem, mode: ScoreMode = ScoreMode.BALANCED): {
    currentScore: number;
    candidateScore: number;
    diff: number;
    diffPercent: number;
    shouldReplace: boolean;
  } {
    const currentScore = this.calculate(current, mode);
    const candidateScore = this.calculate(candidate, mode);
    const diff = candidateScore - currentScore;
    const diffPercent = currentScore > 0 ? (diff / currentScore * 100) : 100;
    const shouldReplace = diff > 0;

    return {
      currentScore,
      candidateScore,
      diff,
      diffPercent: Math.round(diffPercent * 10) / 10,
      shouldReplace,
    };
  }

  /**
   * 从装备列表中选择最优装备
   * @param items 装备列表（应为同一部位）
   * @param mode 评分模式
   * @returns 最优装备
   */
  static findBest(items: EquipmentItem[], mode: ScoreMode = ScoreMode.BALANCED): EquipmentItem | null {
    if (items.length === 0) return null;
    
    let best = items[0];
    let bestScore = this.calculate(best, mode);
    
    for (let i = 1; i < items.length; i++) {
      const score = this.calculate(items[i], mode);
      if (score > bestScore) {
        best = items[i];
        bestScore = score;
      }
    }
    
    return best;
  }
}
```

### 5.3 装备强化系统 `EnhancementSystem.ts`（MVP +1~+5）

MVP只保留+1~+5强化，+6~+10标注第二阶段。

```typescript
/**
 * @file core/EnhancementSystem.ts
 * @description 装备强化系统 - MVP只保留+1~+5
 * 
 * MVP强化规则：
 * - +0→+1: 100%成功率，消耗50金币
 * - +1→+2: 100%成功率，消耗75金币
 * - +2→+3: 100%成功率，消耗112金币
 * - +3→+4: 90%成功率，消耗169金币
 * - +4→+5: 80%成功率，消耗253金币
 * - +5以上: [第二阶段] 开放，失败可能降级
 * 
 * [第二阶段] 强化规则：
 * - +5→+6: 70%成功率，失败不降级
 * - +6→+7: 60%成功率，失败降至+5
 * - +7→+8: 50%成功率，失败降至+6
 * - +8→+9: 40%成功率，失败降至+7
 * - +9→+10: 30%成功率，失败降至+7
 * - +10以上: [第二阶段] 更高级的强化系统
 */
import type { EquipmentItem } from '@/types';
import { Rarity } from '@/types/enums';
import { EQUIPMENT_CONSTANTS } from '@/utils/constants';

export interface EnhanceResult {
  success: boolean;
  newLevel: number;
  goldCost: number;
  message: string;
}

export class EnhancementSystem {
  /** 强化成功率表 [+0→+1, +1→+2, ..., +9→+10] */
  private static SUCCESS_RATES = [100, 100, 100, 90, 80, 70, 60, 50, 40, 30];
  
  /** 强化消耗增长系数 */
  private static COST_GROWTH = 1.5;
  /** 基础消耗 */
  private static BASE_COST = 50;

  /**
   * 执行强化
   * @param item 要强化的装备
   * @returns 强化结果
   */
  static enhance(item: EquipmentItem): EnhanceResult {
    const currentLevel = item.enhancement.level;
    
    // MVP强化上限+5
    if (currentLevel >= 5) {
      return {
        success: false,
        newLevel: currentLevel,
        goldCost: 0,
        message: 'MVP阶段强化上限为+5，+6以上将在后续版本开放',
      };
    }

    const successRate = this.SUCCESS_RATES[currentLevel];
    const goldCost = Math.floor(this.BASE_COST * Math.pow(this.COST_GROWTH, currentLevel));
    
    const roll = Math.random() * 100;
    
    if (roll <= successRate) {
      // 成功
      const newLevel = currentLevel + 1;
      item.enhancement.level = newLevel;
      item.enhancement.currentSuccessRate = this.SUCCESS_RATES[newLevel] || 0;
      item.enhancement.failureCount = 0;
      // 重新计算装备评分（每级+10%）
      item.score = Math.floor(item.score * 1.1);
      
      return {
        success: true,
        newLevel,
        goldCost,
        message: `强化成功！${item.name} → +${newLevel}`,
      };
    } else {
      // MVP阶段失败不降级（+0~+5保护期）
      item.enhancement.failureCount++;
      // [第二阶段] +6以上失败时可能降级
      // if (currentLevel >= 6) {
      //   const downgrade = currentLevel === 6 ? 5 : currentLevel - 1;
      //   item.enhancement.level = downgrade;
      //   return { ... downgrade result ... };
      // }
      
      return {
        success: false,
        newLevel: currentLevel,
        goldCost,
        message: `强化失败（成功率${successRate}%），装备未损坏`,
      };
    }
  }

  /**
   * 预览强化信息（用于UI展示）
   * @param item 装备
   * @returns 预览信息
   */
  static preview(item: EquipmentItem): {
    nextLevel: number;
    successRate: number;
    goldCost: number;
    canEnhance: boolean;
    message: string;
  } {
    const currentLevel = item.enhancement.level;
    
    if (currentLevel >= 5) {
      return {
        nextLevel: currentLevel,
        successRate: 0,
        goldCost: 0,
        canEnhance: false,
        message: '已达到MVP强化上限',
      };
    }
    
    return {
      nextLevel: currentLevel + 1,
      successRate: this.SUCCESS_RATES[currentLevel],
      goldCost: Math.floor(this.BASE_COST * Math.pow(this.COST_GROWTH, currentLevel)),
      canEnhance: true,
      message: `${item.name} +${currentLevel} → +${currentLevel + 1}`,
    };
  }
}
```

---

## MVP第二阶段标注汇总

| 系统/功能 | 标注位置 | 处理方式 |
|-----------|----------|----------|
| 策略模式（激进/稳健/平衡） | 4.1节 CombatEngine | 已删除相关加成逻辑 |
| 爆发技能 | 4.1节 CombatEngine | 已删除技能伤害加成 |
| 药水系统 | 4.1节 CombatEngine | 已删除药水效果加成 |
| 怪物词缀生效 | 4.1节 monsterAttack | 注释标注[第二阶段] |
| 挂机加速（1x/2x/5x） | 4.4节 useCombat | 固定1x，不做加速选项 |
| 远古装备掉落 | 5.1节 rollRarity | ANCIENT权重设为0 |
| 传奇词缀触发效果 | 5.1节 AFFIX_TABLE | RIFT标注[第二阶段] |
| 套装检测 | — | 整行删除，MVP不做 |
| 强化+6~+10 | 5.3节 EnhancementSystem | 上限判断为+5，失败不降级 |
| 装备幻化 | 类型定义 | 标注@reserved |
| 宝石镶嵌 | 类型定义 | 标注@reserved |
