# 依赖升级记录

## 当前环境

- Node：`v24.12.0`
- npm：`11.6.2`

## 本次调整

为适配当前 Node 版本，并解决此前 `pinia` 与 `pinia-plugin-persistedstate` 的版本冲突，本次升级到以下兼容组合：

- `vite`：`^8.0.11`
- `@vitejs/plugin-vue`：`^6.0.6`
- `vitest`：`^4.1.5`
- `vue`：`^3.5.34`
- `pinia`：`^3.0.4`
- `pinia-plugin-persistedstate`：`^4.7.1`
- `vue-tsc`：`^3.2.8`
- `@vue/tsconfig`：`^0.9.1`
- `jsdom`：`^29.1.1`
- `@types/node`：`^24.12.2`
- `typescript`：`^5.9.3`
- `gsap`：`^3.15.0`

## 暂不升级的项目

- `tailwindcss` 保持 `^3.4.17`，实际安装为 `3.4.19`。Tailwind 4 是破坏性升级，当前项目仍使用 Tailwind 3 的 `tailwind.config.js` 与 PostCSS 配置模式，暂不迁移。
- `typescript` 保持 5.9 最新线，暂不升级到 6.0，避免 Vue 类型链路和生态工具出现未验证风险。
- `@types/node` 保持 Node 24 类型线，暂不升级到 25.x，因为当前运行环境是 Node 24。

## 验证结果

以下命令均已通过：

```bash
npm install
npm run typecheck
npm run test:run
npm run build
```

`npm outdated` 仍会显示 `@types/node`、`tailwindcss`、`typescript` 有更高主版本，这是有意保留，不是依赖冲突。
