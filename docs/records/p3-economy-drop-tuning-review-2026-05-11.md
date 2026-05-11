# P3 经济和掉落调优阶段复盘（2026-05-11）

## 目标回顾

本阶段目标是让 P2 已经进入总属性的 `goldFind` 和 `magicFind` 真正影响收益，并建立统一、可测试、可调的经济和掉落口径。

第一版只让 `magicFind` 影响掉落率，不改品质权重。

## 实际完成

- 新增 `src/data/economy.ts`，集中管理 `goldFind`、`magicFind`、掉落率上限和基础掉落价值。
- 新增 `src/core/combat/economy.ts`，提供统一纯函数：
  - `getGoldFindMultiplier()`
  - `getMagicFindDropChanceMultiplier()`
  - `getGoldWithFind()`
  - `getEffectiveDropChance()`
  - `getExpectedDropValue()`
- `applyRewardDecay()` 支持传入属性，金币会先吃 `goldFind` 加成，再做战力收益衰减。
- `simulateCombat()` 使用统一有效掉落率，`magicFind` 会影响在线掉落率。
- 离线批量模拟复用战斗引擎的有效掉落率。
- `calculateOfflineReward()` 复用 `applyRewardDecay()`，不另写金币加成公式。
- `evaluateStageTarget()` 使用统一金币加成和期望掉落价值口径，推荐挂机评分会受寻宝属性影响。
- 补充核心测试，覆盖经济工具、在线掉落、离线金币、推荐评分和金币收益衰减。

## 主要取舍

- `magicFind` 第一版只影响掉落率，没有影响稀有、传说品质权重。
- 金币加成统一放在收益结算函数，不在战斗模拟中提前改变基础金币，避免在线和离线重复加成。
- 推荐说明文本暂不新增“寻宝构筑”专属文案，只让评分口径真实受到寻宝属性影响。
- 没有把怪物成长和金币经验曲线全部迁入调参表，当前只集中 P3 必需参数。

## 验证结果

已通过：

- `npm run typecheck`
- `npm run test:run`

当前测试基线为 29 个测试文件、125 条测试通过。

## 剩余风险

- 掉落率提高会增加背包压力，后续需要观察拾取过滤和自动转化是否足够承载。
- `goldFind` 提升金币后，金币消耗系统仍较轻，短期可能继续堆积。
- `magicFind` 尚未影响品质权重，寻宝流的高级追求仍有限。
- 推荐挂机评分已受寻宝属性影响，后续需要观察装备层和奖励怪是否过度垄断推荐结果。

## 下一步建议

- 跑完整收口验证：`npm run format:check`、`npm run typecheck`、`npm run test:run`、`npm run build`。
- 同步 backlog、总任务拆解和记录索引的 P3 完成状态。
- 后续可做 P3-2：小幅让 `magicFind` 影响稀有和传说权重，并补品质分布测试。
