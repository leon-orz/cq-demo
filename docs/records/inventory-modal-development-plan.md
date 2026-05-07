# 装备对比与分解确认开发记录

## 目标

本阶段将背包整理从文字提示推进到可操作弹窗：玩家可以点击装备查看正式对比浮层，也可以在分解前查看将被分解和已保护装备。

## 任务拆解

主智能体负责实现和集成：

- `core/item/filter.ts`：补充完整装备对比结果。
- `components/inventory/ItemCompareModal.vue`：装备对比弹窗。
- `components/inventory/DecomposeConfirmModal.vue`：分解确认弹窗。
- `components/inventory/ItemSlot.vue`：接入对比入口。
- `components/layout/RightPanel.vue`：移除原生确认，接入正式弹窗。
- `tests/core/`、`tests/stores/`：补充对比和保护原因测试。

子智能体 A 负责复核交互切入点和移动端风险。

子智能体 B 负责整理本阶段美术资源需求。

## 已实现内容

- 新增 `ItemCompareResult` 和属性差值列表。
- 新增 `getItemCompareResult()`，返回目标槽位、当前装备、新装备、评分差、属性差值。
- 新增 `ItemCompareModal.vue`：
  - 当前装备与新装备并排展示。
  - 展示评分差。
  - 展示属性差值列表。
  - 支持直接穿戴。
- 新增 `DecomposeConfirmModal.vue`：
  - 展示将被分解装备。
  - 展示已保护装备和保护原因。
  - 展示预计强化石收益。
- `RightPanel.vue` 已移除 `window.confirm`。
- 分解预览中的保护项已包含原因：锁定保护、更优保护、品质保护。

## 当前取舍

- 弹窗使用 CSS 深色面板和文字占位，不使用正式美术资源。
- 对比弹窗由单个装备卡内部状态打开，后续多入口时可迁移到统一 UI store。
- 分解确认弹窗暂不做动画和材料飞入效果。

## 验收标准

- 点击装备卡“对比”可打开装备对比弹窗。
- 对比弹窗展示当前装备、新装备、评分差和属性差值。
- 分解低品不再使用浏览器原生确认框。
- 分解确认弹窗展示将分解和已保护装备。
- 已保护装备展示保护原因。
