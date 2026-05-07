# 放置型 ARPG 开发任务拆解记录

## 1. 目标范围

基于 `game-design-document.md` 与 `game-development-document.md`，优先搭建一个可运行、可测试、可扩展的 H5 放置型 ARPG 代码骨架。

最小可行版本核心闭环：

```text
战斗模拟 -> 掉落装备 -> 背包获得 -> 穿戴装备 -> 属性变强 -> 推进层数 -> 离线收益
```

## 2. 多智能体协作拆分

主智能体：架构与集成负责人。

- 维护目录结构与模块边界。
- 保证 `core` 不依赖 Vue、Pinia、DOM。
- 保证 `stores` 是游戏状态修改入口。
- 负责最终集成、运行验证、测试覆盖检查。

子智能体 A：核心数值与战斗。

- 负责 `core/combat/`、`core/player/`、`core/offline/`、`tests/core/`。
- 实现 DPS、EHP、战力评分、单场战斗、批量战斗、离线收益。

子智能体 B：装备与数据配置。

- 负责 `core/item/`、`data/items/`、`data/affixes.ts`、`data/monsters.ts`、`types/item.ts`。
- 实现装备类型、词缀 roll、装备生成、装备命名、基础配置。

子智能体 C：状态与存档。

- 负责 `stores/player.ts`、`stores/inventory.ts`、`stores/combat.ts`、`stores/settings.ts`、`stores/save.ts`。
- 实现穿戴、卸下、分解、自动拾取、存档快照、离线时间记录。

子智能体 D：界面与交互。

- 负责 `components/layout/`、`components/inventory/`、`components/combat/`、`components/equipment/`、`components/offline/`。
- 实现三栏 UI、装备格、战斗日志、装备浮窗、离线收益报告。

## 3. 里程碑

### 里程碑 0：项目技术骨架

最小可行版本必做：

- 初始化 Vue 3 + TypeScript + Vite。
- 接入 Pinia、Tailwind CSS、Vitest。
- 配置路径别名 `@/`。
- 建立 `src/core`、`src/data`、`src/stores`、`src/components`、`src/types`、`tests`。
- 创建左侧角色、中间战斗、右侧背包的暗黑主题基础布局。

风险点：

- 不把业务逻辑写进组件。
- 先保证核心闭环，不提前堆复杂动画。

### 里程碑 1：核心数值闭环

最小可行版本必做：

- `core/player/calculator.ts`：总属性、DPS、EHP、装备评分。
- `core/combat/formula.ts`：伤害、击杀时间、收益衰减公式。
- `core/combat/engine.ts`：单场战斗、批量战斗。
- `data/monsters.ts`：基础怪物与层数推荐战力。
- `stores/combat.ts`：当前层数、挑战动作、日志。
- `tests/core/combat.test.ts`、`tests/core/calculator.test.ts`。

验收标准：

- 点击挑战后能模拟一场战斗。
- 胜利获得金币、经验，失败不丢失资源。
- DPS、EHP 可测试验证。

### 里程碑 2：装备生成与背包

最小可行版本必做：

- `core/item/generator.ts`：根据层数生成装备。
- `core/item/affixRoll.ts`：按部位和品质 roll 词缀。
- `core/item/naming.ts`：生成装备名称。
- [x] `stores/inventory.ts`：背包、穿戴、卸下、分解、容量限制。
- [x] `components/inventory/ItemGrid.vue`、`ItemSlot.vue`。
- [x] `tests/core/item-generator.test.ts`。
- [x] 自动拾取过滤。
- [x] 装备锁定和分解保护。
- [x] 装备评分、评分差值和更优高亮。
- [x] 正式装备对比浮窗。
- [x] 正式分解确认弹窗。
- [x] 装备排序和筛选面板。
  - [x] 阶段开发计划与任务拆解文档。
  - [x] 阶段美术资源需求文档。
  - [x] 阶段复盘文档。
  - [x] 核心排序和筛选纯逻辑。
  - [x] 独立背包视图状态接入排序字段、筛选条件和重置动作。
  - [x] 背包 UI 接入排序入口、筛选面板、升降序和空结果状态。
  - [x] 核心逻辑测试与集成验证。

验收标准：

- 战斗胜利后可能掉落装备。
- 装备进入背包，玩家可以穿戴。
- 穿戴后角色 DPS/EHP 实时变化。
- 玩家可以通过排序、筛选、对比、锁定和分解确认完成基础背包整理。

### 里程碑 3：挂机循环与离线收益

最小可行版本必做：

- [x] `core/offline/reward.ts`：离线秒数、收益上限、背包截断。
- [x] `composables/useCombatLoop.ts`：在线挂机定时器。
- [x] `composables/useOfflineCheck.ts`：启动和恢复时结算离线收益。
- [x] `stores/save.ts`：最后保存时间。
- [x] `components/offline/RewardReport.vue`：离线收益报告弹窗。
- [ ] localForage 快照、导入导出和版本迁移。
- [ ] 离线收益先执行拾取过滤，再按背包剩余空间截断。
- [ ] 开箱动画、领取反馈和传说装备优先展示。

风险点：

- 本地时间可被修改，最小可行版本先使用收益上限硬封顶。
- 离线批量模拟不能逐秒死循环。
- 自动保存需要节流。

### 里程碑 4：构筑与层数推进

最小可行版本必做：

- `core/player/validator.ts`：预测目标层胜率和推荐挂机层。
- `data/skills.ts`：少量被动天赋，先做暴击、攻速、坦克三条路线。
- `stores/player.ts`：天赋点、激活节点、主属性方向。
- `stores/combat.ts`：最高解锁层数、挑战层数、推层成功。
- `components/skilltree/SkillTree.vue`、`SkillNode.vue`。

风险点：

- 战力评分不能完全替代实际模拟。
- 天赋树不要过早复杂化。
- 词缀权重不合理会导致构筑单一化。

### 近期任务队列

优先级 P0：

- 优化离线收益领取流程：先按拾取过滤处理装备，再计算背包容量截断，避免可转化装备占用离线奖励空间。
- 建立完整存档服务：localForage 快照、导入导出、版本号和基础迁移。
- 拆分右侧面板：将拾取过滤、背包整理和资源统计拆成更清晰的子组件。

优先级 P1：

- 增加装备流派评分权重，为暴击、攻速、坦克和主属性构筑提供更可信的“更优”判断。
- 增加装备资源占位目录和正式资源替换说明，先接入图标路径常量，不引入未完成美术。
- 补充移动端交互测试或组件测试依赖，覆盖对比弹窗、分解弹窗和筛选抽屉。

优先级 P2：

- 实现开箱动画、掉落光效、强化反馈和离线领取动效。
- 推进天赋树、层数预测、推荐挂机层和更完整的构筑路线。
- 扩展装备长期系统：强化、传说特效、远古装备、套装和转生。

### 里程碑 5：表现、体验与长期系统

最小可行版本必做：

- 基础暗黑 UI。
- 品质颜色体系。
- 装备对比浮窗。
- 战斗日志。
- 背包满提示。
- 一键分解确认。

后续增强：

- GSAP 开箱动画、掉落光效、强化特效、层数突破动画。
- Howler.js 音效管理。
- 传说装备、远古装备、套装、强化、转生、多职业、排行榜。

## 4. 主要风险清单

| 风险         | 影响                   | 规避方式                                     |
| ------------ | ---------------------- | -------------------------------------------- |
| 数值膨胀失控 | 后续系统无法平衡       | 公式集中管理，尽早写测试                     |
| 构筑单一化   | 策略深度不足           | 评分权重按流派调整，Boss 设计抗性差异        |
| 背包整理疲劳 | 玩家流失               | 自动过滤、一键分解、智能高亮                 |
| 离线收益作弊 | 本地时间可修改         | 最小可行版本先做收益上限，后续考虑服务端校验 |
| 存档丢失     | 严重体验问题           | localForage 快照、自动保存、页面隐藏保存     |
| UI 卡顿      | 装备数量增长后性能下降 | 背包容量限制、虚拟滚动、日志长度限制         |
| 组件逻辑过重 | 后期难维护             | 组件只展示，状态走 Store，计算走 Core        |
