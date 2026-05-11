# P1 内容厚度开发计划（2026-05-11）

## 目标

本阶段从 P0 稳定化基线继续推进，让当前可运行闭环里的层数、怪物、Boss 和推荐挂机说明具备更清晰的差异感。优先增加内容解释力，不扩展天赋树、强化、套装或复杂地图系统。

当前基线闭环为：

```text
构筑评分 -> 装备选择 -> 推层目标 -> 战斗/挂机 -> 掉落反馈 -> 离线收益 -> 存档
```

## 范围边界

- 主要落点是 `src/data/monsters.ts`、`src/types/combat.ts`、`src/core/combat/progression.ts`、`src/components/layout/CenterPanel.vue` 和对应测试。
- 怪物和关卡差异必须从数据与纯逻辑产生，组件只展示，不在 UI 中写死层数规则。
- 推荐挂机说明要解释“为什么推荐这一层”，不仅展示收益倍率或效率数字。
- 本阶段不处理 P2 天赋节点，也不处理 P3 的 `goldFind`、`magicFind` 和集中调参表。
- 不改变存档结构，除非后续实现发现新增字段必须持久化；按当前方案新增字段都可从层数派生。

## 任务拆解

主智能体负责实现和集成：

- [x] 扩展战斗类型定义，新增怪物类型、关卡标签和收益倾向字段。
- [x] 重构 `createMonster()` 和 `getStageConfig()`，从层数派生高血怪、高攻怪、均衡怪、奖励怪和 Boss 层。
- [x] 为第 10、20、30 层 Boss 设计不同奖励倾向，初版分别偏金币、经验、装备。
- [x] 让关卡标签进入 `StageTargetEvaluation`，推荐挂机说明结合标签、收益倾向和每秒收益输出可读原因。
- [x] 调整中间战斗面板，展示当前层标签、怪物类型和推荐挂机原因。
- [x] 补充核心测试，覆盖普通怪类型轮换、Boss 奖励倾向、关卡标签和推荐说明。
- [x] 运行 `npm run format:check`、`npm run typecheck`、`npm run test:run`。

## 实际完成

- `src/types/combat.ts` 新增 `MonsterArchetype`、`StageTag`、`RewardFocus`，并把怪物类型、关卡标签、收益倾向和推荐原因接入战斗评估类型。
- `src/data/monsters.ts` 已按层数派生普通怪类型，Boss 层按金币、经验、装备倾向循环。
- `src/core/combat/progression.ts` 已把掉落价值、关卡标签和收益倾向纳入推荐评估，并输出 `recommendReason`。
- `src/components/layout/CenterPanel.vue` 已展示当前关卡标签、怪物类型、怪物占位符号和推荐挂机原因。
- `tests/core/progression.test.ts` 已覆盖普通怪类型轮换、Boss 奖励倾向、关卡标签和推荐说明。

## 建议数据模型

新增枚举或联合类型：

```ts
type MonsterArchetype = 'balanced' | 'highHp' | 'highAttack' | 'reward' | 'boss';
type StageTag = 'gold' | 'exp' | 'gear' | 'boss';
type RewardFocus = 'balanced' | 'gold' | 'exp' | 'gear';
```

建议字段：

- `Monster.archetype`：用于区分怪物战斗体验。
- `StageConfig.tags`：用于 UI 标签和推荐说明。
- `StageConfig.rewardFocus`：用于推荐层说明和 Boss 阶段感。
- `StageTargetEvaluation.recommendReason`：推荐挂机卡片展示的短文案。

## 怪物类型规则

普通层按可预测但不单调的方式轮换：

- 高血怪：生命更高、攻击略低，拉长击杀时间，偏考验输出。
- 高攻怪：攻击更高、生命略低，偏考验生存。
- 均衡怪：作为普通层基准。
- 奖励怪：战斗强度略低或持平，金币、经验或掉落价值更高，用于制造挂机层选择差异。

初版可以按 `stage % 4` 派生普通怪类型，Boss 层优先级最高。后续若需要更强主题感，再迁移到集中关卡表。

## Boss 阶段感

每 10 层仍作为小目标。初版建议：

- 第 10 层：金币 Boss，金币收益更高，标签为 `boss`、`gold`。
- 第 20 层：经验 Boss，经验收益更高，标签为 `boss`、`exp`。
- 第 30 层：装备 Boss，掉落率和掉落价值更高，标签为 `boss`、`gear`。
- 30 层后按 10、20、30 的模式循环，避免只支持前三个 Boss。

Boss 仍保持更高推荐战力、更高生命攻击、更高基础收益和更高掉落价值，但不同阶段的收益倾向要能被推荐说明解释。

## 推荐说明口径

推荐挂机层的卡片不只显示 `rewardText`，建议展示一条短原因：

- 金币层：`金币效率最高，适合补充分解和养成消耗。`
- 经验层：`经验效率最高，适合提升角色等级。`
- 装备层：`掉落价值更高，适合刷装备替换。`
- Boss 层：`Boss 奖励更集中，但需要确认击杀效率。`

具体文案应由 `core/combat/progression.ts` 根据 `StageTargetEvaluation` 派生，组件只读取字段。

## 验收标准

- [x] 普通层不再全部显示为同一种 `腐化行者`。
- [x] 高血怪、高攻怪、均衡怪、奖励怪至少在属性或收益上有可测试差异。
- [x] 第 10、20、30 层 Boss 有不同奖励倾向，并能通过关卡标签和推荐说明体现。
- [x] 推荐挂机层展示明确原因，玩家能理解它偏金币、经验、装备或 Boss 收益。
- [x] 核心逻辑测试覆盖新字段和关键派生规则。
- [x] 格式检查、类型检查和单元测试通过。

## 验证结果

已通过：

- `npm run format:check`
- `npm run typecheck`
- `npm run test:run`

当前测试基线为 26 个测试文件、105 条测试通过。

浏览器回归结果：

- 当前层标签、推荐挂机原因、怪物类型和怪物占位符号可见。
- 控制台仅发现既有 `favicon.ico` 404，不影响游戏流程。

## 风险与取舍

- 如果奖励怪收益过高，推荐挂机可能长期锁定奖励层；需要测试推荐结果不要被单一标签完全垄断。
- 高攻怪可能让生存失败过早出现；初版倍率应保守，避免破坏已有推层节奏。
- 关卡标签先服务解释，不要提前扩展为地图、词缀、抗性或复杂事件系统。
- UI 只做信息补充，不在本阶段加入新动画和资源需求，避免把内容厚度任务扩大成表现阶段。
