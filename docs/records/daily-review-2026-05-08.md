# 2026-05-08 开发复盘

## 今日完成

今天围绕昨天留下的数据流边界问题、离线收益顺序问题和右侧面板复杂度问题，完成了背包装备展示、装备对比、背包视图派生数据整理，离线收益过滤优先于容量截断的行为修正，以及右侧背包面板拆分。

核心代码完成：

- 新增 `src/composables/useItemPresentation.ts`，统一提供装备评分、评分差、更优判断和装备对比结果。
- `ItemSlot.vue` 不再直接调用 `@/core/item/filter`，只负责展示装备信息和触发穿戴、锁定、打开对比等交互。
- `ItemCompareModal.vue` 不再直接调用 `getItemCompareResult()`，只展示 composable 提供的对比结果。
- `inventoryView` store 新增 `visibleItems()`、`emptyText()`、`showReset()`，集中提供背包列表展示派生能力。
- `RightPanel.vue` 不再直接调用 `getInventoryViewItems()`，排序筛选仍只影响展示，不改变 `inventory.items` 原始顺序。
- `tests/stores/inventory-view.test.ts` 补充可见列表、空文案、重置入口和原始顺序保护测试。
- 离线收益改为先执行拾取过滤，再按背包剩余空间截断过滤后仍需入包的装备。
- `OfflineReport.filteredItems` 记录被拾取过滤拒绝的装备，领取时按自动转化规则结算强化石。
- `OfflineReport.rejectedItems` 只统计过滤后仍需入包但容量不足的装备。
- 离线报告补充显示拾取过滤自动转化的装备数量。
- `tests/core/offline-reward.test.ts` 和 `tests/stores/offline.test.ts` 补充离线收益过滤、转化和容量截断顺序测试。
- `RightPanel.vue` 拆分为组合容器，资源统计、分解入口、拾取过滤设置、背包工具栏和列表分别迁入独立组件。
- 新增 `InventoryDecomposePanel.vue`、`InventoryResourceSummary.vue`、`LootFilterSettings.vue`、`InventoryListSection.vue`。

文档完成：

- 删除临时接续计划 `next-day-plan-2026-05-08.md`，避免和阶段文档重复。
- 新增 `docs/records/README.md`，梳理 records 目录的文档分组和维护规则。
- 更新总任务拆解，记录数据流边界整理已完成。
- 美术资源文档保持为资源清单，本轮不新增资源需求；离线报告和右侧面板拆分均复用现有文字、边框和颜色占位策略。

## 验证结果

本轮已通过：

- `npm run format:check`
- `npm run typecheck`
- `npm run test:run`
- `npm run build`

当前测试结果为 14 个测试文件、45 条测试通过。

## 主要取舍

- 装备展示派生数据优先放在 composable，而不是新增 `inventoryUi` store；当前还没有多入口统一弹窗状态的强需求。
- 背包视图派生数据放到 `inventoryView` store，方便后续拆分 `RightPanel.vue` 时直接复用。
- 离线收益的过滤规则在生成报告时固化，领取时不再二次过滤 `report.items`，避免设置变化导致报告语义漂移。
- 右侧面板本轮只拆组件边界，不改变 store 行为，也不新增组件测试依赖。
- 本轮不新增动效和美术资源入口。
- `RewardReport.vue` 仍直接引用 `@/core/utils/time` 做时间格式化，风险较低，后续可迁到 `src/utils/format.ts`。

## 当前已知问题

- “更优装备”仍基于通用评分，暂不能准确覆盖暴击、攻速、坦克等不同构筑。
- 弹窗和筛选抽屉尚未做组件级交互测试。

## 下一步建议

P0：

- 建立完整存档服务：localForage 快照、导入导出、版本号和迁移。

P1：

- 将 `RewardReport.vue` 的时间格式化迁到 `src/utils/format.ts` 或离线展示 composable。
- 增加构筑评分权重，支持按主属性或流派判断装备是否更优。
- 补充组件交互测试，覆盖装备对比、分解确认和筛选面板。
