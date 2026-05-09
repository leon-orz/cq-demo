# 开发记录索引

本目录用于保存阶段计划、阶段复盘、美术资源需求和每日复盘。临时接续计划完成后应合并进每日复盘或阶段文档，不长期保留。

## 当前主线状态

当前核心闭环已经跑通：

```text
战斗模拟 -> 掉落装备 -> 背包获得 -> 穿戴装备 -> 属性变强 -> 推进层数 -> 离线收益
```

最新验证基线：

- `npm run format:check`
- `npm run typecheck`
- `npm run test:run`
- `npm run build`

当前测试结果为 16 个测试文件、56 条测试通过。

## 文档分组

### 总览和长期计划

- `design-development-task-breakdown.md`：总任务拆解、里程碑、近期任务队列和主要风险。
- `runnable-code-skeleton-plan.md`：最初可运行骨架计划，主要作为历史参考。
- `dependency-upgrade-notes.md`：依赖升级和版本策略记录。

### 每日复盘

- `daily-review-2026-05-07.md`：最小可行闭环、离线收益、背包整理、排序筛选阶段完成记录。
- `daily-review-2026-05-08.md`：数据流边界整理、离线收益顺序优化和文档整理记录。
- `next-day-plan-2026-05-09.md`：2026-05-09 临时接续计划，完成后应沉淀进每日复盘并删除。

### 阶段计划与复盘

- `auto-combat-development-plan.md`、`auto-combat-review.md`：自动挂机阶段。
- `offline-reward-development-plan.md`、`offline-reward-review.md`：离线收益阶段。
- `inventory-quality-development-plan.md`、`inventory-quality-review.md`：拾取过滤、装备评分、锁定和分解保护阶段。
- `inventory-modal-development-plan.md`、`inventory-modal-review.md`：装备对比与分解确认弹窗阶段。
- `equipment-sort-filter-development-plan.md`、`equipment-sort-filter-review.md`：装备排序和筛选面板阶段。

### 美术资源需求

- `art-resource-requirements-auto-combat.md`：战斗区、怪物、血条、自动挂机和基础装备资源。
- `art-resource-requirements-offline-reward.md`：离线收益报告和开箱表现资源。
- `art-resource-requirements-inventory-quality.md`：锁定、分解保护、拾取过滤和更优装备资源。
- `art-resource-requirements-inventory-modal.md`：装备对比和分解确认弹窗资源。
- `art-resource-requirements-equipment-sort-filter.md`：排序筛选入口、筛选面板、空结果和筛选状态资源。
- `art-resource-requirements-save-management.md`：存档保存、读取、导入导出和覆盖确认资源。

## 维护规则

- 阶段计划记录“准备怎么做”，阶段复盘记录“实际做成什么”和“剩余风险”。
- 每日复盘只保留当天完成、验证结果、主要取舍和下一步建议。
- 美术资源文档只记录资源清单、规格、命名、用途和占位策略，不写代码执行流水。
- 临时接续计划完成后删除，关键结论沉淀到每日复盘和总任务拆解。
- 如果某条任务已完成，要同步更新 `design-development-task-breakdown.md` 的里程碑或近期任务队列。
