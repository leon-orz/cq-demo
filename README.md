# cq-demo

Vue 3 + TypeScript 的 H5 放置型 ARPG 原型。当前已经跑通可测试的核心玩法闭环，下一阶段主线是“构筑选择 -> 推层目标 -> 掉落反馈”，先补正式可玩的核心目标，再做长期扩展。

当前核心闭环：

```text
战斗模拟 -> 掉落装备 -> 背包获得 -> 穿戴装备 -> 属性变强 -> 推进层数 -> 离线收益
```

## 技术栈

- Node `v24.12.0`
- npm `11.6.2`
- Vue 3 + TypeScript
- Vite 8
- Pinia 3
- Vitest 4
- Tailwind CSS 3.4

## 快速开始

```bash
npm install
npm run dev
```

常用验证命令：

```bash
npm run format:check
npm run typecheck
npm run test:run
npm run build
```

## 项目结构

```text
src/
├── core/         # 纯游戏逻辑，禁止依赖 Vue、Pinia、DOM
├── stores/       # Pinia 状态管理和状态修改入口
├── composables/  # 组件和 store/core 之间的流程编排或展示派生层
├── components/   # Vue UI 组件
├── views/        # 页面级主界面
├── types/        # 共享领域类型
└── utils/        # 通用工具函数和常量

tests/
├── components/   # UI 冒烟和关键交互测试
├── core/         # 核心纯逻辑测试
├── services/     # 存档服务测试
└── stores/       # Pinia store 行为测试

docs/
├── START_HERE.md              # 开发入口和阶段验收标准
├── DESIGN_PRIMER.md           # 阶段一必读设计精华版
├── DEV_PRIMER.md              # 阶段一必读开发精华版
├── GameDesignDocument.md      # 新版完整设计文档
├── DevelopmentDocument.md     # 新版完整开发文档
├── MVP-*.md                   # MVP 拆分文档
└── records/                   # 开发记录、阶段复盘和关键取舍
```

## 当前状态

已完成：

- 阶段一 MVP 主链路：挂机战斗、掉落装备、穿戴装备、属性变强、手动推层。
- 核心逻辑：战斗公式、层数缩放、装备生成、装备评分、强化 +1 到 +5、离线收益。
- 状态管理：`player`、`combat`、`equipment` 三个 Pinia store。
- 存档系统：本地存档、导入导出、自动保存、页面隐藏即时保存和离线报告。
- 主界面：角色属性、训练、战斗面板、背包、装备卡、装备对比、离线收益弹窗。
- 稳定性补丁：实际战斗耗时结算、重复穿戴保护、坏档保护、前 10 层节奏调校。
- 测试覆盖：核心规则、Store 行为、存档服务和 UI 关键交互。

当前已知重点任务：

- 真实浏览器手工验收阶段一完整链路。
- 移动端布局、按钮密度和文本溢出检查。
- 基于试玩继续微调掉落率、金币训练和强化消耗。
- 阶段一可玩基线确认后，再规划背包筛选/整理、掉落展示等体验增强。

## 文档入口

- [开发入口](docs/START_HERE.md)
- [分阶段实施路线图](docs/DEVELOPMENT_ROADMAP.md)
- [设计精华版](docs/DESIGN_PRIMER.md)
- [开发精华版](docs/DEV_PRIMER.md)
- [完整设计文档](docs/GameDesignDocument.md)
- [完整开发文档](docs/DevelopmentDocument.md)
- [开发记录索引](docs/records/README.md)

设计和开发文档统一维护在 `docs/` 目录。根目录不再保留旧版 `game-design-document.md`、`game-development-document.md`、`game_design_doc.md`、`game_development_doc.md`，避免新旧文档冲突。

## 开发约束

- `src/core/` 只写纯逻辑，不依赖 Vue、Pinia、DOM 或浏览器副作用。
- `src/stores/` 是修改游戏状态的主要入口。
- `src/composables/` 用于承接流程编排或展示派生数据，避免组件直接堆业务计算。
- `src/components/` 只负责界面展示和用户交互。
- 新增核心玩法逻辑时优先补 Vitest 测试。
