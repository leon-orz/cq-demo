# 下次接续计划（2026-05-09）

## 接续原则

下次不要直接做强化、套装、转生、多职业或全量美术。当前要先把游戏从“核心循环能跑”推进到“玩家能理解目标并稳定游玩”。

下一阶段主线：

```text
构筑选择 -> 推层目标 -> 掉落反馈
```

## 下次从这里开始

第一件事做“构筑评分系统”。

目标是让装备推荐不再只有通用评分，而是能按流派偏好判断：

- `balanced`：当前通用评分。
- `crit`：偏暴击率、暴击伤害、攻击。
- `speed`：偏攻击速度、攻击和持续输出。
- `tank`：偏生命、护甲、抗性和闪避。

## 建议任务拆解

1. 只读梳理现有评分调用链
   - `src/core/item/filter.ts`
   - `src/core/player/calculator.ts`
   - `src/composables/useItemPresentation.ts`
   - `src/core/item/inventoryView.ts`
   - `src/stores/inventory.ts`
   - `src/stores/settings.ts`

2. 设计评分模式类型
   - 可放在 `src/types/item.ts` 或新的评分类型文件。
   - 保持 `balanced` 为默认，避免破坏现有体验。

3. 改造核心评分函数
   - 新增按模式计算分数的入口。
   - 保留旧函数兼容，或让旧函数默认走 `balanced`。
   - 不在组件里写评分权重。

4. 接入状态偏好
   - 优先放入 `settings`。
   - 后续如果主属性和职业系统成熟，再评估迁到 `player`。

5. 接入现有使用点
   - 更优高亮。
   - 装备对比。
   - 只看更优。
   - 分解保护。

6. 补测试
   - 暴击装备在 `crit` 下评分更高。
   - 攻速装备在 `speed` 下评分更高。
   - 生命护甲装备在 `tank` 下评分更高。
   - 现有 `balanced` 行为尽量保持稳定。

## 验证命令

开发过程中至少运行：

```bash
npm run typecheck
npm run test:run
```

收尾运行：

```bash
npm run format:check
npm run typecheck
npm run test:run
npm run build
```

## 完成后要沉淀

- 更新 `docs/backlog/remaining-work-2026-05-09.md`。
- 更新 `docs/records/design-development-task-breakdown.md`。
- 新增或更新当日复盘。
- 如果此临时接续计划已完成，应删除本文件。
