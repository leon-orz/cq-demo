# P3 经济和掉落调优开发计划（2026-05-11）

## 目标

本阶段承接 P2 的寻宝属性入口，让 `goldFind` 和 `magicFind` 真正影响游戏收益，并把怪物成长、金币经验、掉落率和掉落价值的关键调参入口集中起来。

核心目标不是追求最终平衡，而是先建立统一、可测试、可调的经济和掉落口径。

## 当前基础

- `goldFind`、`magicFind` 已存在于装备词缀、天赋节点和 `PlayerBaseStats` 总属性中。
- 在线战斗通过 `simulateStageCombat()` 得到金币、经验和掉落，再由 `applyRewardDecay()` 做战力收益衰减。
- 离线收益通过 `simulateBatchCombat()` 批量模拟，再按过滤和容量截断生成离线报告。
- 推荐挂机评分已包含金币、经验和 `dropValuePerSecond`。
- P1 已有金币层、经验层、装备层、Boss 层等关卡标签。

## 范围边界

- 第一版让 `goldFind` 影响金币收益。
- 第一版让 `magicFind` 优先影响掉落率和推荐掉落价值。
- 暂不让 `magicFind` 直接改高品质权重，避免同时扰动掉落率和品质分布。
- 在线战斗、离线收益、推荐挂机评分必须共享同一套收益口径。
- 不在本阶段做拍卖、商店、强化消耗、长期经济回收或服务端防作弊。
- 不改变存档结构。

## 建议生效口径

### `goldFind`

建议公式：

```ts
goldMultiplier = 1 + clamp(goldFind, 0, 300) / 100;
```

含义：

- `goldFind = 0`：金币收益 100%。
- `goldFind = 50`：金币收益 150%。
- `goldFind = 300`：金币收益 400%，第一版封顶，防止数值过早失控。

生效顺序建议：

```text
怪物基础金币 -> goldFind 加成 -> 战力收益衰减 -> 入包/报告展示
```

这样在线战斗和离线收益可以复用 `applyRewardDecay()` 或新建统一奖励预览函数。

### `magicFind`

第一版建议只影响掉落率：

```ts
dropChanceMultiplier = 1 + clamp(magicFind, 0, 300) / 200;
effectiveDropChance = min(baseDropChance * dropChanceMultiplier, 0.95);
```

含义：

- `magicFind = 0`：掉落率不变。
- `magicFind = 100`：掉落率提高 50%。
- `magicFind = 300`：掉落率提高 150%，但总掉落率最高 95%。

暂不改品质权重的理由：

- 当前 `rollRarity()` 已按怪物等级提供基础品质曲线。
- 同时改掉率和品质会让推荐挂机、离线截断、拾取过滤和高价值反馈一起变化，第一版不利于定位问题。
- P3 收口后可以再做 P3-2：让 `magicFind` 小幅影响稀有和传说权重。

## 集中调参表

建议新增：

- `src/data/economy.ts`

初版集中以下配置：

```ts
export const economyTuning = {
  maxGoldFind: 300,
  goldFindMultiplierPerPoint: 0.01,
  maxMagicFind: 300,
  magicFindDropChanceMultiplierPerPoint: 0.005,
  maxDropChance: 0.95,
  baseDropValue: 18,
};
```

后续再逐步迁入怪物成长、金币经验曲线和品质权重。

## 任务拆解

### P3-1：集中收益工具

- [x] 新增 `src/data/economy.ts`，集中 `goldFind`、`magicFind`、掉落价值和上限配置。
- [x] 新增纯函数，例如：
  - `getGoldFindMultiplier(stats)`
  - `getMagicFindDropChanceMultiplier(stats)`
  - `getEffectiveDropChance(monster, stats)`
  - `getExpectedDropValue(monster, stats)`
- [x] 补核心测试，覆盖封顶、0 值、普通值和负值容错。

### P3-2：在线战斗收益接入

- [x] `simulateCombat()` 使用有效掉落率，而不是直接读取 `monster.dropChance`。
- [x] 掉落生成仍先保持原有品质权重。
- [x] 在线金币结算应用 `goldFind`，并继续保留战力收益衰减。
- [x] 补测试验证 `goldFind` 提高在线金币，`magicFind` 提高掉落概率或可控随机结果。

### P3-3：离线收益接入

- [x] `simulateBatchCombat()` 复用同一套有效掉落率和金币收益。
- [x] `calculateOfflineReward()` 不另写一套 `goldFind/magicFind` 逻辑。
- [x] 保持过滤优先于容量截断的既有规则。
- [x] 补测试验证离线金币受 `goldFind` 影响，离线掉落受 `magicFind` 影响。

### P3-4：推荐挂机评分接入

- [x] `evaluateStageTarget()` 使用统一 `goldFind` 和 `magicFind` 口径计算：
  - `goldPerSecond`
  - `dropValuePerSecond`
  - `farmScore`
- [x] 推荐理由可保留现有标签说明，必要时补寻宝构筑提示。
- [x] 补测试验证寻宝属性会改变推荐层评分，但不会破坏可通关判断。

### P3-5：文档与收口

- [x] 更新 backlog、总任务拆解和记录索引。
- [x] 新增 P3 阶段复盘。
- [x] 跑 `npm run format:check`、`npm run typecheck`、`npm run test:run`、`npm run build`。

## 多智能体协作判断

第一轮不建议多 agent 并行实现。

原因：

- 在线战斗、离线收益和推荐挂机必须共享同一套公式。
- `goldFind` 和 `magicFind` 同时影响收益、掉落和推荐评分，拆开实现容易出现口径漂移。
- 当前变更跨 `core/combat`、`core/offline`、`data` 和测试，适合由主智能体统一设计和集成。

建议：

- 主智能体单线完成 P3-1 到 P3-4。
- 实现后可使用一个只读复核 agent 检查：
  - 是否存在重复公式。
  - 在线、离线和推荐评分是否共享口径。
  - 掉落率封顶和金币加成封顶是否有测试。
  - 是否误把 P3 扩展成品质权重大改或长期经济系统。

## 验收标准

- `goldFind` 能提升在线战斗金币收益。
- `goldFind` 能提升离线收益金币。
- `magicFind` 能提升在线和离线掉落率，且掉落率有上限。
- 推荐挂机评分使用包含 `goldFind` 和 `magicFind` 的同一套期望收益口径。
- 经济和掉落关键参数集中在 `src/data/economy.ts`。
- `core` 仍保持纯逻辑，不依赖 Vue、Pinia、DOM。
- 格式检查、类型检查、单元测试和生产构建通过。

## 风险与取舍

- `magicFind` 第一版只影响掉落率，不影响品质，寻宝流深度有限，但更容易验证和调参。
- `goldFind` 提升金币后，金币消耗系统还不完整，短期内金币可能继续堆积。
- 提高掉落率会加大背包压力，拾取过滤和自动转化的现有规则需要继续承担整理压力。
- 推荐挂机评分加入寻宝属性后，装备层和奖励怪可能更容易被推荐，需要在测试中观察是否长期垄断。
