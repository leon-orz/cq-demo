# 放置型 ARPG 游戏开发文档
> **文档版本**：v1.0  
> **对应 GDD**：v1.0  
> **目标**：为前端开发团队提供完整的技术实现指南、架构规范与开发流程。

---

## 1. 技术栈选型

### 1.1 技术栈总览

| 层级 | 技术 | 版本 | 职责 |
|------|------|------|------|
| **框架** | Vue 3 | ^3.4 | 主框架，Composition API 组织复杂游戏逻辑 |
| **语言** | TypeScript | ^5.4 | 类型安全，装备/词缀/Build 等数据结构复杂，TS 是刚需 |
| **构建** | Vite | ^5.0 | 开发服务器、热更新、打包优化 |
| **状态** | Pinia | ^2.1 | 全局状态管理，配合持久化插件自动存档 |
| **样式** | Tailwind CSS | ^3.4 | 原子化 CSS 快速搭建暗黑主题游戏 UI |
| **动画** | GSAP | ^3.12 | 时间轴动画：伤害飘字、开箱仪式、装备光效 |
| **存储** | localForage | ^1.10 | IndexedDB 的 Promise 封装，存大量装备数据不卡 |
| **音频** | Howler.js | ^2.2 | 处理浏览器自动播放策略，BGM/音效管理 |
| **工具** | Vitest | ^1.0 | 单元测试，核心引擎（战斗/装备生成）必须可测 |

### 1.2 选型理由

#### 为什么选 Vue 3 + DOM，而不是 Phaser/Canvas？

本游戏的核心体验是**复杂 UI 交互**（装备对比、背包筛选、技能树、Build 计算），而非实时战斗画面渲染。

| 维度 | DOM + CSS (Vue) | Phaser/Canvas |
|------|-----------------|---------------|
| 装备背包网格 | 原生 CSS Grid + 事件监听 | 手写碰撞检测、坐标计算 |
| 装备对比浮窗 | 绝对定位 + z-index，悬停即出 | 管理绘制层级、文字渲染 |
| 技能树连线 | SVG 或 DOM 节点，响应式 | 手写贝塞尔曲线、点击判定 |
| 设置/表单面板 | 原生 input + v-model | 需封装 UI 组件库 |
| 响应式适配 | CSS media query / flex | 手动计算缩放、坐标映射 |
| 开发速度 | **快**（前端本职工作） | **慢**（处理引擎细节） |

**结论**：Canvas 做 UI 是自讨苦吃。唯一可能需要 Canvas 的场景是后期全屏粒子特效，届时可叠一个透明 `<canvas>` 层在 DOM 之上，互不干扰。

#### 为什么选 Pinia 而不是 Vuex？

- 更轻量，无 mutations 繁琐，直接 actions 修改 state。
- TypeScript 支持原生，无需额外类型封装。
- 配合 `pinia-plugin-persistedstate` 一行代码实现自动存档。

#### 为什么选 GSAP 而不是纯 CSS 动画？

- 伤害飘字需要**时间轴控制**（出现 → 上浮 → 淡出 → 销毁），GSAP 的 timeline 最适合。
- 开箱仪式需要**序列动画**（开箱 → 停顿 → 第一件装备飞出 → 停顿 → 第二件...），GSAP 的 `gsap.to()` 链式调用比 CSS keyframes 更易维护。
- 装备光效需要**动态颜色/强度变化**，GSAP 可以动画化任意对象属性。

---

## 2. 项目架构

### 2.1 目录结构

```text
project-root/
├── public/
│   ├── assets/
│   │   ├── items/              # 装备图标（按部位分类）
│   │   ├── effects/            # 特效素材（光柱、粒子、强化闪光）
│   │   ├── ui/                 # 界面素材（边框、按钮、背景）
│   │   └── audio/              # 音效与 BGM
│   └── favicon.ico
│
├── src/
│   ├── main.ts                 # 入口：创建 Vue 实例、注册 Pinia、加载存档
│   ├── App.vue                 # 根组件：布局框架（左中右三栏）
│   ├── style.css               # 全局样式：Tailwind 导入 + CSS 变量定义
│   │
│   ├── core/                   # ===== 纯游戏逻辑层（无 UI，可单元测试） =====
│   │   ├── combat/
│   │   │   ├── engine.ts       # 战斗模拟器：纯数值计算
│   │   │   ├── formula.ts      # 战斗公式：DPS、EHP、伤害减免
│   │   │   └── types.ts        # 战斗相关类型定义
│   │   ├── item/
│   │   │   ├── generator.ts    # 装备生成器：品质/词缀/roll 点
│   │   │   ├── affixRoll.ts    # 词缀 roll 点逻辑（数值范围、Tier）
│   │   │   └── naming.ts       # 装备自动命名（前缀+基础名+后缀）
│   │   ├── player/
│   │   │   ├── calculator.ts   # Build 计算器：汇总属性、计算 DPS/EHP
│   │   │   └── validator.ts    # Build 验证器：模拟对战某层怪物
│   │   ├── offline/
│   │   │   └── reward.ts       # 离线收益结算：时间差计算 + 批量战斗模拟
│   │   └── utils/
│   │       ├── random.ts       # 随机数工具： seeded random（便于测试）
│   │       ├── id.ts           # UUID 生成（装备唯一 ID）
│   │       └── time.ts         # 时间格式化、离线秒数计算
│   │
│   ├── data/                   # ===== 游戏配置层（静态数据） =====
│   │   ├── items/
│   │   │   ├── weapons.ts      # 武器基础库（剑、斧、法杖等）
│   │   │   ├── armors.ts       # 防具基础库
│   │   │   └── accessories.ts  # 饰品基础库
│   │   ├── affixes.ts          # 词缀池定义：前缀/后缀/数值范围/权重
│   │   ├── monsters.ts         # 怪物模板与层数配置
│   │   ├── skills.ts           # 技能与天赋树配置
│   │   └── sets.ts             # 套装效果定义
│   │
│   ├── stores/                 # ===== Pinia 状态管理层 =====
│   │   ├── player.ts           # 角色属性、等级、当前 Build
│   │   ├── inventory.ts        # 背包、装备穿戴/卸下、筛选规则
│   │   ├── combat.ts           # 战斗状态：是否挂机、当前层数、日志
│   │   ├── settings.ts         # 自动拾取过滤、分解规则、音画设置
│   │   └── save.ts             # 存档读写、导出/导入、版本迁移
│   │
│   ├── components/             # ===== Vue UI 组件层 =====
│   │   ├── layout/
│   │   │   ├── LeftPanel.vue   # 左栏：角色面板 + 装备穿戴栏
│   │   │   ├── CenterPanel.vue # 中栏：战斗区域（日志/飘字/层数信息）
│   │   │   └── RightPanel.vue  # 右栏：背包/技能树/设置（Tab 切换）
│   │   ├── inventory/
│   │   │   ├── ItemGrid.vue    # 背包网格（虚拟滚动）
│   │   │   ├── ItemSlot.vue    # 单件装备槽（穿戴栏/背包格）
│   │   │   ├── ItemTooltip.vue # 装备悬停提示（对比浮窗）
│   │   │   └── CompareModal.vue# 装备对比弹窗
│   │   ├── combat/
│   │   │   ├── BattleLog.vue   # 战斗日志滚动区域
│   │   │   ├── DamageText.vue  # 伤害飘字（GSAP 驱动）
│   │   │   ├── StageInfo.vue   # 当前层数/收益统计
│   │   │   └── MonsterAvatar.vue # 怪物形象（静态图 + 血条）
│   │   ├── equipment/
│   │   │   ├── ItemCard.vue    # 装备卡片（完整展示词缀/光效）
│   │   │   ├── RarityGlow.vue  # 品质光效组件（按品质渲染不同 CSS 光晕）
│   │   │   └── AffixLine.vue   # 单条词缀展示（颜色区分 T1/T2/T3）
│   │   ├── skilltree/
│   │   │   ├── SkillTree.vue   # 天赋树画布（SVG 节点 + 连线）
│   │   │   └── SkillNode.vue   # 单个天赋节点
│   │   ├── offline/
│   │   │   └── RewardReport.vue # 离线战利品开箱界面
│   │   └── common/
│   │       ├── Button.vue      # 统一按钮（主/次/危险/传说品质）
│   │       ├── Modal.vue       # 统一弹窗容器
│   │       ├── ProgressBar.vue # 进度条（生命/经验/强化）
│   │       └── NumberChange.vue# 数字变化动画（+1234 飘字）
│   │
│   ├── types/                  # ===== 全局 TypeScript 类型 =====
│   │   ├── item.ts             # 装备、词缀、品质类型
│   │   ├── player.ts           # 角色属性、天赋类型
│   │   ├── combat.ts           # 战斗结果、怪物类型
│   │   └── common.ts           # 通用工具类型
│   │
│   ├── composables/            # ===== Vue 组合式函数 =====
│   │   ├── useCombatLoop.ts    # 战斗循环：定时调用 engine + 驱动 UI
│   │   ├── useItemDrop.ts      # 掉落处理：生成装备 → 进入背包/分解
│   │   ├── useOfflineCheck.ts  # 离线检测：页面可见性变化时结算
│   │   ├── useAutoSave.ts      # 自动存档：节流保存（最多每 10 秒）
│   │   └── useAudio.ts         # 音频管理：Howler 封装，处理自动播放
│   │
│   └── utils/                  # ===== 通用工具函数 =====
│       ├── format.ts           # 数字格式化（大数字简写：1.2K, 3.5M）
│       ├── validators.ts       # 表单/输入校验
│       └── constants.ts        # 游戏常量（离线上限、背包容量、强化成功率）
│
├── tests/                      # ===== 单元测试 =====
│   ├── core/
│   │   ├── combat.test.ts      # 战斗引擎测试
│   │   ├── itemGenerator.test.ts # 装备生成测试
│   │   └── calculator.test.ts  # Build 计算测试
│   └── stores/
│       └── inventory.test.ts   # 状态管理测试
│
├── docs/
│   └── game-design-document.md # 游戏设计文档（GDD）
│
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### 2.2 架构分层原则

```
┌─────────────────────────────────────┐
│           Vue 组件层 (UI)            │  ← 只负责展示与交互，不直接修改游戏数据
│    components/ + composables/       │
├─────────────────────────────────────┤
│         Pinia 状态管理层              │  ← 唯一可修改游戏数据的入口，响应式驱动 UI
│           stores/                     │
├─────────────────────────────────────┤
│         纯游戏逻辑层 (Core)            │  ← 纯函数，无状态，可单元测试
│    core/ + data/ + types/            │
└─────────────────────────────────────┘
```

**数据流向**：
1. 用户操作（点击按钮）→ Vue 组件调用 composable
2. Composable 调用 Pinia Action 修改状态
3. Pinia Action 调用 core 层纯函数进行计算
4. 计算结果更新 Pinia State
5. Vue 组件通过 getter 响应式更新 UI

---

## 3. 核心模块实现

### 3.1 战斗引擎（core/combat/engine.ts）

**设计原则**：纯数值计算，零副作用，输入输出明确。

```typescript
// 核心接口
interface CombatResult {
  win: boolean;
  duration: number;           // 战斗耗时（秒）
  playerHpLost: number;       // 玩家损失生命
  drops: Item[];              // 掉落装备
  gold: number;               // 获得金币
  exp: number;                // 获得经验
  damageEvents: DamageEvent[]; // 供前端播放的伤害时间线
}

interface DamageEvent {
  timestamp: number;          // 相对战斗开始的时间（毫秒）
  damage: number;
  isCrit: boolean;
  isKill: boolean;
}

// 战斗模拟器
export function simulateCombat(
  player: PlayerBuild,
  monster: Monster,
  maxDuration: number = 60      // 单场战斗最长 60 秒，超时算失败
): CombatResult {
  const playerDps = calculateDps(player);
  const monsterDps = calculateMonsterDps(monster, player);

  const timeToKill = monster.hp / playerDps;
  const timeToDie = player.stats.hp / monsterDps;

  if (timeToKill >= maxDuration || timeToKill >= timeToDie) {
    return { win: false, duration: maxDuration, playerHpLost: monsterDps * maxDuration, drops: [], gold: 0, exp: 0, damageEvents: [] };
  }

  // 生成伤害时间线（供前端播放飘字）
  const events = generateDamageTimeline(timeToKill, playerDps, player.stats.critChance, player.stats.critDamage);

  return {
    win: true,
    duration: timeToKill,
    playerHpLost: monsterDps * timeToKill,
    drops: generateDrops(monster),
    gold: calculateGoldReward(monster),
    exp: calculateExpReward(monster),
    damageEvents: events
  };
}
```

**批量战斗**（离线收益/高速挂机）：
```typescript
export function simulateBatchCombat(
  player: PlayerBuild,
  stage: StageConfig,
  totalSeconds: number
): BatchResult {
  let remaining = totalSeconds;
  let kills = 0;
  let totalGold = 0;
  let totalExp = 0;
  const allDrops: Item[] = [];

  while (remaining > 0) {
    const monster = stage.getRandomMonster();
    const result = simulateCombat(player, monster, remaining);

    if (!result.win) break;

    kills++;
    totalGold += result.gold;
    totalExp += result.exp;
    allDrops.push(...result.drops);
    remaining -= result.duration;
  }

  return { kills, gold: totalGold, exp: totalExp, drops: allDrops, actualSeconds: totalSeconds - remaining };
}
```

### 3.2 装备生成器（core/item/generator.ts）

```typescript
export function generateItem(
  monsterLevel: number,
  rarityOverride?: Rarity
): Item {
  // 1. 确定品质
  const rarity = rarityOverride ?? rollRarity(monsterLevel);

  // 2. 选择基础物品（根据怪物等级和部位池）
  const baseItem = pickBaseItem(monsterLevel);

  // 3. Roll 词缀
  const affixes = rollAffixes(rarity.affixCount, monsterLevel, baseItem.slot);

  // 4. 如果是传说，替换第一个词缀为固定传奇词缀
  if (rarity === 'legendary') {
    affixes[0] = getLegendaryAffix(baseItem.legendaryPool);
  }

  // 5. 计算基础属性（根据 iLv 缩放）
  const scaledBase = scaleBaseStats(baseItem.baseStats, monsterLevel);

  return {
    id: generateUUID(),
    name: generateItemName(baseItem, affixes, rarity),
    slot: baseItem.slot,
    rarity,
    itemLevel: monsterLevel,
    baseStats: scaledBase,
    affixes,
    icon: baseItem.icon,
    setId: baseItem.setId // 可能属于某套装
  };
}

function rollRarity(monsterLevel: number): Rarity {
  const roll = Math.random();
  const magicFind = getPlayerMagicFind(); // 从玩家状态获取

  // 基础掉率（可被 MF 加成）
  if (roll < 0.001 * (1 + magicFind)) return 'legendary';  // 0.1% 基础
  if (roll < 0.01 * (1 + magicFind)) return 'rare';       // 1%
  if (roll < 0.1 * (1 + magicFind)) return 'magic';        // 10%
  return 'normal';                                         // 89.9%
}
```

### 3.3 Build 计算器（core/player/calculator.ts）

```typescript
export function calculateTotalStats(
  baseStats: PlayerBaseStats,
  equipped: EquippedItems,
  skillNodes: SkillNode[]
): TotalStats {
  let stats = { ...baseStats };

  // 1. 汇总装备基础属性
  Object.values(equipped).forEach(item => {
    if (!item) return;
    Object.entries(item.baseStats).forEach(([key, val]) => {
      stats[key] = (stats[key] || 0) + val;
    });
  });

  // 2. 汇总装备词缀（百分比词缀需要特殊处理）
  Object.values(equipped).forEach(item => {
    if (!item) return;
    item.affixes.forEach(affix => {
      if (affix.type === 'percent') {
        stats[affix.stat] = (stats[affix.stat] || 0) * (1 + affix.value / 100);
      } else {
        stats[affix.stat] = (stats[affix.stat] || 0) + affix.value;
      }
    });
  });

  // 3. 汇总天赋加成
  skillNodes.forEach(node => {
    if (node.active) {
      stats[node.stat] = (stats[node.stat] || 0) + node.value;
    }
  });

  // 4. 应用软上限
  stats.critChance = Math.min(stats.critChance, 75);
  stats.dodgeChance = Math.min(stats.dodgeChance, 60);

  return stats;
}

export function calculateDps(stats: TotalStats): number {
  const attack = stats.attack || 0;
  const mainStatBonus = 1 + (stats.mainStat || 0) * 0.005;
  const attackSpeed = Math.min(stats.attackSpeed || 1, 5);
  const critChance = (stats.critChance || 5) / 100;
  const critDamage = (stats.critDamage || 150) / 100;

  return attack * mainStatBonus * attackSpeed * (1 + critChance * (critDamage - 1));
}

export function calculateEhp(stats: TotalStats, monsterLevel: number): number {
  const hp = stats.hp || 100;
  const armor = stats.armor || 0;
  const resistance = Math.max(stats.fireRes || 0, stats.iceRes || 0, stats.lightningRes || 0);
  const dodge = (stats.dodgeChance || 0) / 100;

  const armorDR = armor / (armor + monsterLevel * 50 + 500);
  const resDR = resistance / (resistance + 100);

  return hp / ((1 - armorDR) * (1 - resDR) * (1 - dodge));
}
```

### 3.4 离线收益计算（core/offline/reward.ts）

```typescript
export function calculateOfflineReward(
  lastSaveTime: number,
  playerBuild: PlayerBuild,
  currentStage: number,
  maxOfflineHours: number = 8
): OfflineReport {
  const now = Date.now();
  const rawOfflineSeconds = (now - lastSaveTime) / 1000;
  const maxOfflineSeconds = maxOfflineHours * 3600;

  const effectiveSeconds = Math.min(rawOfflineSeconds, maxOfflineSeconds);

  // 获取层数配置
  const stageConfig = getStageConfig(currentStage);

  // 批量模拟（不需要逐秒，可以按分钟聚合减少计算量）
  const batchResult = simulateBatchCombat(playerBuild, stageConfig, effectiveSeconds);

  // 检查背包容量（如果满了，截断收益）
  const inventoryStore = useInventoryStore(); // 从存档中读取离线前的背包状态
  const remainingSlots = INVENTORY_CAPACITY - inventoryStore.items.length;
  const actualDrops = batchResult.drops.slice(0, remainingSlots);
  const wasFull = batchResult.drops.length > remainingSlots;
  const lostSeconds = wasFull 
    ? estimateTimeForDrops(batchResult.drops.slice(remainingSlots), playerBuild, stageConfig)
    : 0;

  return {
    totalSeconds: effectiveSeconds,
    actualSeconds: effectiveSeconds - lostSeconds,
    monstersKilled: batchResult.kills,
    gold: batchResult.gold,
    exp: batchResult.exp,
    items: actualDrops,
    wasInterrupted: wasFull,
    lostTime: lostSeconds
  };
}
```

---

## 4. 状态管理（Pinia）

### 4.1 Store 划分

按**玩家操作视角**划分 Store，而非技术模块：

| Store | 职责 | 持久化 |
|-------|------|--------|
| `player` | 角色等级、经验、基础属性、当前装备 Build | ✅ |
| `inventory` | 背包物品、穿戴栏、筛选规则、分解设置 | ✅ |
| `combat` | 是否挂机、当前层数、战斗日志、怪物状态 | ❌（运行时状态） |
| `settings` | 自动拾取过滤、音效开关、画面设置 | ✅ |
| `save` | 存档版本、导出/导入、最后保存时间 | ✅ |

### 4.2 关键 Store 示例

```typescript
// stores/player.ts
export const usePlayerStore = defineStore('player', {
  state: () => ({
    name: '冒险者',
    level: 1,
    exp: 0,
    expToNext: 100,
    baseStats: { str: 10, dex: 10, int: 10, hp: 100 },
    equipped: {
      weapon: null as Item | null,
      helmet: null as Item | null,
      armor: null as Item | null,
      gloves: null as Item | null,
      shoes: null as Item | null,
      ring1: null as Item | null,
      ring2: null as Item | null,
      necklace: null as Item | null,
      offhand: null as Item | null
    },
    skillNodes: [] as SkillNode[]
  }),

  getters: {
    // 派生状态：实时计算总属性（不存 state，用 getter）
    totalStats(): TotalStats {
      return calculateTotalStats(this.baseStats, this.equipped, this.skillNodes);
    },

    dps(): number {
      return calculateDps(this.totalStats);
    },

    ehp(): number {
      const combatStore = useCombatStore();
      return calculateEhp(this.totalStats, combatStore.currentStage * 2 + 10);
    },

    gearScore(): number {
      return calculateGearScore(this.equipped);
    }
  },

  actions: {
    equipItem(slot: EquipmentSlot, item: Item) {
      // 如果该部位已有装备，先卸到背包
      if (this.equipped[slot]) {
        useInventoryStore().addItem(this.equipped[slot]!);
      }
      this.equipped[slot] = item;
      useInventoryStore().removeItem(item.id);
    },

    unequipItem(slot: EquipmentSlot) {
      const item = this.equipped[slot];
      if (item) {
        useInventoryStore().addItem(item);
        this.equipped[slot] = null;
      }
    },

    gainExp(amount: number) {
      this.exp += amount;
      while (this.exp >= this.expToNext) {
        this.exp -= this.expToNext;
        this.level++;
        this.expToNext = Math.floor(this.expToNext * 1.2);
        // 升级奖励：天赋点
      }
    }
  },

  persist: {
    key: 'player',
    paths: ['name', 'level', 'exp', 'expToNext', 'baseStats', 'equipped', 'skillNodes']
  }
});
```

### 4.3 持久化策略

```typescript
// stores/save.ts - 集中管理存档
export const useSaveStore = defineStore('save', {
  state: () => ({
    version: 1,
    lastSaveTime: Date.now(),
    gameStartTime: Date.now()
  }),

  actions: {
    async saveAll() {
      // Pinia persistedstate 插件会自动保存各 store
      // 这里额外记录时间戳和版本
      this.lastSaveTime = Date.now();

      // 使用 localForage 存一份完整快照（用于导出/备份）
      const snapshot = {
        version: this.version,
        timestamp: this.lastSaveTime,
        player: usePlayerStore().$state,
        inventory: useInventoryStore().$state,
        settings: useSettingsStore().$state
      };
      await localForage.setItem('game_save_v1', snapshot);
    },

    async loadAll(): Promise<boolean> {
      const snapshot = await localForage.getItem('game_save_v1');
      if (!snapshot) return false;

      // 版本兼容处理
      if (snapshot.version !== this.version) {
        return this.migrate(snapshot);
      }

      // 恢复各 store 状态
      usePlayerStore().$patch(snapshot.player);
      useInventoryStore().$patch(snapshot.inventory);
      useSettingsStore().$patch(snapshot.settings);

      return true;
    },

    exportToString(): string {
      // 导出为 base64，玩家可手动备份
      const snapshot = { /* ... */ };
      return btoa(JSON.stringify(snapshot));
    },

    importFromString(str: string): boolean {
      try {
        const snapshot = JSON.parse(atob(str));
        // 校验后恢复...
        return true;
      } catch {
        return false;
      }
    }
  }
});
```

### 4.4 自动存档触发点

| 触发时机 | 节流策略 |
|---------|---------|
| 战斗结算后 | 最多每 10 秒存一次（debounce） |
| 装备穿戴/卸下 | 立即保存 |
| 技能点分配 | 立即保存 |
| 设置变更 | 立即保存 |
| 页面 `beforeunload` | 同步保存（防止数据丢失） |
| 页面 `visibilitychange`（切后台） | 立即保存 |

---

## 5. 性能优化

### 5.1 响应式性能（Vue 陷阱）

装备对象词缀多、属性深，200 件装备同时更新会卡。

**方案**：装备对象用 `shallowReactive`，内部属性变化时手动触发更新。

```typescript
// composables/useItem.ts
import { shallowReactive, triggerRef } from 'vue';

export function createItemReactive(baseItem: ItemBase): Item {
  const item = shallowReactive({
    id: generateUUID(),
    ...baseItem,
    affixes: baseItem.affixes.map(a => shallowReactive({ ...a }))
  });

  // 强化装备时改变词缀数值
  function enhanceAffix(index: number, newValue: number) {
    item.affixes[index].value = newValue;
    triggerRef(item); // 手动通知 Vue 更新
  }

  return { ...item, enhanceAffix };
}
```

### 5.2 背包虚拟滚动

离线回来 200 件装备，DOM 节点不能全渲染。

**方案**：使用 `vue-virtual-scroller` 或自研 `IntersectionObserver` 实现。只渲染视口内的格子（约 20-30 个），滚动时动态替换。

```vue
<!-- ItemGrid.vue -->
<template>
  <div class="grid grid-cols-8 gap-1" ref="gridRef">
    <ItemSlot
      v-for="item in visibleItems"
      :key="item.id"
      :item="item"
    />
  </div>
</template>

<script setup>
import { useVirtualList } from '@/composables/useVirtualList';

const props = defineProps({ items: Array });
const { visibleItems, gridRef } = useVirtualList(props.items, {
  itemHeight: 48,
  overscan: 10
});
</script>
```

### 5.3 批量 UI 更新

离线开箱展示 100 件装备，不要逐个 `items.push()`（触发 100 次响应式更新）。

```typescript
// 正确做法：先聚合，一次性赋值
const newItems = await calculateOfflineReward(...);
inventoryStore.$patch((state) => {
  state.items.push(...newItems); // 只触发一次响应式更新
});
```

### 5.4 战斗日志滚动

战斗日志无限增长，需限制长度（保留最近 100 条），避免内存泄漏。

```typescript
// stores/combat.ts
const MAX_LOG_ENTRIES = 100;

actions: {
  addLog(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > MAX_LOG_ENTRIES) {
      this.logs = this.logs.slice(-MAX_LOG_ENTRIES); // 截断旧日志
    }
  }
}
```

### 5.5 伤害飘字对象池

伤害飘字频繁创建/销毁 DOM 节点，导致 GC 压力。

```typescript
// composables/useDamagePool.ts
const POOL_SIZE = 50;
const pool = ref<HTMLElement[]>([]);

export function useDamagePool() {
  function showDamage(amount: number, isCrit: boolean, x: number, y: number) {
    const el = pool.value.find(e => e.style.display === 'none') || createNewElement();
    el.textContent = formatNumber(amount);
    el.className = isCrit ? 'damage-text crit' : 'damage-text';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.display = 'block';

    // GSAP 动画结束后归还对象池
    gsap.to(el, {
      y: -100,
      opacity: 0,
      duration: 1,
      onComplete: () => { el.style.display = 'none'; }
    });
  }

  return { showDamage };
}
```

---

## 6. 开发流程与里程碑

### 6.1 环境搭建（Day 1）

```bash
# 1. 创建项目
npm create vue@latest idle-arpg
cd idle-arpg

# 2. 安装依赖
npm install pinia pinia-plugin-persistedstate localforage gsap howler
npm install -D vitest tailwindcss postcss autoprefixer

# 3. 配置 Tailwind
npx tailwindcss init -p
# 配置 tailwind.config.js 的 content 路径

# 4. 配置 Pinia 持久化
# main.ts 中：
# import { createPersistedState } from 'pinia-plugin-persistedstate'
# pinia.use(createPersistedState({ storage: localForage }))
```

### 6.2 里程碑规划

#### Milestone 1：核心循环验证（Week 1）
**目标**：玩家能"点一下，看结果，捡装备，穿装备，变强"。

- [ ] 项目骨架搭建（Vue 3 + Pinia + Tailwind + 暗黑主题）
- [ ] 角色基础属性系统（力量/敏捷/智力 + 生命/攻击/防御）
- [ ] 装备生成器（白/蓝/黄 三个品质，2-3 种基础词缀）
- [ ] Build 计算器（实时汇总属性、计算 DPS）
- [ ] 手动"挑战"按钮：点击 → 模拟战斗 → 显示胜负和掉落
- [ ] 装备穿戴/卸下：实时更新角色面板
- [ ] 简单的装备对比（悬停显示属性）

**验收标准**：玩家可以通过换装备明显感受到 DPS 变化。

#### Milestone 2：挂机与离线（Week 2）
**目标**：游戏开始"自己玩自己"。

- [ ] 自动战斗开关：开启后每秒自动进行战斗模拟
- [ ] 战斗可视化：伤害数字飘字（GSAP）、怪物血条、击杀日志滚动
- [ ] 离线收益计算：记录退出时间，登录时结算离线期间收益
- [ ] 离线开箱界面：战利品箱动画，逐件展示
- [ ] 背包系统：50 格容量，满包自动停止挂机
- [ ] 一键分解：白/蓝装批量转化为强化石

**验收标准**：关闭浏览器 1 小时后再打开，能看到"你离线期间获得了 XX"。

#### Milestone 3：Build 深度（Week 3）
**目标**：让"整理装备"变得有策略性。

- [ ] 词缀扩展：暴击率、暴击伤害、攻击速度、元素伤害、抗性
- [ ] 装备评分系统：根据词缀组合计算综合评分，辅助决策
- [ ] 技能树组件：3-5 个被动天赋（SVG 节点 + 连线）
- [ ] 层数系统：打过第 N 层解锁第 N+1 层，每层怪物更强
- [ ] 套装雏形：1-2 套 2 件/4 件效果的套装

**验收标准**：玩家需要在"高攻击低生存"和"高生存低攻击"之间做选择。

#### Milestone 4：Polish 与长期系统（Week 4+）

- [ ] 传说装备：固定传奇词缀，改变玩法（如"攻击连锁闪电"）
- [ ] 强化系统：+1 到 +10，消耗强化石，失败不掉级或只降 1 级
- [ ] 转生/轮回系统（Prestige）：到达一定层数后重置，获得永久加成
- [ ] 多角色/多职业：战士（力量）、刺客（敏捷）、法师（智力）
- [ ] 成就与挑战：限时挑战、只用蓝装通关等
- [ ] 排行榜与装备展示（可选）

### 6.3 代码规范

#### TypeScript 规范
- 所有游戏数据接口必须定义类型，禁止 `any`。
- 装备、词缀、怪物等配置数据使用 `as const` 确保类型收窄。
- 核心引擎函数必须是纯函数（无副作用），便于测试。

#### 命名规范
```text
core/ 层：函数式命名，动词开头
  - generateItem(), calculateDps(), simulateCombat()

stores/ 层：Pinia store 命名
  - usePlayerStore, useInventoryStore
  - getters 用名词：totalStats, dps, ehp
  - actions 用动词：equipItem(), unequipItem(), gainExp()

components/ 层：Vue 组件命名
  - 大写驼峰：ItemGrid.vue, BattleLog.vue
  - 组合式函数：useCombatLoop(), useAutoSave()
```

#### 文件组织原则
- `core/` 层**禁止**导入 Vue/Pinia/组件，保持纯逻辑。
- `components/` 层**禁止**直接调用 `core/` 函数，必须通过 `stores/` 或 `composables/` 中转。
- `data/` 层**禁止**包含运行时逻辑，只能是静态配置对象。

---

## 7. 测试策略

### 7.1 单元测试（Vitest）

**必须测试的模块**：

```typescript
// tests/core/combat.test.ts
import { describe, it, expect } from 'vitest';
import { simulateCombat } from '@/core/combat/engine';

describe('战斗引擎', () => {
  it('战力碾压时应快速击杀', () => {
    const player = createMockPlayer({ attack: 1000, hp: 1000 });
    const monster = createMockMonster({ hp: 100, attack: 10 });
    const result = simulateCombat(player, monster);

    expect(result.win).toBe(true);
    expect(result.duration).toBeLessThan(1);
  });

  it('战力不足时应失败', () => {
    const player = createMockPlayer({ attack: 10, hp: 100 });
    const monster = createMockMonster({ hp: 1000, attack: 1000 });
    const result = simulateCombat(player, monster);

    expect(result.win).toBe(false);
  });
});

// tests/core/itemGenerator.test.ts
describe('装备生成器', () => {
  it('应生成正确品质的装备', () => {
    const item = generateItem(10, 'legendary');
    expect(item.rarity).toBe('legendary');
    expect(item.affixes.length).toBe(4);
  });

  it('传说装备应包含固定传奇词缀', () => {
    const item = generateItem(10, 'legendary');
    const hasLegendaryAffix = item.affixes.some(a => a.isLegendary);
    expect(hasLegendaryAffix).toBe(true);
  });
});
```

### 7.2 集成测试

- 离线收益计算：模拟离线 8 小时，验证收益不超标、背包满时正确截断。
- 存档/读档：保存 → 刷新页面 → 读取，验证状态完全一致。
- Build 计算：穿戴装备 → 验证 DPS/EHP 变化符合预期。

---

## 8. 附录

### 8.1 开发检查清单（Checklist）

**MVP 发布前必须完成**：
- [ ] 战斗模拟无 bug，胜负判定正确
- [ ] 装备生成器各品质掉率符合设计
- [ ] 离线收益计算准确，上限生效
- [ ] 存档/读档 100% 可靠，不丢数据
- [ ] 背包满时自动停止挂机
- [ ] 一键分解不误删有用装备
- [ ] 装备对比 3 秒内可看懂
- [ ] 移动端触摸操作流畅
- [ ] 音效不突兀，可关闭
- [ ] 暗黑主题无刺眼亮色元素

### 8.2 常见问题排查

| 问题 | 可能原因 | 解决方案 |
|------|---------|---------|
| 离线收益异常高 | 本地时间被修改 | 收益上限硬封顶 + 服务端校验（如有） |
| 背包卡顿 | 装备对象深层响应式 | 改用 shallowReactive + 虚拟滚动 |
| 战斗日志内存泄漏 | 无限 push 未清理 | 限制 MAX_LOG_ENTRIES = 100 |
| 存档丢失 | beforeunload 未触发 | 增加 visibilitychange 备份保存 |
| 伤害飘字卡顿 | 频繁创建 DOM | 使用对象池（Object Pool）复用 |
| 装备对比浮窗错位 | 视口边界检测缺失 | 动态计算 left/top，超出时翻转方向 |

---

> **文档维护**：本开发文档随技术实现迭代更新。任何架构变更、新技术引入、性能优化方案需在此同步修订。
