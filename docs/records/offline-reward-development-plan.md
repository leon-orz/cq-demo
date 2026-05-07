# 离线收益开发记录

## 目标

本阶段补齐放置游戏的核心承诺：玩家关闭页面后，再次进入可以获得离线期间的收益报告，并在确认后领取奖励。

## 任务拆解

主智能体负责实现和集成：

- `core/offline/reward.ts`：离线收益纯逻辑。
- `stores/save.ts`：最后活跃时间。
- `stores/offline.ts`：离线报告状态和领取流程。
- `composables/useOfflineCheck.ts`：启动、隐藏、关闭页面时的时间戳处理。
- `components/offline/RewardReport.vue`：离线收益报告弹窗。
- `tests/core/`、`tests/stores/`：核心逻辑和状态测试。

子智能体 A 负责复核实现切入点和风险。

子智能体 B 负责整理离线报告和开箱占位的美术资源需求。

## 已实现内容

- 新增 `src/core/offline/reward.ts`：
  - 计算离线秒数。
  - 应用 `MAX_OFFLINE_HOURS` 上限。
  - 复用批量战斗模拟。
  - 应用收益衰减。
  - 根据背包剩余格截断装备。
- 新增 `src/stores/save.ts`：
  - 持久化 `lastActiveTime`。
  - 提供 `markActive()`。
- 新增 `src/stores/offline.ts`：
  - 启动时生成离线报告。
  - 领取时写入金币、经验、装备。
  - 领取后清空报告，避免重复领取。
- 新增 `src/composables/useOfflineCheck.ts`：
  - 页面启动检查离线收益。
  - `visibilitychange` 和 `beforeunload` 时更新时间戳。
- 新增 `src/components/offline/RewardReport.vue`：
  - 使用 CSS 和文字宝箱占位。
  - 展示离线时长、击杀、金币、经验、装备、收益倍率和满包截断提示。

## 当前取舍

- 本阶段使用 Pinia persistedstate 默认存储，暂不切换到 localForage。
- 离线报告不持久化，刷新后会按最新 `lastActiveTime` 重新检查。
- 开箱只做弹窗和文字占位，不做动画。
- 背包满时离线收益按装备可接收数量进行截断，并提示未拾取装备数量。

## 验收标准

- 离线超过最小阈值后启动页面会生成报告。
- 离线超过 8 小时会按上限裁剪。
- 无法击败怪物时没有收益。
- 背包剩余格不足时装备会截断。
- 领取后金币、经验、装备入账，报告清空。
