# MVP-Dev-01：项目基础 + 类型定义 + Store

> **MVP模块说明**
> - **前置依赖**：无（本模块是MVP基础，所有其他模块依赖于此）
> - **产出文件**：`vite.config.ts`, `tsconfig.json`, `package.json`, `types/index.ts`, `types/enums.ts`, `utils/constants.ts`, `main.ts`, `App.vue`, `stores/player.ts`, `stores/combat.ts`, `stores/equipment.ts`
> - **对应设计文档章节**：第2章（项目搭建）、第3章（核心数据结构）、第4章（游戏状态管理）
> - **MVP边界**：完整保留项目基础配置和核心3个Store（playerStore、combatStore、equipmentStore）。转生Store（prestigeStore）和每日任务Store（dailyStore）标注为第二阶段。Store间通信去掉daily相关联动。

---

## 第1章 项目搭建（完整保留）

MVP阶段完整保留Dev-01的全部项目配置，包括：

- `vite.config.ts` —— Vite配置（含路径别名、manualChunks代码分割）
- `tsconfig.json` —— TypeScript严格模式配置
- `package.json` —— 项目依赖（vue3 + pinia + typescript）
- `main.ts` —— 应用入口（Pinia挂载、游戏初始化）
- `App.vue` —— 根组件（Tab切换、离线弹窗）
- `variables.css` —— 全局CSS变量

以上配置与完整版一致，MVP阶段不做任何裁剪。详见原 `Dev-01-ProjectSetup.md` 第2章完整内容。

---

## 第2章 核心数据类型定义（完整保留）

MVP阶段保留完整的类型定义体系，所有类型定义与完整版一致。

### 2.1 枚举定义 `types/enums.ts`

```typescript
/**
 * @file types/enums.ts
 * @description 游戏基础枚举定义 - MVP完整保留
 */

/** 职业类型 - MVP仅实现WARRIOR，其余预留 */
export const enum ClassType {
  WARRIOR = 1,  // 战士 - MVP可玩职业
  ROGUE = 2,    // [第二阶段] 游侠
  MAGE = 3,     // [第二阶段] 法师
}

/** 装备部位枚举 - 共9个部位 */
export const enum SlotType {
  WEAPON = 1,
  OFFHAND = 2,
  HELMET = 3,
  ARMOR = 4,
  GLOVES = 5,
  BOOTS = 6,
  RING_LEFT = 7,
  RING_RIGHT = 8,
  NECKLACE = 9,
}

/** 装备品质枚举 - 5级品质 */
export const enum Rarity {
  NORMAL = 1,     // 普通 - 白色
  MAGIC = 2,      // 魔法 - 蓝色
  RARE = 3,       // 稀有 - 黄色
  LEGENDARY = 4,  // 传说 - 金色
  ANCIENT = 5,    // [第二阶段] 远古 - 暗金
}

/** 词缀类型枚举 - 共18种 */
export const enum AffixType {
  // 攻击类 (6种)
  SHARP = 1,        // 增加基础攻击力
  CRUEL = 2,        // 增加暴击伤害百分比
  EAGLE_EYE = 3,    // 增加暴击率
  SWIFT = 4,        // 增加攻击速度百分比
  ACCURATE = 5,     // 增加命中率
  PENETRATING = 6,  // 无视目标部分护甲

  // 防御类 (6种)
  STURDY = 7,       // 增加护甲值
  VITAL = 8,        // 增加最大生命值
  ELUSIVE = 9,      // 增加闪避率
  RESISTANT = 10,   // 增加元素抗性
  REGENERATING = 11,// 增加生命恢复速度
  LEECHING = 12,    // 攻击时恢复生命

  // 属性类 (3种)
  STRONG = 13,      // 增加STR属性
  AGILE = 14,       // 增加AGI属性
  WISE = 15,        // 增加INT属性

  // 特殊词缀 - 传说独有 (3种)
  RIFT = 16,        // [第二阶段] 击杀后增加移动速度
  GREEDY = 17,      // 增加金币获取量
  LUCKY = 18,       // 增加装备掉落品质与掉率
}

/** 怪物类型枚举 */
export const enum MonsterType {
  BALANCED = 1,
  HIGH_HP = 2,
  HIGH_ATK = 3,
  REWARD = 4,       // [第二阶段] 奖励型怪物
}

/** 怪物词缀 - MVP保留定义，MVP战斗中不生效 */
export const enum MonsterAffix {
  THORNS = 1,       // [第二阶段] 反弹伤害
  FRENZY = 2,       // [第二阶段] 低血量狂暴
  SHIELD = 3,       // [第二阶段] 周期性护盾
  SPLIT = 4,        // [第二阶段] 分裂
  LEECH = 5,        // [第二阶段] 吸血
  POISON = 6,       // [第二阶段] 中毒
  FORTIFIED = 7,    // [第二阶段] 高护甲
  SWIFT = 8,        // [第二阶段] 高闪避
}

/** 天赋分支 - [第二阶段] 预留枚举 */
export const enum TalentBranch {
  BERSERKER = 1,
  PALADIN = 2,
  MARKSMAN = 3,
  ASSASSIN = 4,
  ELEMENTALIST = 5,
  ARCANIST = 6,
}

/** 装备评分模式 */
export const enum ScoreMode {
  BALANCED = 1,
  CRIT = 2,
  ATK_SPEED = 3,
  TOUGHNESS = 4,
  MAIN_ATTR = 5,
}
```

### 2.2 核心接口定义 `types/index.ts`

MVP保留完整接口定义，与完整版一致：

- `BaseAttributes` —— 三大主属性（力量/敏捷/智力）
- `CombatStats` —— 战斗属性（攻击/攻速/暴击/命中/破甲）
- `DefenseStats` —— 防御属性（护甲/生命/闪避/抗性/回复/吸血）
- `PlayerProgress` —— 进度状态（等级/经验/金币/击杀）
- `Player` —— 玩家完整数据结构
- `EquipmentItem` —— 装备完整数据结构（含词缀/强化/评分）
- `AffixRoll` —— 单条词缀实例
- `EnhancementInfo` —— 装备强化信息
- `Monster` / `MonsterState` —— 怪物数据
- `CombatResult` / `AttackRecord` —— 战斗结果
- `OfflineReport` / `OfflineBreakdown` —— 离线收益报告

详见原 `Dev-01-ProjectSetup.md` 第3章完整内容。所有接口MVP阶段不做裁剪。

### 2.3 游戏常量 `utils/constants.ts`

MVP保留完整常量定义：

```typescript
/**
 * @file utils/constants.ts
 * @description 游戏平衡参数与数值常量 - MVP完整保留
 */

// ==================== 战斗常量 ====================
export const COMBAT_CONSTANTS = {
  /** 基础攻击间隔(ms) */
  BASE_ATTACK_INTERVAL: 1000,
  /** 最小攻击间隔(ms) */
  MIN_ATTACK_INTERVAL: 200,
  /** 暴击基础倍率 */
  CRIT_MULTIPLIER_BASE: 1.5,
  /** 暴击倍率上限 */
  CRIT_MULTIPLIER_MAX: 5.0,
  /** 闪避率上限 */
  DODGE_CAP: 0.60,
  /** 暴击率上限 */
  CRIT_CHANCE_CAP: 0.75,
  /** 抗性上限 */
  RESISTANCE_CAP: 0.75,
  /** 护甲减伤公式分母系数 */
  ARMOR_REDUCTION_DENOMINATOR: 300,
  /** 生命偷取上限 */
  LIFE_STEAL_CAP: 0.30,
} as const;

// ==================== 升级常量 ====================
export const LEVEL_CONSTANTS = {
  /** 基础升级所需经验 */
  BASE_EXP_REQUIREMENT: 100,
  /** 每级经验增长系数 */
  EXP_GROWTH_RATE: 1.15,
  /** 等级上限 */
  MAX_LEVEL: 100,
} as const;

// ==================== 装备常量 ====================
export const EQUIPMENT_CONSTANTS = {
  /** 基础掉落率 */
  BASE_DROP_RATE: 0.10,
  /** 品质权重 [普通, 魔法, 稀有, 传说, 远古] */
  RARITY_WEIGHTS: [500, 300, 150, 45, 5] as const,
  /** 每件装备最大词缀数 */
  MAX_AFFIXES: 6,
  /** 强化最高等级 - MVP只开放到+5 */
  MAX_ENHANCEMENT_LEVEL: 5,
  /** 强化成功率表 [+0→+1, +1→+2, ...] (百分比) */
  ENHANCE_SUCCESS_RATES: [100, 100, 100, 90, 80, 70] as const,
  /** 强化基础消耗金币 */
  ENHANCE_BASE_COST: 50,
  /** 强化消耗增长系数 */
  ENHANCE_COST_GROWTH: 1.5,
} as const;

// ==================== 离线收益常量 ====================
export const OFFLINE_CONSTANTS = {
  /** 最大离线计算时间(秒) = 8小时 */
  MAX_OFFLINE_SECONDS: 28800,
  /** 离线收益效率(相对于在线) */
  OFFLINE_EFFICIENCY: 0.8,
  /** 防作弊最大允许离线时间(秒) = 24小时 */
  ANTI_CHEAT_MAX_GAP: 86400,
} as const;

// ==================== 关卡常量 ====================
export const FLOOR_CONSTANTS = {
  /** 每10层一个Boss */
  BOSS_INTERVAL: 10,
  /** Boss血量倍率 */
  BOSS_HP_MULTIPLIER: 5,
  /** Boss攻击倍率 */
  BOSS_ATK_MULTIPLIER: 2,
  /** Boss金币奖励倍率 */
  BOSS_GOLD_MULTIPLIER: 3,
  /** 层数增长系数(每层的属性增长) */
  FLOOR_GROWTH_RATE: 1.08,
} as const;
```

---

## 第3章 核心Store（MVP精简版）

MVP阶段只实现3个核心Store：

| Store | 保留 | 说明 |
|-------|------|------|
| `playerStore` | 完整保留 | 玩家状态、属性、资源 |
| `combatStore` | 完整保留 | 战斗循环、怪物、日志 |
| `equipmentStore` | 完整保留 | 背包、装备、强化+1~+5 |
| `prestigeStore` | [第二阶段] | 转生系统在MVP后实现 |
| `dailyStore` | [第二阶段] | 每日任务在MVP后实现 |

### 3.1 玩家状态管理 `playerStore`

MVP完整保留，负责管理玩家的全部状态数据。

```typescript
/**
 * @file stores/player.ts
 * @description 玩家状态管理 - MVP完整保留
 * 管理玩家基础属性、战斗属性、防御属性、进度状态
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Player, BaseAttributes, CombatStats, DefenseStats, PlayerProgress } from '@/types';
import { ClassType } from '@/types/enums';
import { LEVEL_CONSTANTS } from '@/utils/constants';

export const usePlayerStore = defineStore('player', () => {
  // ========== State ==========
  const player = ref<Player>(createDefaultPlayer());

  // ========== Getters ==========
  
  /** 当前等级 */
  const level = computed(() => player.value.progress.level);
  
  /** 当前金币 */
  const gold = computed(() => player.value.progress.gold);
  
  /** 当前层数 */
  const currentFloor = computed(() => player.value.currentFloor);
  
  /** 最高通关层数 */
  const maxFloor = computed(() => player.value.maxFloorCleared);
  
  /** 总战力评分（简化计算） */
  const totalPower = computed(() => {
    const stats = player.value.combat;
    const def = player.value.defense;
    const dps = stats.baseAttack * stats.attackSpeed * 
      (1 + stats.critChance * (stats.critDamage - 1));
    const ehp = def.maxHealth * (1 + def.armor / 100);
    return Math.floor(Math.sqrt(dps * ehp));
  });

  /** 检查是否可升级 */
  const canLevelUp = computed(() => 
    player.value.progress.experience >= player.value.progress.expToNext
  );

  // ========== Actions ==========

  /** 增加经验值，自动处理升级 */
  function addExperience(amount: number): void {
    const p = player.value.progress;
    p.experience += amount;
    p.totalKills += 1; // 每次加经验视为击杀
    
    // 自动升级循环
    while (p.experience >= p.expToNext && p.level < LEVEL_CONSTANTS.MAX_LEVEL) {
      p.experience -= p.expToNext;
      p.level++;
      p.expToNext = Math.floor(
        LEVEL_CONSTANTS.BASE_EXP_REQUIREMENT * 
        Math.pow(LEVEL_CONSTANTS.EXP_GROWTH_RATE, p.level - 1)
      );
      // 升级时恢复满血
      player.value.defense.currentHealth = player.value.defense.maxHealth;
    }
  }

  /** 增加金币 */
  function addGold(amount: number): void {
    player.value.progress.gold += amount;
    player.value.progress.totalGoldEarned += amount;
  }

  /** 消耗金币，返回是否成功 */
  function spendGold(amount: number): boolean {
    if (player.value.progress.gold < amount) return false;
    player.value.progress.gold -= amount;
    return true;
  }

  /** 设置当前层数 */
  function setFloor(floor: number): void {
    player.value.currentFloor = Math.max(1, floor);
    if (player.value.currentFloor > player.value.maxFloorCleared) {
      player.value.maxFloorCleared = player.value.currentFloor;
    }
  }

  /** 更新玩家当前血量 */
  function setCurrentHealth(hp: number): void {
    player.value.defense.currentHealth = Math.max(0, 
      Math.min(hp, player.value.defense.maxHealth)
    );
  }

  /** 恢复满血 */
  function fullHeal(): void {
    player.value.defense.currentHealth = player.value.defense.maxHealth;
  }

  /** 更新战斗属性（由装备/天赋变更触发） */
  function updateCombatStats(newStats: Partial<CombatStats>): void {
    Object.assign(player.value.combat, newStats);
  }

  /** 更新防御属性 */
  function updateDefenseStats(newStats: Partial<DefenseStats>): void {
    Object.assign(player.value.defense, newStats);
  }

  /** 获取序列化数据（用于存档） */
  function serialize(): object {
    return JSON.parse(JSON.stringify(player.value));
  }

  /** 从序列化数据恢复 */
  function deserialize(data: object): void {
    player.value = { ...createDefaultPlayer(), ...data };
  }

  return {
    player,
    level, gold, currentFloor, maxFloor, totalPower, canLevelUp,
    addExperience, addGold, spendGold, setFloor,
    setCurrentHealth, fullHeal,
    updateCombatStats, updateDefenseStats,
    serialize, deserialize,
  };
});

/** 创建默认玩家 */
function createDefaultPlayer(): Player {
  const baseAttrs: BaseAttributes = {
    strength: 10,
    agility: 5,
    intelligence: 5,
  };

  const combatStats: CombatStats = {
    baseAttack: 10 + baseAttrs.strength * 2,
    attackSpeed: 1.0 + baseAttrs.agility * 0.02,
    critChance: 0.05,
    critDamage: 1.5,
    hitChance: 0.95,
    armorPenetration: 0,
  };

  const defenseStats: DefenseStats = {
    armor: baseAttrs.strength + 5,
    maxHealth: 100 + baseAttrs.strength * 10,
    currentHealth: 100 + baseAttrs.strength * 10,
    dodgeChance: Math.min(0.05 + baseAttrs.agility * 0.005, 0.60),
    resistance: 0,
    healthRegen: 1 + baseAttrs.strength * 0.2,
    lifeSteal: 0,
  };

  const progress: PlayerProgress = {
    level: 1,
    experience: 0,
    expToNext: LEVEL_CONSTANTS.BASE_EXP_REQUIREMENT,
    prestigeLevel: 0,        // [第二阶段] 转生等级
    soulPoints: 0,           // [第二阶段] 灵魂点数
    totalKills: 0,
    gold: 0,
    totalGoldEarned: 0,
  };

  return {
    id: `player_${Date.now()}`,
    name: '裂隙行者',
    classType: ClassType.WARRIOR,
    baseAttributes: baseAttrs,
    combat: combatStats,
    defense: defenseStats,
    progress,
    currentFloor: 1,
    maxFloorCleared: 1,
    talentAllocations: {},   // [第二阶段] 天赋分配
    preferredScoreMode: 1,
    createdAt: Date.now(),
    lastOnlineAt: Date.now(),
  };
}
```

### 3.2 战斗状态管理 `combatStore`

MVP完整保留战斗Store，但移除了与第二阶段系统（策略模式、爆发技能、药水）相关的接口。

```typescript
/**
 * @file stores/combat.ts
 * @description 战斗状态管理 - MVP精简版
 * 管理战斗循环、当前怪物、战斗日志、离线收益
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Monster, CombatResult, AttackRecord, OfflineReport } from '@/types';

export const useCombatStore = defineStore('combat', () => {
  // ========== State ==========
  
  /** 战斗中状态 */
  const isFighting = ref(false);
  /** 自动战斗状态 */
  const autoCombat = ref(false);
  /** 当前怪物 */
  const currentMonster = ref<Monster | null>(null);
  /** 怪物当前血量 */
  const monsterCurrentHp = ref(0);
  /** 怪物最大血量 */
  const monsterMaxHp = ref(0);
  /** 当前战斗日志（MVP只保留最近20条，不在独立组件中展示） */
  const combatLog = ref<string[]>([]);
  /** 总击杀数（本次在线） */
  const sessionKills = ref(0);
  /** 最后一场战斗结果 */
  const lastResult = ref<CombatResult | null>(null);
  /** 离线收益报告（登录时计算） */
  const offlineReport = ref<OfflineReport | null>(null);
  
  // [第二阶段] 策略模式：aggressive / balanced / defensive
  // const strategyMode = ref<'balanced'>('balanced');
  
  // [第二阶段] 爆发技能状态
  // const burstMode = ref(false);
  // const burstCooldown = ref(0);
  
  // [第二阶段] 药水系统
  // const potions = ref<Potion[]>([]);

  // ========== Getters ==========

  /** 怪物血量百分比 */
  const monsterHpPercent = computed(() => {
    if (monsterMaxHp.value <= 0) return 0;
    return Math.max(0, (monsterCurrentHp.value / monsterMaxHp.value) * 100);
  });

  /** 是否处于Boss战 */
  const isBossFight = computed(() => currentMonster.value?.type === MonsterType.BALANCED && false); // 简化判断

  /** 战斗状态文本 */
  const combatStatusText = computed(() => {
    if (!isFighting.value) return '休息中';
    if (autoCombat.value) return '自动战斗中';
    return '战斗中';
  });

  // ========== Actions ==========

  /** 设置当前怪物 */
  function setMonster(monster: Monster): void {
    currentMonster.value = monster;
    monsterCurrentHp.value = monster.state.currentHealth;
    monsterMaxHp.value = monster.baseHealth;
  }

  /** 更新怪物血量 */
  function updateMonsterHp(damage: number): void {
    monsterCurrentHp.value = Math.max(0, monsterCurrentHp.value - damage);
  }

  /** 怪物死亡处理 */
  function onMonsterKilled(): void {
    sessionKills.value++;
    currentMonster.value = null;
    monsterCurrentHp.value = 0;
    monsterMaxHp.value = 0;
  }

  /** 添加战斗日志（MVP保留最近20条） */
  function addLog(message: string): void {
    combatLog.value.push(message);
    if (combatLog.value.length > 20) {
      combatLog.value.shift();
    }
  }

  /** 清空战斗日志 */
  function clearLog(): void {
    combatLog.value = [];
  }

  /** 设置自动战斗 */
  function setAutoCombat(enabled: boolean): void {
    autoCombat.value = enabled;
    isFighting.value = enabled;
  }

  /** 记录战斗结果 */
  function recordResult(result: CombatResult): void {
    lastResult.value = result;
  }

  /** 设置离线报告 */
  function setOfflineReport(report: OfflineReport | null): void {
    offlineReport.value = report;
  }

  /** 清除离线报告 */
  function dismissOfflineReward(): void {
    offlineReport.value = null;
  }

  return {
    isFighting, autoCombat,
    currentMonster, monsterCurrentHp, monsterMaxHp,
    combatLog, sessionKills, lastResult, offlineReport,
    monsterHpPercent, isBossFight, combatStatusText,
    setMonster, updateMonsterHp, onMonsterKilled,
    addLog, clearLog, setAutoCombat,
    recordResult, setOfflineReport, dismissOfflineReward,
  };
});
```

### 3.3 装备状态管理 `equipmentStore`

MVP完整保留装备Store，但移除了套装检测、远古装备生成、天赋联动等第二阶段功能。

```typescript
/**
 * @file stores/equipment.ts
 * @description 装备状态管理 - MVP精简版
 * 管理背包、已装备、强化(+1~+5)
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { EquipmentItem, SlotType } from '@/types';
import { EQUIPMENT_CONSTANTS } from '@/utils/constants';

export const useEquipmentStore = defineStore('equipment', () => {
  // ========== State ==========

  /** 背包容量上限 */
  const INVENTORY_SIZE = 50;

  /** 背包中的装备 */
  const inventory = ref<EquipmentItem[]>([]);
  /** 已装备装备：部位 → 装备 */
  const equipped = ref<Partial<Record<SlotType, EquipmentItem>>>({});
  /** 强化石数量 */
  const enhancementStones = ref(0);

  // ========== Getters ==========

  /** 背包中物品数量 */
  const inventoryCount = computed(() => inventory.value.length);
  /** 背包剩余空间 */
  const inventorySpace = computed(() => INVENTORY_SIZE - inventory.value.length);
  /** 背包是否已满 */
  const isFull = computed(() => inventory.value.length >= INVENTORY_SIZE);
  /** 已装备数量 */
  const equippedCount = computed(() => Object.keys(equipped.value).length);

  /** 总装备评分 */
  const totalGearScore = computed(() => {
    let score = 0;
    for (const item of Object.values(equipped.value)) {
      if (item) score += item.score;
    }
    return score;
  });

  /** 获取某部位的已装备 */
  function getEquipped(slot: SlotType): EquipmentItem | undefined {
    return equipped.value[slot];
  }

  // ========== Actions ==========

  /** 添加装备到背包 */
  function addToInventory(item: EquipmentItem): boolean {
    if (isFull.value) return false;
    inventory.value.push(item);
    return true;
  }

  /** 装备一件装备（从背包到装备栏） */
  function equip(item: EquipmentItem): EquipmentItem | null {
    const slot = item.slot;
    const previous = equipped.value[slot] || null;

    // 从背包移除
    const idx = inventory.value.findIndex(i => i.instanceId === item.instanceId);
    if (idx !== -1) {
      inventory.value.splice(idx, 1);
    }

    // 如果该部位已有装备，退回背包
    if (previous) {
      addToInventory(previous);
    }

    equipped.value[slot] = item;
    return previous;
  }

  /** 卸下装备（从装备栏到背包） */
  function unequip(slot: SlotType): boolean {
    const item = equipped.value[slot];
    if (!item) return false;
    if (isFull.value) return false;

    delete equipped.value[slot];
    addToInventory(item);
    return true;
  }

  /** 分解装备（从背包中删除，返还强化石） */
  function dismantle(itemId: string): { success: boolean; stonesReturned: number } {
    const idx = inventory.value.findIndex(i => i.instanceId === itemId);
    if (idx === -1) return { success: false, stonesReturned: 0 };

    const item = inventory.value[idx];
    // 返还强化石 = 品质 × 强化等级
    const stones = item.enhancement.level * (item.rarity === 4 ? 5 : item.rarity === 3 ? 3 : 1);
    enhancementStones.value += stones;
    inventory.value.splice(idx, 1);
    return { success: true, stonesReturned: stones };
  }

  /** 强化装备 - MVP只开放+1~+5 */
  function enhance(itemId: string): { 
    success: boolean; 
    message: string;
    newLevel: number;
  } {
    // 查找装备（可能在背包或已装备中）
    let item = inventory.value.find(i => i.instanceId === itemId);
    let isEquipped = false;
    if (!item) {
      item = Object.values(equipped.value).find(i => i?.instanceId === itemId);
      isEquipped = true;
    }
    if (!item) return { success: false, message: '装备不存在', newLevel: 0 };

    const currentLevel = item.enhancement.level;
    
    // MVP强化上限+5
    if (currentLevel >= 5) {
      return { success: false, message: 'MVP阶段强化上限为+5', newLevel: currentLevel };
    }

    // 消耗金币计算
    const cost = Math.floor(
      EQUIPMENT_CONSTANTS.ENHANCE_BASE_COST * 
      Math.pow(EQUIPMENT_CONSTANTS.ENHANCE_COST_GROWTH, currentLevel)
    );
    
    // MVP简化：只消耗金币，不消耗强化石
    // [第二阶段] 强化+6以上需要消耗强化石，有失败降级的风险
    const successRate = EQUIPMENT_CONSTANTS.ENHANCE_SUCCESS_RATES[currentLevel];
    const roll = Math.random() * 100;

    if (roll <= successRate) {
      // 强化成功
      item.enhancement.level = currentLevel + 1;
      item.enhancement.failureCount = 0;
      // 重新计算装备评分
      item.score = Math.floor(item.score * 1.1);
      return { 
        success: true, 
        message: `强化成功！${item.name} +${currentLevel + 1}`,
        newLevel: currentLevel + 1 
      };
    } else {
      // MVP阶段 +0~+5 强化失败不降级（保护期）
      // [第二阶段] +6~+10 失败可能降级
      item.enhancement.failureCount++;
      return { 
        success: false, 
        message: `强化失败（成功率${successRate}%）`,
        newLevel: currentLevel 
      };
    }
  }

  /** 一键分解所有普通品质装备 */
  function autoDismantleNormal(): { count: number; stonesReturned: number } {
    const toRemove: number[] = [];
    let stones = 0;
    inventory.value.forEach((item, idx) => {
      if (item.rarity === 1) { // 普通品质
        toRemove.push(idx);
        stones += 1;
      }
    });
    // 从后往前删除，避免索引偏移
    toRemove.reverse().forEach(idx => inventory.value.splice(idx, 1));
    enhancementStones.value += stones;
    return { count: toRemove.length, stonesReturned: stones };
  }

  /** 出售装备换金币 */
  function sell(itemId: string): number {
    const idx = inventory.value.findIndex(i => i.instanceId === itemId);
    if (idx === -1) return 0;
    const item = inventory.value[idx];
    const sellPrice = Math.floor(item.baseValue * (1 + item.enhancement.level * 0.1));
    inventory.value.splice(idx, 1);
    return sellPrice;
  }

  /** 获取序列化数据 */
  function serialize(): object {
    return {
      inventory: inventory.value,
      equipped: equipped.value,
      enhancementStones: enhancementStones.value,
    };
  }

  /** 从序列化数据恢复 */
  function deserialize(data: any): void {
    inventory.value = data.inventory ?? [];
    equipped.value = data.equipped ?? {};
    enhancementStones.value = data.enhancementStones ?? 0;
  }

  return {
    inventory, equipped, enhancementStones,
    inventoryCount, inventorySpace, isFull, equippedCount, totalGearScore,
    addToInventory, equip, unequip, dismantle, enhance,
    autoDismantleNormal, sell, getEquipped,
    serialize, deserialize,
  };
});
```

### 3.4 Store间通信（MVP简化版）

MVP阶段Store间通信保留核心联动，去掉daily相关的联动。

```typescript
/**
 * @file stores/subscribers.ts
 * @description Store间响应式联动 - MVP简化版
 * 只保留核心的跨Store联动，去掉每日任务和转生相关联动
 */
import { usePlayerStore } from './player';
import { useCombatStore } from './combat';
import { useEquipmentStore } from './equipment';

/** 初始化所有跨Store订阅 */
export function initStoreSubscribers(): void {
  const playerStore = usePlayerStore();
  const combatStore = useCombatStore();
  const equipmentStore = useEquipmentStore();

  // --- 联动1：战斗击杀 → 玩家经验金币 ---
  // 此联动在combat引擎中直接调用store action，不通过订阅

  // --- 联动2：装备变化 → 触发属性重算 ---
  // 在装备/卸装时由UI组件调用updateCombatStats

  // --- 联动3：背包满时警告 ---
  // [第二阶段] 通过combatStore.addLog显示警告

  // [第二阶段] 以下联动在MVP后实现：
  // - 击杀数变化 → 更新每日任务进度
  // - 层数变化 → 更新每日任务进度
  // - 转生后自动应用灵魂加成
}
```

---

## MVP第二阶段标注汇总

| 系统/功能 | 标注位置 | 说明 |
|-----------|----------|------|
| 转生系统 (prestigeStore) | 3.1节 | 玩家progress中prestigeLevel/soulPoints预留字段 |
| 每日任务 (dailyStore) | 3.1节 | 整行删除，MVP不做 |
| 多职业 (ROGUE/MAGE) | 2.1节 | enums.ts中标注[第二阶段] |
| 天赋树 (TalentBranch) | 2.1节 | 枚举保留，player中talentAllocations预留 |
| 怪物词缀生效 | 2.1节 | MonsterAffix枚举保留，MVP战斗中不应用 |
| 远古装备 (ANCIENT) | 2.1节 | Rarity.ANCIENT枚举保留，掉落中不生成 |
| 策略模式切换 | 3.2节 | combatStore中注释掉 |
| 爆发技能 | 3.2节 | combatStore中注释掉 |
| 药水系统 | 3.2节 | combatStore中注释掉 |
| 强化+6以上 | 3.3节 | enhance()中上限判断为+5 |
| Store间daily联动 | 3.4节 | subscribers.ts中标注[第二阶段] |
