# 开发记录索引

本目录用于保存阶段计划、阶段复盘、美术资源需求和每日复盘。临时接续计划完成后应合并进每日复盘或阶段文档，不长期保留。

历史阶段复盘和每日复盘保留当日状态，不作为当前待办入口；当前待办以当前阶段设计方向、连续开发路线图、总任务拆解和 `../backlog/remaining-work-2026-05-09.md` 为准。

## 当前主线状态

当前核心闭环已经跑通：

```text
构筑评分 -> 装备选择 -> 推层目标 -> 战斗/挂机 -> 掉落反馈 -> 离线收益 -> 存档
```

P1 内容厚度、P2 真实构筑入口和 P3 经济掉落调优第一版已完成。

最新验证基线：

- `npm run format:check`
- `npm run typecheck`
- `npm run test:run`
- `npm run build`

当前测试结果为 29 个测试文件、125 条测试通过。

## 文档分组

### 总览和长期计划

- `../../game-design-document.md`：原始 GDD，已补充 2026-05-09 阶段修订说明。
- `../../game-development-document.md`：原始开发文档，已补充 2026-05-09 阶段修订说明。
- `../design/current-design-direction-2026-05-09.md`：当前阶段设计方向。
- `../plans/continuous-development-roadmap-2026-05-09.md`：从当前原型到正式可玩的连续开发路线图。
- `../reports/project-status-2026-05-09.md`：项目完成度和真实产品状态评估。
- `design-development-task-breakdown.md`：总任务拆解、里程碑、近期任务队列和主要风险。
- `p0-stabilization-review-2026-05-11.md`：P0 稳定化复盘、新对话接续入口和 P1-P3 后续计划。
- `p1-content-depth-development-plan-2026-05-11.md`：P1 内容厚度开发计划，覆盖怪物类型、Boss 阶段感、关卡标签和推荐说明。
- `p1-content-depth-review-2026-05-11.md`：P1 内容厚度阶段复盘，记录实际完成、验证结果、取舍和剩余风险。
- `p2-build-entry-development-plan-2026-05-11.md`：P2 真实构筑入口开发计划，覆盖小型天赋节点、状态接入、基础 UI 和验证范围。
- `p2-build-entry-review-2026-05-11.md`：P2 真实构筑入口阶段复盘，记录天赋节点、状态接入、收益属性展示和剩余风险。
- `p3-economy-drop-tuning-development-plan-2026-05-11.md`：P3 经济和掉落调优开发计划，覆盖 `goldFind`、`magicFind`、统一收益口径和集中调参表。
- `p3-economy-drop-tuning-review-2026-05-11.md`：P3 经济和掉落调优阶段复盘，记录收益口径统一、掉落率接入、验证结果和剩余风险。
- `current-phase-summary-2026-05-11.md`：当前阶段总复盘，汇总 P0-P3 完成状态、体验回归、验证基线和下一步建议。
- `next-session-handoff-2026-05-11.md`：下次接续记录，说明继续前应读取的文档、当前基线、未处理事项和下一步优先级。
- `../backlog/remaining-work-2026-05-09.md`：当前剩余工作清单和后续排期入口。
- `runnable-code-skeleton-plan.md`：最初可运行骨架计划，主要作为历史参考。
- `dependency-upgrade-notes.md`：依赖升级和版本策略记录。

### 每日复盘

- `daily-review-2026-05-07.md`：最小可行闭环、离线收益、背包整理、排序筛选阶段完成记录。
- `daily-review-2026-05-08.md`：数据流边界整理、离线收益顺序优化和文档整理记录。
- `daily-review-2026-05-09.md`：本地存档、导入导出 UI、文档整理和剩余工作清单记录。
- `design-alignment-2026-05-09.md`：当前设计方向、核心落地系统和未来扩展的对齐记录。
- `build-progression-feedback-review.md`：构筑评分、推层目标、掉落反馈和组件交互测试阶段复盘。
- `p0-stabilization-review-2026-05-11.md`：离线报告持久化、口径统一、Boss 差异和新对话接续记录。
- `p1-content-depth-review-2026-05-11.md`：怪物类型、Boss 阶段感、关卡标签和推荐说明阶段复盘。
- `p2-build-entry-review-2026-05-11.md`：小型天赋节点、构筑属性生效和收益属性展示阶段复盘。
- `current-phase-summary-2026-05-11.md`：P0-P3 总体状态、体验回归和下一步建议。
- `next-session-handoff-2026-05-11.md`：新对话或下次开发的接续入口。

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
