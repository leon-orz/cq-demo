# START HERE — 开发入口文件

> 你是《放置裂隙：装备与传说》的开发助手。请按本文档的指引，依次完成各阶段开发任务。

---

## 0. 项目概述

《放置裂隙：装备与传说》（Idle Rift）是一款 H5 文字放置 ARPG。
- **核心体验**：角色自动挂机打怪，玩家回来筛选装备、调整 Build、决定挂哪层
- **技术栈**：Vue 3 + TypeScript + Vite + Pinia + Tailwind CSS，纯前端
- **目标**：阶段一先做一个可玩的 MVP（4-6周），再逐步添加系统

---

## 1. 文档清单（共5份）

| # | 文件名 | 作用 | 什么时候读 |
|---|--------|------|-----------|
| 1 | `START_HERE.md` | 本文件，入口指南 | **第一步就读这个** |
| 2 | `DESIGN_PRIMER.md` | 设计精华版，约3K tokens | **阶段一必读** — 了解游戏全貌 |
| 3 | `DEV_PRIMER.md` | 开发精华版，约5K tokens | **阶段一必读** — 了解技术架构和接口 |
| 4 | `GameDesignDocument.md` | 完整设计文档（17章） | 实现某个系统时，查阅对应章节获取详细数值 |
| 5 | `DevelopmentDocument.md` | 完整开发文档（12章） | 实现某个系统时，查阅对应章节获取完整代码 |

---

## 2. 开发顺序（阶段划分）

### 阶段一：MVP 核心循环（可玩版本）

**目标**：玩家能体验到"挂机 → 掉装备 → 穿装备 → 变强 → 推层"的核心循环。

**步骤**（按顺序执行，每步完成后再进入下一步）：

---

#### Step 1：建立全局理解（读2份文档，不写代码）

1. 阅读 `DESIGN_PRIMER.md` — 了解游戏是什么、核心循环、战斗公式、装备系统、推层规则
2. 阅读 `DEV_PRIMER.md` — 了解技术架构、目录结构、类型定义、Store接口、核心引擎public方法
3. 确认理解后告诉我："已理解全局设计，准备开始 Step 2"

**注意**：这两份文档覆盖了游戏的所有核心系统。如果你在读的过程中发现某个设计细节不清楚，可以去 `GameDesignDocument.md` 查阅对应章节的详细说明。

---

#### Step 2：创建项目骨架（产出配置文件）

**阅读**：`DEV_PRIMER.md` 第1节（项目配置）+ `DevelopmentDocument.md` 第1-2章

**产出文件**：
```
vite.config.ts          — Vite + Vue + PWA 插件配置
tsconfig.json           — TypeScript 严格模式配置
package.json            — 所有依赖和 scripts
index.html              — 入口 HTML
.env                    — 环境变量
```

**完成后**：运行 `npm install && npm run dev`，确认项目能启动，告诉我启动成功的截图。

---

#### Step 3：类型定义和常量（产出 types/ + utils/）

**阅读**：`DEV_PRIMER.md` 第2-3节（类型定义 + 常量）+ `DevelopmentDocument.md` 第3章

**产出文件**：
```
src/types/enums.ts          — 8个枚举（ClassType, SlotType, Rarity, AffixType, MonsterType, MonsterAffix, TalentBranch, ScoreMode）
src/types/index.ts          — 所有接口（Player, EquipmentItem, Affix, Monster, CombatResult, OfflineReport 等20+接口）
src/utils/constants.ts      — 游戏数值常量（上限、缩放率、成功率表、品质倍率等）
src/utils/format.ts         — 格式化函数（数字格式化、时间格式化）
src/utils/math.ts           — 数学工具（clamp、randomRange 等）
src/utils/debounce.ts       — 防抖函数
```

**完成后**：确保 `npm run build` 能通过类型检查，无 TypeScript 错误。

---

#### Step 4：3 个核心 Store（产出 stores/）

**阅读**：`DEV_PRIMER.md` 第4节（Store 设计）+ `DevelopmentDocument.md` 第4章

**产出文件**：
```
src/stores/player.ts        — 角色属性、金币、训练、经验
src/stores/combat.ts        — 战斗状态、挂机控制、层数管理
src/stores/equipment.ts     — 背包、装备、强化石、评分模式
```

**每个 Store 必须包含**：
- State（ref/reactive）
- Getters（computed — DPS、EHP、战力、推荐层等）
- Actions（普通函数 — 训练、穿装备、启动挂机等）

**Store 间通信规则**：
- playerStore 提供角色属性给 combatStore 计算战斗
- equipmentStore 装备变化时调用 playerStore.recalculateStats() 刷新属性
- combatStore 战斗胜利时调用 playerStore.gainGold()/gainExp() 和 equipmentStore.addToInventory()

**完成后**：写一个简单测试（在 App.vue 中初始化数据、调用几个 Action），确认 Store 间能正确联动。

---

#### Step 5：核心引擎（产出 core/，这是最重要的部分）

**阅读**：`DEV_PRIMER.md` 第5节（核心引擎）+ `DevelopmentDocument.md` 第5-7章

**产出文件**：
```
src/core/CombatEngine.ts         — DPS/EHP/战力公式、单场战斗模拟、批量战斗模拟
src/core/FloorScaling.ts         — 推荐战力计算、怪物生成、收益衰减、推荐层
src/core/LootGenerator.ts        — 装备生成、品质Roll、词缀Roll（18种词缀完整实现）
src/core/GearScore.ts            — 5档评分模式、装备对比、最优装备推荐
src/core/EnhancementSystem.ts    — 强化+1~+10（成功率、消耗、惩罚）
src/core/OfflineCalculator.ts    — 离线收益计算（12h软上限、批量模拟）
```

**关键验证**：
- DPS 公式：用一组测试数据（力量=100, 攻击=50, 攻速=1.5, 暴击率=20%, 暴伤=2.0）计算，输出应该在合理范围
- 装备生成：调用 `LootGenerator.generateDrop(10, 0)` 100 次，检查掉落分布（普通最多，远古极少）
- 离线计算：模拟离线8小时，输出应该在合理范围

**完成后**：运行测试确认所有引擎方法正确工作，告诉我测试结果。

---

#### Step 6：存档系统（产出 core/SaveManager.ts）

**阅读**：`DEV_PRIMER.md` 第5节中 SaveManager 部分 + `DevelopmentDocument.md` 第8章

**产出文件**：
```
src/core/SaveManager.ts     — localStorage 读写、JSON 导入导出、自动保存（防抖5秒）
```

**功能要求**：
- save()：序列化所有 Store 状态到 localStorage
- load()：从 localStorage 恢复所有 Store 状态
- exportSave()：导出 JSON 字符串（玩家可备份）
- importSave()：导入 JSON 字符串（玩家可恢复）
- autoSave()：防抖5秒自动保存

**完成后**：测试保存→刷新页面→加载→数据完整。

---

#### Step 7：UI 组件（产出 components/）

**阅读**：`DEV_PRIMER.md` 第6节（UI组件规格）+ `DevelopmentDocument.md` 第9章

**产出文件**：
```
src/components/equipment/EquipmentCard.vue       — 装备卡片（品质色、属性、词缀、强化等级）
src/components/equipment/EquipmentCompare.vue    — 装备对比（并排展示、差值绿↑红↓、一键替换）
src/components/combat/CombatPanel.vue            — 战斗面板（怪物信息、挂机开关、层数、DPS/EHP）
src/components/ui/OfflineReportModal.vue         — 离线报告弹窗（时长、击杀、金币、装备列表）
```

**样式**：使用 Tailwind CSS，暗色主题。

**完成后**：所有组件能在页面上正确显示，交互功能正常。

---

#### Step 8：组装主界面（产出 App.vue + MainView.vue）

**阅读**：`DEV_PRIMER.md` 第7节（目录结构）中 App.vue 说明

**产出文件**：
```
src/App.vue                — 三栏布局（左：角色+装备 / 中：战斗面板 / 右：背包）
src/views/MainView.vue     — 主游戏界面，组合所有组件
```

**三栏布局**：
- 左栏（25%）：角色属性面板、已装备装备列表、训练按钮
- 中栏（50%）：战斗面板（怪物信息、挂机开关、战斗日志）、推层目标
- 右栏（25%）：背包格子、评分模式切换、一键穿戴

**完成后**：整个游戏能在浏览器中运行，玩家可以：
1. 看到角色属性
2. 开启自动挂机
3. 背包中出现掉落的装备
4. 点击装备查看对比
5. 穿上新装备看到 DPS/EHP 变化
6. 离线后重新上线看到离线报告

---

### 阶段二：深度系统（第二阶段开发）

**目标**：装备Build有深度，玩家有长期追求。

**阅读**：`DESIGN_PRIMER.md` 中标注"第二阶段"的章节 + `GameDesignDocument.md` 对应章节

**系统清单**（按顺序）：

| 顺序 | 系统 | 对应设计文档 | 对应开发文档 |
|------|------|-------------|-------------|
| 1 | 强化+6~+10（完整） | Ch6 强化部分 | Ch6 扩展 |
| 2 | Boss特殊机制 | Ch8 Boss部分 | Ch5 扩展 |
| 3 | 怪物词缀 | Ch8 怪物词缀 | Ch5 扩展 |
| 4 | 天赋树（48节点） | Ch7 完整 | Ch7 新增 |
| 5 | 转生系统 | Ch9 完整 | Ch8 扩展 |
| 6 | 传奇触发特效×15 | Ch6 传奇部分 | Ch6 扩展 |
| 7 | 3套套装效果 | Ch6 套装部分 | Ch6 扩展 |
| 8 | 每日任务+成就 | Ch13 完整 | Ch4 新增dailyStore |

**每步流程**：阅读设计文档理解设计 → 阅读开发文档获取参考 → 实现代码 → 测试 → 下一步。

---

### 阶段三：社交与长线（第三阶段开发）

**目标**：增加留存和商业化能力。

| 顺序 | 系统 | 对应设计文档 |
|------|------|-------------|
| 1 | 本地排行榜 | Ch13 |
| 2 | 佣兵酒馆 | Ch13 |
| 3 | 裂隙挑战（赛季） | Ch13 |
| 4 | 远古装备完整 | Ch6 |
| 5 | 视觉优化（飘字/光柱） | Ch15 |
| 6 | PWA配置 | Ch11 |

---

## 3. 开发原则

1. **先读精华版，再查完整版**：实现每个系统前先读 `DESIGN_PRIMER`/`DEV_PRIMER` 对应部分，只有需要详细数值或完整代码时才去查 `GameDesignDocument.md` / `DevelopmentDocument.md`
2. **每步完成再下一步**：不要跳过步骤，每个步骤完成后确认功能正常再进入下一步
3. **保持类型安全**：所有函数参数和返回值都必须有 TypeScript 类型
4. **Store是数据唯一来源**：所有数据修改必须通过 Store Action，不要直接修改 ref
5. **测试每个引擎方法**：CombatEngine、LootGenerator 等核心方法写完后用测试数据验证
6. **及时保存**：每完成一个文件就调用 SaveManager.save() 测试存档功能

---

## 4. 常见问题

**Q：某个设计细节在精华版中没有，怎么办？**
A：去 `GameDesignDocument.md` 查找对应章节的详细说明。文档共17章，按标题找到对应章节即可。

**Q：代码实现不确定怎么写？**
A：去 `DevelopmentDocument.md` 查找对应章节的完整代码。文档共12章，每章包含完整的 TypeScript/Vue 代码。

**Q：Store间怎么通信？**
A：在 Action 中直接调用其他 Store 的 Action。例如 combatStore 的 executeBattle() 中调用 playerStore.gainGold()。

**Q：MVP中不做天赋树，但类型定义中需要 TalentBranch 枚举吗？**
A：需要定义但不实现逻辑。类型定义包含所有第二阶段的类型，但 Store 和组件中暂不使用。

---

## 5. 验收标准（阶段一完成时）

玩家能够：
- [ ] 打开游戏看到角色属性和空背包
- [ ] 点击"开始挂机"后角色自动战斗
- [ ] 看到战斗日志（击杀怪物、获得金币/经验）
- [ ] 背包中出现掉落的装备（不同品质不同颜色）
- [ ] 点击装备查看详细属性
- [ ] 穿上新装备后 DPS/EHP 实时变化
- [ ] 战力足够时手动切换到更高层
- [ ] 关闭游戏后重新打开，进度完整保留
- [ ] 离线后重新上线看到离线收益报告
- [ ] 使用一键"穿戴最优"快速装备

全部勾选 = 阶段一完成，进入阶段二。
