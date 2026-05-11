# P2 真实构筑入口开发计划（2026-05-11）

## 目标

本阶段在 P1 内容厚度之后，为玩家提供第一个真实构筑入口。当前装备评分已经能表达偏好，但它主要影响装备排序、对比和分解保护；P2 要让构筑选择真实影响战斗属性、推层能力或收益属性。

第一版坚持小型、配置化、可测试，不直接做复杂技能树。

## 当前基础

- `PlayerState.skillNodes` 已存在，但当前默认为空。
- `calculateTotalStats()` 已支持把激活的 `SkillNode` 加到总属性。
- 存档快照已包含 `player.skillNodes`。
- 装备评分模式已有 `balanced`、`crit`、`speed`、`tank`、`mainAttribute`。
- `goldFind`、`magicFind` 已存在于装备属性和属性计算中，但尚未影响金币、掉落率或品质权重。

## 范围边界

- 本阶段新增小型天赋节点、天赋点和激活/重置入口。
- 暴击流、攻速流、防御流、寻宝流各 3-5 个节点。
- 暴击、攻速、防御节点必须真实影响战斗属性。
- 寻宝节点第一版可以先提供 `goldFind`、`magicFind` 属性入口；是否让它们影响金币收益和掉落权重，放到 P3 经济和掉落调优统一处理。
- 不做复杂树状连线、前置路径、职业分支、转职、重置消耗和动画。
- 不把天赋逻辑写进组件；节点配置放在 `src/data/skills.ts`，纯逻辑放在 `src/core/player/` 或现有 calculator 附近，状态修改走 `stores/player.ts`。

## 建议数据模型

第一版建议保守扩展 `SkillNode`：

```ts
type SkillBranch = 'crit' | 'speed' | 'tank' | 'treasure';

interface SkillNode {
  id: string;
  name: string;
  branch: SkillBranch;
  description: string;
  active: boolean;
  stat: keyof StatBlock;
  value: number;
}
```

如需避免把“配置节点”和“玩家已激活节点”混在一起，可拆分为：

```ts
interface SkillNodeConfig {
  id: string;
  name: string;
  branch: SkillBranch;
  description: string;
  stat: keyof StatBlock;
  value: number;
}
```

当前代码已经以 `SkillNode[]` 进入 `calculateTotalStats()`，第一版可以继续使用 `SkillNode[]`，后续再拆配置和存档状态。

## 节点设计建议

### 暴击流

- 增加暴击率。
- 增加暴击伤害。
- 少量增加敏捷或攻击。

目标：让暴击流真实提高 DPS，和 `crit` 装备评分形成一致体验。

### 攻速流

- 增加攻击速度。
- 增加闪避或敏捷。
- 少量增加攻击。

目标：让攻速流真实提高击杀速度，但受现有攻速上限约束。

### 防御流

- 增加生命。
- 增加护甲。
- 增加闪避或抗性。

目标：让防御流真实提高 EHP，改善高攻怪和 Boss 的生存压力。

### 寻宝流

- 增加 `goldFind`。
- 增加 `magicFind`。
- 少量增加金币或掉落相关展示属性。

目标：先建立寻宝构筑入口；实际金币收益和掉落权重在 P3 统一接入，避免 P2 和 P3 两边各写一套经济口径。

## 分阶段实施

### P2-1：数据和纯逻辑

- [x] 新增 `src/data/skills.ts`，配置四条分支节点。
- [x] 扩展 `SkillNode` 类型，增加分支和描述字段。
- [x] 新增或补充纯逻辑，用于计算可用天赋点、已用点数、是否可激活。
- [x] 补 `tests/core/calculator.test.ts` 或新增 `tests/core/skills.test.ts`，验证节点激活后 DPS、EHP 或寻宝属性变化。

### P2-2：Player Store 接入

- [x] `stores/player.ts` 新增天赋点 getter，例如 `skillPoints`、`spentSkillPoints`、`availableSkillPoints`。
- [x] 新增动作：初始化默认节点、激活节点、重置节点。
- [x] 等级提升时不需要立即写额外逻辑，天赋点可由等级派生，例如 `Math.max(0, level - 1)`。
- [x] 保证导入旧存档时没有天赋节点也能正常恢复默认空节点或配置节点。

### P2-3：基础 UI

- [x] 新增 `components/skilltree/SkillPanel.vue` 和 `SkillNode.vue`，但第一版做分支列表，不做复杂树。
- [x] 左侧角色面板增加天赋入口或直接嵌入小型天赋区。
- [x] 展示可用点数、已激活节点、节点描述和属性增益。
- [x] 激活按钮在点数不足或已激活时禁用。
- [x] 提供重置按钮，第一版无消耗。

### P2-4：验证和文档

- [x] 补 store 测试，覆盖激活节点、点数不足、重置节点。
- [x] 补组件测试，覆盖按钮状态和激活交互。
- [x] 跑 `npm run format:check`、`npm run typecheck`、`npm run test:run`、`npm run build`。
- [x] 阶段完成后新增 P2 复盘，并更新 backlog、总任务拆解和记录索引。

## 多智能体协作判断

P2 第一版可以拆，但不建议一开始并行多 agent 实现。

原因：

- 类型、节点配置、属性计算、store、UI 和存档状态耦合较紧。
- 当前已有 `SkillNode` 但字段偏简化，第一步需要统一数据模型。
- 多 agent 容易在节点结构、点数规则和 UI 状态上产生不一致。

建议：

- 规划和第一轮实现由主智能体单线完成。
- 如果实现后需要复核，可以让一个子智能体做只读审查，重点检查：
  - `core` 是否仍保持纯逻辑。
  - 天赋节点是否真实影响 DPS、EHP 或寻宝属性。
  - 旧存档兼容是否有缺口。
  - UI 是否没有把核心规则写死。

## 验收标准

- 玩家能看到四条小型构筑分支：暴击、攻速、防御、寻宝。
- 玩家升级后拥有可用天赋点。
- 激活暴击节点后 DPS 变化可被测试验证。
- 激活攻速节点后 DPS 或击杀效率变化可被测试验证。
- 激活防御节点后 EHP 变化可被测试验证。
- 激活寻宝节点后 `goldFind` 或 `magicFind` 出现在总属性中。
- 构筑评分仍作为装备排序偏好存在，但不再是唯一构筑入口。
- 格式检查、类型检查、单元测试和生产构建通过。

## 风险与取舍

- 如果直接让 `goldFind`、`magicFind` 影响收益，会提前进入 P3 调参范围；第一版建议只接属性，再由 P3 统一调经济口径。
- 如果 UI 做成完整树状图，会放大布局和交互成本；第一版使用分支列表更符合当前原型阶段。
- 如果天赋点由等级派生，导入旧存档后高等级角色会立即获得点数，这是可接受的补偿式兼容。
- 如果节点数值过高，会压过装备掉落成长；第一版数值应保守，并用测试验证方向而非追求平衡终值。
