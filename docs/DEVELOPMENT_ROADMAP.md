# 放置裂隙：装备与传说 — 分阶段实施路线图

> 本文档与 `GameDesignDocument.md`（完整设计文档）和 `DevelopmentDocument.md`（完整开发文档）配套使用。
> AI按此路线图分阶段读取完整文档中的对应章节，逐步实现。

---

## 阶段一：MVP核心循环（可玩版本，4-6周）

**目标**：玩家能体验到"挂机→掉装备→穿装备→变强→推层"的核心循环。

### 读取的设计文档章节

| 章节 | 读取范围 | 实现内容 |
|------|---------|---------|
| Ch1 游戏概述 | 1.1-1.4 | 理解游戏定位和核心体验 |
| Ch3 战斗系统 | 3.1-3.4 | 纯数值战斗、DPS/EHP公式、自动挂机 |
| Ch4 角色属性 | 4.1-4.3 | 战士1个职业、基础属性、训练+1~+20 |
| Ch5 装备系统-词缀 | 5.1-5.6 | 18种词缀、5种品质、装备评分、部位差异化 |
| Ch6 装备系统-强化 | 6.3（+1~+5部分） | 强化+1~+5规则 |
| Ch8 推层系统 | 8.1-8.4 | 层数递进、推荐战力、收益衰减 |
| Ch10 离线收益 | 10.1-10.3 | 12h软上限、离线报告 |
| Ch11 经济系统 | 11.1-11.2 | 金币、强化石、训练消耗 |
| Ch12 背包与UI | 12.1-12.3 | 50格背包、过滤、分解、一键穿戴、三栏布局 |

### 读取的开发文档章节

| 章节 | 产出文件 |
|------|---------|
| Ch1 技术选型 + Ch2 项目配置 | `vite.config.ts`, `tsconfig.json`, `package.json`, `types/*.ts`, `utils/constants.ts`, `main.ts`, `App.vue` |
| Ch3 数据类型 | `types/enums.ts`, `types/index.ts`（完整8枚举+20接口） |
| Ch4 Store（player+combat+equipment） | `stores/player.ts`, `stores/combat.ts`, `stores/equipment.ts` |
| Ch5 战斗引擎 | `core/CombatEngine.ts`, `core/FloorScaling.ts`, `composables/useCombat.ts` |
| Ch6 装备系统 | `core/LootGenerator.ts`, `core/GearScore.ts`, `core/EnhancementSystem.ts`（+1~+5） |
| Ch7 离线收益 | `core/OfflineCalculator.ts` |
| Ch8 存档系统 | `core/SaveManager.ts`（基础版：localStorage + JSON导入导出） |
| Ch9 UI组件 | `components/equipment/EquipmentCard.vue`, `EquipmentCompare.vue`, `components/combat/CombatPanel.vue`, `components/ui/OfflineReportModal.vue` |

### 阶段一不实现（标记"[第二阶段]"跳过）

- ~~Ch6 传奇特效、套装效果、远古装备~~
- ~~Ch6 强化+6~+10~~
- ~~Ch7 天赋系统~~
- ~~Ch9 转生系统~~
- ~~Ch13 每日任务/成就/社交~~
- ~~Ch14 商业化~~
- ~~Ch9 UI：CombatLog.vue、DamageFloat.vue~~
- ~~Ch10 性能优化（脏标记缓存先做，Web Worker不做）~~
- ~~Ch11 PWA~~

---

## 阶段二：构筑深度（6-8周）

**目标**：装备Build有深度，玩家有长期追求。

### 新增读取的设计文档章节

| 章节 | 实现内容 |
|------|---------|
| Ch6 传奇套装强化（剩余部分） | 15件传奇触发特效、3套套装效果、强化+6~+10 |
| Ch7 天赋系统 | 48节点天赋树、6条分支、终极互斥 |
| Ch9 转生系统 | Prestige、灵魂货币、8项永久加成、转生里程碑 |
| Ch8 Boss机制 | 每10层Boss轻量机制、首通奖励 |

### 新增读取的开发文档章节

| 章节 | 产出文件 |
|------|---------|
| Ch4 Store（prestige+daily） | `stores/prestige.ts`, `stores/daily.ts` |
| Ch6 装备系统（扩展） | 传奇特效触发逻辑、套装检测、远古装备生成 |
| Ch9 UI（扩展） | `CombatLog.vue`（战斗日志100条）、`DamageFloat.vue` |

---

## 阶段三：社交与长线（4-6周）

**目标**：增加留存抓手和商业化能力。

### 新增读取的设计文档章节

| 章节 | 实现内容 |
|------|---------|
| Ch13 每日/成就/社交 | 每日5选3任务、成就树、本地排行榜、佣兵酒馆 |
| Ch14 商业化 | 买断制、DLC系统、捐助者徽章 |
| Ch15 视觉反馈 | 开箱动画、伤害飘字、品质光柱 |

### 新增读取的开发文档章节

| 章节 | 产出文件 |
|------|---------|
| Ch10 性能优化 | Web Worker、对象池、虚拟滚动 |
| Ch11 PWA | vite-plugin-pwa、Service Worker |

---

## 每轮给AI的Prompt模板

### 第一轮（阶段一）

```
你是一个H5游戏前端开发专家。请按以下步骤开发《放置裂险：装备与传说》的MVP核心循环：

1. 先阅读设计文档 GameDesignDocument.md 的第1-5章、第8章、第10-12章，理解游戏设计
2. 再阅读开发文档 DevelopmentDocument.md 的第1-9章，获取技术实现细节
3. 按以下顺序实现：
   - 步骤1：创建项目（vite.config.ts, package.json, tsconfig.json）
   - 步骤2：定义类型（types/enums.ts, types/index.ts, utils/constants.ts）
   - 步骤3：实现3个Store（player, combat, equipment）
   - 步骤4：实现战斗引擎（CombatEngine.ts, FloorScaling.ts）
   - 步骤5：实现装备系统（LootGenerator.ts, GearScore.ts, EnhancementSystem.ts）
   - 步骤6：实现离线收益（OfflineCalculator.ts）
   - 步骤7：实现存档（SaveManager.ts）
   - 步骤8：实现UI组件（4个Vue组件）
   - 步骤9：组装App.vue和主界面

每个步骤完成后告诉我产出文件和关键实现决策。
```

### 后续轮次

每轮开始前，先阅读本路线图确认当前阶段范围，再从完整文档中读取对应章节。
