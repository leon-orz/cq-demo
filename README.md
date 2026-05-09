# cq-demo

Vue 3 + TypeScript 的 H5 放置型 ARPG 原型。当前已经跑通可测试的核心玩法闭环，下一阶段重点是构筑评分、资源占位、组件交互测试和表现增强。

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
├── data/         # 静态游戏配置
├── stores/       # Pinia 状态管理和状态修改入口
├── composables/  # 组件和 store/core 之间的流程编排或展示派生层
├── components/   # Vue UI 组件
├── types/        # 共享领域类型
└── utils/        # 通用工具函数和常量

tests/
├── core/         # 核心纯逻辑测试
└── stores/       # Pinia store 行为测试

docs/
├── backlog/      # 剩余工作清单和后续排期入口
└── records/      # 开发记录、阶段复盘、美术资源需求和每日复盘
```

## 当前状态

已完成：

- 自动战斗和基础收益。
- 装备生成、背包容量、穿戴和属性重算。
- 离线收益报告和领取流程。
- 拾取过滤、自动转化、装备锁定、分解保护。
- 装备评分、更优高亮、装备对比弹窗和分解确认弹窗。
- 背包排序筛选面板。
- 装备展示、装备对比、背包可见列表的数据流边界整理。
- 离线收益先执行拾取过滤和自动转化，再按背包容量截断入包装备。
- 右侧背包面板拆分为资源统计、分解入口、拾取过滤和列表区域。
- 版本化本地存档快照、localForage 保存读取、导入导出和基础迁移。

当前已知重点任务：

- 增加装备流派评分权重，为暴击、攻速、坦克和主属性构筑提供更可信的“更优”判断。
- 增加装备资源占位目录和正式资源替换说明。

## 文档入口

- [开发记录索引](docs/records/README.md)
- [剩余工作清单](docs/backlog/remaining-work-2026-05-09.md)
- [项目状态评估](docs/reports/project-status-2026-05-09.md)
- [总任务拆解](docs/records/design-development-task-breakdown.md)
- [依赖升级记录](docs/records/dependency-upgrade-notes.md)
- [2026-05-09 开发复盘](docs/records/daily-review-2026-05-09.md)

原始设计文档：

- `game-design-document.md`
- `game-development-document.md`

## 开发约束

- `src/core/` 只写纯逻辑，不依赖 Vue、Pinia、DOM 或浏览器副作用。
- `src/stores/` 是修改游戏状态的主要入口。
- `src/composables/` 用于承接流程编排或展示派生数据，避免组件直接堆业务计算。
- `src/components/` 只负责界面展示和用户交互。
- 新增核心玩法逻辑时优先补 Vitest 测试。
