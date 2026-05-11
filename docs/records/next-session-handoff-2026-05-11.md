# 下次接续记录（2026-05-11）

## 接续入口

下次继续时建议优先读取：

1. `docs/records/current-phase-summary-2026-05-11.md`
2. `docs/backlog/remaining-work-2026-05-09.md`
3. `docs/records/design-development-task-breakdown.md`
4. 本文件

## 当前完成状态

P0、P1、P2、P3 第一版均已完成并收口：

- P0：稳定化基线、离线报告持久化、存档恢复和推荐评分口径整理。
- P1：内容厚度，包含怪物类型、Boss 阶段感、关卡标签和推荐说明。
- P2：真实构筑入口，包含小型天赋节点、天赋点、基础 UI 和收益属性展示。
- P3：经济和掉落调优第一版，包含 `goldFind` 金币加成、`magicFind` 掉落率加成和统一推荐评分口径。

当前核心闭环：

```text
构筑评分 -> 天赋选择 -> 装备选择 -> 推层目标 -> 战斗/挂机 -> 掉落反馈 -> 离线收益 -> 存档
```

## 最新验证基线

已通过：

- `npm run format:check`
- `npm run typecheck`
- `npm run test:run`
- `npm run build`

当前测试基线为 29 个测试文件、125 条测试通过。

## 本次最后处理内容

- 做了当前阶段总复盘：`docs/records/current-phase-summary-2026-05-11.md`。
- 做了浏览器总体验回归。
- 清理了 Playwright MCP 临时快照目录。
- 将 `.playwright-mcp/` 加入 `.gitignore`。
- 确认浏览器控制台只剩 `favicon.ico` 404。

## 当前未处理事项

- `favicon.ico` 仍未添加。应放在 `public/favicon.ico`。
- 左侧天赋面板内容偏长，后续建议做折叠或紧凑化。
- 推荐挂机说明还没有明确解释 `goldFind`、`magicFind` 对推荐评分的影响。
- `magicFind` 目前只影响掉落率，不影响稀有或传说品质权重。
- `.playwright-mcp/` 下旧快照已删除，若这些文件已被 Git 跟踪，状态中会显示删除，这是预期清理结果。

## 下次建议优先级

建议先做低风险体验打磨：

1. 添加 `public/favicon.ico`，清掉控制台唯一 404。
2. 左侧天赋面板折叠或紧凑化。
3. 推荐挂机说明补充寻宝属性影响。
4. 再考虑 P3-2：让 `magicFind` 小幅影响稀有和传说品质权重，并补品质分布测试。

## 注意事项

- 不要直接扩强化、套装、转生、多职业、排行榜等长期系统。
- 继续保持架构边界：`core` 纯逻辑，`stores` 改状态，`composables` 编排，`components` 展示。
- 后续改经济或掉落时必须同步在线战斗、离线收益和推荐挂机评分，不要写三套公式。
