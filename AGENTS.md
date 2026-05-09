# 仓库指南

## 项目结构与模块组织

本仓库是一个 Vue 3 + TypeScript 的 H5 放置型 ARPG 原型。当前开发环境以 Node 24 为基准，前端主链路为 Vite 8、Pinia 3、Vitest 4。

- `src/core/`：纯游戏逻辑层。禁止依赖 Vue、Pinia、DOM 或浏览器副作用。
- `src/data/`：静态游戏配置，例如怪物、基础装备、词缀池。
- `src/stores/`：Pinia 状态管理，是修改游戏状态的主要入口。
- `src/composables/`：组件和 store/core 之间的流程编排或展示派生层，例如战斗循环、离线检查、装备展示派生数据。
- `src/components/`：Vue UI 组件，按功能拆分为 `layout`、`combat`、`inventory` 等目录。
- `src/types/`：共享 TypeScript 领域类型。
- `src/utils/`：通用工具函数和常量。
- `tests/core/`：核心纯逻辑的 Vitest 测试。
- `public/assets/`：装备、特效、UI、音频资源。
- `docs/records/`：计划、拆解、阶段记录等开发文档。

## 构建、测试与开发命令

- `npm install`：安装项目依赖。
- `npm run dev`：启动 Vite 开发服务器。
- `npm run typecheck`：执行 `vue-tsc --noEmit` 类型检查。
- `npm run test:run`：单次运行全部 Vitest 测试。
- `npm run test:watch`：以监听模式运行 Vitest。
- `npm run build`：先类型检查，再构建生产产物。
- `npm run preview`：本地预览生产构建结果。
- `npm run format`：使用 Prettier 格式化代码和文档。
- `npm run format:check`：检查格式是否符合 Prettier 配置。

依赖版本策略：

- 当前环境使用 Node `v24.12.0`、npm `11.6.2`。
- `pinia` 与 `pinia-plugin-persistedstate` 必须保持同代兼容，当前为 Pinia 3 + persistedstate 4。
- `tailwindcss` 暂留 3.4 线，继续使用 `tailwind.config.js` 与 PostCSS 配置；升级到 Tailwind 4 应单独做迁移任务。
- `typescript` 暂留 5.9 线；升级到 6.x 前必须先验证 `vue-tsc`、Vite、Vitest 和 Vue 类型链路。
- 依赖调整记录写入 `docs/records/dependency-upgrade-notes.md`。

## 编码风格与命名约定

使用严格 TypeScript。避免 `any`，领域类型应放在 `src/types/`。

JSON、Vue、TypeScript 文件统一使用 2 空格缩进，具体规则以 `.editorconfig` 和 `prettier.config.js` 为准。`core/` 中优先写小型纯函数；组件只负责展示和交互，不承载核心数值逻辑。

组件需要展示派生数据或流程编排时，优先通过 `stores` getter/action 或 `composables` 承接，不要在组件中直接堆叠核心计算。`core` 仍是纯逻辑来源，`composables` 只负责把纯逻辑和响应式状态组织成 UI 可消费的数据。

提交前应运行 `npm run format:check`。需要自动整理时运行 `npm run format`。两份原始设计文档 `game-design-document.md` 和 `game-development-document.md` 暂不交给 Prettier 处理，避免产生大范围文档格式差异。

命名示例：

- Vue 组件：`PascalCase.vue`，例如 `ItemSlot.vue`。
- 组合式函数：`useXxx.ts`，例如 `useCombatLoop.ts`。
- Store 导出：`useXxxStore`，例如 `usePlayerStore`。
- 核心函数：动词开头，例如 `simulateCombat`、`generateItem`、`calculateDps`。

## 测试规范

测试框架为 Vitest。核心玩法逻辑应先补单元测试，再接入 UI。

测试文件使用 `*.test.ts` 命名，例如：

- `tests/core/combat.test.ts`
- `tests/core/item-generator.test.ts`
- `tests/core/calculator.test.ts`

提交前运行 `npm run format:check`、`npm run typecheck` 和 `npm run test:run`。战斗公式、装备生成、属性计算、背包规则、离线收益逻辑都应有测试覆盖。

## 提交与合并请求规范

当前 Git 历史只有初始提交，尚未形成既有约定。后续建议使用简短的约定式提交：

- `feat: 添加离线收益计算`
- `fix: 防止背包溢出掉落`
- `test: 覆盖传说装备生成`
- `docs: 更新阶段计划`

合并请求应包含变更摘要、影响范围、验证命令。涉及 UI 的改动应附截图或录屏；如有关联问题或计划文档，请一并链接。

## 文档维护规范

- `docs/records/README.md` 是开发记录入口，新增阶段记录后应同步更新索引。
- 临时接续计划完成后不要长期保留，应删除并把关键结论沉淀到每日复盘、阶段复盘或总任务拆解。
- 每日复盘只记录当天完成、验证结果、主要取舍和下一步建议。
- 阶段计划记录“准备怎么做”，阶段复盘记录“实际做成什么”和“剩余风险”。
- 美术资源文档只记录资源清单、规格、命名、用途和占位策略，不写代码执行流水。

## 智能体专用说明

始终使用中文进行对话，包括代码注释和文档生成。不要因为用户消息或模板中出现英文就切换到英文。文件命名、命令、代码标识、依赖包名、提交类型等工程固定格式可以使用英文。

如果外部模板要求固定英文标题或字段名，只保留该固定内容，其他说明和正文仍使用中文。不确定时先按中文输出，必要时再向用户确认。

保持架构边界：`core` 负责纯逻辑，`stores` 负责状态修改，`composables` 负责流程编排或展示派生，`components` 负责界面展示。不要回滚用户已有的无关改动。
