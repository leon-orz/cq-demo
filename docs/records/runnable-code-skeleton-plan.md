# 可运行代码骨架开发计划

## 1. 目标范围

本计划用于搭建放置型 ARPG 的最小可运行前端代码骨架，技术栈采用 Vue 3、TypeScript、Vite、Pinia、Tailwind CSS、Vitest。

首阶段目标不是完成完整游戏，而是跑通“页面可启动、状态可管理、核心逻辑可测试、UI 有基础布局”的开发框架。

## 2. 最小可运行能力

- 浏览器可打开三栏暗黑主题界面。
- Pinia 可维护玩家、背包、战斗运行状态。
- `core/` 中已有纯函数模块，可被 Vitest 测试。
- 可点击一次“挑战一次”，生成战斗日志和可能的装备掉落。
- 背包中可展示基础装备条目，并支持穿戴。
- `npm run dev` 可启动开发环境。
- `npm run test:run` 可验证核心逻辑。

## 3. 首批目录

```text
src/
├── core/          # 纯游戏逻辑
├── data/          # 静态配置
├── stores/        # Pinia 状态
├── components/    # Vue 组件
├── types/         # 全局类型
└── utils/         # 通用工具

tests/
└── core/          # 核心逻辑测试
```

## 4. 首批模块

- `core/combat`：战斗公式、单场战斗、批量战斗。
- `core/item`：品质、词缀、基础装备、装备命名与生成。
- `core/player`：总属性、DPS、EHP、装备评分。
- `stores/player`：角色等级、经验、基础属性、装备穿戴。
- `stores/inventory`：背包、金币、强化石、分解低品质装备。
- `stores/combat`：当前层数、战斗日志、挑战动作。
- `components/layout`：左中右三栏。
- `components/inventory`：背包列表和装备条目。
- `components/combat`：战斗日志。

## 5. 启动与验证

```bash
npm install
npm run dev
npm run typecheck
npm run test:run
npm run build
```

验收标准：

- Vite 开发服务器正常启动。
- 页面能看到角色、战斗、背包三栏。
- 点击挑战后，战斗日志、金币、经验或背包会变化。
- TypeScript 类型检查通过。
- 核心测试通过。

## 6. 后续预留

- `core/offline`：离线收益结算。
- `stores/save`：localForage 存档快照、导入导出、版本迁移。
- `stores/settings`：自动拾取、音效、画面设置。
- `composables/useCombatLoop.ts`：在线自动挂机。
- `composables/useOfflineCheck.ts`：离线检测。
- `components/offline/RewardReport.vue`：离线开箱报告。
- `components/skilltree`：天赋树。
- GSAP、Howler.js 在骨架稳定后进入表现层。
