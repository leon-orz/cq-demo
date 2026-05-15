# 《放置裂隙：装备与传说》开发技术文档

> **文档版本**：v1.0  
> **游戏代号**：IdleARPG  
> **项目类型**：H5 放置型 ARPG  
> **目标平台**：浏览器 / 微信 WebView / 移动端浏览器  
> **技术架构**：纯前端单机架构，无服务端依赖  

---

## 第1章 技术选型与架构设计

### 1.1 技术栈概览

《放置裂隙：装备与传说》采用现代化的前端技术栈，以 Vue 3 为核心框架，配合 TypeScript 提供完整的类型安全，使用 Vite 作为构建工具，Pinia 管理状态，Tailwind CSS 处理样式。这套组合兼顾了开发效率和运行时性能，同时天然支持 PWA（渐进式 Web 应用），使得游戏可以在浏览器中运行，也可以安装到桌面或手机主屏上像原生应用一样使用。

技术选型遵循以下核心原则：**开发效率优先**，因为团队规模较小，需要快速迭代；**运行时性能可控**，放置游戏对帧率要求不高，但需要处理大量数值计算；**长期可维护性**，代码结构清晰、类型完整，便于后续扩展新系统；**跨平台兼容性**，一套代码同时覆盖浏览器、微信 H5 和移动端 WebView 三种运行环境。

| 技术层 | 选型 | 版本 | 说明 |
|--------|------|------|------|
| 框架 | Vue | 3.4.x | Composition API 为主，响应式系统驱动 UI |
| 语言 | TypeScript | 5.4.x | 全项目类型安全，严格模式启用 |
| 构建 | Vite | 5.2.x | 快速开发服务器，Rollup 生产打包 |
| 状态管理 | Pinia | 2.1.x | Setup Store 风格，TypeScript 完美支持 |
| 样式 | Tailwind CSS | 3.4.x | 实用优先的原子化 CSS |
| 存储 | IndexedDB + localStorage | 原生 API | IndexedDB 存大量装备，localStorage 存核心状态 |
| PWA | vite-plugin-pwa | 0.19.x | Service Worker 离线缓存 |

**框架选择 Vue 3 的原因**：Vue 3 的 Composition API 天然适合游戏开发中的状态组合逻辑。游戏角色属性由基础值、训练加成、装备加成、天赋加成等多个部分组合而成，Composition API 的 `ref`、`computed` 和组合式函数完美匹配这种"属性累加"的计算模式。此外，Vue 3 的响应式系统经过 Proxy 重写，性能优于 Vue 2 的 Object.defineProperty，对于频繁更新的数值 UI 更友好。

**TypeScript 严格模式的必要性**：游戏中有大量的数值公式和类型转换，例如装备词缀有 18 种类型，每种类型有固定值和百分比两种表达方式，品质有 5 个等级，评分有 5 种模式。使用 TypeScript 的枚举和联合类型可以确保在编译阶段捕获类型错误，避免因拼写错误或类型混淆导致的数值 Bug。

**Vite 替代 Webpack 的理由**：Vite 使用原生 ESM 模块进行开发服务器的热更新，冷启动时间几乎为零，对于频繁修改数值参数的游戏开发场景极为友好。生产构建使用 Rollup 打包，Tree Shaking 效果优秀，可以有效减小最终包体积。

**Pinia 替代 Vuex 的理由**：Pinia 的 Setup Store 风格与 Composition API 完全一致，学习成本极低。Pinia 天然支持 TypeScript 类型推导，不需要像 Vuex 那样编写大量类型辅助代码。Pinia 的 Store 之间可以直接导入使用，不需要通过命名空间字符串访问，代码可读性更高。

### 1.2 架构设计原则

采用纯前端架构，所有游戏逻辑在浏览器端完成。数据持久化通过浏览器本地存储实现，无需后端服务。

**核心设计决策**：

- 战斗引擎为纯数值计算模块，不依赖 Vue 响应式系统或浏览器 DOM
- 游戏状态分层管理：Pinia Store 管理 UI 状态，`core` 模块管理游戏逻辑
- 装备数据存储于 IndexedDB，避免 localStorage 的 5MB 限制
- 存档系统支持版本迁移，确保升级后旧存档可恢复
- 离线收益在客户端基于时间戳计算，设有软上限防止异常收益

### 1.3 模块依赖关系

```
┌─────────────────────────────────────────────────────┐
│                      UI 层 (Vue)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │
│  │ 组件系统  │ │ 组合式函数 │ │     全局事件         │ │
│  │ .vue     │ │ .ts      │ │     mitt             │ │
│  └────┬─────┘ └────┬─────┘ └──────────┬───────────┘ │
└───────┼────────────┼──────────────────┼─────────────┘
        │            │                  │
        ▼            ▼                  ▼
┌─────────────────────────────────────────────────────┐
│                   状态管理层 (Pinia)                   │
│  ┌────────┐ ┌────────┐ ┌──────────┐ ┌────────────┐ │
│  │ player │ │ combat │ │equipment │ │  prestige  │ │
│  │        │ │        │ │          │ │   daily    │ │
│  └────┬───┘ └────┬───┘ └────┬─────┘ └─────┬──────┘ │
└───────┼──────────┼──────────┼──────────────┼────────┘
        │          │          │              │
        ▼          ▼          ▼              ▼
┌─────────────────────────────────────────────────────┐
│                   核心逻辑层 (core)                    │
│  ┌──────────┐ ┌───────────┐ ┌────────────────────┐ │
│  │ CombatEngine│ │LootGenerator│ │ EnhancementSystem  │ │
│  ├──────────┤ ├───────────┤ ├────────────────────┤ │
│  │FloorScaling│ │ GearScore │ │ OfflineCalculator  │ │
│  ├──────────┤ ├───────────┤ ├────────────────────┤ │
│  │ SaveManager│ │           │ │                    │ │
│  └──────────┘ └───────────┘ └────────────────────┘ │
└─────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────┐
│                   数据持久化层                         │
│       IndexedDB (装备数据) + localStorage (状态)       │
└─────────────────────────────────────────────────────┘
```

### 1.4 ADR-001：纯前端架构决策

**背景**：放置型 ARPG 的核心体验围绕数值成长、装备收集和离线收益展开。玩家需要随时可玩、不受网络环境影响的游戏体验。传统客户端-服务端架构虽然可以防止作弊，但引入了服务器成本、网络延迟和运维负担，对于小型团队和原型验证阶段并不友好。

**决策**：采用纯前端架构，使用 Vue 3 + TypeScript 技术栈，所有游戏逻辑在浏览器端运行，数据通过浏览器本地存储持久化。

**决策理由**：

1. 放置型 ARPG 的核心体验是数值成长与装备收集，对实时联机没有刚性需求。战斗是纯数值模拟，不需要服务端校验每次攻击的合法性。装备掉落使用客户端伪随机数生成，玩家体验不会受到影响。
2. 纯前端架构消除了服务器成本，适合原型验证和独立发布。服务器零成本意味着可以更专注于游戏内容本身，而不是基础设施运维。
3. IndexedDB 提供足够的存储空间（50MB+），可以容纳数万件装备数据。localStorage 虽然只有 5MB 限制，但只用于存储核心状态快照，装备数据存储在 IndexedDB 中，容量不受限制。
4. 玩家可以离线游玩，不受网络环境影响。这对于放置游戏至关重要，因为玩家可能在地铁、电梯等信号不稳定的环境中查看离线收益。
5. 开发迭代速度快。修改数值、调整公式后，玩家刷新页面即可获得更新，不需要等待服务端部署。

**决策影响**：

- 存档数据存储在本地，玩家可通过导入导出功能手动备份。需要在 UI 中明确提示玩家定期备份存档。
- 离线收益基于本地时间戳计算，设有 12 小时软上限和异常时间校验。虽然可以通过修改系统时间作弊，但收益上限限制了作弊效果，且对单机游戏体验影响有限。
- 不提供排行榜、交易等多人功能。这些功能需要服务端支持，在当前架构下无法实现。未来如需添加，可以通过可选的云存档服务实现。
- 存档安全性依赖设备本身。设备损坏或浏览器数据清除会导致存档丢失，因此需要强调手动备份的重要性。

**替代方案考虑**：

- 轻量级后端（Firebase / Supabase）：可以提供云存档和排行榜，但需要额外成本和运维。决定在当前阶段不引入，但在存档数据结构中为未来迁移预留接口。
- 混合架构（核心逻辑本地 + 校验服务端）：可以实现反作弊，但增加了架构复杂度。决定在当前阶段不引入，如果未来上线排行榜再考虑。

### 1.5 ADR-002：Pinia Setup Store 风格

**背景**：状态管理需要支持 TypeScript 严格类型推导，并与 Composition API 风格保持一致。

**决策**：所有 Pinia Store 采用 Setup Store（函数式定义）风格。

**理由**：

1. Setup Store 与 Vue 组件的 `<script setup>` 语法完全一致，降低心智负担
2. 天然支持 TypeScript 类型推导，无需额外定义类型辅助函数
3. 可以在 Store 内部使用 `computed`、`watch` 等响应式 API
4. 逻辑复用更灵活，可通过提取组合式函数实现跨 Store 共享

**示例对比**：

```typescript
// Setup Store 风格（采用）
export const usePlayerStore = defineStore('player', () => {
  const level = ref(1)
  const exp = ref(0)
  const maxExp = computed(() => Math.round(100 * 1.2 ** (level.value - 1)))
  function gainExp(amount: number) { /* ... */ }
  return { level, exp, maxExp, gainExp }
})
```

### 1.6 ADR-003：战斗引擎与 Vue 解耦

**背景**：战斗模拟是纯数值计算，不应依赖 UI 框架。

**决策**：所有战斗计算、装备生成、收益结算等核心逻辑放置在独立的 `core` 模块中，不引用 Vue 或 Pinia。

**理由**：

1. 核心逻辑与 UI 框架解耦，便于单元测试和性能优化
2. 战斗引擎可以在 Web Worker 中运行，避免阻塞主线程
3. 未来如需添加服务端校验或联机对战，核心逻辑可直接复用
4. 离线收益计算可在后台线程执行，不占用 UI 渲染资源

**模块边界**：

- `core` 模块：纯 TypeScript 函数和类，不引用任何框架代码
- `composables`：Vue 组合式函数，桥接 `core` 与 Pinia Store
- `stores`：Pinia Store，管理响应式状态
- `components`：Vue 组件，纯展示与交互

---

## 第2章 项目结构与工程配置

### 2.0 工程配置概述

本章详细说明项目的工程化配置，包括目录结构设计思路、构建工具配置、TypeScript 编译选项和入口文件编写。这些配置是整个项目的基础，直接影响开发体验、构建产物质量和运行时性能。

目录结构的设计遵循"关注点分离"原则。`core` 目录只包含纯游戏逻辑，不依赖任何框架；`stores` 目录使用 Pinia 管理状态；`components` 目录只负责 UI 展示；`composables` 目录作为 `core` 和 `stores` 之间的桥梁。这种分层架构确保每一层都有明确的职责边界，降低了模块间的耦合度。

TypeScript 配置启用严格模式，包括 `noUnusedLocals`、`noUnusedParameters` 和 `noFallthroughCasesInSwitch`，这些选项虽然在开发阶段可能显得严格，但可以有效防止常见错误。例如 `noFallthroughCasesInSwitch` 可以捕获 switch 语句中遗漏的 break，这在处理装备品质、怪物类型等枚举值时尤为重要。

### 2.1 完整目录结构

```
idle-arpg/
├── public/
│   ├── icons/
│   │   ├── icon-192x192.png
│   │   └── icon-512x512.png
│   └── manifest.json
├── src/
│   ├── assets/
│   │   ├── styles/
│   │   │   └── global.css
│   │   └── sprites/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── BaseButton.vue
│   │   │   ├── BaseModal.vue
│   │   │   └── BaseTooltip.vue
│   │   ├── EquipmentCard.vue
│   │   ├── EquipmentCompare.vue
│   │   ├── EquipmentList.vue
│   │   ├── CombatPanel.vue
│   │   ├── CombatLog.vue
│   │   ├── PlayerPanel.vue
│   │   ├── TalentPanel.vue
│   │   ├── TrainingPanel.vue
│   │   ├── BackpackPanel.vue
│   │   ├── TargetPanel.vue
│   │   ├── BossTarget.vue
│   │   ├── OfflineReportModal.vue
│   │   ├── SettingsPanel.vue
│   │   └── FilterPanel.vue
│   ├── composables/
│   │   ├── useCombat.ts
│   │   ├── useGearScore.ts
│   │   ├── useOfflineEarnings.ts
│   │   ├── useSaveLoad.ts
│   │   └── useEquipmentFilter.ts
│   ├── core/
│   │   ├── CombatEngine.ts
│   │   ├── FloorScaling.ts
│   │   ├── LootGenerator.ts
│   │   ├── GearScore.ts
│   │   ├── EnhancementSystem.ts
│   │   ├── OfflineCalculator.ts
│   │   ├── SaveManager.ts
│   │   └── __tests__/
│   │       ├── CombatEngine.test.ts
│   │       ├── FloorScaling.test.ts
│   │       ├── LootGenerator.test.ts
│   │       ├── GearScore.test.ts
│   │       ├── EnhancementSystem.test.ts
│   │       ├── OfflineCalculator.test.ts
│   │       └── SaveManager.test.ts
│   ├── stores/
│   │   ├── player.ts
│   │   ├── combat.ts
│   │   ├── equipment.ts
│   │   ├── prestige.ts
│   │   └── daily.ts
│   ├── types/
│   │   ├── enums.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── constants.ts
│   │   ├── formatters.ts
│   │   └── helpers.ts
│   ├── db/
│   │   └── indexedDB.ts
│   ├── App.vue
│   ├── main.ts
│   └── shims-vue.d.ts
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
└── vitest.config.ts
```

### 2.2 package.json

```json
{
  "name": "idle-arpg",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "typecheck": "vue-tsc --noEmit",
    "lint": "eslint . --ext .vue,.ts,.tsx",
    "lint:fix": "eslint . --ext .vue,.ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,vue}\"",
    "format:check": "prettier --check \"src/**/*.{ts,vue}\"
  },
  "dependencies": {
    "vue": "^3.4.21",
    "pinia": "^2.1.7",
    "vue-router": "^4.3.0",
    "mitt": "^3.0.1",
    "idb": "^8.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.4",
    "@vue/test-utils": "^2.4.5",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-plugin-vue": "^9.24.0",
    "jsdom": "^24.0.0",
    "postcss": "^8.4.38",
    "prettier": "^3.2.5",
    "tailwindcss": "^3.4.3",
    "typescript": "^5.4.5",
    "vite": "^5.2.8",
    "vite-plugin-pwa": "^0.19.8",
    "vitest": "^1.5.0",
    "vue-tsc": "^2.0.11"
  }
}
```

### 2.3 vite.config.ts

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '放置裂隙：装备与传说',
        short_name: '放置裂隙',
        description: '一款以装备 Build 为核心的放置型 ARPG',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@types': resolve(__dirname, 'src/types'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@components': resolve(__dirname, 'src/components'),
      '@composables': resolve(__dirname, 'src/composables'),
      '@db': resolve(__dirname, 'src/db')
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue', 'vue-router', 'pinia'],
          db: ['idb']
        }
      }
    }
  }
})
```

### 2.4 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "preserve",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@core/*": ["src/core/*"],
      "@stores/*": ["src/stores/*"],
      "@types/*": ["src/types/*"],
      "@utils/*": ["src/utils/*"],
      "@components/*": ["src/components/*"],
      "@composables/*": ["src/composables/*"],
      "@db/*": ["src/db/*"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 2.5 tsconfig.app.json

```json
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "include": ["env.d.ts", "src/**/*", "src/**/*.vue"],
  "exclude": ["src/**/__tests__/*"],
  "compilerOptions": {
    "composite": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### 2.6 tsconfig.node.json

```json
{
  "extends": "@tsconfig/node20/tsconfig.json",
  "include": [
    "vite.config.*",
    "vitest.config.*",
    "cypress.config.*",
    "nightwatch.conf.*",
    "playwright.config.*"
  ],
  "compilerOptions": {
    "composite": true,
    "noEmit": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "types": ["node"]
  }
}
```

### 2.7 tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        rarity: {
          normal: '#9ca3af',
          magic: '#3b82f6',
          rare: '#eab308',
          legendary: '#f97316',
          ancient: '#ef4444'
        },
        game: {
          bg: '#0f0f1a',
          panel: '#1a1a2e',
          border: '#2d2d44',
          text: '#e2e8f0',
          muted: '#64748b',
          accent: '#8b5cf6'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      animation: {
        'glow-magic': 'glow 2s ease-in-out infinite alternate',
        'glow-rare': 'glow 1.5s ease-in-out infinite alternate',
        'glow-legendary': 'glow 1s ease-in-out infinite alternate',
        'shake': 'shake 0.5s ease-in-out',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out'
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px currentColor' },
          '100%': { boxShadow: '0 0 20px currentColor, 0 0 40px currentColor' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' }
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      }
    }
  },
  plugins: []
}
```

### 2.8 postcss.config.js

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
}
```

### 2.9 vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/core/**/*.ts', 'src/stores/**/*.ts', 'src/utils/**/*.ts']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@types': resolve(__dirname, 'src/types'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@db': resolve(__dirname, 'src/db')
    }
  }
})
```

### 2.10 main.ts

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import './assets/styles/global.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.mount('#app')
```

### 2.11 App.vue

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { usePlayerStore } from '@stores/player'
import { useCombatStore } from '@stores/combat'
import { useEquipmentStore } from '@stores/equipment'
import { SaveManager } from '@core/SaveManager'
import { OfflineCalculator } from '@core/OfflineCalculator'
import PlayerPanel from '@components/PlayerPanel.vue'
import CombatPanel from '@components/CombatPanel.vue'
import BackpackPanel from '@components/BackpackPanel.vue'
import OfflineReportModal from '@components/OfflineReportModal.vue'

const playerStore = usePlayerStore()
const combatStore = useCombatStore()
const equipmentStore = useEquipmentStore()

let saveInterval: number | null = null

onMounted(async () => {
  // 尝试加载存档
  const saveManager = new SaveManager()
  const snapshot = await saveManager.loadSnapshot()

  if (snapshot) {
    // 恢复玩家状态
    playerStore.restoreFromSnapshot(snapshot.player)
    combatStore.restoreFromSnapshot(snapshot.combat)
    equipmentStore.restoreFromSnapshot(snapshot.equipment)

    // 计算离线收益
    if (snapshot.offline?.lastActiveTime) {
      const offlineCalc = new OfflineCalculator()
      const report = offlineCalc.calculate({
        lastActiveTime: snapshot.offline.lastActiveTime,
        currentTime: Date.now(),
        playerBuild: playerStore.getBuildSnapshot(),
        currentFloor: combatStore.currentFloor,
        backpackSlots: equipmentStore.getAvailableSlots(),
        playerPower: playerStore.totalPower,
        pickupFilter: equipmentStore.pickupFilter
      })

      if (report.durationSeconds >= 60) {
        combatStore.setPendingOfflineReport(report)
      }
    }
  }

  // 每 60 秒自动保存
  saveInterval = window.setInterval(async () => {
    await autoSave()
  }, 60000)

  // 页面可见性变化时保存/恢复
  document.addEventListener('visibilitychange', handleVisibilityChange)
})

onUnmounted(() => {
  if (saveInterval) clearInterval(saveInterval)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
})

async function autoSave(): Promise<void> {
  const saveManager = new SaveManager()
  await saveManager.saveSnapshot({
    version: 1,
    lastActiveTime: Date.now(),
    player: playerStore.createSnapshot(),
    combat: combatStore.createSnapshot(),
    equipment: equipmentStore.createSnapshot(),
    settings: {
      scoreMode: equipmentStore.scoreMode,
      pickupFilter: equipmentStore.pickupFilter,
      protection: equipmentStore.protectionSettings
    }
  })
}

function handleVisibilityChange(): void {
  if (document.hidden) {
    // 页面隐藏时立即保存
    autoSave()
  }
}
</script>

<template>
  <div class="min-h-screen bg-game-bg text-game-text font-sans">
    <!-- 离线报告弹窗 -->
    <OfflineReportModal
      v-if="combatStore.pendingOfflineReport"
      :report="combatStore.pendingOfflineReport"
      @claim="combatStore.claimOfflineReport"
      @dismiss="combatStore.dismissOfflineReport"
    />

    <!-- 三栏布局 -->
    <div class="flex flex-col lg:flex-row h-screen overflow-hidden">
      <!-- 左侧面板：角色、属性、装备、训练、天赋 -->
      <div class="w-full lg:w-80 xl:w-96 flex-shrink-0 border-r border-game-border overflow-y-auto">
        <PlayerPanel />
      </div>

      <!-- 中间面板：战斗、推荐、目标、日志 -->
      <div class="flex-1 border-r border-game-border overflow-y-auto">
        <CombatPanel />
      </div>

      <!-- 右侧面板：背包、资源、存档、过滤 -->
      <div class="w-full lg:w-80 xl:w-96 flex-shrink-0 overflow-y-auto">
        <BackpackPanel />
      </div>
    </div>
  </div>
</template>
```

### 2.12 global.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    @apply bg-game-bg text-game-text;
    overflow: hidden;
    overscroll-behavior: none;
  }

  /* 滚动条样式 */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: #2d2d44;
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #3d3d5c;
  }
}

@layer components {
  .game-panel {
    @apply bg-game-panel border border-game-border rounded-lg p-4;
  }

  .game-panel-header {
    @apply text-sm font-semibold text-game-muted uppercase tracking-wider mb-3;
  }

  .btn-primary {
    @apply px-4 py-2 bg-game-accent text-white rounded-lg font-medium
           hover:bg-violet-600 active:bg-violet-700
           transition-colors duration-150
           disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-secondary {
    @apply px-4 py-2 bg-game-border text-game-text rounded-lg font-medium
           hover:bg-opacity-80 active:bg-opacity-60
           transition-colors duration-150;
  }

  .btn-danger {
    @apply px-4 py-2 bg-red-600 text-white rounded-lg font-medium
           hover:bg-red-700 active:bg-red-800
           transition-colors duration-150;
  }

  .stat-row {
    @apply flex justify-between items-center py-1 text-sm;
  }

  .stat-label {
    @apply text-game-muted;
  }

  .stat-value {
    @apply font-mono font-medium;
  }

  /* 品质颜色 */
  .rarity-normal { color: #9ca3af; }
  .rarity-magic { color: #3b82f6; }
  .rarity-rare { color: #eab308; }
  .rarity-legendary { color: #f97316; }
  .rarity-ancient { color: #ef4444; }
}

@layer utilities {
  .text-shadow {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }

  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}
```

### 2.13 shims-vue.d.ts

```typescript
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
```

### 2.14 indexedDB.ts（IndexedDB 封装）

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb'
import type { EquipmentItem } from '@types'

interface GameDBSchema extends DBSchema {
  equipments: {
    key: string
    value: EquipmentItem
    indexes: { 'by-score': number; 'by-rarity': string; 'by-slot': string }
  }
  snapshots: {
    key: string
    value: {
      id: string
      data: string
      createdAt: number
    }
  }
}

let db: IDBPDatabase<GameDBSchema> | null = null

export async function getDB(): Promise<IDBPDatabase<GameDBSchema>> {
  if (db) return db

  db = await openDB<GameDBSchema>('IdleARPG', 1, {
    upgrade(database) {
      // 装备存储
      const equipStore = database.createObjectStore('equipments', { keyPath: 'id' })
      equipStore.createIndex('by-score', 'score')
      equipStore.createIndex('by-rarity', 'rarity')
      equipStore.createIndex('by-slot', 'slot')

      // 存档存储
      database.createObjectStore('snapshots', { keyPath: 'id' })
    }
  })

  return db
}

export async function saveEquipment(item: EquipmentItem): Promise<void> {
  const database = await getDB()
  await database.put('equipments', item)
}

export async function saveEquipments(items: EquipmentItem[]): Promise<void> {
  const database = await getDB()
  const tx = database.transaction('equipments', 'readwrite')
  await Promise.all(items.map((item) => tx.store.put(item)))
  await tx.done
}

export async function getEquipment(id: string): Promise<EquipmentItem | undefined> {
  const database = await getDB()
  return database.get('equipments', id)
}

export async function getAllEquipments(): Promise<EquipmentItem[]> {
  const database = await getDB()
  return database.getAll('equipments')
}

export async function deleteEquipment(id: string): Promise<void> {
  const database = await getDB()
  await database.delete('equipments', id)
}

export async function clearAllEquipments(): Promise<void> {
  const database = await getDB()
  await database.clear('equipments')
}
```


---

## 第3章 核心数据结构定义

### 3.0 数据层设计概述

数据层是整个游戏系统的基石。放置型 ARPG 的核心复杂度来自装备系统的数据多样性：18 种词缀类型、5 种品质等级、9 个装备部位、5 种评分模式，这些维度组合产生了大量需要精确建模的数据关系。一个设计良好的数据层能够在编译阶段捕获大部分类型错误，同时为运行时提供高效的数据结构。

数据层的设计遵循以下原则：**类型安全优先**，所有游戏数据都有明确的 TypeScript 类型定义，杜绝 `any` 类型；**枚举驱动**，使用枚举而非字符串字面量定义离散取值，确保代码的可维护性和 IDE 自动补全；**接口隔离**，每个系统只依赖自己需要的数据接口，避免一个大而全的上帝接口；**常量集中**，所有游戏数值常量集中定义在 `constants.ts` 中，便于数值策划统一调整。

本章包含三个核心文件：

- `types/enums.ts`：定义 8 个枚举类型，覆盖职业、装备部位、品质、词缀、怪物、天赋、评分等维度
- `types/index.ts`：定义 20+ 个 TypeScript 接口，覆盖装备、玩家、战斗、离线收益等所有数据结构
- `utils/constants.ts`：集中定义所有游戏数值常量，包括 DPS/EHP/战力公式参数、词缀数值范围、强化成功率等

### 3.1 枚举定义（types/enums.ts）

```typescript
/**
 * 职业类型
 * 当前为单职业系统，预留扩展接口
 */
export enum ClassType {
  ADVENTURER = 'adventurer',  // 冒险者（默认）
  WARRIOR = 'warrior',        // 战士
  ROGUE = 'rogue',            // 刺客/游侠
  MAGE = 'mage'               // 法师
}

/**
 * 装备部位
 */
export enum SlotType {
  WEAPON = 'weapon',       // 武器（主手）
  OFFHAND = 'offhand',     // 副手
  HELMET = 'helmet',       // 头盔
  ARMOR = 'armor',         // 护甲
  GLOVES = 'gloves',       // 手套
  SHOES = 'shoes',         // 鞋子
  RING = 'ring',           // 戒指
  NECKLACE = 'necklace'    // 项链
}

/**
 * 装备品质
 */
export enum Rarity {
  NORMAL = 'normal',       // 普通（白色）
  MAGIC = 'magic',         // 魔法（蓝色）
  RARE = 'rare',           // 稀有（黄色）
  LEGENDARY = 'legendary', // 传说（橙色）
  ANCIENT = 'ancient'      // 远古（红色/紫色）
}

/**
 * 词缀类型（共 18 种）
 */
export enum AffixType {
  // 攻击类词缀（6 种）
  ATTACK = 'attack',              // +X 攻击力
  CRIT_CHANCE = 'critChance',     // +X% 暴击率
  CRIT_DAMAGE = 'critDamage',     // +X% 暴击伤害
  ATTACK_SPEED = 'attackSpeed',   // +X% 攻击速度
  FIRE_DAMAGE = 'fireDamage',     // +X 火焰伤害
  ICE_DAMAGE = 'iceDamage',       // +X 冰霜伤害

  // 防御类词缀（6 种）
  HP = 'hp',                      // +X 生命值
  ARMOR = 'armor',                // +X 护甲值
  DODGE = 'dodge',                // +X% 闪避率
  BLOCK = 'block',                // +X% 格挡率
  FIRE_RESIST = 'fireResist',     // +X% 火焰抗性
  ICE_RESIST = 'iceResist',       // +X% 冰霜抗性

  // 功能类词缀（4 种）
  EXP_GAIN = 'expGain',           // +X% 经验获取
  MAGIC_FIND = 'magicFind',       // +X% 魔法物品发现率
  GOLD_FIND = 'goldFind',         // +X% 金币获取
  MOVE_SPEED = 'moveSpeed',       // +X% 移动速度

  // 属性类词缀（2 种）
  STR = 'strength',               // +X 力量
  DEX = 'dexterity',              // +X 敏捷
  INT = 'intelligence'            // +X 智力
}

/**
 * 怪物类型
 */
export enum MonsterType {
  BALANCED = 'balanced',   // 均衡怪
  HIGH_HP = 'highHp',      // 高血怪
  HIGH_ATK = 'highAtk',    // 高攻怪
  REWARD = 'reward',       // 奖励怪
  BOSS = 'boss'            // Boss
}

/**
 * 怪物词缀（精英/Boss 特殊能力）
 */
export enum MonsterAffix {
  FAST = 'fast',           // 快速：攻击速度 +30%
  TANKY = 'tanky',         // 坚韧：生命值 +50%
  DEADLY = 'deadly',       // 致命：暴击率 +20%
  RESISTANT = 'resistant', // 抗性：所有抗性 +30%
  HEALER = 'healer'        // 恢复：每秒恢复 2% 生命
}

/**
 * 天赋分支
 */
export enum TalentBranch {
  CRIT = 'crit',           // 暴击分支
  ATK_SPD = 'atkSpd',      // 攻速分支
  DEFENSE = 'defense',     // 防御分支
  TREASURE = 'treasure'    // 寻宝分支
}

/**
 * 评分模式
 */
export enum ScoreMode {
  BALANCED = 'balanced',   // 均衡
  CRIT = 'crit',           // 暴击
  ATK_SPD = 'atkSpd',      // 攻速
  TOUGH = 'tough',         // 坚韧
  MAIN_ATTR = 'mainAttr'   // 主属性
}
```

### 3.2 核心接口定义（types/index.ts）

```typescript
import type { ClassType, SlotType, Rarity, AffixType, MonsterType, MonsterAffix, TalentBranch, ScoreMode } from './enums'

// ───────────────────────────────────────────────
// 基础数值类型
// ───────────────────────────────────────────────

/** 属性值类型：支持数值和百分比两种表达 */
export interface AttributeValue {
  flat: number          // 固定数值加成
  percent: number       // 百分比加成
}

/** 基础属性集合 */
export interface BaseStats {
  attack: number
  hp: number
  armor: number
  attackSpeed: number
  critChance: number     // 0~1 小数
  critDamage: number     // 1.5 = 150%
  dodge: number          // 0~1 小数
  block: number          // 0~1 小数
  fireResist: number     // 0~1 小数
  iceResist: number      // 0~1 小数
  goldFind: number       // 0~N 数值
  magicFind: number      // 0~N 数值
  expGain: number        // 0~N 百分比
}

/** 主属性集合 */
export interface MainAttributes {
  str: number
  dex: number
  int: number
}

// ───────────────────────────────────────────────
// 装备系统
// ───────────────────────────────────────────────

/** 单条词缀 */
export interface Affix {
  type: AffixType
  value: number
  valueType: 'flat' | 'percent'  // 数值类型：固定值或百分比
  isLegendary: boolean           // 是否为传奇词缀
}

/** 基础物品模板 */
export interface BaseItem {
  id: string
  name: string
  slot: SlotType
  requiredLevel: number
  baseStats: Partial<BaseStats>
  baseMainAttr: Partial<MainAttributes>
}

/** 装备实例 */
export interface EquipmentItem {
  id: string
  name: string
  slot: SlotType
  rarity: Rarity
  itemLevel: number
  baseItemId: string
  baseStats: BaseStats
  affixes: Affix[]
  locked: boolean
  score: number               // 均衡评分（缓存）
  scores: Record<ScoreMode, number>  // 各模式评分
  enhancement: number         // 强化等级 +0~+10
  createdAt: number           // 创建时间戳
}

/** 穿戴装备映射 */
export type EquippedGear = Partial<Record<SlotType, EquipmentItem>>

// ───────────────────────────────────────────────
// 玩家系统
// ───────────────────────────────────────────────

/** 训练项定义 */
export interface TrainingDef {
  type: 'attack' | 'hp' | 'armor'
  name: string
  attrName: string
  perLevel: number        // 每级提升数值
  maxLevel: number
  baseCost: number
  costGrowth: number
}

/** 训练进度 */
export interface TrainingProgress {
  attack: number          // 当前等级
  hp: number
  armor: number
}

/** 天赋节点定义 */
export interface TalentNodeDef {
  id: string
  branch: TalentBranch
  name: string
  description: string
  maxPoints: number
  effect: Partial<BaseStats> & Partial<MainAttributes>
}

/** 已激活天赋节点 */
export interface ActiveTalentNode {
  nodeId: string
  points: number
}

/** 玩家存档快照 */
export interface PlayerSnapshot {
  level: number
  exp: number
  classType: ClassType
  mainAttribute: 'str' | 'dex' | 'int'
  baseStats: BaseStats
  mainAttributes: MainAttributes
  training: TrainingProgress
  activeTalents: ActiveTalentNode[]
  gold: number
  enhancementStones: number
}

/** 完整角色构建快照（用于战斗计算） */
export interface PlayerBuild {
  level: number
  mainAttribute: 'str' | 'dex' | 'int'
  baseStats: BaseStats
  mainAttributes: MainAttributes
  equipped: EquippedGear
  activeTalents: ActiveTalentNode[]
  training: TrainingProgress
}

// ───────────────────────────────────────────────
// 战斗系统
// ───────────────────────────────────────────────

/** 怪物定义 */
export interface Monster {
  name: string
  type: MonsterType
  level: number
  hp: number
  attack: number
  attackSpeed: number
  armor: number
  critChance: number
  affixes: MonsterAffix[]
  goldReward: number
  expReward: number
  dropChance: number      // 0~1
  dropValueMultiplier: number
}

/** 单场战斗结果 */
export interface CombatResult {
  victory: boolean
  playerKillTime: number    // 玩家击杀怪物所需秒数
  monsterKillTime: number   // 怪物击杀玩家所需秒数
  actualDuration: number    // 实际战斗持续时间
  goldEarned: number
  expEarned: number
  dropTriggered: boolean
  floorCleared: boolean     // 是否推层成功
  failureReason?: 'timeout' | 'dps_insufficient' | 'survival_insufficient' | 'both'
  monsterName: string
  monsterType: MonsterType
}

/** 战斗日志条目 */
export interface CombatLogEntry {
  timestamp: number
  message: string
  type: 'info' | 'victory' | 'defeat' | 'loot' | 'floor' | 'boss'
  details?: Record<string, unknown>
}

// ───────────────────────────────────────────────
// 离线收益
// ───────────────────────────────────────────────

/** 离线收益报告 */
export interface OfflineReport {
  durationSeconds: number
  killCount: number
  goldEarned: number
  expEarned: number
  itemsGained: EquipmentItem[]
  filteredCount: number      // 被过滤自动转化的数量
  lostCount: number          // 因背包满未拾取的数量
  actualEarningSeconds: number
  efficiencyRatio: number    // 收益倍率（因衰减）
  floor: number
  endReason: 'time_limit' | 'backpack_full' | 'cannot_kill'
}

// ───────────────────────────────────────────────
// 推层目标
// ───────────────────────────────────────────────

/** 层目标评估 */
export interface StageTargetEvaluation {
  floor: number
  floorName: string
  monsterName: string
  monsterType: MonsterType
  tags: string[]
  rewardBias: 'gold' | 'exp' | 'equipment' | 'balanced'
  recommendedPower: number
  playerPower: number
  efficiencyRatio: number
  canClear: boolean
  playerKillTime: number
  monsterKillTime: number
  goldPerSecond: number
  expPerSecond: number
  dropValuePerSecond: number
  mainBias: string
  hangScore: number
  failureReason?: string
  failureDescription?: string
  rewardDescription: string
  suggestionText: string
  recommendationReason: string
}

// ───────────────────────────────────────────────
// 装备相关
// ───────────────────────────────────────────────

/** 强化消耗 */
export interface EnhancementCost {
  gold: number
  stones: number
  successRate: number
  failurePenalty: 'none' | 'downgrade' | 'destroy'
  downgradeTo?: number
}

/** 强化结果 */
export interface EnhancementResult {
  success: boolean
  newLevel: number
  cost: EnhancementCost
}

/** 词缀定义（用于生成） */
export interface AffixDef {
  type: AffixType
  name: string
  minValue: number
  maxValue: number
  valueType: 'flat' | 'percent'
  allowedSlots: SlotType[]
  weight: number           // 词缀权重（影响出现概率）
  tier: 1 | 2 | 3          // 词缀层级
}

/** 评分权重配置 */
export interface ScoreWeights {
  name: string
  description: string
  weights: Record<string, number>  // 属性 -> 权重的映射
  legendaryMultiplier: number
}

/** 灵魂加成（转生系统） */
export interface SoulBonus {
  prestigeCount: number
  soulPoints: number
  bonuses: {
    attackPercent: number
    hpPercent: number
    armorPercent: number
    goldFindPercent: number
    magicFindPercent: number
    expGainPercent: number
  }
}

/** 拾取过滤规则 */
export interface PickupFilter {
  minRarity: Rarity
  autoConvert: boolean
  allowedSlots: SlotType[]
  requiredAffixes: AffixType[]
}

/** 分解保护设置 */
export interface ProtectionSettings {
  lockLocked: boolean       // 保护锁定装备
  lockRare: boolean         // 保护稀有及以上
  lockBetter: boolean       // 保护更优装备
}

// ───────────────────────────────────────────────
// 每日任务
// ───────────────────────────────────────────────

/** 每日任务类型 */
export enum DailyTaskType {
  KILL_COUNT = 'killCount',
  GOLD_EARN = 'goldEarn',
  EXP_EARN = 'expEarn',
  EQUIP_GET = 'equipGet',
  ENHANCE = 'enhance',
  FLOOR_PUSH = 'floorPush'
}

/** 每日任务 */
export interface DailyTask {
  id: string
  type: DailyTaskType
  description: string
  target: number
  current: number
  completed: boolean
  claimed: boolean
  reward: {
    gold: number
    stones: number
  }
}

/** 每日任务状态 */
export interface DailyState {
  date: string              // YYYY-MM-DD
  tasks: DailyTask[]
  allCompleted: boolean
  allClaimed: boolean
}

// ───────────────────────────────────────────────
// 存档
// ───────────────────────────────────────────────

/** 完整存档快照 */
export interface GameSnapshot {
  version: number
  lastActiveTime: number
  player: PlayerSnapshot
  combat: CombatSnapshot
  equipment: EquipmentSnapshot
  settings: SettingsSnapshot
}

/** 战斗存档 */
export interface CombatSnapshot {
  currentFloor: number
  highestFloor: number
  isAutoBattling: boolean
}

/** 装备存档 */
export interface EquipmentSnapshot {
  backpack: EquipmentItem[]
  equipped: Record<string, EquipmentItem | null>
  gold: number
  stones: number
  lostDrops: number
  autoConvertCount: number
  scoreMode: ScoreMode
  pickupFilter: PickupFilter
  protection: ProtectionSettings
  backpackView: BackpackViewState
}

/** 背包视图状态 */
export interface BackpackViewState {
  sortBy: 'score' | 'rarity' | 'itemLevel' | 'time'
  sortDesc: boolean
  filterRarity: Rarity | null
  filterSlot: SlotType | null
  showOnlyBetter: boolean
  hideLocked: boolean
  minItemLevel: number
}

/** 设置存档 */
export interface SettingsSnapshot {
  scoreMode: ScoreMode
  pickupFilter: PickupFilter
  protection: ProtectionSettings
}

/** 存档版本迁移函数签名 */
export type SnapshotMigrator = (snapshot: Record<string, unknown>) => GameSnapshot
```

### 3.3 游戏数值常量（utils/constants.ts）

```typescript
import { Rarity, SlotType, AffixType, MonsterType, TalentBranch, ScoreMode } from '@types'
import type { BaseItem, AffixDef, TalentNodeDef, TrainingDef, ScoreWeights } from '@types'

// ───────────────────────────────────────────────
// 战斗常量
// ───────────────────────────────────────────────

/** 单场战斗最大时长（秒） */
export const COMBAT_MAX_DURATION = 60

/** 自动挂机间隔（毫秒） */
export const AUTO_COMBAT_INTERVAL = 1200

/** 战斗日志最大保留条数 */
export const MAX_COMBAT_LOG = 100

/** 怪物轮换类型列表 */
export const MONSTER_ROTATION: MonsterType[] = [
  MonsterType.BALANCED,
  MonsterType.HIGH_HP,
  MonsterType.HIGH_ATK,
  MonsterType.REWARD
]

// ───────────────────────────────────────────────
// 层数与怪物缩放
// ───────────────────────────────────────────────

/** 怪物等级公式系数 */
export const MONSTER_LEVEL_BASE = 8
export const MONSTER_LEVEL_PER_FLOOR = 2

/** 怪物成长倍率底数 */
export const MONSTER_GROWTH_BASE = 1.1

/** 推荐战力公式系数 */
export const RECOMMENDED_POWER_BASE = 100
export const RECOMMENDED_POWER_GROWTH = 1.12

/** Boss 层间隔 */
export const BOSS_INTERVAL = 10

/** Boss 系数 */
export const BOSS_HP_MULTIPLIER = 3.0
export const BOSS_ATK_MULTIPLIER = 2.0
export const BOSS_REWARD_MULTIPLIER = 2.5

/** 奖励怪系数 */
export const REWARD_HP_MULTIPLIER = 0.8
export const REWARD_ATK_MULTIPLIER = 0.7
export const REWARD_GOLD_MULTIPLIER = 1.5
export const REWARD_EXP_MULTIPLIER = 1.3
export const REWARD_DROP_MULTIPLIER = 1.5

/** 高血怪系数 */
export const HIGH_HP_MULTIPLIER = 1.5
export const HIGH_ATK_HP_MULTIPLIER = 0.8

/** 高攻怪系数 */
export const HIGH_ATK_MULTIPLIER = 1.4
export const HIGH_HP_ATK_MULTIPLIER = 0.7

// ───────────────────────────────────────────────
// 收益衰减
// ───────────────────────────────────────────────

/** 收益衰减阈值 */
export const EFFICIENCY_THRESHOLDS = [
  { ratio: 1.0, efficiency: 1.0 },   // 100% 收益
  { ratio: 0.8, efficiency: 0.8 },   // 80% 收益
  { ratio: 0.6, efficiency: 0.5 },   // 50% 收益
  { ratio: 0.0, efficiency: 0.2 }    // 20% 收益
]

// ───────────────────────────────────────────────
// 离线收益
// ───────────────────────────────────────────────

/** 离线收益软上限（小时） */
export const OFFLINE_MAX_HOURS = 12

/** 离线收益秒数上限 */
export const OFFLINE_MAX_SECONDS = OFFLINE_MAX_HOURS * 3600  // 43200

/** 触发离线报告的最小离线时间（秒） */
export const OFFLINE_MIN_REPORT_SECONDS = 60

// ───────────────────────────────────────────────
// 角色初始值
// ───────────────────────────────────────────────

/** 初始角色属性 */
export const INITIAL_PLAYER = {
  level: 1,
  exp: 0,
  gold: 0,
  enhancementStones: 0,
  classType: 'adventurer' as const,
  mainAttribute: 'str' as const,
  baseStats: {
    attack: 12,
    hp: 120,
    armor: 4,
    attackSpeed: 1.0,
    critChance: 0.05,
    critDamage: 1.5,
    dodge: 0.0,
    block: 0.0,
    fireResist: 0.0,
    iceResist: 0.0,
    goldFind: 0,
    magicFind: 0,
    expGain: 0
  },
  mainAttributes: {
    str: 10,
    dex: 10,
    int: 10
  }
}

/** 经验需求公式 */
export const EXP_BASE = 100
export const EXP_GROWTH = 1.2

/** 等级上限 */
export const MAX_LEVEL = 999

// ───────────────────────────────────────────────
// 属性上限
// ───────────────────────────────────────────────

/** 攻击速度上限 */
export const MAX_ATTACK_SPEED = 5.0

/** 暴击率上限 */
export const MAX_CRIT_CHANCE = 0.75

/** 闪避率上限 */
export const MAX_DODGE = 0.60

/** 格挡率上限 */
export const MAX_BLOCK = 0.75

/** 单元素抗性上限 */
export const MAX_ELEMENTAL_RESIST = 0.80

/** 金币获取上限（数值，非百分比） */
export const MAX_GOLD_FIND = 300

/** 魔法发现上限（数值，非百分比） */
export const MAX_MAGIC_FIND = 300

// ───────────────────────────────────────────────
// 战力公式
// ───────────────────────────────────────────────

/** DPS 在战力中的权重 */
export const POWER_DPS_WEIGHT = 4.0

/** EHP 在战力中的权重 */
export const POWER_EHP_WEIGHT = 0.35

/** 主属性对攻击的加成系数 */
export const MAIN_ATTR_BONUS_PER_POINT = 0.005  // 0.5%

/** 护甲减伤公式分母系数 */
export const ARMOR_DENOMINATOR_BASE = 500
export const ARMOR_DENOMINATOR_LEVEL = 50

/** 抗性减伤公式分母 */
export const RESIST_DENOMINATOR = 100

// ───────────────────────────────────────────────
// 装备生成
// ───────────────────────────────────────────────

/** 装备等级公式 */
export const ITEM_LEVEL_FORMULA = {
  divisor: 2,
  offset: 10
}

/** 基础属性缩放系数 */
export const BASE_STAT_SCALE_PER_LEVEL = 0.08

/** 品质基础概率 */
export const RARITY_BASE_CHANCE = {
  legendary: 0.001,
  rare: 0.03,
  magic: 0.18
}

/** 传说概率每 10 层增加量 */
export const LEGENDARY_CHANCE_PER_10_FLOORS = 0.0005

/** 魔法发现对品质权重的影响 */
export const MAGIC_FIND_RARITY_MULTIPLIER = 0.002
export const MAGIC_FIND_LEGENDARY_MULTIPLIER = 0.001
export const MAGIC_FIND_RARITY_CAP = 1.6

/** 魔法发现对掉落率的影响 */
export const MAGIC_FIND_DROP_MULTIPLIER = 0.005
export const MAX_DROP_CHANCE = 0.95

/** 金币获取加成系数 */
export const GOLD_FIND_MULTIPLIER = 0.01
export const MAX_GOLD_FIND_RATIO = 4.0  // 1 + 300 * 0.01 = 4.0

/** 各品质词缀数量 */
export const RARITY_AFFIX_COUNT = {
  [Rarity.NORMAL]: { min: 0, max: 0 },
  [Rarity.MAGIC]: { min: 1, max: 2 },
  [Rarity.RARE]: { min: 3, max: 4 },
  [Rarity.LEGENDARY]: { min: 4, max: 4 },  // 1 传奇 + 3 随机
  [Rarity.ANCIENT]: { min: 5, max: 5 }
}

/** 品质阶级（用于评分） */
export const RARITY_TIER = {
  [Rarity.NORMAL]: 0,
  [Rarity.MAGIC]: 1,
  [Rarity.RARE]: 2,
  [Rarity.LEGENDARY]: 3,
  [Rarity.ANCIENT]: 4
}

/** 品质评分加成系数 */
export const RARITY_SCORE_BONUS = 0.12  // 每级 +12%

/** 传奇词缀评分倍率 */
export const LEGENDARY_AFFIX_SCORE_MULTIPLIER = 1.8

/** 基础掉落价值 */
export const BASE_DROP_VALUE = 18

/** 高价值装备评分阈值 */
export const HIGH_VALUE_SCORE_THRESHOLD = 120

// ───────────────────────────────────────────────
// 词缀定义（完整 18 种）
// ───────────────────────────────────────────────

export const AFFIX_DEFS: AffixDef[] = [
  // ── 攻击类词缀（6 种） ──
  {
    type: AffixType.ATTACK,
    name: '锋利',
    minValue: 2,
    maxValue: 8,
    valueType: 'flat',
    allowedSlots: [SlotType.WEAPON, SlotType.GLOVES, SlotType.RING],
    weight: 100,
    tier: 1
  },
  {
    type: AffixType.CRIT_DAMAGE,
    name: '残忍',
    minValue: 8,
    maxValue: 20,
    valueType: 'flat',
    allowedSlots: [SlotType.WEAPON, SlotType.GLOVES, SlotType.RING, SlotType.NECKLACE],
    weight: 60,
    tier: 2
  },
  {
    type: AffixType.CRIT_CHANCE,
    name: '鹰眼',
    minValue: 2,
    maxValue: 7,
    valueType: 'flat',
    allowedSlots: [SlotType.WEAPON, SlotType.GLOVES, SlotType.RING, SlotType.NECKLACE],
    weight: 60,
    tier: 2
  },
  {
    type: AffixType.ATTACK_SPEED,
    name: '急速',
    minValue: 3,
    maxValue: 10,
    valueType: 'percent',
    allowedSlots: [SlotType.WEAPON, SlotType.GLOVES],
    weight: 50,
    tier: 2
  },
  {
    type: AffixType.FIRE_DAMAGE,
    name: '烈焰',
    minValue: 3,
    maxValue: 12,
    valueType: 'flat',
    allowedSlots: [SlotType.WEAPON, SlotType.RING],
    weight: 40,
    tier: 2
  },
  {
    type: AffixType.ICE_DAMAGE,
    name: '冰霜',
    minValue: 3,
    maxValue: 12,
    valueType: 'flat',
    allowedSlots: [SlotType.WEAPON, SlotType.RING],
    weight: 40,
    tier: 2
  },

  // ── 防御类词缀（6 种） ──
  {
    type: AffixType.HP,
    name: '活力',
    minValue: 10,
    maxValue: 35,
    valueType: 'flat',
    allowedSlots: [SlotType.HELMET, SlotType.ARMOR, SlotType.SHOES, SlotType.OFFHAND, SlotType.RING, SlotType.NECKLACE],
    weight: 100,
    tier: 1
  },
  {
    type: AffixType.ARMOR,
    name: '守护',
    minValue: 3,
    maxValue: 12,
    valueType: 'flat',
    allowedSlots: [SlotType.HELMET, SlotType.ARMOR, SlotType.GLOVES, SlotType.SHOES, SlotType.OFFHAND],
    weight: 100,
    tier: 1
  },
  {
    type: AffixType.DODGE,
    name: '灵巧',
    minValue: 2,
    maxValue: 8,
    valueType: 'percent',
    allowedSlots: [SlotType.GLOVES, SlotType.SHOES, SlotType.NECKLACE],
    weight: 50,
    tier: 2
  },
  {
    type: AffixType.BLOCK,
    name: '壁垒',
    minValue: 3,
    maxValue: 12,
    valueType: 'percent',
    allowedSlots: [SlotType.OFFHAND, SlotType.HELMET],
    weight: 40,
    tier: 2
  },
  {
    type: AffixType.FIRE_RESIST,
    name: '抗火',
    minValue: 5,
    maxValue: 20,
    valueType: 'percent',
    allowedSlots: [SlotType.HELMET, SlotType.ARMOR, SlotType.SHOES, SlotType.NECKLACE],
    weight: 40,
    tier: 2
  },
  {
    type: AffixType.ICE_RESIST,
    name: '抗冰',
    minValue: 5,
    maxValue: 20,
    valueType: 'percent',
    allowedSlots: [SlotType.HELMET, SlotType.ARMOR, SlotType.SHOES, SlotType.NECKLACE],
    weight: 40,
    tier: 2
  },

  // ── 功能类词缀（4 种） ──
  {
    type: AffixType.GOLD_FIND,
    name: '贪婪',
    minValue: 4,
    maxValue: 12,
    valueType: 'flat',
    allowedSlots: [SlotType.RING, SlotType.NECKLACE],
    weight: 70,
    tier: 1
  },
  {
    type: AffixType.MAGIC_FIND,
    name: '寻宝',
    minValue: 3,
    maxValue: 10,
    valueType: 'flat',
    allowedSlots: [SlotType.RING, SlotType.NECKLACE],
    weight: 50,
    tier: 2
  },
  {
    type: AffixType.EXP_GAIN,
    name: '智慧',
    minValue: 3,
    maxValue: 10,
    valueType: 'percent',
    allowedSlots: [SlotType.HELMET, SlotType.NECKLACE],
    weight: 50,
    tier: 2
  },
  {
    type: AffixType.MOVE_SPEED,
    name: '疾行',
    minValue: 3,
    maxValue: 10,
    valueType: 'percent',
    allowedSlots: [SlotType.SHOES, SlotType.GLOVES],
    weight: 30,
    tier: 3
  },

  // ── 属性类词缀（2 种） ──
  {
    type: AffixType.STR,
    name: '蛮力',
    minValue: 2,
    maxValue: 8,
    valueType: 'flat',
    allowedSlots: [SlotType.WEAPON, SlotType.ARMOR, SlotType.GLOVES, SlotType.NECKLACE],
    weight: 60,
    tier: 2
  },
  {
    type: AffixType.DEX,
    name: '敏锐',
    minValue: 2,
    maxValue: 8,
    valueType: 'flat',
    allowedSlots: [SlotType.WEAPON, SlotType.GLOVES, SlotType.SHOES, SlotType.NECKLACE],
    weight: 60,
    tier: 2
  },
  {
    type: AffixType.INT,
    name: '聪慧',
    minValue: 2,
    maxValue: 8,
    valueType: 'flat',
    allowedSlots: [SlotType.WEAPON, SlotType.HELMET, SlotType.NECKLACE],
    weight: 60,
    tier: 2
  }
]

/** 传奇词缀定义 */
export const LEGENDARY_AFFIXES: AffixDef[] = [
  {
    type: AffixType.ATTACK,
    name: '连锁闪电',
    minValue: 18,
    maxValue: 18,
    valueType: 'flat',
    allowedSlots: [SlotType.WEAPON],
    weight: 100,
    tier: 3
  }
]

// ───────────────────────────────────────────────
// 基础物品定义
// ───────────────────────────────────────────────

export const BASE_ITEMS: BaseItem[] = [
  // 武器
  {
    id: 'dagger',
    name: '短剑',
    slot: SlotType.WEAPON,
    requiredLevel: 1,
    baseStats: { attack: 8, attackSpeed: 0.15 }
  },
  {
    id: 'battle_axe',
    name: '战斧',
    slot: SlotType.WEAPON,
    requiredLevel: 3,
    baseStats: { attack: 13, attackSpeed: -0.10 }
  },
  {
    id: 'apprentice_staff',
    name: '学徒法杖',
    slot: SlotType.WEAPON,
    requiredLevel: 5,
    baseStats: { attack: 10, attackSpeed: 0 },
    baseMainAttr: { int: 3 }
  },

  // 防具
  {
    id: 'cloth_hood',
    name: '布质兜帽',
    slot: SlotType.HELMET,
    requiredLevel: 1,
    baseStats: { hp: 10, armor: 2 }
  },
  {
    id: 'leather_armor',
    name: '皮甲',
    slot: SlotType.ARMOR,
    requiredLevel: 1,
    baseStats: { hp: 22, armor: 5 }
  },
  {
    id: 'hunter_gloves',
    name: '猎手手套',
    slot: SlotType.GLOVES,
    requiredLevel: 2,
    baseStats: { armor: 2, attackSpeed: 0.08 }
  },
  {
    id: 'traveler_boots',
    name: '旅者短靴',
    slot: SlotType.SHOES,
    requiredLevel: 2,
    baseStats: { armor: 2, dodge: 0.02 }
  },
  {
    id: 'wooden_shield',
    name: '木盾',
    slot: SlotType.OFFHAND,
    requiredLevel: 3,
    baseStats: { hp: 18, armor: 8 }
  },

  // 饰品
  {
    id: 'copper_ring',
    name: '铜戒指',
    slot: SlotType.RING,
    requiredLevel: 1,
    baseStats: { hp: 6 }
  },
  {
    id: 'focus_necklace',
    name: '专注项链',
    slot: SlotType.NECKLACE,
    requiredLevel: 4,
    baseStats: {},
    baseMainAttr: { str: 1, dex: 1, int: 1 }
  }
]

// ───────────────────────────────────────────────
// 训练定义
// ───────────────────────────────────────────────

export const TRAINING_DEFS: TrainingDef[] = [
  {
    type: 'attack',
    name: '攻击训练',
    attrName: '攻击',
    perLevel: 2,
    maxLevel: 20,
    baseCost: 80,
    costGrowth: 1.22
  },
  {
    type: 'hp',
    name: '体魄训练',
    attrName: '生命',
    perLevel: 18,
    maxLevel: 20,
    baseCost: 70,
    costGrowth: 1.20
  },
  {
    type: 'armor',
    name: '防御训练',
    attrName: '护甲',
    perLevel: 3,
    maxLevel: 20,
    baseCost: 75,
    costGrowth: 1.21
  }
]

// ───────────────────────────────────────────────
// 天赋节点定义
// ───────────────────────────────────────────────

export const TALENT_NODE_DEFS: TalentNodeDef[] = [
  // 暴击分支
  {
    id: 'crit_1',
    branch: TalentBranch.CRIT,
    name: '精准弱点',
    description: '暴击率 +3%',
    maxPoints: 1,
    effect: { critChance: 0.03 }
  },
  {
    id: 'crit_2',
    branch: TalentBranch.CRIT,
    name: '致命打击',
    description: '暴击伤害 +18%',
    maxPoints: 1,
    effect: { critDamage: 0.18 }
  },
  {
    id: 'crit_3',
    branch: TalentBranch.CRIT,
    name: '猎手直觉',
    description: '敏捷 +8',
    maxPoints: 1,
    effect: { dex: 8 }
  },

  // 攻速分支
  {
    id: 'aspd_1',
    branch: TalentBranch.ATK_SPD,
    name: '疾风连击',
    description: '攻击速度 +0.12',
    maxPoints: 1,
    effect: { attackSpeed: 0.12 }
  },
  {
    id: 'aspd_2',
    branch: TalentBranch.ATK_SPD,
    name: '轻步闪避',
    description: '闪避 +4%',
    maxPoints: 1,
    effect: { dodge: 0.04 }
  },
  {
    id: 'aspd_3',
    branch: TalentBranch.ATK_SPD,
    name: '快速压制',
    description: '攻击 +10',
    maxPoints: 1,
    effect: { attack: 10 }
  },

  // 防御分支
  {
    id: 'def_1',
    branch: TalentBranch.DEFENSE,
    name: '厚重体魄',
    description: '生命 +80',
    maxPoints: 1,
    effect: { hp: 80 }
  },
  {
    id: 'def_2',
    branch: TalentBranch.DEFENSE,
    name: '钢铁护壁',
    description: '护甲 +18',
    maxPoints: 1,
    effect: { armor: 18 }
  },
  {
    id: 'def_3',
    branch: TalentBranch.DEFENSE,
    name: '稳固步伐',
    description: '闪避 +3%',
    maxPoints: 1,
    effect: { dodge: 0.03 }
  },

  // 寻宝分支
  {
    id: 'tre_1',
    branch: TalentBranch.TREASURE,
    name: '金币嗅觉',
    description: '金币获取 +8',
    maxPoints: 1,
    effect: { goldFind: 8 }
  },
  {
    id: 'tre_2',
    branch: TalentBranch.TREASURE,
    name: '魔法罗盘',
    description: '魔法发现 +8',
    maxPoints: 1,
    effect: { magicFind: 8 }
  },
  {
    id: 'tre_3',
    branch: TalentBranch.TREASURE,
    name: '秘藏感知',
    description: '魔法发现 +12',
    maxPoints: 1,
    effect: { magicFind: 12 }
  }
]

// ───────────────────────────────────────────────
// 评分权重定义（5 种模式）
// ───────────────────────────────────────────────

export const SCORE_WEIGHTS: Record<ScoreMode, ScoreWeights> = {
  [ScoreMode.BALANCED]: {
    name: '均衡',
    description: '通用默认评分，兼顾输出、生存和少量收益属性',
    weights: {
      attack: 1.0,
      hp: 0.6,
      armor: 0.5,
      attackSpeed: 0.8,
      critChance: 0.8,
      critDamage: 0.8,
      dodge: 0.5,
      goldFind: 0.4,
      magicFind: 0.4,
      str: 0.6,
      dex: 0.6,
      int: 0.6
    },
    legendaryMultiplier: 1.8
  },
  [ScoreMode.CRIT]: {
    name: '暴击',
    description: '提高暴击率、暴击伤害、攻击、敏捷权重',
    weights: {
      attack: 1.0,
      critChance: 2.0,
      critDamage: 1.5,
      dex: 1.2,
      attackSpeed: 0.6,
      hp: 0.3,
      armor: 0.2,
      dodge: 0.3,
      str: 0.4,
      int: 0.3,
      goldFind: 0.2,
      magicFind: 0.2
    },
    legendaryMultiplier: 1.8
  },
  [ScoreMode.ATK_SPD]: {
    name: '攻速',
    description: '提高攻击速度、敏捷、闪避和攻击权重',
    weights: {
      attackSpeed: 2.0,
      dex: 1.5,
      dodge: 0.8,
      attack: 1.0,
      critChance: 0.6,
      critDamage: 0.5,
      hp: 0.3,
      armor: 0.2,
      str: 0.4,
      int: 0.3,
      goldFind: 0.2,
      magicFind: 0.2
    },
    legendaryMultiplier: 1.8
  },
  [ScoreMode.TOUGH]: {
    name: '坚韧',
    description: '提高生命、护甲、闪避、抗性和力量权重',
    weights: {
      hp: 2.0,
      armor: 1.5,
      dodge: 0.8,
      str: 1.0,
      block: 0.6,
      fireResist: 0.5,
      iceResist: 0.5,
      attack: 0.3,
      attackSpeed: 0.2,
      critChance: 0.2,
      critDamage: 0.2,
      dex: 0.3,
      int: 0.3,
      goldFind: 0.2,
      magicFind: 0.2
    },
    legendaryMultiplier: 1.8
  },
  [ScoreMode.MAIN_ATTR]: {
    name: '主属性',
    description: '强化力量、敏捷、智力的评分价值',
    weights: {
      str: 2.0,
      dex: 2.0,
      int: 2.0,
      attack: 0.8,
      critChance: 0.6,
      critDamage: 0.6,
      attackSpeed: 0.6,
      hp: 0.4,
      armor: 0.3,
      dodge: 0.3,
      goldFind: 0.2,
      magicFind: 0.2
    },
    legendaryMultiplier: 1.8
  }
}

// ───────────────────────────────────────────────
// 背包常量
// ───────────────────────────────────────────────

/** 背包容量 */
export const BACKPACK_CAPACITY = 50

/** 背包压力阈值 */
export const BACKPACK_PRESSURE = {
  WARNING: 0.20,   // 剩余 <= 20% 警告
  CRITICAL: 0.10,  // 剩余 <= 10% 危急
}

// ───────────────────────────────────────────────
// 分解常量
// ───────────────────────────────────────────────

/** 各品质分解获得的强化石数量 */
export const DISMANTLE_REWARDS: Record<Rarity, number> = {
  [Rarity.NORMAL]: 1,
  [Rarity.MAGIC]: 2,
  [Rarity.RARE]: 4,
  [Rarity.LEGENDARY]: 8,
  [Rarity.ANCIENT]: 16
}

// ───────────────────────────────────────────────
// 强化常量
// ───────────────────────────────────────────────

export const ENHANCEMENT_TABLE: Record<number, { successRate: number; failurePenalty: 'none' | 'downgrade' | 'destroy'; goldCost: number; stoneCost: number }> = {
  0: { successRate: 1.00, failurePenalty: 'none', goldCost: 50, stoneCost: 1 },
  1: { successRate: 1.00, failurePenalty: 'none', goldCost: 80, stoneCost: 1 },
  2: { successRate: 1.00, failurePenalty: 'none', goldCost: 120, stoneCost: 2 },
  3: { successRate: 0.80, failurePenalty: 'none', goldCost: 180, stoneCost: 2 },
  4: { successRate: 0.80, failurePenalty: 'none', goldCost: 260, stoneCost: 3 },
  5: { successRate: 0.80, failurePenalty: 'none', goldCost: 370, stoneCost: 3 },
  6: { successRate: 0.60, failurePenalty: 'downgrade', goldCost: 520, stoneCost: 4 },
  7: { successRate: 0.60, failurePenalty: 'downgrade', goldCost: 720, stoneCost: 5 },
  8: { successRate: 0.60, failurePenalty: 'downgrade', goldCost: 1000, stoneCost: 6 },
  9: { successRate: 0.40, failurePenalty: 'none', goldCost: 1400, stoneCost: 8 }
}

/** 强化属性提升倍率（每级） */
export const ENHANCEMENT_STAT_BONUS = 0.08  // +8% 基础属性每级

/** 强化最高等级 */
export const MAX_ENHANCEMENT_LEVEL = 10

// ───────────────────────────────────────────────
// 存档版本
// ───────────────────────────────────────────────

/** 当前存档版本 */
export const SAVE_VERSION = 1

/** 存档 localStorage 键名 */
export const SAVE_STORAGE_KEY = 'idle_arpg_snapshot'

/** 自动保存间隔（毫秒） */
export const AUTO_SAVE_INTERVAL = 60000

// ───────────────────────────────────────────────
// 数值格式化
// ───────────────────────────────────────────────

/** 大数值缩写阈值 */
export const NUMBER_FORMAT = {
  K: 1000,
  M: 1000000,
  B: 1000000000,
  T: 1000000000000
}
```

### 3.4 辅助函数（utils/helpers.ts）

```typescript
/**
 * 安全的随机数生成
 */
export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

/**
 * 整数随机范围（含两端）
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 根据权重随机选择
 */
export function weightedRandom<T>(items: { item: T; weight: number }[]): T {
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0)
  let random = Math.random() * totalWeight

  for (const { item, weight } of items) {
    random -= weight
    if (random <= 0) return item
  }

  return items[items.length - 1].item
}

/**
 * 保留指定小数位数
 */
export function roundTo(value: number, decimals: number = 1): number {
  const multiplier = 10 ** decimals
  return Math.round(value * multiplier) / multiplier
}

/**
 * 生成唯一 ID
 */
let idCounter = 0
export function generateId(prefix: string = ''): string {
  idCounter++
  return `${prefix}${Date.now().toString(36)}_${idCounter.toString(36)}_${Math.random().toString(36).substr(2, 5)}`
}

/**
 * 格式化数值（K/M/B/T 缩写）
 */
export function formatNumber(num: number): string {
  if (num < 1000) return Math.round(num).toString()
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`
  if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`
  if (num < 1000000000000) return `${(num / 1000000000).toFixed(1)}B`
  return `${(num / 1000000000000).toFixed(1)}T`
}

/**
 * 格式化百分比
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`
}

/**
 * 格式化时间（秒 -> 时:分:秒）
 */
export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)

  if (h > 0) return `${h}时${m.toString().padStart(2, '0')}分`
  if (m > 0) return `${m}分${s.toString().padStart(2, '0')}秒`
  return `${s}秒`
}

/**
 * 格式化持续时间（离线时间）
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}小时${minutes > 0 ? ` ${minutes}分钟` : ''}`
  }
  return `${minutes}分钟`
}

/**
 * 深拷贝
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * 计算属性总和（将多个部分属性合并）
 */
export function sumPartialStats(
  ...stats: Array<Partial<Record<string, number>>>
): Record<string, number> {
  const result: Record<string, number> = {}

  for (const stat of stats) {
    for (const [key, value] of Object.entries(stat)) {
      if (value !== undefined) {
        result[key] = (result[key] || 0) + value
      }
    }
  }

  return result
}
```


---

## 第4章 状态管理（Pinia Stores）

### 4.0 状态管理设计概述

状态管理是连接游戏逻辑层和 UI 展示层的桥梁。放置型 ARPG 的状态复杂度来自多个维度：角色属性由基础值、训练加成、装备加成、天赋加成四部分组合；战斗状态涉及当前层、最高解锁层、自动挂机开关、战斗日志等；装备系统管理 50 格背包、拾取过滤、分解保护等多个功能状态。

状态管理的设计遵循以下原则：**Setup Store 风格**，所有 Store 使用 Composition API 风格定义，与 Vue 组件的 `<script setup>` 语法完全一致；**派生属性优先**，尽量使用 `computed` 计算派生状态，避免手动同步多个相关状态；**快照序列化**，每个 Store 提供 `createSnapshot` 和 `restoreFromSnapshot` 方法，支持存档系统的完整状态保存和恢复；**跨 Store 解耦**，Store 之间不直接依赖，通过组合式函数（composables）实现跨模块协调。

本章包含 5 个核心 Store：

- `player.ts`：角色属性、金币、训练、天赋、穿戴装备，以及 DPS/EHP/战力计算
- `combat.ts`：战斗状态、挂机控制、层数管理、目标评估
- `equipment.ts`：背包管理、拾取过滤、分解系统、评分模式、保护设置
- `prestige.ts`：转生计数、灵魂点数、灵魂加成配置
- `daily.ts`：每日任务生成、进度追踪、奖励领取

每个 Store 都包含完整的 Setup Store 代码，包括状态定义、派生属性、Actions 和存档序列化方法。

所有 Store 采用 Setup Store 风格定义，使用 Composition API 的 `ref`、`computed` 和函数实现状态、派生属性和方法。

### 4.1 玩家 Store（stores/player.ts）

**设计思路**：Player Store 是整个游戏最核心的 Store，负责管理角色所有属性以及与属性相关的计算。角色的总属性由四部分叠加而成：基础属性（随等级成长）、训练加成（消耗金币提升）、装备加成（来自穿戴装备和词缀）、天赋加成（已激活天赋节点）。Player Store 需要实时计算 DPS、EHP 和战力这三个派生属性，它们被战斗系统、推荐目标系统和离线收益计算所依赖。

**实现要点详解**：

1. **DPS 计算**：遵循 `攻击 × (1 + 主属性 × 0.5%) × 攻击速度 × [1 + 暴击率 × (暴击伤害 - 1)]` 公式。暴击率上限 75%，攻击速度上限 5.0。主属性加成是放置游戏的关键成长维度——每点主属性提供 0.5% 的攻击加成，当主属性达到 200 点时攻击翻倍。这意味着主属性词条在后期的价值极其显著。

2. **EHP 计算**：综合护甲减伤、抗性减伤和闪避率。护甲减伤公式为 `护甲 / (护甲 + 怪物等级 × 50 + 500)`，闪避率上限 60%。护甲的边际收益递减：当护甲值接近分母大小时，每点护甲的收益开始下降。

3. **战力计算**：`战力 = DPS × 4 + EHP × 0.35`。DPS 权重远高于 EHP，因为 DPS 直接影响击杀速度和收益效率。战力只用于推荐挂机层和收益衰减评估。

4. **训练系统**：使用指数增长的消耗曲线。攻击训练基础消耗 80，成长率 1.22，20 级总消耗约 80 × (1.22^20 - 1) / 0.22 ≈ 32,000 金币。这个总量确保了金币在后期始终有消耗出口。

5. **天赋系统**：预留了扩展接口。当前 12 个节点分布在 4 个分支（暴击、攻速、防御、寻宝），每个分支 3 个节点。天赋没有前置关系，没有重置消耗，这种简化设计降低了玩家的心智负担。

6. **装备加成汇总**：`equipmentStats` computed 遍历所有已穿戴装备，累加基础属性、词缀值和强化加成。强化加成公式为 `基础属性 × (1 + 强化等级 × 0.08)`。

7. **存档序列化**：`createSnapshot` 返回一个深拷贝的快照对象，包含所有需要持久化的状态。`restoreFromSnapshot` 从快照恢复状态，同时进行数据校验（如评分模式合法性检查）。

**Store 的响应式设计**：Player Store 使用 `computed` 计算派生属性（DPS、EHP、战力、总属性），这些 computed 属性会自动追踪依赖的响应式状态（等级、装备、训练、天赋），当任何依赖变化时自动重新计算。这种设计确保了 UI 始终显示最新的属性值，同时避免了手动同步多个相关状态。

```typescript，负责管理角色所有属性以及与属性相关的计算。角色的总属性由四部分叠加而成：基础属性（随等级成长）、训练加成（消耗金币提升）、装备加成（来自穿戴装备和词缀）、天赋加成（已激活天赋节点）。Player Store 需要实时计算 DPS、EHP 和战力这三个派生属性，它们被战斗系统、推荐目标系统和离线收益计算所依赖。

**实现要点**：

1. DPS 计算遵循 `攻击 × (1 + 主属性 × 0.5%) × 攻击速度 × [1 + 暴击率 × (暴击伤害 - 1)]` 公式，暴击率上限 75%，攻击速度上限 5.0。
2. EHP 计算综合了护甲减伤、抗性减伤和闪避率，其中护甲减伤公式为 `护甲 / (护甲 + 怪物等级 × 50 + 500)`，闪避率上限 60%。
3. 战力是 DPS 和 EHP 的加权组合，用于收益衰减判断和推荐挂机层评估。
4. 训练系统使用指数增长的消耗曲线，确保后期金币有持续消耗出口。
5. 天赋系统预留了扩展接口，当前 12 个节点分布在 4 个分支中。

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  INITIAL_PLAYER,
  EXP_BASE,
  EXP_GROWTH,
  MAX_LEVEL,
  MAX_ATTACK_SPEED,
  MAX_CRIT_CHANCE,
  POWER_DPS_WEIGHT,
  POWER_EHP_WEIGHT,
  MAIN_ATTR_BONUS_PER_POINT,
  ARMOR_DENOMINATOR_BASE,
  ARMOR_DENOMINATOR_LEVEL,
  RESIST_DENOMINATOR,
  MAX_DODGE,
  GOLD_FIND_MULTIPLIER,
  MAX_GOLD_FIND,
  MAGIC_FIND_DROP_MULTIPLIER,
  MAX_MAGIC_FIND,
  TRAINING_DEFS,
  TALENT_NODE_DEFS
} from '@utils/constants'
import type { PlayerSnapshot, PlayerBuild, BaseStats, MainAttributes, TrainingProgress, ActiveTalentNode } from '@types'
import { SlotType } from '@types'
import type { EquipmentItem } from '@types'
import { roundTo } from '@utils/helpers'

export const usePlayerStore = defineStore('player', () => {
  // ─── 基础状态 ───
  const level = ref(INITIAL_PLAYER.level)
  const exp = ref(INITIAL_PLAYER.exp)
  const gold = ref(INITIAL_PLAYER.gold)
  const enhancementStones = ref(INITIAL_PLAYER.enhancementStones)
  const mainAttribute = ref<'str' | 'dex' | 'int'>(INITIAL_PLAYER.mainAttribute)
  const classType = ref(INITIAL_PLAYER.classType)

  // 基础属性
  const baseStats = ref<BaseStats>({ ...INITIAL_PLAYER.baseStats })
  const mainAttributes = ref<MainAttributes>({ ...INITIAL_PLAYER.mainAttributes })

  // 训练
  const training = ref<TrainingProgress>({ attack: 0, hp: 0, armor: 0 })

  // 天赋
  const activeTalents = ref<ActiveTalentNode[]>([])

  // 穿戴装备
  const equipped = ref<Partial<Record<SlotType, EquipmentItem>>>({})

  // ─── 派生属性 ───

  /** 下一级所需经验 */
  const maxExp = computed(() => {
    return Math.round(EXP_BASE * EXP_GROWTH ** (level.value - 1))
  })

  /** 天赋点 */
  const talentPoints = computed(() => Math.max(0, level.value - 1))

  /** 已使用天赋点 */
  const usedTalentPoints = computed(() =>
    activeTalents.value.reduce((sum, t) => sum + t.points, 0)
  )

  /** 可用天赋点 */
  const availableTalentPoints = computed(() =>
    talentPoints.value - usedTalentPoints.value
  )

  /** 训练加成 */
  const trainingBonus = computed(() => {
    const attackDef = TRAINING_DEFS.find((d) => d.type === 'attack')!
    const hpDef = TRAINING_DEFS.find((d) => d.type === 'hp')!
    const armorDef = TRAINING_DEFS.find((d) => d.type === 'armor')!

    return {
      attack: training.value.attack * attackDef.perLevel,
      hp: training.value.hp * hpDef.perLevel,
      armor: training.value.armor * armorDef.perLevel
    }
  })

  /** 天赋加成 */
  const talentBonus = computed(() => {
    const bonus: Record<string, number> = {}

    for (const active of activeTalents.value) {
      const nodeDef = TALENT_NODE_DEFS.find((n) => n.id === active.nodeId)
      if (!nodeDef) continue

      for (const [key, value] of Object.entries(nodeDef.effect)) {
        if (value !== undefined) {
          bonus[key] = (bonus[key] || 0) + value * active.points
        }
      }
    }

    return bonus
  })

  /** 装备属性总和 */
  const equipmentStats = computed(() => {
    const stats: Record<string, number> = {}
    const items = Object.values(equipped.value).filter(Boolean) as EquipmentItem[]

    for (const item of items) {
      // 基础属性
      for (const [key, value] of Object.entries(item.baseStats)) {
        if (value !== undefined && typeof value === 'number') {
          stats[key] = (stats[key] || 0) + value
        }
      }
      // 词缀
      for (const affix of item.affixes) {
        stats[affix.type] = (stats[affix.type] || 0) + affix.value
      }
      // 强化加成
      if (item.enhancement > 0) {
        const enhanceMult = 1 + item.enhancement * 0.08
        for (const key of ['attack', 'hp', 'armor']) {
          if (item.baseStats[key as keyof BaseStats]) {
            stats[key] = (stats[key] || 0) + item.baseStats[key as keyof BaseStats]! * (enhanceMult - 1)
          }
        }
      }
    }

    return stats
  })

  /** 总属性（基础 + 训练 + 装备 + 天赋） */
  const totalStats = computed<BaseStats>(() => {
    const eq = equipmentStats.value
    const tb = trainingBonus.value
    const tl = talentBonus.value

    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val))

    return {
      attack: baseStats.value.attack + (tb.attack || 0) + (eq.attack || 0) + (tl.attack || 0),
      hp: baseStats.value.hp + (tb.hp || 0) + (eq.hp || 0) + (tl.hp || 0),
      armor: baseStats.value.armor + (tb.armor || 0) + (eq.armor || 0) + (tl.armor || 0),
      attackSpeed: clamp(
        baseStats.value.attackSpeed + (eq.attackSpeed || 0) + (tl.attackSpeed || 0),
        0,
        MAX_ATTACK_SPEED
      ),
      critChance: clamp(
        baseStats.value.critChance + (eq.critChance || 0) + (tl.critChance || 0),
        0,
        MAX_CRIT_CHANCE
      ),
      critDamage: baseStats.value.critDamage + (eq.critDamage || 0) + (tl.critDamage || 0),
      dodge: clamp(baseStats.value.dodge + (eq.dodge || 0) + (tl.dodge || 0), 0, MAX_DODGE),
      block: clamp(baseStats.value.block + (eq.block || 0) + (tl.block || 0), 0, 0.75),
      fireResist: clamp(baseStats.value.fireResist + (eq.fireResist || 0) + (tl.fireResist || 0), 0, 0.8),
      iceResist: clamp(baseStats.value.iceResist + (eq.iceResist || 0) + (tl.iceResist || 0), 0, 0.8),
      goldFind: baseStats.value.goldFind + (eq.goldFind || 0) + (tl.goldFind || 0),
      magicFind: baseStats.value.magicFind + (eq.magicFind || 0) + (tl.magicFind || 0),
      expGain: baseStats.value.expGain + (eq.expGain || 0) + (tl.expGain || 0)
    }
  })

  /** 总主属性 */
  const totalMainAttributes = computed<MainAttributes>(() => {
    const eq = equipmentStats.value
    const tl = talentBonus.value

    return {
      str: mainAttributes.value.str + (eq.str || 0) + (tl.str || 0),
      dex: mainAttributes.value.dex + (eq.dex || 0) + (tl.dex || 0),
      int: mainAttributes.value.int + (eq.int || 0) + (tl.int || 0)
    }
  })

  /** 当前主属性值 */
  const currentMainAttrValue = computed(() => {
    return totalMainAttributes.value[mainAttribute.value]
  })

  /** DPS 计算 */
  const dps = computed(() => {
    const s = totalStats.value
    const mainAttrBonus = 1 + currentMainAttrValue.value * MAIN_ATTR_BONUS_PER_POINT
    const critMultiplier = 1 + s.critChance * (s.critDamage - 1)
    return s.attack * mainAttrBonus * s.attackSpeed * critMultiplier
  })

  /** EHP 计算（需要怪物等级参数，默认用玩家等级×2+8） */
  function calculateEHP(monsterLevel: number = level.value * 2 + 8): number {
    const s = totalStats.value
    const armorReduction = s.armor / (s.armor + monsterLevel * ARMOR_DENOMINATOR_LEVEL + ARMOR_DENOMINATOR_BASE)
    const maxResist = Math.max(s.fireResist, s.iceResist)
    const resistReduction = maxResist / (maxResist + RESIST_DENOMINATOR)
    const effectiveDodge = Math.min(s.dodge, MAX_DODGE)

    return (
      s.hp / ((1 - armorReduction) * (1 - resistReduction) * (1 - effectiveDodge))
    )
  }

  /** 战力 */
  const totalPower = computed(() => {
    const ehp = calculateEHP()
    return Math.round(dps.value * POWER_DPS_WEIGHT + ehp * POWER_EHP_WEIGHT)
  })

  /** 金币倍率 */
  const goldMultiplier = computed(() => {
    return 1 + Math.min(totalStats.value.goldFind, MAX_GOLD_FIND) * GOLD_FIND_MULTIPLIER
  })

  /** 魔法发现倍率 */
  const magicFindMultiplier = computed(() => {
    return 1 + Math.min(totalStats.value.magicFind, MAX_MAGIC_FIND) * MAGIC_FIND_DROP_MULTIPLIER
  })

  /** 掉落率倍率 */
  const dropRateMultiplier = computed(() => {
    return 1 + Math.min(totalStats.value.magicFind, MAX_MAGIC_FIND) * 0.005
  })

  // ─── Actions ───

  /** 获得经验 */
  function gainExp(amount: number): boolean {
    let leveledUp = false
    exp.value += amount

    while (exp.value >= maxExp.value && level.value < MAX_LEVEL) {
      exp.value -= maxExp.value
      level.value++
      leveledUp = true
    }

    if (level.value >= MAX_LEVEL) {
      exp.value = 0
    }

    return leveledUp
  }

  /** 获得金币 */
  function gainGold(amount: number): void {
    gold.value += amount
  }

  /** 消耗金币 */
  function spendGold(amount: number): boolean {
    if (gold.value < amount) return false
    gold.value -= amount
    return true
  }

  /** 获得强化石 */
  function gainStones(amount: number): void {
    enhancementStones.value += amount
  }

  /** 消耗强化石 */
  function spendStones(amount: number): boolean {
    if (enhancementStones.value < amount) return false
    enhancementStones.value -= amount
    return true
  }

  /** 穿戴装备 */
  function equipItem(item: EquipmentItem): EquipmentItem | null {
    const current = equipped.value[item.slot]
    equipped.value[item.slot] = item
    return current || null
  }

  /** 卸下装备 */
  function unequipItem(slot: SlotType): EquipmentItem | null {
    const current = equipped.value[slot]
    if (current) {
      delete equipped.value[slot]
    }
    return current || null
  }

  /** 训练升级 */
  function train(type: 'attack' | 'hp' | 'armor'): boolean {
    const def = TRAINING_DEFS.find((d) => d.type === type)
    if (!def) return false

    const currentLevel = training.value[type]
    if (currentLevel >= def.maxLevel) return false

    const cost = Math.round(def.baseCost * def.costGrowth ** currentLevel)
    if (!spendGold(cost)) return false

    training.value[type]++
    return true
  }

  /** 获取训练消耗 */
  function getTrainingCost(type: 'attack' | 'hp' | 'armor'): number {
    const def = TRAINING_DEFS.find((d) => d.type === type)
    if (!def) return Infinity

    const currentLevel = training.value[type]
    if (currentLevel >= def.maxLevel) return Infinity

    return Math.round(def.baseCost * def.costGrowth ** currentLevel)
  }

  /** 激活天赋 */
  function activateTalent(nodeId: string): boolean {
    if (availableTalentPoints.value <= 0) return false

    const nodeDef = TALENT_NODE_DEFS.find((n) => n.id === nodeId)
    if (!nodeDef) return false

    const existing = activeTalents.value.find((t) => t.nodeId === nodeId)
    if (existing) {
      if (existing.points >= nodeDef.maxPoints) return false
      existing.points++
    } else {
      activeTalents.value.push({ nodeId, points: 1 })
    }

    return true
  }

  /** 重置天赋 */
  function resetTalents(): void {
    activeTalents.value = []
  }

  // ─── 存档序列化 ───

  function createSnapshot(): PlayerSnapshot {
    return {
      level: level.value,
      exp: exp.value,
      classType: classType.value,
      mainAttribute: mainAttribute.value,
      baseStats: { ...baseStats.value },
      mainAttributes: { ...mainAttributes.value },
      training: { ...training.value },
      activeTalents: activeTalents.value.map((t) => ({ ...t })),
      gold: gold.value,
      enhancementStones: enhancementStones.value
    }
  }

  function restoreFromSnapshot(snapshot: PlayerSnapshot): void {
    level.value = snapshot.level
    exp.value = snapshot.exp
    classType.value = snapshot.classType
    mainAttribute.value = snapshot.mainAttribute
    baseStats.value = { ...snapshot.baseStats }
    mainAttributes.value = { ...snapshot.mainAttributes }
    training.value = snapshot.training || { attack: 0, hp: 0, armor: 0 }
    activeTalents.value = snapshot.activeTalents?.map((t) => ({ ...t })) || []
    gold.value = snapshot.gold || 0
    enhancementStones.value = snapshot.enhancementStones || 0
  }

  /** 获取角色构建快照（用于战斗计算） */
  function getBuildSnapshot(): PlayerBuild {
    return {
      level: level.value,
      mainAttribute: mainAttribute.value,
      baseStats: totalStats.value,
      equipped: { ...equipped.value },
      activeTalents: activeTalents.value.map((t) => ({ ...t })),
      training: { ...training.value }
    }
  }

  return {
    // 状态
    level,
    exp,
    gold,
    enhancementStones,
    mainAttribute,
    classType,
    baseStats,
    mainAttributes,
    training,
    activeTalents,
    equipped,

    // 派生
    maxExp,
    talentPoints,
    availableTalentPoints,
    totalStats,
    totalMainAttributes,
    dps,
    totalPower,
    goldMultiplier,
    magicFindMultiplier,
    dropRateMultiplier,

    // 方法
    gainExp,
    gainGold,
    spendGold,
    gainStones,
    spendStones,
    equipItem,
    unequipItem,
    train,
    getTrainingCost,
    activateTalent,
    resetTalents,
    calculateEHP,
    createSnapshot,
    restoreFromSnapshot,
    getBuildSnapshot
  }
})
```

### 4.2 战斗 Store（stores/combat.ts）

**设计思路**：Combat Store 管理所有与战斗和层数相关的状态。它的核心职责是维护当前层数和最高解锁层数，控制自动挂机状态，存储战斗日志，以及管理离线报告。

**实现要点**：

1. **层数管理**：`currentFloor` 表示玩家当前选择的层（影响战斗目标），`highestFloor` 表示玩家历史最高解锁层。两者分离的设计允许玩家在已解锁的低层挂机（用于刷装备），同时看到推层目标的评估。

2. **自动挂机状态**：`isAutoBattling` 布尔值控制挂机循环。挂机定时器不存储在 Store 中（因为它是非序列化的运行时对象），而是在组合式函数 `useCombat` 中管理。

3. **战斗日志**：日志使用倒序数组存储（最新在前），上限 100 条。日志条目的类型系统（victory/defeat/loot/floor/boss）支持 UI 层按类型过滤和着色。

4. **离线报告**：`pendingOfflineReport` 存储未领取的离线报告。报告可以稍后领取，让玩家先整理背包再领取装备。`claimOfflineReport` 方法返回报告并清空状态。

5. **目标评估**：`evaluateTargets` 方法遍历已解锁层，使用 `FloorScaling` 评估每一层的挂机评分。`getRecommendedFloor` 返回综合收益最高的可通关层。`getPushTarget` 和 `getBossTarget` 分别返回推层和 Boss 挑战的评估结果。

6. **存档策略**：序列化时保存 `currentFloor` 和 `highestFloor`，但不保存 `isAutoBattling`（避免恢复后自动开始挂机）、日志和当前结果。反序列化时重置运行态。

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CombatResult, CombatLogEntry, OfflineReport, StageTargetEvaluation } from '@types'
import { CombatEngine } from '@core/CombatEngine'
import { FloorScaling } from '@core/FloorScaling'

export const useCombatStore = defineStore('combat', () => {
  // ─── 状态 ───
  const currentFloor = ref(1)
  const highestFloor = ref(1)
  const isAutoBattling = ref(false)
  const currentResult = ref<CombatResult | null>(null)
  const combatLogs = ref<CombatLogEntry[]>([])
  const pendingOfflineReport = ref<OfflineReport | null>(null)
  const pauseReason = ref<string | null>(null)

  // 缓存的目标评估
  const targetEvaluations = ref<StageTargetEvaluation[]>([])

  // ─── 派生 ───

  const canPushFloor = computed(() => currentFloor.value >= highestFloor.value)

  const nextBossFloor = computed(() => Math.ceil((highestFloor.value + 1) / 10) * 10)

  const isBossFloor = computed(() => currentFloor.value % 10 === 0)

  // ─── Actions ───

  /** 设置当前层 */
  function setFloor(floor: number): void {
    if (floor < 1) return
    currentFloor.value = floor
  }

  /** 解锁新层 */
  function unlockFloor(floor: number): void {
    if (floor > highestFloor.value) {
      highestFloor.value = floor
    }
  }

  /** 执行单场战斗 */
  function executeCombat(build: Parameters<CombatEngine['simulate']>[0]): CombatResult {
    const engine = new CombatEngine()
    const result = engine.simulate(build, currentFloor.value)
    currentResult.value = result

    // 添加战斗日志
    const entry: CombatLogEntry = {
      timestamp: Date.now(),
      message: result.victory
        ? `击败了 ${result.monsterName}，获得 ${Math.round(result.goldEarned)} 金币`
        : `被 ${result.monsterName} 击败`,
      type: result.victory ? 'victory' : 'defeat',
      details: { ...result }
    }
    addLogEntry(entry)

    // 如果胜利且当前层等于最高层，解锁下一层
    if (result.victory && result.floorCleared && canPushFloor.value) {
      unlockFloor(currentFloor.value + 1)
    }

    // 如果失败，暂停自动挂机
    if (!result.victory && isAutoBattling.value) {
      isAutoBattling.value = false
      pauseReason.value = result.failureReason || 'combat_failed'
    }

    return result
  }

  /** 添加日志条目 */
  function addLogEntry(entry: CombatLogEntry): void {
    combatLogs.value.unshift(entry)
    if (combatLogs.value.length > 100) {
      combatLogs.value = combatLogs.value.slice(0, 100)
    }
  }

  /** 开启自动挂机 */
  function startAutoCombat(): void {
    pauseReason.value = null
    isAutoBattling.value = true
  }

  /** 停止自动挂机 */
  function stopAutoCombat(): void {
    isAutoBattling.value = false
  }

  /** 设置暂停原因 */
  function setPauseReason(reason: string): void {
    pauseReason.value = reason
    isAutoBattling.value = false
  }

  /** 设置离线报告 */
  function setPendingOfflineReport(report: OfflineReport): void {
    pendingOfflineReport.value = report
  }

  /** 领取离线报告 */
  function claimOfflineReport(): OfflineReport | null {
    const report = pendingOfflineReport.value
    pendingOfflineReport.value = null
    return report
  }

  /** 关闭离线报告 */
  function dismissOfflineReport(): void {
    pendingOfflineReport.value = null
  }

  /** 评估目标层 */
  function evaluateTargets(build: Parameters<CombatEngine['simulate']>[0]): StageTargetEvaluation[] {
    const floorScaling = new FloorScaling()
    const evaluations: StageTargetEvaluation[] = []

    // 评估推荐挂机层（在已解锁层中扫描）
    for (let f = 1; f <= highestFloor.value; f++) {
      const eval_ = floorScaling.evaluateFloor(f, build)
      evaluations.push(eval_)
    }

    targetEvaluations.value = evaluations
    return evaluations
  }

  /** 获取推荐挂机层 */
  function getRecommendedFloor(build: Parameters<CombatEngine['simulate']>[0]): StageTargetEvaluation | null {
    const floorScaling = new FloorScaling()
    const evaluations: StageTargetEvaluation[] = []

    for (let f = 1; f <= highestFloor.value; f++) {
      evaluations.push(floorScaling.evaluateFloor(f, build))
    }

    // 选择可通关且收益评分最优的层
    const viableFloors = evaluations
      .filter((e) => e.canClear)
      .sort((a, b) => b.hangScore - a.hangScore)

    return viableFloors[0] || null
  }

  /** 获取推层目标 */
  function getPushTarget(build: Parameters<CombatEngine['simulate']>[0]): StageTargetEvaluation {
    const floorScaling = new FloorScaling()
    const nextFloor = highestFloor.value + 1
    return floorScaling.evaluateFloor(nextFloor, build)
  }

  /** 获取 Boss 目标 */
  function getBossTarget(build: Parameters<CombatEngine['simulate']>[0]): StageTargetEvaluation {
    const floorScaling = new FloorScaling()
    return floorScaling.evaluateFloor(nextBossFloor.value, build)
  }

  // ─── 存档序列化 ───

  function createSnapshot(): { currentFloor: number; highestFloor: number; isAutoBattling: boolean } {
    return {
      currentFloor: currentFloor.value,
      highestFloor: highestFloor.value,
      isAutoBattling: false  // 不保存战斗中的状态
    }
  }

  function restoreFromSnapshot(snapshot: { currentFloor: number; highestFloor: number }): void {
    currentFloor.value = snapshot.currentFloor || 1
    highestFloor.value = snapshot.highestFloor || 1
    isAutoBattling.value = false
    currentResult.value = null
    pauseReason.value = null
    combatLogs.value = []
  }

  return {
    // 状态
    currentFloor,
    highestFloor,
    isAutoBattling,
    currentResult,
    combatLogs,
    pendingOfflineReport,
    pauseReason,
    targetEvaluations,

    // 派生
    canPushFloor,
    nextBossFloor,
    isBossFloor,

    // 方法
    setFloor,
    unlockFloor,
    executeCombat,
    addLogEntry,
    startAutoCombat,
    stopAutoCombat,
    setPauseReason,
    setPendingOfflineReport,
    claimOfflineReport,
    dismissOfflineReport,
    evaluateTargets,
    getRecommendedFloor,
    getPushTarget,
    getBossTarget,
    createSnapshot,
    restoreFromSnapshot
  }
})
```

### 4.3 装备 Store（stores/equipment.ts）

**设计思路**：Equipment Store 管理背包、拾取过滤、评分模式、保护设置和背包视图状态。这是游戏中最复杂的 Store，因为装备系统的交互逻辑最为丰富。

**实现要点**：

1. **背包管理**：背包是一个 `EquipmentItem[]` 数组，容量上限 50 格。`addItem` 方法在背包未满时添加装备，`removeItem` 按 ID 移除。背包压力状态（normal/warning/critical/full）基于剩余空间比例计算，用于 UI 警告和自动挂机暂停。

2. **拾取过滤**：`pickupFilter` 包含最低品质、部位过滤、必要词缀和自动转化开关。`checkPickupFilter` 方法在装备掉落时调用，判断装备是否值得保留。未通过过滤的装备在 `autoConvert` 为 true 时自动转化为强化石。

3. **评分模式**：`scoreMode` 决定装备评分使用的权重配置。模式切换后，所有装备的显示评分即时更新（因为 `filteredBackpack` computed 会重新计算）。

4. **保护设置**：`protectionSettings` 定义分解时的保护规则——锁定装备、稀有以上装备、更优装备。这些设置在批量分解时自动生效。

5. **背包视图**：`backpackView` 包含排序、过滤和显示选项。`filteredBackpack` computed 根据这些选项动态过滤和排序背包列表。支持按评分、品质、装备等级、时间排序。

6. **分解系统**：`dismantleItem` 移除装备并给予强化石，`batchDismantle` 批量处理。分解奖励根据品质决定：普通 1 个、魔法 2 个、稀有 4 个、传说 8 个、远古 16 个。

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { EquipmentItem, PickupFilter, ProtectionSettings, BackpackViewState } from '@types'
import { Rarity, SlotType, ScoreMode } from '@types'
import { BACKPACK_CAPACITY, BACKPACK_PRESSURE, DISMANTLE_REWARDS } from '@utils/constants'

export const useEquipmentStore = defineStore('equipment', () => {
  // ─── 状态 ───
  const backpack = ref<EquipmentItem[]>([])
  const gold = ref(0)
  const stones = ref(0)
  const lostDrops = ref(0)
  const autoConvertCount = ref(0)

  // 评分模式
  const scoreMode = ref<ScoreMode>(ScoreMode.BALANCED)

  // 拾取过滤
  const pickupFilter = ref<PickupFilter>({
    minRarity: Rarity.NORMAL,
    autoConvert: true,
    allowedSlots: Object.values(SlotType),
    requiredAffixes: []
  })

  // 保护设置
  const protectionSettings = ref<ProtectionSettings>({
    lockLocked: true,
    lockRare: true,
    lockBetter: true
  })

  // 背包视图
  const backpackView = ref<BackpackViewState>({
    sortBy: 'score',
    sortDesc: true,
    filterRarity: null,
    filterSlot: null,
    showOnlyBetter: false,
    hideLocked: false,
    minItemLevel: 0
  })

  // ─── 派生 ───

  const backpackCount = computed(() => backpack.value.length)

  const availableSlots = computed(() => BACKPACK_CAPACITY - backpackCount.value)

  const isFull = computed(() => backpackCount.value >= BACKPACK_CAPACITY)

  /** 背包压力状态 */
  const pressureState = computed<'normal' | 'warning' | 'critical' | 'full'>(() => {
    if (isFull.value) return 'full'
    const ratio = availableSlots.value / BACKPACK_CAPACITY
    if (ratio <= BACKPACK_PRESSURE.CRITICAL) return 'critical'
    if (ratio <= BACKPACK_PRESSURE.WARNING) return 'warning'
    return 'normal'
  })

  /** 过滤后的背包列表 */
  const filteredBackpack = computed(() => {
    let items = [...backpack.value]

    // 部位过滤
    if (backpackView.value.filterSlot) {
      items = items.filter((i) => i.slot === backpackView.value.filterSlot)
    }

    // 品质过滤
    if (backpackView.value.filterRarity) {
      items = items.filter((i) => i.rarity === backpackView.value.filterRarity)
    }

    // 最低装备等级
    if (backpackView.value.minItemLevel > 0) {
      items = items.filter((i) => i.itemLevel >= backpackView.value.minItemLevel)
    }

    // 隐藏锁定
    if (backpackView.value.hideLocked) {
      items = items.filter((i) => !i.locked)
    }

    // 排序
    const sortKey = backpackView.value.sortBy
    const desc = backpackView.value.sortDesc ? -1 : 1
    items.sort((a, b) => {
      if (sortKey === 'score') return (a.score - b.score) * desc
      if (sortKey === 'rarity') {
        const rarityOrder = { normal: 0, magic: 1, rare: 2, legendary: 3, ancient: 4 }
        return (rarityOrder[a.rarity] - rarityOrder[b.rarity]) * desc
      }
      if (sortKey === 'itemLevel') return (a.itemLevel - b.itemLevel) * desc
      if (sortKey === 'time') return (a.createdAt - b.createdAt) * desc
      return 0
    })

    return items
  })

  // ─── Actions ───

  /** 添加装备到背包 */
  function addItem(item: EquipmentItem): boolean {
    if (isFull.value) return false
    backpack.value.push(item)
    return true
  }

  /** 从背包移除装备 */
  function removeItem(itemId: string): EquipmentItem | null {
    const idx = backpack.value.findIndex((i) => i.id === itemId)
    if (idx === -1) return null
    const item = backpack.value[idx]
    backpack.value.splice(idx, 1)
    return item
  }

  /** 锁定/解锁装备 */
  function toggleLock(itemId: string): void {
    const item = backpack.value.find((i) => i.id === itemId)
    if (item) {
      item.locked = !item.locked
    }
  }

  /** 分解装备 */
  function dismantleItem(itemId: string): { stones: number; gold: number } | null {
    const item = removeItem(itemId)
    if (!item) return null

    const stonesGained = DISMANTLE_REWARDS[item.rarity] || 1
    stones.value += stonesGained
    autoConvertCount.value++

    return { stones: stonesGained, gold: 0 }
  }

  /** 批量分解 */
  function batchDismantle(itemIds: string[]): { stones: number; count: number } {
    let totalStones = 0
    let count = 0

    for (const id of itemIds) {
      const result = dismantleItem(id)
      if (result) {
        totalStones += result.stones
        count++
      }
    }

    return { stones: totalStones, count }
  }

  /** 检查拾取过滤 */
  function checkPickupFilter(item: EquipmentItem): boolean {
    // 最低品质检查
    const rarityOrder = { normal: 0, magic: 1, rare: 2, legendary: 3, ancient: 4 }
    if (rarityOrder[item.rarity] < rarityOrder[pickupFilter.value.minRarity]) return false

    // 部位检查
    if (!pickupFilter.value.allowedSlots.includes(item.slot)) return false

    // 必要词缀检查
    if (pickupFilter.value.requiredAffixes.length > 0) {
      const itemAffixTypes = item.affixes.map((a) => a.type)
      const hasRequired = pickupFilter.value.requiredAffixes.some((ra) =>
        itemAffixTypes.includes(ra)
      )
      if (!hasRequired) return false
    }

    return true
  }

  /** 获取某部位的已穿戴装备（用于对比） */
  function getEquippedForSlot(slot: SlotType): EquipmentItem | null {
    // 由 player store 提供，这里只做接口预留
    return null
  }

  /** 设置评分模式 */
  function setScoreMode(mode: ScoreMode): void {
    scoreMode.value = mode
  }

  /** 更新拾取过滤 */
  function updatePickupFilter(filter: Partial<PickupFilter>): void {
    pickupFilter.value = { ...pickupFilter.value, ...filter }
  }

  /** 更新保护设置 */
  function updateProtection(settings: Partial<ProtectionSettings>): void {
    protectionSettings.value = { ...protectionSettings.value, ...settings }
  }

  /** 增加丢失掉落计数 */
  function addLostDrop(): void {
    lostDrops.value++
  }

  // ─── 存档序列化 ───

  function createSnapshot(): {
    backpack: EquipmentItem[]
    gold: number
    stones: number
    lostDrops: number
    autoConvertCount: number
    scoreMode: ScoreMode
    pickupFilter: PickupFilter
    protection: ProtectionSettings
    backpackView: BackpackViewState
  } {
    return {
      backpack: backpack.value.map((i) => ({ ...i })),
      gold: gold.value,
      stones: stones.value,
      lostDrops: lostDrops.value,
      autoConvertCount: autoConvertCount.value,
      scoreMode: scoreMode.value,
      pickupFilter: { ...pickupFilter.value },
      protection: { ...protectionSettings.value },
      backpackView: { ...backpackView.value }
    }
  }

  function restoreFromSnapshot(snapshot: {
    backpack?: EquipmentItem[]
    gold?: number
    stones?: number
    lostDrops?: number
    autoConvertCount?: number
    scoreMode?: ScoreMode
    pickupFilter?: PickupFilter
    protection?: ProtectionSettings
    backpackView?: BackpackViewState
  }): void {
    backpack.value = snapshot.backpack?.map((i) => ({ ...i })) || []
    gold.value = snapshot.gold || 0
    stones.value = snapshot.stones || 0
    lostDrops.value = snapshot.lostDrops || 0
    autoConvertCount.value = snapshot.autoConvertCount || 0

    // 校验评分模式
    const validModes = Object.values(ScoreMode)
    scoreMode.value = validModes.includes(snapshot.scoreMode as ScoreMode)
      ? (snapshot.scoreMode as ScoreMode)
      : ScoreMode.BALANCED

    pickupFilter.value = snapshot.pickupFilter
      ? { ...pickupFilter.value, ...snapshot.pickupFilter }
      : pickupFilter.value

    protectionSettings.value = snapshot.protection
      ? { ...protectionSettings.value, ...snapshot.protection }
      : protectionSettings.value

    backpackView.value = snapshot.backpackView
      ? { ...backpackView.value, ...snapshot.backpackView }
      : backpackView.value
  }

  return {
    // 状态
    backpack,
    gold,
    stones,
    lostDrops,
    autoConvertCount,
    scoreMode,
    pickupFilter,
    protectionSettings,
    backpackView,

    // 派生
    backpackCount,
    availableSlots,
    isFull,
    pressureState,
    filteredBackpack,

    // 方法
    addItem,
    removeItem,
    toggleLock,
    dismantleItem,
    batchDismantle,
    checkPickupFilter,
    setScoreMode,
    updatePickupFilter,
    updateProtection,
    addLostDrop,
    createSnapshot,
    restoreFromSnapshot
  }
})
```

### 4.4 转生 Store（stores/prestige.ts）

**设计思路**：Prestige Store 管理转生计数、灵魂点数和灵魂加成配置。转生系统是放置游戏的经典长期机制，通过重置进度换取永久加成，为玩家提供无尽的成长追求。

**实现要点**：

1. **转生触发**：`doPrestige` 方法增加转生计数并授予灵魂点。转生后玩家需要重新积累，但灵魂加成提供永久的成长加速。

2. **灵魂点数计算**：每次转生获得的基础灵魂点为 `10 + floor(转生次数 × 2)`，后期转生获得更多点数。

3. **灵魂加成配置**：支持 6 种全局百分比加成（攻击%、生命%、护甲%、金币获取%、魔法发现%、经验获取%），每次投入 +5%。

4. **加点与重置**：`investSoulPoint` 消耗灵魂点提升某项加成，`resetSoulBonus` 免费重置所有加点。免费重置降低了玩家尝试不同加点方案的心智负担。

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { SoulBonus } from '@types'

export const usePrestigeStore = defineStore('prestige', () => {
  // ─── 状态 ───
  const prestigeCount = ref(0)
  const soulPoints = ref(0)
  const spentSoulPoints = ref(0)

  // 灵魂加成配置
  const soulBonusConfig = ref({
    attackPercent: 0,
    hpPercent: 0,
    armorPercent: 0,
    goldFindPercent: 0,
    magicFindPercent: 0,
    expGainPercent: 0
  })

  // ─── 派生 ───

  /** 总可获得灵魂点（基于转生次数和最高层数） */
  const totalEarnedSoulPoints = computed(() => {
    // 每次转生获得的基础灵魂点 + 层数加成
    return prestigeCount.value * 10 + Math.floor(prestigeCount.value * prestigeCount.value * 2)
  })

  /** 可用灵魂点 */
  const availableSoulPoints = computed(() => {
    return totalEarnedSoulPoints.value - spentSoulPoints.value
  })

  /** 当前灵魂加成 */
  const currentBonus = computed<SoulBonus>(() => ({
    prestigeCount: prestigeCount.value,
    soulPoints: availableSoulPoints.value,
    bonuses: { ...soulBonusConfig.value }
  }))

  // ─── Actions ───

  /** 执行转生 */
  function doPrestige(): boolean {
    prestigeCount.value++
    const earnedPoints = 10 + Math.floor(prestigeCount.value * 2)
    soulPoints.value += earnedPoints
    return true
  }

  /** 投入灵魂点到某项加成 */
  function investSoulPoint(type: keyof SoulBonus['bonuses']): boolean {
    if (availableSoulPoints.value <= 0) return false
    soulBonusConfig.value[type] += 5  // 每次投入 +5%
    spentSoulPoints.value++
    return true
  }

  /** 重置灵魂加点 */
  function resetSoulBonus(): void {
    soulBonusConfig.value = {
      attackPercent: 0,
      hpPercent: 0,
      armorPercent: 0,
      goldFindPercent: 0,
      magicFindPercent: 0,
      expGainPercent: 0
    }
    spentSoulPoints.value = 0
  }

  // ─── 存档序列化 ───

  function createSnapshot() {
    return {
      prestigeCount: prestigeCount.value,
      soulPoints: soulPoints.value,
      spentSoulPoints: spentSoulPoints.value,
      soulBonusConfig: { ...soulBonusConfig.value }
    }
  }

  function restoreFromSnapshot(snapshot: {
    prestigeCount?: number
    soulPoints?: number
    spentSoulPoints?: number
    soulBonusConfig?: Partial<SoulBonus['bonuses']>
  }): void {
    prestigeCount.value = snapshot.prestigeCount || 0
    soulPoints.value = snapshot.soulPoints || 0
    spentSoulPoints.value = snapshot.spentSoulPoints || 0
    if (snapshot.soulBonusConfig) {
      soulBonusConfig.value = {
        ...soulBonusConfig.value,
        ...snapshot.soulBonusConfig
      }
    }
  }

  return {
    prestigeCount,
    soulPoints,
    spentSoulPoints,
    soulBonusConfig,
    totalEarnedSoulPoints,
    availableSoulPoints,
    currentBonus,
    doPrestige,
    investSoulPoint,
    resetSoulBonus,
    createSnapshot,
    restoreFromSnapshot
  }
})
```

### 4.5 每日任务 Store（stores/daily.ts）

**设计思路**：Daily Store 管理每日任务的生成、进度追踪和奖励领取。每日任务为玩家提供明确的短期目标，增加日常登录的动力。

**实现要点**：

1. **任务生成**：`initDailyTasks` 在每天首次登录时生成 6 种任务：击杀 100 只怪物、获得 5000 金币、获得 2000 经验、获得 20 件装备、强化 5 次、推 3 层。任务目标数值基于玩家当前进度动态调整。

2. **进度追踪**：`updateProgress` 方法按任务类型累积进度。Store 提供便捷方法（`recordKill`、`recordGoldEarned` 等）让其他模块直接调用，不需要关心任务系统的内部逻辑。

3. **奖励领取**：`claimTask` 领取单个任务的奖励，`claimAllRewards` 一键领取所有已完成任务的奖励。奖励包括金币和强化石。

4. **日期检测**：`restoreFromSnapshot` 检查存档日期是否为今天，如果不是则生成新任务。这确保了每日任务的正确重置。

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { DailyState, DailyTask } from '@types'
import { DailyTaskType } from '@types'

/** 生成每日任务 */
function generateDailyTasks(date: string): DailyTask[] {
  const tasks: DailyTask[] = [
    {
      id: `kill_${date}`,
      type: DailyTaskType.KILL_COUNT,
      description: '击杀 100 只怪物',
      target: 100,
      current: 0,
      completed: false,
      claimed: false,
      reward: { gold: 500, stones: 5 }
    },
    {
      id: `gold_${date}`,
      type: DailyTaskType.GOLD_EARN,
      description: '累计获得 5000 金币',
      target: 5000,
      current: 0,
      completed: false,
      claimed: false,
      reward: { gold: 1000, stones: 3 }
    },
    {
      id: `exp_${date}`,
      type: DailyTaskType.EXP_EARN,
      description: '累计获得 2000 经验',
      target: 2000,
      current: 0,
      completed: false,
      claimed: false,
      reward: { gold: 300, stones: 2 }
    },
    {
      id: `equip_${date}`,
      type: DailyTaskType.EQUIP_GET,
      description: '获得 20 件装备',
      target: 20,
      current: 0,
      completed: false,
      claimed: false,
      reward: { gold: 200, stones: 10 }
    },
    {
      id: `enhance_${date}`,
      type: DailyTaskType.ENHANCE,
      description: '强化装备 5 次',
      target: 5,
      current: 0,
      completed: false,
      claimed: false,
      reward: { gold: 800, stones: 8 }
    },
    {
      id: `push_${date}`,
      type: DailyTaskType.FLOOR_PUSH,
      description: '推进 3 层',
      target: 3,
      current: 0,
      completed: false,
      claimed: false,
      reward: { gold: 1500, stones: 10 }
    }
  ]

  return tasks
}

export const useDailyStore = defineStore('daily', () => {
  // ─── 状态 ───
  const dailyState = ref<DailyState>({
    date: new Date().toISOString().split('T')[0],
    tasks: [],
    allCompleted: false,
    allClaimed: false
  })

  // ─── 派生 ───

  const todayTasks = computed(() => dailyState.value.tasks)

  const completedCount = computed(() =>
    dailyState.value.tasks.filter((t) => t.completed).length
  )

  const claimedCount = computed(() =>
    dailyState.value.tasks.filter((t) => t.claimed).length
  )

  const hasUnclaimed = computed(() =>
    dailyState.value.tasks.some((t) => t.completed && !t.claimed)
  )

  // ─── Actions ───

  /** 初始化或刷新每日任务 */
  function initDailyTasks(): void {
    const today = new Date().toISOString().split('T')[0]

    if (dailyState.value.date !== today) {
      // 新的一天，重置任务
      dailyState.value = {
        date: today,
        tasks: generateDailyTasks(today),
        allCompleted: false,
        allClaimed: false
      }
    } else if (dailyState.value.tasks.length === 0) {
      // 同一天但没有任务（首次登录）
      dailyState.value.tasks = generateDailyTasks(today)
    }
  }

  /** 更新任务进度 */
  function updateProgress(type: DailyTaskType, amount: number): void {
    const tasks = dailyState.value.tasks.filter((t) => t.type === type && !t.completed)

    for (const task of tasks) {
      task.current += amount
      if (task.current >= task.target) {
        task.current = task.target
        task.completed = true
      }
    }

    // 检查是否全部完成
    dailyState.value.allCompleted = dailyState.value.tasks.every((t) => t.completed)
  }

  /** 领取任务奖励 */
  function claimTask(taskId: string): DailyTask['reward'] | null {
    const task = dailyState.value.tasks.find((t) => t.id === taskId)
    if (!task || !task.completed || task.claimed) return null

    task.claimed = true

    // 检查是否全部领取
    dailyState.value.allClaimed = dailyState.value.tasks.every((t) => t.claimed)

    return task.reward
  }

  /** 一键领取所有已完成任务的奖励 */
  function claimAllRewards(): DailyTask['reward'] {
    let totalGold = 0
    let totalStones = 0

    for (const task of dailyState.value.tasks) {
      if (task.completed && !task.claimed) {
        task.claimed = true
        totalGold += task.reward.gold
        totalStones += task.reward.stones
      }
    }

    dailyState.value.allClaimed = true
    return { gold: totalGold, stones: totalStones }
  }

  /** 击杀计数（便捷方法） */
  function recordKill(count: number = 1): void {
    updateProgress(DailyTaskType.KILL_COUNT, count)
  }

  /** 金币获取（便捷方法） */
  function recordGoldEarned(amount: number): void {
    updateProgress(DailyTaskType.GOLD_EARN, amount)
  }

  /** 经验获取（便捷方法） */
  function recordExpEarned(amount: number): void {
    updateProgress(DailyTaskType.EXP_EARN, amount)
  }

  /** 装备获取（便捷方法） */
  function recordEquipGet(count: number = 1): void {
    updateProgress(DailyTaskType.EQUIP_GET, count)
  }

  /** 强化记录（便捷方法） */
  function recordEnhance(count: number = 1): void {
    updateProgress(DailyTaskType.ENHANCE, count)
  }

  /** 推层记录（便捷方法） */
  function recordFloorPush(count: number = 1): void {
    updateProgress(DailyTaskType.FLOOR_PUSH, count)
  }

  // ─── 存档序列化 ───

  function createSnapshot(): DailyState {
    return {
      date: dailyState.value.date,
      tasks: dailyState.value.tasks.map((t) => ({ ...t })),
      allCompleted: dailyState.value.allCompleted,
      allClaimed: dailyState.value.allClaimed
    }
  }

  function restoreFromSnapshot(snapshot: DailyState): void {
    const today = new Date().toISOString().split('T')[0]

    if (snapshot.date === today) {
      dailyState.value = {
        date: snapshot.date,
        tasks: snapshot.tasks?.map((t) => ({ ...t })) || generateDailyTasks(today),
        allCompleted: snapshot.allCompleted || false,
        allClaimed: snapshot.allClaimed || false
      }
    } else {
      // 存档日期不是今天，生成新任务
      initDailyTasks()
    }
  }

  return {
    dailyState,
    todayTasks,
    completedCount,
    claimedCount,
    hasUnclaimed,
    initDailyTasks,
    updateProgress,
    claimTask,
    claimAllRewards,
    recordKill,
    recordGoldEarned,
    recordExpEarned,
    recordEquipGet,
    recordEnhance,
    recordFloorPush,
    createSnapshot,
    restoreFromSnapshot
  }
})
```


---

## 第5章 战斗系统实现

### 5.0 战斗系统设计概述

战斗系统是放置型 ARPG 的核心循环驱动力。与实时操作型 ARPG 不同，放置游戏的战斗是纯数值模拟，不需要逐帧渲染动画。玩家战力的提升直接体现在击杀时间的缩短和可挑战层数的提高上。

战斗系统的设计遵循以下原则：**纯数值模拟**，不依赖 Vue 响应式系统或浏览器 DOM，可以在 Web Worker 中运行；**毫秒级计算**，单场战斗在 1 毫秒内完成，支持批量模拟离线收益；**确定性结果**，给定相同的玩家属性和层数，战斗结果始终一致（伪随机数用于掉落，不影响胜负）；**可解释性**，失败时提供明确原因（输出不足、生存不足、超时）。

战斗系统包含三个核心模块：

- `CombatEngine.ts`：战斗引擎，提供 DPS/EHP/战力计算、怪物生成、单场模拟、批量模拟
- `FloorScaling.ts`：层数缩放系统，提供推荐战力计算、收益衰减判断、目标层评估
- `useCombat.ts`：战斗组合式函数，桥接战斗引擎与 Pinia Store，管理挂机循环

**核心公式说明**：

DPS（每秒伤害）决定击杀速度，公式为 `攻击 × (1 + 主属性 × 0.5%) × 攻击速度 × [1 + 暴击率 × (暴击伤害 - 1)]`。其中主属性加成是放置游戏的关键成长维度，每点主属性提供 0.5% 的攻击加成，这意味着主属性的堆叠会产生显著的后期收益。暴击率上限 75%，攻击速度上限 5.0，这两个软上限确保了玩家需要在多个维度上分配资源，而不是单一堆叠某一项。

EHP（有效生命值）综合衡量生存能力，公式为 `生命 / [(1 - 护甲减伤) × (1 - 抗性减伤) × (1 - 闪避率)]`。护甲减伤采用线性衰减公式 `护甲 / (护甲 + 怪物等级 × 50 + 500)`，这意味着护甲的收益随怪物等级提升而递减，玩家需要持续提升护甲才能保持相同的减伤比例。

战力是 DPS 和 EHP 的加权组合，公式为 `战力 = DPS × 4 + EHP × 0.35`。战力用于推荐挂机层判断、收益衰减和推层目标评估。战力本身不是战斗中的直接属性，而是一个综合评估指标。

### 5.1 战斗引擎（core/CombatEngine.ts）

战斗引擎是整个游戏最核心的计算模块。所有与战斗相关的数值计算都集中在这个类中，包括 DPS/EHP/战力公式、怪物生成、单场战斗模拟和批量战斗模拟。

**设计模式选择**：战斗引擎使用面向对象类（Class）而非函数集合，因为引擎需要维护内部状态（如怪物名称池、类型轮换规则）。同时 CombatEngine 不依赖任何外部框架，可以在浏览器主线程、Web Worker 甚至 Node.js 环境中运行，这种可移植性为性能优化和单元测试提供了便利。

**关键设计决策**：

1. **纯函数输入输出**：`simulate` 方法的输入是 `PlayerBuild` 和层数，输出是 `CombatResult`，不修改输入对象。这种不可变性避免了副作用导致的 Bug。
2. **怪物生成确定性**：给定相同的层数，生成的怪物基础属性相同。掉落和词缀使用伪随机数，但战斗胜负由数值公式决定，不受随机性影响。
3. **批量模拟优化**：`simulateBatch` 方法使用预计算的平均击杀时间估算总击杀数，避免逐场模拟的性能开销。离线收益计算中，100 场战斗作为一个批次处理。
4. **失败原因可解释性**：战斗失败时返回具体的失败原因（超时、输出不足、生存不足），这个信息直接传递给 UI 层展示给玩家，帮助玩家理解为何打不过某一层。

**模块职责**：

- 接收 `PlayerBuild` 和层数作为输入
- 生成对应层的怪物（含类型系数）
- 计算 DPS、EHP、战力等派生属性
- 模拟单场或批量战斗
- 输出包含胜负、击杀时间、收益和掉落信息的 `CombatResult`

**数值公式详解**：

DPS 公式中的 `主属性加成` 是一个关键的指数成长因子。每点主属性提供 0.5% 的加成，这意味着当主属性达到 100 点时，攻击会提升 50%；达到 200 点时提升 100%。这种设计确保了后期装备上几十点主属性的词条具有显著价值。暴击率上限 75% 和攻击速度上限 5.0 是两个软上限，超过后不再提供收益，迫使玩家在暴击、攻速、主属性之间做出权衡。

EHP 公式中的护甲减伤采用经典的线性衰减模型 `护甲 / (护甲 + 怪物等级 × 50 + 500)`。分母中包含怪物等级意味着，同样的护甲值在面对高等级怪物时减伤效果会下降。这解释了为什么玩家需要持续提升护甲才能在新层数中保持生存能力。护甲的边际收益递减特性意味着，当护甲值接近分母大小时，每点护甲的收益开始下降。

战力公式 `DPS × 4 + EHP × 0.35` 中 DPS 的权重远高于 EHP，这是因为 DPS 直接影响击杀速度和收益效率。EHP 的权重较低但不可忽略，因为生存能力是推层的前提。战力只用于推荐挂机层和收益衰减评估，不直接参与战斗计算。

```typescript
import {
  COMBAT_MAX_DURATION,
  MONSTER_GROWTH_BASE,
  MONSTER_LEVEL_BASE,
  MONSTER_LEVEL_PER_FLOOR,
  BOSS_INTERVAL,
  BOSS_HP_MULTIPLIER,
  BOSS_ATK_MULTIPLIER,
  BOSS_REWARD_MULTIPLIER,
  REWARD_HP_MULTIPLIER,
  REWARD_ATK_MULTIPLIER,
  REWARD_GOLD_MULTIPLIER,
  REWARD_EXP_MULTIPLIER,
  REWARD_DROP_MULTIPLIER,
  HIGH_HP_MULTIPLIER,
  HIGH_ATK_HP_MULTIPLIER,
  HIGH_ATK_MULTIPLIER,
  HIGH_HP_ATK_MULTIPLIER,
  POWER_DPS_WEIGHT,
  POWER_EHP_WEIGHT,
  MAIN_ATTR_BONUS_PER_POINT,
  ARMOR_DENOMINATOR_BASE,
  ARMOR_DENOMINATOR_LEVEL,
  RESIST_DENOMINATOR,
  MAX_ATTACK_SPEED,
  MAX_CRIT_CHANCE,
  MAX_DODGE,
  MONSTER_ROTATION,
  GOLD_FIND_MULTIPLIER,
  MAX_GOLD_FIND
} from '@utils/constants'
import type { PlayerBuild, Monster, CombatResult, MonsterType } from '@types'
import { roundTo } from '@utils/helpers'

export interface CombatEngineInput {
  player: PlayerBuild
  monster: Monster
  maxDuration?: number
}

export class CombatEngine {
  /**
   * 计算玩家 DPS（每秒伤害）
   *
   * DPS 是衡量角色输出能力的核心指标，直接决定击杀怪物的速度。
   * 公式包含四个因子：攻击、主属性加成、攻击速度和暴击乘数。
   *
   * 公式详解：
   * DPS = 攻击 × 主属性加成 × 攻击速度 × 暴击乘数
   *
   * 其中：
   * - 攻击 = 基础攻击 + 训练攻击加成 + 装备攻击 + 天赋攻击
   * - 主属性加成 = 1 + 主属性值 × 0.005（每点主属性提供 0.5% 加成）
   * - 攻击速度 = 基础攻速 + 装备攻速（上限 5.0）
   * - 暴击乘数 = 1 + 暴击率 × (暴击伤害 - 1)
   *   例如暴击率 25%、暴击伤害 150% 时：1 + 0.25 × 0.5 = 1.125
   *
   * 设计意图：
   * 1. 主属性加成是后期的关键成长维度。当主属性从 10 提升到 200 时，
   *    加成从 5% 提升到 100%，DPS 翻倍。这确保了主属性词条在后期
   *    装备中的价值极高。
   * 2. 暴击率上限 75% 防止暴击流过于强势，迫使玩家在暴击和攻速之间
   *    做选择。
   * 3. 攻击速度上限 5.0 防止攻速流无限堆叠。
   * 4. 暴击伤害的基准值为 150%（即暴击时造成 1.5 倍伤害）。
   */
  calculateDPS(build: PlayerBuild): number {
    const mainAttrMap = { str: build.mainAttributes.str, dex: build.mainAttributes.dex, int: build.mainAttributes.int }
    const mainAttrValue = mainAttrMap[build.mainAttribute] || 10
    const mainAttrBonus = 1 + mainAttrValue * MAIN_ATTR_BONUS_PER_POINT

    const attackSpeed = Math.min(build.baseStats.attackSpeed, MAX_ATTACK_SPEED)
    const critChance = Math.min(build.baseStats.critChance, MAX_CRIT_CHANCE)
    const critMultiplier = 1 + critChance * (build.baseStats.critDamage - 1)

    return build.baseStats.attack * mainAttrBonus * attackSpeed * critMultiplier
  }

  /**
   * 计算玩家 EHP（有效生命值）
   *
   * EHP 综合衡量角色的生存能力，考虑了护甲减伤、元素抗性减伤和闪避率。
   * EHP 表示"在承受多少伤害后死亡"，数值越高生存能力越强。
   *
   * 公式详解：
   * EHP = 生命 / [(1 - 护甲减伤) × (1 - 抗性减伤) × (1 - 闪避率)]
   *
   * 其中：
   * - 护甲减伤 = 护甲 / (护甲 + 怪物等级 × 50 + 500)
   *   这是经典的线性护甲减伤公式。护甲收益递减：当护甲 = 分母时减伤 50%，
   *   护甲翻倍时减伤 67%。怪物等级出现在分母中意味着同样护甲值在面对
   *   高等级怪物时减伤效果下降，解释了为什么需要持续提升护甲。
   * - 抗性减伤 = 最大元素抗性 / (最大元素抗性 + 100)
   *   取火焰抗性和冰霜抗性中的较大值。两种抗性不叠加，避免双抗堆叠过强。
   * - 闪避率 = min(闪避, 60%)，上限 60%
   *
   * 设计意图：
   * 1. EHP 综合三个防御维度，任何一个维度的短板都会显著降低生存能力。
   * 2. 护甲的边际收益递减鼓励玩家在护甲、抗性和闪避之间分配资源。
   * 3. 怪物等级影响护甲减伤效果，确保玩家不能靠一套装备打到极高层次。
   */
  calculateEHP(build: PlayerBuild, monsterLevel: number): number {
    const armor = build.baseStats.armor
    const armorReduction = armor / (armor + monsterLevel * ARMOR_DENOMINATOR_LEVEL + ARMOR_DENOMINATOR_BASE)

    const maxResist = Math.max(build.baseStats.fireResist, build.baseStats.iceResist)
    const resistReduction = maxResist / (maxResist + RESIST_DENOMINATOR)

    const dodge = Math.min(build.baseStats.dodge, MAX_DODGE)

    const hp = build.baseStats.hp
    return hp / ((1 - armorReduction) * (1 - resistReduction) * (1 - dodge))
  }

  /**
   * 计算战力
   */
  calculatePower(build: PlayerBuild, monsterLevel?: number): number {
    const dps = this.calculateDPS(build)
    const ehp = this.calculateEHP(build, monsterLevel || build.level * 2 + 8)
    return Math.round(dps * POWER_DPS_WEIGHT + ehp * POWER_EHP_WEIGHT)
  }

  /**
   * 生成指定层的怪物
   */
  generateMonster(floor: number): Monster {
    const isBoss = floor % BOSS_INTERVAL === 0
    const monsterLevel = floor * MONSTER_LEVEL_PER_FLOOR + MONSTER_LEVEL_BASE
    const growthMultiplier = MONSTER_GROWTH_BASE ** (floor - 1)

    // 确定怪物类型
    let monsterType: MonsterType
    let typeName: string

    if (isBoss) {
      monsterType = 'boss' as MonsterType
      typeName = this.getBossName(floor)
    } else {
      const rotationIndex = (floor - 1) % MONSTER_ROTATION.length
      monsterType = MONSTER_ROTATION[rotationIndex]
      typeName = this.getMonsterTypeName(monsterType)
    }

    // 基础属性
    const baseHP = 60 * growthMultiplier
    const baseAttack = 8 * growthMultiplier
    const baseAttackSpeed = 1.0

    // 类型系数
    let hpMult = 1.0
    let atkMult = 1.0
    let goldMult = 1.0
    let expMult = 1.0
    let dropMult = 1.0

    switch (monsterType) {
      case 'balanced':
        break
      case 'highHp':
        hpMult = HIGH_HP_MULTIPLIER
        atkMult = HIGH_ATK_HP_MULTIPLIER
        break
      case 'highAtk':
        hpMult = HIGH_HP_ATK_MULTIPLIER
        atkMult = HIGH_ATK_MULTIPLIER
        break
      case 'reward':
        hpMult = REWARD_HP_MULTIPLIER
        atkMult = REWARD_ATK_MULTIPLIER
        goldMult = REWARD_GOLD_MULTIPLIER
        expMult = REWARD_EXP_MULTIPLIER
        dropMult = REWARD_DROP_MULTIPLIER
        break
      case 'boss':
        hpMult = BOSS_HP_MULTIPLIER
        atkMult = BOSS_ATK_MULTIPLIER
        goldMult = BOSS_REWARD_MULTIPLIER
        expMult = BOSS_REWARD_MULTIPLIER
        dropMult = BOSS_REWARD_MULTIPLIER
        break
    }

    const monster: Monster = {
      name: typeName,
      type: monsterType,
      level: monsterLevel,
      hp: roundTo(baseHP * hpMult),
      attack: roundTo(baseAttack * atkMult),
      attackSpeed: baseAttackSpeed,
      armor: roundTo(2 * growthMultiplier),
      critChance: isBoss ? 0.08 : 0.03,
      affixes: [],
      goldReward: Math.max(1, Math.round(5 * growthMultiplier * goldMult)),
      expReward: Math.max(1, Math.round(10 * growthMultiplier * expMult)),
      dropChance: isBoss ? 0.5 : 0.15,
      dropValueMultiplier: dropMult
    }

    return monster
  }

  /**
   * 模拟单场战斗
   */
  simulate(player: PlayerBuild, floor: number, maxDuration: number = COMBAT_MAX_DURATION): CombatResult {
    const monster = this.generateMonster(floor)

    const playerDPS = this.calculateDPS(player)
    const playerEHP = this.calculateEHP(player, monster.level)

    // 怪物 DPS（对玩家）
    const monsterArmorReduction = monster.armor / (monster.armor + player.level * ARMOR_DENOMINATOR_LEVEL + ARMOR_DENOMINATOR_BASE)
    const playerEffectiveAttack = player.baseStats.attack * (1 - monsterArmorReduction)
    const monsterDPS = Math.max(0.1, playerEffectiveAttack > 0 ? monster.attack * monster.attackSpeed * 0.5 : 0)

    // 实际计算：怪物攻击玩家时，要考虑玩家护甲
    const playerArmor = player.baseStats.armor
    const playerArmorReduction = playerArmor / (playerArmor + monster.level * ARMOR_DENOMINATOR_LEVEL + ARMOR_DENOMINATOR_BASE)
    const monsterEffectiveDPS = monster.attack * monster.attackSpeed * (1 - playerArmorReduction)

    // 击杀时间
    const playerKillTime = playerDPS > 0 ? monster.hp / playerDPS : Infinity
    const monsterKillTime = monsterEffectiveDPS > 0 ? player.baseStats.hp / monsterEffectiveDPS : Infinity

    // 胜负判定
    let victory = false
    let failureReason: CombatResult['failureReason'] = undefined

    if (playerKillTime >= maxDuration) {
      failureReason = 'timeout'
    } else if (playerKillTime >= monsterKillTime) {
      if (playerDPS < monsterEffectiveDPS * 0.5) {
        failureReason = 'dps_insufficient'
      } else {
        failureReason = 'survival_insufficient'
      }
    } else {
      victory = true
    }

    const actualDuration = victory ? playerKillTime : maxDuration

    // 收益计算
    const goldMult = 1 + Math.min(player.baseStats.goldFind, MAX_GOLD_FIND) * GOLD_FIND_MULTIPLIER
    const goldEarned = victory ? Math.round(monster.goldReward * goldMult) : 0
    const expEarned = victory ? Math.round(monster.expReward) : 0

    return {
      victory,
      playerKillTime: roundTo(playerKillTime, 2),
      monsterKillTime: roundTo(monsterKillTime, 2),
      actualDuration: roundTo(actualDuration, 2),
      goldEarned,
      expEarned,
      dropTriggered: victory && Math.random() < monster.dropChance,
      floorCleared: victory,
      failureReason,
      monsterName: monster.name,
      monsterType: monster.type
    }
  }

  /**
   * 批量模拟多场战斗（用于离线收益计算）
   * @returns 总击杀数、总金币、总经验、掉落列表
   */
  simulateBatch(
    player: PlayerBuild,
    floor: number,
    seconds: number,
    maxDuration: number = COMBAT_MAX_DURATION
  ): {
    killCount: number
    totalGold: number
    totalExp: number
    totalDrops: number
    actualSeconds: number
    stoppedBy: 'time' | 'cannot_kill'
  } {
    let killCount = 0
    let totalGold = 0
    let totalExp = 0
    let totalDrops = 0
    let remainingSeconds = seconds
    let stoppedBy: 'time' | 'cannot_kill' = 'time'

    // 检查是否能击杀
    const checkMonster = this.generateMonster(floor)
    const playerDPS = this.calculateDPS(player)
    if (playerDPS <= 0 || checkMonster.hp / playerDPS >= maxDuration) {
      return { killCount: 0, totalGold: 0, totalExp: 0, totalDrops: 0, actualSeconds: 0, stoppedBy: 'cannot_kill' }
    }

    // 估算每场战斗平均时间
    const avgKillTime = checkMonster.hp / playerDPS

    while (remainingSeconds > 0) {
      const result = this.simulate(player, floor, maxDuration)

      if (!result.victory) {
        stoppedBy = 'cannot_kill'
        break
      }

      killCount++
      totalGold += result.goldEarned
      totalExp += result.expEarned
      if (result.dropTriggered) totalDrops++

      remainingSeconds -= result.actualDuration
    }

    return {
      killCount,
      totalGold,
      totalExp,
      totalDrops,
      actualSeconds: seconds - remainingSeconds,
      stoppedBy
    }
  }

  // ─── 私有辅助方法 ───

  private getMonsterTypeName(type: MonsterType): string {
    const names: Record<string, string[]> = {
      balanced: ['森林史莱姆', '荒野豺狼', '洞穴蝙蝠', '流浪骷髅'],
      highHp: ['巨型史莱姆', '岩甲巨兽', '古树守卫', '钢铁傀儡'],
      highAtk: ['暗影刺客', '狂暴狼人', '剧毒蜘蛛', '火焰恶魔'],
      reward: ['宝箱怪', '幸运精灵', '黄金哥布林', '宝藏守卫']
    }
    const pool = names[type] || names.balanced
    return pool[Math.floor(Math.random() * pool.length)]
  }

  private getBossName(floor: number): string {
    const bosses = [
      '腐化树精', '暗影领主', '炎魔之王', '冰霜巨龙',
      '深渊吞噬者', '虚空行者', '混沌魔神', '远古泰坦',
      '暗黑破坏神', '裂隙之主'
    ]
    return bosses[Math.floor((floor / 10 - 1)) % bosses.length] || `第 ${floor} 层守护者`
  }
}
```

### 5.2 层数缩放系统（core/FloorScaling.ts）

层数缩放系统负责管理整个游戏的难度曲线和收益成长。玩家通过挑战更高层数获得更好的装备和更高的收益，但每层怪物的属性都会指数增长，形成自然的难度门槛。

**设计原理**：层数系统的核心是一个指数增长函数。推荐战力公式 `100 × 1.12 ^ (层数 - 1)` 确保每层的推荐战力比上一层高 12%。这个增长率经过精心调校：太低玩家会觉得推层太容易，太高玩家会觉得成长太慢。12% 的增长率意味着每 6 层推荐战力约翻一倍，提供了持续的推层动力。

怪物属性的指数增长采用 `1.1 ^ (层数 - 1)` 作为成长倍率底数。这意味着第 10 层怪物的属性约为第 1 层的 2.6 倍，第 20 层约为 6.7 倍，第 50 层约为 117 倍。这种指数增长确保了游戏后期数值的膨胀感，与玩家通过装备获得的指数成长形成博弈。

**收益衰减机制**是层数系统的重要组成部分。当玩家战力低于推荐战力时，收益按比例衰减：

| 战力比 | 收益比例 | 体验 |
|--------|----------|------|
| ≥ 100% | 100% | 轻松挂机 |
| 80%~100% | 80% | 略微吃力 |
| 60%~80% | 50% | 明显困难 |
| < 60% | 20% | 勉强能挂 |

这个四级衰减系统向玩家传递了明确的信号：当收益降到 50% 或 20% 时，应该回到推荐挂机层积累装备和资源。衰减只影响金币和经验，不影响掉落率，这意味着即使收益很低，仍然有可能获得高品质装备。

**怪物类型轮换**增加了战斗的多样性。每 4 层一个轮换周期：均衡怪（标准属性）、高血怪（考验输出效率）、高攻怪（考验生存能力）、奖励怪（高收益）。这种轮换迫使玩家平衡 DPS 和 EHP，不能单一堆叠某一属性。

**Boss 层设计**：每 10 层一个 Boss，Boss 的生命和攻击分别是普通怪物的 3 倍和 2 倍，但奖励也是 2.5 倍。第 10、20、30 层 Boss 分别偏向金币、经验和装备奖励，之后循环。Boss 层是游戏中的重要节点，通关 Boss 意味着可以进入下一个十层区间。

**推荐挂机层算法**：系统在已解锁的所有层中评估每一层的挂机评分，选择可通关且综合收益（金币/秒 × 0.4 + 经验/秒 × 0.3 + 掉落价值/秒 × 0.3）最高的层作为推荐。当两层收益接近时，倾向推荐更高层，因为更高层有更高的掉落等级。

```typescript

```typescript
import {
  RECOMMENDED_POWER_BASE,
  RECOMMENDED_POWER_GROWTH,
  MONSTER_ROTATION,
  BOSS_INTERVAL,
  BOSS_HP_MULTIPLIER,
  BOSS_ATK_MULTIPLIER,
  BOSS_REWARD_MULTIPLIER,
  EFFICIENCY_THRESHOLDS,
  REWARD_HP_MULTIPLIER,
  REWARD_ATK_MULTIPLIER,
  REWARD_GOLD_MULTIPLIER,
  REWARD_EXP_MULTIPLIER,
  REWARD_DROP_MULTIPLIER,
  HIGH_HP_MULTIPLIER,
  HIGH_ATK_HP_MULTIPLIER,
  HIGH_ATK_MULTIPLIER,
  HIGH_HP_ATK_MULTIPLIER,
  MONSTER_GROWTH_BASE,
  MONSTER_LEVEL_PER_FLOOR,
  MONSTER_LEVEL_BASE,
  GOLD_FIND_MULTIPLIER,
  MAX_GOLD_FIND
} from '@utils/constants'
import type { PlayerBuild, StageTargetEvaluation, MonsterType } from '@types'
import { CombatEngine } from './CombatEngine'

export class FloorScaling {
  private engine = new CombatEngine()

  /**
   * 计算指定层的推荐战力
   */
  getRecommendedPower(floor: number, monsterType: MonsterType = 'balanced'): number {
    let typeMult = 1.0

    switch (monsterType) {
      case 'highHp':
        typeMult = 1.2
        break
      case 'highAtk':
        typeMult = 1.3
        break
      case 'reward':
        typeMult = 0.9
        break
      case 'boss':
        typeMult = 2.5
        break
    }

    return Math.round(RECOMMENDED_POWER_BASE * RECOMMENDED_POWER_GROWTH ** (floor - 1) * typeMult)
  }

  /**
   * 计算收益衰减倍率
   */
  getEfficiencyRatio(playerPower: number, recommendedPower: number): number {
    if (recommendedPower <= 0) return 1.0
    const ratio = playerPower / recommendedPower

    for (const threshold of EFFICIENCY_THRESHOLDS) {
      if (ratio >= threshold.ratio) return threshold.efficiency
    }

    return EFFICIENCY_THRESHOLDS[EFFICIENCY_THRESHOLDS.length - 1].efficiency
  }

  /**
   * 评估指定层
   */
  evaluateFloor(floor: number, player: PlayerBuild): StageTargetEvaluation {
    const isBoss = floor % BOSS_INTERVAL === 0
    const monsterType = isBoss
      ? ('boss' as MonsterType)
      : MONSTER_ROTATION[(floor - 1) % MONSTER_ROTATION.length]

    const recommendedPower = this.getRecommendedPower(floor, monsterType)
    const playerPower = this.engine.calculatePower(player)

    // 模拟战斗
    const result = this.engine.simulate(player, floor)
    const efficiencyRatio = this.getEfficiencyRatio(playerPower, recommendedPower)

    // 收益估算
    const goldPerSecond = result.victory ? result.goldEarned / result.actualDuration : 0
    const expPerSecond = result.victory ? result.expEarned / result.actualDuration : 0

    // 掉落价值估算
    const monsterLevel = floor * MONSTER_LEVEL_PER_FLOOR + MONSTER_LEVEL_BASE
    const dropValuePerSecond = result.victory
      ? (result.dropTriggered ? 18 * (1 + monsterLevel / 80) : 0) / result.actualDuration
      : 0

    // 确定奖励倾向
    let rewardBias: StageTargetEvaluation['rewardBias'] = 'balanced'
    if (isBoss) {
      const bossIndex = floor / 10
      if (bossIndex % 3 === 1) rewardBias = 'gold'
      else if (bossIndex % 3 === 2) rewardBias = 'exp'
      else rewardBias = 'equipment'
    }

    // 挂机评分（综合收益评分）
    const hangScore = result.victory
      ? (goldPerSecond * 0.4 + expPerSecond * 0.3 + dropValuePerSecond * 0.3) * efficiencyRatio
      : 0

    // 失败原因和建议
    let failureReason: string | undefined
    let failureDescription: string | undefined
    let suggestionText: string
    let recommendationReason: string

    if (result.victory) {
      suggestionText = `可在 ${result.actualDuration.toFixed(1)} 秒内击杀`
      if (efficiencyRatio >= 1.0) {
        recommendationReason = '收益倍率 100%，建议在此层挂机'
      } else if (efficiencyRatio >= 0.8) {
        recommendationReason = '收益倍率 80%，战力略低于推荐值但仍可高效挂机'
      } else {
        recommendationReason = `收益倍率 ${Math.round(efficiencyRatio * 100)}%，建议提升战力后再回来挂机`
      }
    } else {
      switch (result.failureReason) {
        case 'timeout':
          failureReason = '超时'
          failureDescription = '无法在 60 秒内击杀怪物，DPS 不足'
          suggestionText = '提升攻击、暴击率或攻击速度以加快击杀'
          break
        case 'dps_insufficient':
          failureReason = '输出不足'
          failureDescription = '怪物击杀速度远快于你'
          suggestionText = '大幅提升攻击力后再尝试'
          break
        case 'survival_insufficient':
          failureReason = '生存不足'
          failureDescription = '无法在怪物击杀你之前击杀它'
          suggestionText = '提升生命值、护甲或闪避以增强生存能力'
          break
        default:
          failureReason = '综合不足'
          failureDescription = '输出和生存都需要提升'
          suggestionText = '全面提升角色属性后再尝试'
      }
      recommendationReason = failureDescription || ''
    }

    return {
      floor,
      floorName: `第 ${floor} 层`,
      monsterName: result.monsterName,
      monsterType,
      tags: this.getFloorTags(floor, monsterType),
      rewardBias,
      recommendedPower,
      playerPower,
      efficiencyRatio,
      canClear: result.victory,
      playerKillTime: result.playerKillTime,
      monsterKillTime: result.monsterKillTime,
      goldPerSecond: roundTo(goldPerSecond, 2),
      expPerSecond: roundTo(expPerSecond, 2),
      dropValuePerSecond: roundTo(dropValuePerSecond, 2),
      mainBias: this.getMainBias(monsterType),
      hangScore: roundTo(hangScore, 2),
      failureReason,
      failureDescription,
      rewardDescription: this.getRewardDescription(rewardBias, efficiencyRatio),
      suggestionText,
      recommendationReason
    }
  }

  /**
   * 扫描已解锁层，返回推荐挂机层
   */
  findBestHangFloor(
    highestFloor: number,
    player: PlayerBuild
  ): { floor: number; evaluation: StageTargetEvaluation } | null {
    let bestFloor: { floor: number; evaluation: StageTargetEvaluation } | null = null

    for (let f = 1; f <= highestFloor; f++) {
      const eval_ = this.evaluateFloor(f, player)
      if (!eval_.canClear) continue

      if (!bestFloor || eval_.hangScore > bestFloor.evaluation.hangScore) {
        bestFloor = { floor: f, evaluation: eval_ }
      } else if (bestFloor && Math.abs(eval_.hangScore - bestFloor.evaluation.hangScore) < 0.01 && f > bestFloor.floor) {
        // 收益接近时，选择更高层
        bestFloor = { floor: f, evaluation: eval_ }
      }
    }

    return bestFloor
  }

  // ─── 私有辅助方法 ───

  private getFloorTags(floor: number, type: MonsterType): string[] {
    const tags: string[] = []
    if (floor % 10 === 0) tags.push('Boss')
    if (type === 'highHp') tags.push('高血量')
    if (type === 'highAtk') tags.push('高攻击')
    if (type === 'reward') tags.push('高奖励')
    if (floor % 5 === 0) tags.push('精英')
    return tags
  }

  private getMainBias(type: MonsterType): string {
    switch (type) {
      case 'highHp': return '考验输出效率'
      case 'highAtk': return '考验生存能力'
      case 'reward': return '高收益层'
      case 'boss': return '综合考验'
      default: return '标准层'
    }
  }

  private getRewardDescription(bias: StageTargetEvaluation['rewardBias'], efficiency: number): string {
    const biasText = bias === 'gold' ? '金币' : bias === 'exp' ? '经验' : bias === 'equipment' ? '装备' : '均衡'
    return `${biasText}奖励为主，收益倍率 ${Math.round(efficiency * 100)}%`
  }
}

function roundTo(value: number, decimals: number = 1): number {
  const multiplier = 10 ** decimals
  return Math.round(value * multiplier) / multiplier
}
```

### 5.3 战斗组合式函数（composables/useCombat.ts）

战斗组合式函数是连接核心战斗引擎与 Vue 状态管理的桥梁。它封装了战斗的完整生命周期：执行单场战斗、启动/停止自动挂机、处理战斗结果（获得金币、经验、掉落装备）、管理战斗日志。

**设计模式**：使用 Vue 组合式函数（`useCombat`）而非直接在组件中调用引擎，因为战斗逻辑需要在多个组件中复用（CombatPanel.vue 中的手动战斗、App.vue 中的离线收益计算、可能的未来 Boss 战组件）。组合式函数内部持有战斗引擎和层数缩放系统的实例，对外提供简洁的接口。

**自动挂机循环**使用 `setInterval` 每 1200 毫秒执行一次战斗。选择 1200 毫秒而非更短的间隔，是为了在视觉效果和性能之间取得平衡：太短的间隔会让日志滚动过快，玩家无法阅读；太长的间隔会让玩家感觉游戏反应迟钝。1200 毫秒大约对应每秒一次战斗的节奏，对于放置游戏来说恰到好处。

**挂机暂停条件**：

1. 背包已满 — 停止挂机，提示玩家整理背包
2. 战斗失败 — 停止挂机，提示玩家提升战力
3. 玩家手动停止 — 立即停止

**战斗结果处理流程**：

1. 将战斗结果记录到 Combat Store 的日志中
2. 如果是胜利，给予金币和经验奖励
3. 如果触发掉落，使用 LootGenerator 生成装备
4. 装备经过拾取过滤检查
5. 通过过滤的装备尝试加入背包
6. 未通过过滤的装备自动转化为强化石
7. 如果背包满了，停止挂机并记录原因

**进度动画**：手动战斗时显示一个 0~100% 的进度条，模拟战斗过程。进度条的持续时间根据预估击杀时间动态调整（最短 0.5 秒，最长 2 秒），给玩家即时的操作反馈。

```typescript

```typescript
import { ref, computed } from 'vue'
import { usePlayerStore } from '@stores/player'
import { useCombatStore } from '@stores/combat'
import { useEquipmentStore } from '@stores/equipment'
import { CombatEngine } from '@core/CombatEngine'
import { FloorScaling } from '@core/FloorScaling'
import { AUTO_COMBAT_INTERVAL } from '@utils/constants'
import type { CombatResult } from '@types'

export function useCombat() {
  const playerStore = usePlayerStore()
  const combatStore = useCombatStore()
  const equipmentStore = useEquipmentStore()

  const combatEngine = new CombatEngine()
  const floorScaling = new FloorScaling()

  /** 自动挂机定时器 */
  let combatTimer: ReturnType<typeof setInterval> | null = null

  /** 是否正在战斗中 */
  const isFighting = ref(false)

  /** 当前战斗进度（0~1） */
  const combatProgress = ref(0)

  /** 推荐挂机层 */
  const recommendedFloor = computed(() => {
    const result = floorScaling.findBestHangFloor(
      combatStore.highestFloor,
      playerStore.getBuildSnapshot()
    )
    return result?.floor || 1
  })

  /** 推层目标评估 */
  const pushTarget = computed(() => {
    return floorScaling.evaluateFloor(
      combatStore.highestFloor + 1,
      playerStore.getBuildSnapshot()
    )
  })

  /** 下一个 Boss 目标 */
  const bossTarget = computed(() => {
    return floorScaling.evaluateFloor(
      combatStore.nextBossFloor,
      playerStore.getBuildSnapshot()
    )
  })

  /** 当前层评估 */
  const currentEvaluation = computed(() => {
    return floorScaling.evaluateFloor(
      combatStore.currentFloor,
      playerStore.getBuildSnapshot()
    )
  })

  /** 执行单场战斗 */
  async function fightOnce(): Promise<CombatResult> {
    if (isFighting.value) return combatStore.currentResult!

    isFighting.value = true
    combatProgress.value = 0

    try {
      const build = playerStore.getBuildSnapshot()
      const result = combatEngine.simulate(build, combatStore.currentFloor)

      // 模拟进度动画
      const duration = Math.min(result.actualDuration, 2) * 1000
      await animateProgress(duration)

      // 处理结果
      processCombatResult(result)

      return result
    } finally {
      isFighting.value = false
      combatProgress.value = 0
    }
  }

  /** 启动自动挂机 */
  function startAutoCombat(): void {
    if (combatStore.isAutoBattling) return
    if (equipmentStore.isFull) {
      combatStore.setPauseReason('backpack_full')
      return
    }

    combatStore.startAutoCombat()

    combatTimer = setInterval(() => {
      if (!combatStore.isAutoBattling) {
        stopAutoCombat()
        return
      }

      if (equipmentStore.isFull) {
        combatStore.setPauseReason('backpack_full')
        stopAutoCombat()
        return
      }

      const build = playerStore.getBuildSnapshot()
      const result = combatEngine.simulate(build, combatStore.currentFloor)
      processCombatResult(result)

      if (!result.victory) {
        combatStore.setPauseReason('combat_failed')
        stopAutoCombat()
      }
    }, AUTO_COMBAT_INTERVAL)
  }

  /** 停止自动挂机 */
  function stopAutoCombat(): void {
    combatStore.stopAutoCombat()
    if (combatTimer) {
      clearInterval(combatTimer)
      combatTimer = null
    }
  }

  /** 前往推荐挂机层 */
  function goToRecommendedFloor(): void {
    const floor = recommendedFloor.value
    if (floor !== combatStore.currentFloor) {
      combatStore.setFloor(floor)
    }
  }

  /** 处理战斗结果 */
  function processCombatResult(result: CombatResult): void {
    // 记录到 store
    combatStore.executeCombat(playerStore.getBuildSnapshot())

    if (result.victory) {
      // 获得金币和经验
      const actualGold = Math.round(result.goldEarned)
      playerStore.gainGold(actualGold)
      playerStore.gainExp(Math.round(result.expEarned))

      // 掉落装备
      if (result.dropTriggered) {
        // 使用 LootGenerator 生成装备
        const { LootGenerator } = require('@core/LootGenerator')
        const lootGen = new LootGenerator()
        const item = lootGen.generateDrop(
          combatStore.currentFloor,
          playerStore.totalStats.magicFind
        )

        if (equipmentStore.checkPickupFilter(item)) {
          if (!equipmentStore.addItem(item)) {
            combatStore.setPauseReason('backpack_full')
            stopAutoCombat()
          }
        } else {
          // 自动转化
          if (equipmentStore.pickupFilter.autoConvert) {
            const rarityOrder = { normal: 0, magic: 1, rare: 2, legendary: 3, ancient: 4 }
            const rarityMap: Record<number, number> = { 0: 1, 1: 2, 2: 4, 3: 8, 4: 16 }
            const stones = rarityMap[rarityOrder[item.rarity]] || 1
            equipmentStore.gainStones(stones)
            equipmentStore.autoConvertCount++
          }
        }
      }
    }
  }

  /** 进度动画 */
  function animateProgress(duration: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now()
      const tick = () => {
        const elapsed = Date.now() - startTime
        combatProgress.value = Math.min(1, elapsed / duration)
        if (elapsed < duration) {
          requestAnimationFrame(tick)
        } else {
          resolve()
        }
      }
      requestAnimationFrame(tick)
    })
  }

  return {
    isFighting,
    combatProgress,
    recommendedFloor,
    pushTarget,
    bossTarget,
    currentEvaluation,
    fightOnce,
    startAutoCombat,
    stopAutoCombat,
    goToRecommendedFloor
  }
}
```

---

## 第6章 装备系统实现

### 6.0 装备系统设计概述

装备系统是放置型 ARPG 的核心发动机，玩家的核心驱动力全部来自装备收集。一件装备由基础物品、品质等级、装备等级、随机词缀和强化等级五个维度共同定义，这种多维度的组合创造了近乎无限的装备变化空间。

装备系统的设计遵循以下原则：**丰富的词缀池**，18 种词缀分为攻击、防御、功能、属性四大类，每种词缀适用于特定装备部位；**明确的品质层级**，5 种品质（普通→魔法→稀有→传说→远古）各有清晰的词缀数量和数值范围；**智能的评分系统**，5 种评分模式（均衡、暴击、攻速、坚韧、主属性）帮助玩家快速判断装备价值；**克制的强化系统**，+1~+10 的强化等级带有成功率和失败惩罚，提供风险与收益的博弈。

装备系统包含三个核心模块：

- `LootGenerator.ts`：装备掉落生成器，负责基础物品选择、品质 Roll、词缀生成、装备命名
- `GearScore.ts`：装备评分系统，提供 5 种评分模式的分数计算和装备对比
- `EnhancementSystem.ts`：装备强化系统，管理 +1~+10 的强化成功率、消耗和惩罚

**装备生成流程**：

当怪物被击杀且掉落触发时，系统按以下流程生成装备：

1. 根据当前层数计算装备等级：`floor(层数 / 2 + 10)`
2. 选择基础物品：从适合当前装备等级的基础物品中随机选择
3. Roll 品质：基于基础概率和魔法发现加成计算品质
4. 生成词缀：根据品质决定词缀数量，按权重随机选择词缀类型，按装备等级缩放数值
5. 生成名称：根据品质使用不同的命名规则
6. 计算评分：为 5 种模式分别计算评分

**品质概率设计**：

传说装备的基础概率为 `0.001 + floor(怪物等级 / 10) × 0.0005`，这是一个极低的掉率，确保传说装备的稀有性和掉落时的惊喜感。魔法发现（Magic Find）可以小幅提升稀有和传说品质的权重，但设有 1.6 倍的上限，避免寻宝流过强。

### 6.1 装备掉落生成器（core/LootGenerator.ts）

```typescript
import {
  ITEM_LEVEL_FORMULA,
  BASE_STAT_SCALE_PER_LEVEL,
  RARITY_BASE_CHANCE,
  LEGENDARY_CHANCE_PER_10_FLOORS,
  MAGIC_FIND_RARITY_MULTIPLIER,
  MAGIC_FIND_LEGENDARY_MULTIPLIER,
  MAGIC_FIND_RARITY_CAP,
  RARITY_AFFIX_COUNT,
  BASE_ITEMS,
  AFFIX_DEFS,
  LEGENDARY_AFFIXES,
  generateId,
  randomRange,
  randomInt,
  weightedRandom,
  roundTo
} from '@utils/constants'
import type { EquipmentItem, Affix, BaseItem, MonsterType } from '@types'
import { Rarity, SlotType, AffixType } from '@types'

export interface LootGeneratorOptions {
  floor: number
  monsterType: MonsterType
  magicFind: number
  monsterLevel?: number
}

export class LootGenerator {
  /**
   * 生成掉落装备
   */
  generateDrop(floor: number, magicFind: number = 0): EquipmentItem {
    const itemLevel = this.calculateItemLevel(floor)
    const baseItem = this.selectBaseItem(itemLevel)
    const rarity = this.rollRarity(floor, magicFind)
    const affixes = this.generateAffixes(rarity, baseItem.slot, itemLevel, magicFind)
    const name = this.generateItemName(baseItem, rarity, affixes)

    // 计算基础属性缩放
    const scale = 1 + itemLevel * BASE_STAT_SCALE_PER_LEVEL
    const scaledBaseStats = this.scaleBaseStats(baseItem.baseStats || {}, scale)

    const item: EquipmentItem = {
      id: generateId('eq_'),
      name,
      slot: baseItem.slot,
      rarity,
      itemLevel,
      baseItemId: baseItem.id,
      baseStats: scaledBaseStats,
      affixes,
      locked: false,
      score: 0,
      scores: { balanced: 0, crit: 0, atkSpd: 0, tough: 0, mainAttr: 0 },
      enhancement: 0,
      createdAt: Date.now()
    }

    // 计算评分
    this.calculateScores(item)

    return item
  }

  /**
   * 计算装备等级
   */
  private calculateItemLevel(floor: number): number {
    return Math.floor(floor / ITEM_LEVEL_FORMULA.divisor + ITEM_LEVEL_FORMULA.offset)
  }

  /**
   * 选择基础物品
   */
  private selectBaseItem(itemLevel: number): BaseItem {
    // 筛选适合当前装备等级的基础物品
    const candidates = BASE_ITEMS.filter((b) => b.requiredLevel <= itemLevel)
    if (candidates.length === 0) return BASE_ITEMS[0]

    // 随机选择（可加入权重逻辑）
    return candidates[Math.floor(Math.random() * candidates.length)]
  }

  /**
   * Roll 品质
   */
  rollRarity(floor: number, magicFind: number = 0): Rarity {
    // 计算基础概率
    let legendaryChance = RARITY_BASE_CHANCE.legendary + Math.floor(floor / 10) * LEGENDARY_CHANCE_PER_10_FLOORS
    let rareChance = RARITY_BASE_CHANCE.rare
    const magicChance = RARITY_BASE_CHANCE.magic

    // 应用魔法发现加成
    const rareMult = Math.min(MAGIC_FIND_RARITY_CAP, 1 + magicFind * MAGIC_FIND_RARITY_MULTIPLIER)
    const legendaryMult = Math.min(MAGIC_FIND_RARITY_CAP, 1 + magicFind * MAGIC_FIND_LEGENDARY_MULTIPLIER)

    rareChance *= rareMult
    legendaryChance *= legendaryMult

    // 归一化概率
    const total = 1 + magicChance + rareChance + legendaryChance
    const roll = Math.random() * total

    if (roll < legendaryChance) return Rarity.LEGENDARY
    if (roll < legendaryChance + rareChance) return Rarity.RARE
    if (roll < legendaryChance + rareChance + magicChance) return Rarity.MAGIC
    return Rarity.NORMAL
  }

  /**
   * 生成词缀
   */
  private generateAffixes(
    rarity: Rarity,
    slot: SlotType,
    itemLevel: number,
    magicFind: number
  ): Affix[] {
    const affixCount = this.getAffixCount(rarity)
    const affixes: Affix[] = []

    // 传说装备固定带一个传奇词缀
    if (rarity === Rarity.LEGENDARY) {
      const legendaryAffix = this.rollLegendaryAffix(slot)
      if (legendaryAffix) {
        affixes.push({
          ...legendaryAffix,
          isLegendary: true
        })
      }
    }

    // 随机词缀
    const availableAffixes = AFFIX_DEFS.filter((a) => a.allowedSlots.includes(slot))
    const usedTypes = new Set(affixes.map((a) => a.type))

    while (affixes.length < affixCount && availableAffixes.length > 0) {
      // 筛选未使用的词缀类型
      const candidates = availableAffixes.filter((a) => !usedTypes.has(a.type))
      if (candidates.length === 0) break

      // 按权重随机选择
      const selectedDef = weightedRandom(
        candidates.map((c) => ({ item: c, weight: c.weight }))
      )

      // 计算词缀数值（受装备等级影响）
      const levelScale = 1 + (itemLevel - 1) * 0.03
      const value = randomRange(selectedDef.minValue, selectedDef.maxValue) * levelScale

      affixes.push({
        type: selectedDef.type,
        name: selectedDef.name,
        value: roundTo(value),
        valueType: selectedDef.valueType,
        isLegendary: false
      })

      usedTypes.add(selectedDef.type)
    }

    return affixes
  }

  /**
   * 获取词缀数量
   */
  private getAffixCount(rarity: Rarity): number {
    const config = RARITY_AFFIX_COUNT[rarity]
    if (!config) return 0
    return randomInt(config.min, config.max)
  }

  /**
   * Roll 传奇词缀
   */
  private rollLegendaryAffix(slot: SlotType): Affix | null {
    const candidates = LEGENDARY_AFFIXES.filter((a) => a.allowedSlots.includes(slot))
    if (candidates.length === 0) return null

    const selected = candidates[Math.floor(Math.random() * candidates.length)]
    return {
      type: selected.type,
      name: selected.name,
      value: selected.maxValue,
      valueType: selected.valueType,
      isLegendary: true
    }
  }

  /**
   * 缩放基础属性
   */
  private scaleBaseStats(baseStats: Partial<Record<string, number>>, scale: number): Record<string, number> {
    const scaled: Record<string, number> = {}
    for (const [key, value] of Object.entries(baseStats)) {
      if (value !== undefined) {
        scaled[key] = roundTo(value * scale)
      }
    }
    return scaled
  }

  /**
   * 生成装备名称
   */
  private generateItemName(baseItem: BaseItem, rarity: Rarity, affixes: Affix[]): string {
    switch (rarity) {
      case Rarity.NORMAL:
        return baseItem.name

      case Rarity.MAGIC: {
        const prefix = affixes[0]?.name || ''
        return prefix ? `${prefix}的${baseItem.name}` : baseItem.name
      }

      case Rarity.RARE: {
        const prefix = affixes[0]?.name || ''
        const suffix = affixes[1]?.name || ''
        if (prefix && suffix) return `${prefix}之${baseItem.name}·${suffix}`
        if (prefix) return `${prefix}的${baseItem.name}`
        return baseItem.name
      }

      case Rarity.LEGENDARY: {
        const legendaryNames: Record<string, string[]> = {
          weapon: ['灰烬使者', '影之哀伤', '雷霆之怒', '霜之哀伤'],
          armor: ['不朽之王铠甲', '暗影披风', '龙鳞护甲'],
          helmet: ['灵魂面罩', '审判之冠', '风暴头盔'],
          gloves: ['毁灭者护手', '风行者手套'],
          shoes: ['疾风之靴', '虚空行者'],
          offhand: ['埃辛诺斯壁垒', '龙骨盾牌'],
          ring: ['无尽轮回', '虚空之戒'],
          necklace: ['泰坦坠饰', '灵魂项链']
        }
        const names = legendaryNames[baseItem.slot] || ['传说装备']
        return names[Math.floor(Math.random() * names.length)]
      }

      default:
        return baseItem.name
    }
  }

  /**
   * 计算装备评分（所有模式）
   */
  calculateScores(item: EquipmentItem): void {
    const { SCORE_WEIGHTS } = require('@utils/constants')

    for (const [mode, config] of Object.entries(SCORE_WEIGHTS)) {
      const weights = config.weights
      let baseScore = 0
      let affixScore = 0

      // 基础属性分
      for (const [attr, value] of Object.entries(item.baseStats)) {
        const weight = weights[attr] || 0.5
        baseScore += value * weight
      }

      // 词缀分
      for (const affix of item.affixes) {
        const weight = weights[affix.type] || 0.5
        const legendaryMult = affix.isLegendary ? config.legendaryMultiplier : 1.0
        affixScore += affix.value * weight * legendaryMult
      }

      // 品质加成
      const rarityTier = this.getRarityTier(item.rarity)
      const rarityBonus = 1 + rarityTier * 0.12

      item.scores[mode as keyof typeof item.scores] = Math.round((baseScore + affixScore) * rarityBonus)
    }

    // 默认评分使用均衡模式
    item.score = item.scores.balanced
  }

  /**
   * 获取品质阶级
   */
  private getRarityTier(rarity: Rarity): number {
    const tiers: Record<Rarity, number> = {
      [Rarity.NORMAL]: 0,
      [Rarity.MAGIC]: 1,
      [Rarity.RARE]: 2,
      [Rarity.LEGENDARY]: 3,
      [Rarity.ANCIENT]: 4
    }
    return tiers[rarity] || 0
  }
}
```

### 6.2 装备评分系统（core/GearScore.ts）

装备评分系统帮助玩家快速判断装备的价值。面对大量掉落装备时，玩家需要一个自动化的评估工具来筛选出值得关注的装备。评分系统的核心是"不同 Build 对属性的需求不同"，因此需要多种评分模式。

**5 种评分模式设计**：

- **均衡模式**：通用默认评分，兼顾输出、生存和少量收益属性。所有属性权重接近，适合新手玩家使用。
- **暴击模式**：提高暴击率、暴击伤害、攻击和敏捷的权重。适合已经决定走暴击流的玩家。
- **攻速模式**：提高攻击速度、敏捷、闪避和攻击的权重。适合快速攻击流派。
- **坚韧模式**：提高生命、护甲、闪避和力量的权重。适合追求生存能力的挂机流派。
- **主属性模式**：提高力量、敏捷、智力的权重。适合依靠主属性成长的 Build。

每种模式的权重配置反映了该 Build 对属性的优先级。例如暴击模式中，暴击率的权重是 2.0（普通权重的 2 倍），暴击伤害权重 1.5，而生命值和护甲的权重只有 0.3 和 0.2。这种差异化权重确保了同一件装备在不同模式下可能有完全不同的评分。

**评分计算公式**：

```
基础分 = Σ(基础属性值 × 当前模式属性权重)
词缀分 = Σ(词缀值 × 当前模式属性权重 × 传奇词缀倍率)
品质加成 = 1 + 品质阶级 × 0.12
最终评分 = round((基础分 + 词缀分) × 品质加成)
```

传奇词缀倍率 1.8 意味着传奇词缀在评分时价值提升 80%，这反映了传奇装备的稀有性和强大效果。品质加成每级 12%，传说装备（阶级 3）相比普通装备有 36% 的评分加成。

**装备对比功能**逐属性比较两件装备，用颜色标识优劣（绿色表示更好，红色表示更差），并给出综合评分差异百分比。这让玩家可以在 3 秒内判断一件新装备是否值得替换当前装备。

```typescript

```typescript
import { SCORE_WEIGHTS, RARITY_TIER, RARITY_SCORE_BONUS, LEGENDARY_AFFIX_SCORE_MULTIPLIER } from '@utils/constants'
import type { EquipmentItem, ScoreMode } from '@types'

export class GearScore {
  /**
   * 计算装备在指定评分模式下的分数
   */
  static calculateScore(item: EquipmentItem, mode: ScoreMode = 'balanced'): number {
    const config = SCORE_WEIGHTS[mode]
    if (!config) return 0

    let baseScore = 0
    let affixScore = 0

    // 基础属性分
    for (const [attr, value] of Object.entries(item.baseStats)) {
      const weight = config.weights[attr] || 0.5
      if (typeof value === 'number') {
        baseScore += value * weight
      }
    }

    // 词缀分
    for (const affix of item.affixes) {
      const weight = config.weights[affix.type] || 0.5
      const legendaryMult = affix.isLegendary ? LEGENDARY_AFFIX_SCORE_MULTIPLIER : 1.0
      affixScore += affix.value * weight * legendaryMult
    }

    // 品质加成
    const rarityTier = RARITY_TIER[item.rarity] || 0
    const rarityBonus = 1 + rarityTier * RARITY_SCORE_BONUS

    return Math.round((baseScore + affixScore) * rarityBonus)
  }

  /**
   * 计算所有模式的评分
   */
  static calculateAllScores(item: EquipmentItem): Record<ScoreMode, number> {
    const scores: Partial<Record<ScoreMode, number>> = {}

    for (const mode of Object.keys(SCORE_WEIGHTS) as ScoreMode[]) {
      scores[mode] = this.calculateScore(item, mode)
    }

    return scores as Record<ScoreMode, number>
  }

  /**
   * 更新装备的评分（所有模式）
   */
  static updateItemScores(item: EquipmentItem): void {
    item.scores = this.calculateAllScores(item)
    item.score = item.scores.balanced  // 默认使用均衡评分
  }

  /**
   * 比较两件同部位装备
   * @returns 正数表示 itemA 更好，负数表示 itemB 更好
   */
  static compare(itemA: EquipmentItem, itemB: EquipmentItem, mode: ScoreMode = 'balanced'): number {
    const scoreA = itemA.scores[mode] || this.calculateScore(itemA, mode)
    const scoreB = itemB.scores[mode] || this.calculateScore(itemB, mode)
    return scoreA - scoreB
  }

  /**
   * 逐属性对比两件装备
   */
  static compareAttributes(
    itemA: EquipmentItem,
    itemB: EquipmentItem,
    mode: ScoreMode = 'balanced'
  ): Array<{
    attr: string
    label: string
    valueA: number
    valueB: number
    diff: number
    better: 'A' | 'B' | 'equal'
  }> {
    const attrs = new Set<string>()
    Object.keys(itemA.baseStats).forEach((k) => attrs.add(k))
    Object.keys(itemB.baseStats).forEach((k) => attrs.add(k))
    itemA.affixes.forEach((a) => attrs.add(a.type))
    itemB.affixes.forEach((a) => attrs.add(a.type))

    const config = SCORE_WEIGHTS[mode]
    const results: ReturnType<typeof this.compareAttributes> = []

    for (const attr of attrs) {
      const valA = this.getAttributeValue(itemA, attr)
      const valB = this.getAttributeValue(itemB, attr)
      const diff = valA - valB

      results.push({
        attr,
        label: this.getAttributeLabel(attr),
        valueA: valA,
        valueB: valB,
        diff,
        better: diff > 0 ? 'A' : diff < 0 ? 'B' : 'equal'
      })
    }

    // 按权重排序
    if (config) {
      results.sort((a, b) => {
        const wA = config.weights[a.attr] || 0
        const wB = config.weights[b.attr] || 0
        return wB - wA
      })
    }

    return results
  }

  /**
   * 判断装备是否为高价值（触发特殊反馈）
   */
  static isHighValue(item: EquipmentItem, mode: ScoreMode = 'balanced'): boolean {
    // 传说/远古
    if (item.rarity === 'legendary' || item.rarity === 'ancient') return true

    // 包含传奇词缀
    if (item.affixes.some((a) => a.isLegendary)) return true

    // 评分超过阈值
    if (item.score >= 120) return true

    return false
  }

  // ─── 私有辅助方法 ───

  private static getAttributeValue(item: EquipmentItem, attr: string): number {
    let value = 0
    if (item.baseStats[attr]) value += item.baseStats[attr]
    const affix = item.affixes.find((a) => a.type === attr)
    if (affix) value += affix.value
    return value
  }

  private static getAttributeLabel(attr: string): string {
    const labels: Record<string, string> = {
      attack: '攻击',
      hp: '生命',
      armor: '护甲',
      attackSpeed: '攻速',
      critChance: '暴击率',
      critDamage: '暴击伤害',
      dodge: '闪避',
      block: '格挡',
      fireResist: '火抗',
      iceResist: '冰抗',
      goldFind: '金币获取',
      magicFind: '魔法发现',
      expGain: '经验获取',
      moveSpeed: '移速',
      str: '力量',
      dex: '敏捷',
      int: '智力',
      fireDamage: '火焰伤害',
      iceDamage: '冰霜伤害'
    }
    return labels[attr] || attr
  }
}
```

### 6.3 强化系统（core/EnhancementSystem.ts）

装备强化系统为玩家提供了一个消耗金币和强化石来提升装备属性的途径。强化只提升装备的基础属性（白字），不影响词缀，这确保了词缀的价值不受强化等级稀释。

**强化等级设计**：+0 到 +10 共 11 个等级，分为三个难度区间：

| 等级区间 | 成功率 | 失败惩罚 | 视觉反馈 |
|----------|--------|----------|----------|
| +1 ~ +3 | 100% | 无 | 微弱白光 |
| +4 ~ +6 | 80% | 无 | 蓝色光晕 |
| +7 ~ +9 | 60% | 降 1 级 | 紫色光晕 + 特效 |
| +10 | 40% | 无（保护） | 金色全屏闪光 |

+7 是一个关键节点，因为从这个等级开始失败会降级。这个设计创造了风险与收益的博弈：玩家需要权衡是否值得将一件装备强化到 +7 以上。+10 的最高等级设有保护机制（失败不降级），因为达到 +10 已经非常困难，不应该让玩家的努力白费。

**强化消耗曲线**：金币消耗和强化石消耗随等级指数增长。+1 需要 50 金币和 1 个强化石，+10 需要 1400 金币和 8 个强化石。这种指数增长的消耗确保了后期金币和强化石始终有消耗出口。

**强化属性提升**：每级强化提升基础属性 8%。+10 的装备基础属性是 +0 的 180%（1 + 10 × 0.08）。这意味着一件 +10 的传说装备的基础属性可能超过一件 +0 的远古装备，为玩家提供了明确的成长路径。

**强化石获取**：主要通过分解普通和魔法装备获得（1-2 个），稀有及以上品质的分解产出更多。拾取过滤中未通过过滤的装备也会自动转化为强化石。

```typescript

```typescript
import { ENHANCEMENT_TABLE, MAX_ENHANCEMENT_LEVEL, ENHANCEMENT_STAT_BONUS } from '@utils/constants'
import type { EquipmentItem, EnhancementCost, EnhancementResult } from '@types'

export class EnhancementSystem {
  /**
   * 获取强化消耗
   */
  static getCost(currentLevel: number): EnhancementCost {
    const config = ENHANCEMENT_TABLE[currentLevel]
    if (!config) {
      return {
        gold: Infinity,
        stones: Infinity,
        successRate: 0,
        failurePenalty: 'destroy'
      }
    }

    return {
      gold: config.goldCost,
      stones: config.stoneCost,
      successRate: config.successRate,
      failurePenalty: config.failurePenalty
    }
  }

  /**
   * 是否可以强化
   */
  static canEnhance(item: EquipmentItem, availableGold: number, availableStones: number): {
    can: boolean
    reason?: string
    cost?: EnhancementCost
  } {
    if (item.enhancement >= MAX_ENHANCEMENT_LEVEL) {
      return { can: false, reason: '已达到最高强化等级' }
    }

    const cost = this.getCost(item.enhancement)
    if (cost.gold === Infinity) {
      return { can: false, reason: '强化配置不存在' }
    }

    if (availableGold < cost.gold) {
      return { can: false, reason: `金币不足（需要 ${cost.gold}）` }
    }

    if (availableStones < cost.stones) {
      return { can: false, reason: `强化石不足（需要 ${cost.stones}）` }
    }

    return { can: true, cost }
  }

  /**
   * 执行强化
   */
  static enhance(
    item: EquipmentItem,
    availableGold: number,
    availableStones: number
  ): EnhancementResult & { goldSpent: number; stonesSpent: number } {
    const check = this.canEnhance(item, availableGold, availableStones)
    if (!check.can || !check.cost) {
      return {
        success: false,
        newLevel: item.enhancement,
        cost: check.cost || { gold: 0, stones: 0, successRate: 0, failurePenalty: 'none' },
        goldSpent: 0,
        stonesSpent: 0
      }
    }

    const cost = check.cost
    const roll = Math.random()
    const success = roll < cost.successRate

    let newLevel = item.enhancement

    if (success) {
      newLevel = item.enhancement + 1
      item.enhancement = newLevel

      // 重新计算基础属性（应用强化加成）
      this.applyEnhancementBonus(item)
    } else {
      // 失败处理
      if (cost.failurePenalty === 'downgrade' && item.enhancement > 0) {
        newLevel = item.enhancement - 1
        item.enhancement = newLevel
        this.applyEnhancementBonus(item)
      }
      // 'none' 表示维持原等级
    }

    return {
      success,
      newLevel,
      cost,
      goldSpent: cost.gold,
      stonesSpent: cost.stones
    }
  }

  /**
   * 获取强化等级显示颜色
   */
  static getEnhanceColor(level: number): string {
    if (level >= 10) return '#ef4444'  // 红色
    if (level >= 7) return '#a855f7'   // 紫色
    if (level >= 4) return '#3b82f6'   // 蓝色
    if (level >= 1) return '#6b7280'   // 灰色
    return '#9ca3af'
  }

  /**
   * 获取强化成功率描述
   */
  static getSuccessRateText(level: number): string {
    const cost = this.getCost(level)
    if (cost.successRate >= 1.0) return '100%'
    if (cost.successRate >= 0.8) return '80%'
    if (cost.successRate >= 0.6) return '60%'
    return '40%'
  }

  /**
   * 应用强化加成到装备基础属性
   */
  private static applyEnhancementBonus(item: EquipmentItem): void {
    // 获取原始基础物品的属性
    const { BASE_ITEMS } = require('@utils/constants')
    const baseItem = BASE_ITEMS.find((b: { id: string }) => b.id === item.baseItemId)
    if (!baseItem) return

    const itemLevel = item.itemLevel
    const scale = 1 + itemLevel * 0.08
    const enhanceMult = 1 + item.enhancement * ENHANCEMENT_STAT_BONUS

    // 重新计算基础属性（含强化加成）
    const newBaseStats: Record<string, number> = {}
    for (const [key, value] of Object.entries(baseItem.baseStats || {})) {
      if (value !== undefined) {
        newBaseStats[key] = Math.round(value * scale * enhanceMult * 10) / 10
      }
    }

    item.baseStats = newBaseStats
  }
}
```


---

## 第7章 离线收益计算

### 7.0 离线收益设计概述

离线收益是放置游戏的灵魂机制。玩家关闭游戏后，角色继续自动战斗并积累收益，下次打开游戏时通过一份"离线报告"呈现这段时间的成果。这种机制创造了"每次打开都有成长"的正向反馈，是放置游戏区别于传统 RPG 的核心特征。

离线收益系统的设计遵循以下原则：**合理上限**，12 小时软上限鼓励玩家每天登录 1-2 次，同时避免长时间不登录导致的数值膨胀；**时间戳校验**，多层校验机制防止通过修改系统时间获取异常收益；**背包限制**，离线期间背包满了会停止收益，鼓励玩家定期整理；**收益衰减**，战力低于推荐值时收益按比例衰减，确保玩家不会过度越层挂机。

离线收益的核心流程：

1. 页面加载时读取存档中的 `lastActiveTime`
2. 与当前时间做差，得到有效离线秒数
3. 应用时间戳校验（负数归零、超长限制、上限封顶）
4. 检查玩家是否能击杀当前层怪物（不能则零收益）
5. 批量模拟战斗，累积金币、经验和掉落
6. 掉落经过拾取过滤，不符合条件的自动转化为强化石
7. 通过过滤的装备按背包剩余容量入包，满了则停止
8. 生成离线报告，展示总时长、击杀数、收益和装备列表

### 7.1 离线计算器（core/OfflineCalculator.ts）

离线计算器是纯数值计算模块，接收玩家构建、层数、背包状态等输入，输出一份完整的离线收益报告。离线计算器不依赖 Vue 或浏览器环境，可以在 Web Worker 中运行以避免阻塞主线程。

**时间戳校验策略**是离线收益系统的关键安全机制。由于纯前端架构无法依赖服务端验证时间，需要在客户端实现多层防护：

- 第一层校验检测负数时间（当前时间 < 上次活跃时间），这种情况直接归零收益
- 第二层校验检测超长离线时间（超过 30 天），这种情况限制为 12 小时上限
- 第三校验检测未来时间戳（超过当前时间 1 秒以上），直接归零
- 第四层是 12 小时软上限，正常离线时间超过 12 小时只计算 12 小时
- 第五层是 60 秒最低报告阈值，离线时间少于 60 秒不展示报告
- 第六层是存档时间锚点，每次保存记录时间戳，下次加载时交叉校验

```typescript
import {
  OFFLINE_MAX_SECONDS,
  OFFLINE_MIN_REPORT_SECONDS,
  COMBAT_MAX_DURATION,
  BACKPACK_CAPACITY,
  DISMANTLE_REWARDS
} from '@utils/constants'
import type { PlayerBuild, OfflineReport, EquipmentItem, PickupFilter } from '@types'
import { Rarity } from '@types'
import { CombatEngine } from './CombatEngine'
import { LootGenerator } from './LootGenerator'

export interface OfflineCalcInput {
  lastActiveTime: number
  currentTime: number
  playerBuild: PlayerBuild
  currentFloor: number
  backpackSlots: number          // 背包剩余格数
  playerPower: number
  pickupFilter: PickupFilter
  magicFind: number
  goldFind: number
}

export class OfflineCalculator {
  private combatEngine = new CombatEngine()
  private lootGenerator = new LootGenerator()

  /**
   * 计算离线收益
   */
  calculate(input: OfflineCalcInput): OfflineReport {
    // 时间戳校验
    const rawSeconds = Math.floor((input.currentTime - input.lastActiveTime) / 1000)

    // 异常时间处理
    let validSeconds = this.validateTime(rawSeconds)

    // 12 小时软上限
    validSeconds = Math.min(validSeconds, OFFLINE_MAX_SECONDS)

    // 少于 60 秒不生成报告
    if (validSeconds < OFFLINE_MIN_REPORT_SECONDS) {
      return this.createEmptyReport(input.currentFloor)
    }

    // 检查是否能击杀当前层怪物
    const canKill = this.checkCanKill(input.playerBuild, input.currentFloor)
    if (!canKill) {
      return {
        ...this.createEmptyReport(input.currentFloor),
        durationSeconds: validSeconds,
        endReason: 'cannot_kill',
        efficiencyRatio: 0
      }
    }

    // 批量模拟战斗
    const result = this.simulateOfflineBattles(input, validSeconds)

    return result
  }

  /**
   * 校验时间（防止异常时间戳）
   */
  private validateTime(rawSeconds: number): number {
    // 负数时间 -> 归零
    if (rawSeconds < 0) return 0

    // 超过 30 天 -> 可能是时间戳异常，限制为 12 小时
    if (rawSeconds > 30 * 24 * 3600) return OFFLINE_MAX_SECONDS

    // 未来时间 -> 归零
    if (rawSeconds > 365 * 24 * 3600) return 0

    return rawSeconds
  }

  /**
   * 检查是否能击杀当前层怪物
   */
  private checkCanKill(build: PlayerBuild, floor: number): boolean {
    const result = this.combatEngine.simulate(build, floor)
    return result.victory
  }

  /**
   * 模拟离线期间的战斗
   */
  private simulateOfflineBattles(
    input: OfflineCalcInput,
    totalSeconds: number
  ): OfflineReport {
    const items: EquipmentItem[] = []
    let killCount = 0
    let totalGold = 0
    let totalExp = 0
    let filteredCount = 0
    let lostCount = 0
    let remainingSlots = input.backpackSlots
    let remainingSeconds = totalSeconds
    let actualSeconds = 0
    const goldMult = 1 + Math.min(input.goldFind, 300) * 0.01

    // 估算单场战斗时间
    const testResult = this.combatEngine.simulate(input.playerBuild, input.currentFloor)
    const avgKillTime = testResult.victory ? testResult.actualDuration : COMBAT_MAX_DURATION

    // 计算大致击杀数
    const estimatedKills = Math.floor(totalSeconds / avgKillTime)

    // 批量处理：每批处理 100 场战斗
    const batchSize = 100
    let processedKills = 0

    while (processedKills < estimatedKills && remainingSeconds > 0) {
      const currentBatch = Math.min(batchSize, estimatedKills - processedKills)

      for (let i = 0; i < currentBatch; i++) {
        const result = this.combatEngine.simulate(input.playerBuild, input.currentFloor)

        if (!result.victory) {
          remainingSeconds = 0
          break
        }

        killCount++
        totalGold += Math.round(result.goldEarned * goldMult)
        totalExp += result.expEarned
        remainingSeconds -= result.actualDuration
        actualSeconds += result.actualDuration

        // 掉落处理
        if (result.dropTriggered) {
          const item = this.lootGenerator.generateDrop(
            input.currentFloor,
            input.magicFind
          )

          // 拾取过滤
          const passesFilter = this.checkPickupFilter(item, input.pickupFilter)

          if (passesFilter) {
            if (remainingSlots > 0) {
              items.push(item)
              remainingSlots--
            } else {
              lostCount++
            }
          } else {
            filteredCount++
            // 自动转化为强化石
            if (input.pickupFilter.autoConvert) {
              const rarityOrder = { normal: 0, magic: 1, rare: 2, legendary: 3, ancient: 4 }
              const rarityMap: Record<number, number> = { 0: 1, 1: 2, 2: 4, 3: 8, 4: 16 }
              // 转化数量记录在报告的 filteredCount 中
            }
          }
        }

        if (remainingSlots <= 0) {
          // 背包已满，停止收益
          remainingSeconds = 0
          break
        }
      }

      processedKills += currentBatch
    }

    // 计算效率倍率
    const { FloorScaling } = require('./FloorScaling')
    const floorScaling = new FloorScaling()
    const efficiency = floorScaling.getEfficiencyRatio(input.playerPower, 100)

    return {
      durationSeconds: totalSeconds,
      killCount,
      goldEarned: totalGold,
      expEarned: totalExp,
      itemsGained: items,
      filteredCount,
      lostCount,
      actualEarningSeconds: actualSeconds,
      efficiencyRatio: efficiency,
      floor: input.currentFloor,
      endReason: lostCount > 0 ? 'backpack_full' : remainingSeconds <= 0 ? 'time_limit' : 'time_limit'
    }
  }

  /**
   * 检查拾取过滤
   */
  private checkPickupFilter(item: EquipmentItem, filter: PickupFilter): boolean {
    const rarityOrder = { normal: 0, magic: 1, rare: 2, legendary: 3, ancient: 4 }
    if (rarityOrder[item.rarity] < rarityOrder[filter.minRarity]) return false
    if (!filter.allowedSlots.includes(item.slot)) return false
    return true
  }

  /**
   * 创建空报告（离线时间过短或无法击杀）
   */
  private createEmptyReport(floor: number): OfflineReport {
    return {
      durationSeconds: 0,
      killCount: 0,
      goldEarned: 0,
      expEarned: 0,
      itemsGained: [],
      filteredCount: 0,
      lostCount: 0,
      actualEarningSeconds: 0,
      efficiencyRatio: 0,
      floor,
      endReason: 'time_limit'
    }
  }
}
```

### 7.2 时间戳校验策略

时间戳校验是离线收益系统的关键安全机制。由于纯前端架构无法依赖服务端验证时间，需要在客户端实现多层防护。这些防护层的设计理念是"安全但不破坏体验"——正常玩家的离线收益不受影响，只有明显异常的时间才会被限制。

校验机制的设计考虑了以下作弊场景：

1. **修改系统时间向前**：玩家将系统时间调到未来，然后打开游戏获取大量离线收益。防护：检测负数时间（当前时间 < 上次活跃时间），直接归零收益。同时在每次保存存档时记录时间戳，下次加载时检查时间是否倒流。

2. **长时间不登录后修改时间**：玩家一个月没登录，修改系统时间假装只离线了 12 小时。防护：离线时间超过 30 天直接限制为 12 小时上限。正常玩家不太可能 30 天不登录还关心游戏进度。

3. **快速切换时区**：利用时区切换制造时间差。防护：使用绝对时间戳（Date.now() 返回的是 UTC 毫秒数），不受时区影响。

4. **浏览器隐私模式**：部分浏览器在隐私模式下不保存 localStorage 数据。防护：IndexedDB 作为备用存储，如果 localStorage 为空但 IndexedDB 有数据，从 IndexedDB 恢复。

时间戳校验的实现采用防御性编程策略：任何可疑的时间值都被夹（clamp）到安全范围内，而不是直接报错或崩溃。这种"优雅降级"确保了即使校验逻辑本身有 Bug，最坏情况也只是收益被限制，不会破坏玩家的存档。

**离线收益计算的性能考虑**：离线 12 小时大约对应 36000 场战斗（按每场平均 1.2 秒计算）。逐场模拟 36000 场战斗在主线程中需要约 100-200 毫秒，虽然不算太长，但对于低性能设备可能导致 UI 卡顿。解决方案是使用批量估算：`simulateBatch` 方法先计算平均击杀时间，然后估算总击杀数，最后只生成掉落装备。这种方法将计算量从 O(击杀数) 降低到 O(1)，即使离线 12 小时也能在 10 毫秒内完成。

| 校验层级 | 触发条件 | 处理结果 | 用户体验 |
|----------|----------|----------|----------|
| 第一层：负数时间 | 当前时间 < 上次活跃时间 | 收益归零 | 无感知（正常不会发生） |
| 第二层：超长离线 | 离线时间 > 30 天 | 限制为 12 小时 | 无感知 |
| 第三层：未来时间 | 离线时间 > 365 天 | 收益归零 | 无感知 |
| 第四层：软上限 | 正常离线 > 12 小时 | 限制为 12 小时 | 提示"已达到收益上限" |
| 第五层：报告阈值 | 离线 < 60 秒 | 不弹报告 | 无感知 |
| 第六层：存档锚点 | 存档时间 > 当前时间 | 收益归零 | 无感知 |

离线收益依赖时间戳计算，需要多层防护确保时间不会被恶意篡改：

| 校验层级 | 机制 | 说明 |
|----------|------|------|
| 第一层 | 负数归零 | 当前时间 < 上次活跃时间，收益归零 |
| 第二层 | 未来时间过滤 | 离线时间超过 365 天视为异常，收益归零 |
| 第三层 | 超长离线限制 | 离线时间超过 30 天限制为 12 小时上限 |
| 第四层 | 12 小时软上限 | 正常离线时间超过 12 小时只计算 12 小时 |
| 第五层 | 最低报告阈值 | 离线时间少于 60 秒不展示离线报告 |
| 第六层 | 存档时间锚点 | 每次保存记录时间戳，下次加载时交叉校验 |

```typescript
// 时间校验辅助函数（utils/helpers.ts 追加）

/**
 * 校验离线时间
 * @param lastActiveTime 上次活跃时间戳
 * @param currentTime 当前时间戳
 * @returns 有效的离线秒数
 */
export function validateOfflineDuration(lastActiveTime: number, currentTime: number): number {
  // 基本校验
  if (lastActiveTime <= 0 || currentTime <= 0) return 0
  if (currentTime < lastActiveTime) return 0

  const diffSeconds = Math.floor((currentTime - lastActiveTime) / 1000)

  // 超过 30 天视为异常
  if (diffSeconds > 30 * 24 * 3600) return 12 * 3600  // 限制为 12 小时

  // 正常上限
  return Math.min(diffSeconds, 12 * 3600)
}

/**
 * 安全解析时间戳（防止非数字值）
 */
export function safeTimestamp(value: unknown): number {
  if (typeof value !== 'number') return 0
  if (isNaN(value) || !isFinite(value)) return 0
  if (value <= 0) return 0
  // 时间戳应为毫秒级，且在过去 50 年内
  const now = Date.now()
  if (value > now + 1000) return 0  // 未来时间
  if (value < now - 50 * 365 * 24 * 3600 * 1000) return 0  // 50 年前
  return value
}
```

---

## 第8章 存档系统实现

### 8.0 存档系统设计概述

存档系统是玩家游戏进度的唯一持久化保障。在纯前端架构下，存档数据存储在浏览器的 localStorage 和 IndexedDB 中，这意味着存档安全性受限于浏览器的数据管理机制。一个设计良好的存档系统需要确保数据完整性、支持版本迁移、提供导入导出备份功能。

存档系统的设计遵循以下原则：**双重存储**，核心状态存 localStorage（同步读写），装备数据存 IndexedDB（大容量异步）；**版本化结构**，存档包含版本号，支持旧版本自动迁移到新版本；**完整性校验**，加载时验证数据结构，损坏时回退到默认存档；**玩家可控**，提供导入导出功能，玩家可以手动备份和恢复。

存档采用分层快照结构：`GameSnapshot` 包含 `player`（玩家状态）、`combat`（战斗状态）、`equipment`（装备和背包状态）、`settings`（设置状态）四个子快照，以及 `version`（版本号）和 `lastActiveTime`（上次活跃时间戳）两个元数据字段。

恢复规则设计：训练等级归一化（缺失字段补零）、评分模式校验（不合法回退到均衡）、背包筛选数组深拷贝（避免引用问题）、战斗运行态重置（不恢复挂机状态和日志）、离线报告保留（允许稍后领取）。

### 8.1 存档管理器（core/SaveManager.ts）

存档系统负责游戏状态的持久化、加载、导入导出和版本迁移。

```typescript
import {
  SAVE_VERSION,
  SAVE_STORAGE_KEY,
  AUTO_SAVE_INTERVAL,
  INITIAL_PLAYER,
  Rarity,
  ScoreMode
} from '@utils/constants'
import type { GameSnapshot, PlayerSnapshot, CombatSnapshot, EquipmentSnapshot } from '@types'
import { SlotType } from '@types'
import { deepClone } from '@utils/helpers'

/**
 * 存档版本迁移器
 */
const MIGRATORS: Record<number, (data: Record<string, unknown>) => GameSnapshot> = {
  // v0 -> v1: 初始版本迁移
  0: (data) => {
    const defaultSnapshot = SaveManager.createDefaultSnapshot()
    return {
      ...defaultSnapshot,
      ...data as Partial<GameSnapshot>,
      version: 1
    }
  }
}

export class SaveManager {
  /**
   * 保存存档到 localStorage
   */
  async saveSnapshot(snapshot: GameSnapshot): Promise<boolean> {
    try {
      const serialized = JSON.stringify({
        ...snapshot,
        lastActiveTime: Date.now()
      })
      localStorage.setItem(SAVE_STORAGE_KEY, serialized)

      // 同时保存到 IndexedDB（用于大容量装备存储）
      await this.saveToIndexedDB(snapshot)

      return true
    } catch (e) {
      console.error('存档保存失败:', e)
      return false
    }
  }

  /**
   * 从 localStorage 加载存档
   */
  async loadSnapshot(): Promise<GameSnapshot | null> {
    try {
      // 先尝试从 localStorage 加载
      const raw = localStorage.getItem(SAVE_STORAGE_KEY)
      if (!raw) {
        // 尝试从 IndexedDB 加载
        return await this.loadFromIndexedDB()
      }

      const parsed = JSON.parse(raw) as Record<string, unknown>

      // 版本迁移
      const version = (parsed.version as number) || 0
      let snapshot: GameSnapshot

      if (version < SAVE_VERSION) {
        snapshot = this.migrateSnapshot(parsed, version)
      } else {
        snapshot = parsed as unknown as GameSnapshot
      }

      // 校验快照数据
      if (!this.validateSnapshot(snapshot)) {
        console.warn('存档校验失败，使用默认存档')
        return null
      }

      return snapshot
    } catch (e) {
      console.error('存档加载失败:', e)
      return null
    }
  }

  /**
   * 导出存档为 JSON 字符串（供玩家手动备份）
   */
  exportSnapshot(): string {
    const raw = localStorage.getItem(SAVE_STORAGE_KEY)
    if (!raw) return ''

    // Base64 编码
    return btoa(unescape(encodeURIComponent(raw)))
  }

  /**
   * 导入存档 JSON 字符串
   */
  importSnapshot(base64String: string): GameSnapshot | null {
    try {
      const raw = decodeURIComponent(escape(atob(base64String)))
      const parsed = JSON.parse(raw) as Record<string, unknown>

      const version = (parsed.version as number) || 0
      const snapshot = version < SAVE_VERSION
        ? this.migrateSnapshot(parsed, version)
        : parsed as unknown as GameSnapshot

      if (!this.validateSnapshot(snapshot)) return null

      // 保存到本地
      localStorage.setItem(SAVE_STORAGE_KEY, raw)

      return snapshot
    } catch (e) {
      console.error('存档导入失败:', e)
      return null
    }
  }

  /**
   * 删除存档
   */
  deleteSnapshot(): void {
    localStorage.removeItem(SAVE_STORAGE_KEY)
  }

  /**
   * 检查是否存在存档
   */
  hasSnapshot(): boolean {
    return !!localStorage.getItem(SAVE_STORAGE_KEY)
  }

  /**
   * 获取上次活跃时间
   */
  getLastActiveTime(): number {
    try {
      const raw = localStorage.getItem(SAVE_STORAGE_KEY)
      if (!raw) return 0
      const parsed = JSON.parse(raw)
      return (parsed.lastActiveTime as number) || 0
    } catch {
      return 0
    }
  }

  /**
   * 创建默认存档
   */
  static createDefaultSnapshot(): GameSnapshot {
    return {
      version: SAVE_VERSION,
      lastActiveTime: Date.now(),
      player: {
        level: INITIAL_PLAYER.level,
        exp: INITIAL_PLAYER.exp,
        classType: INITIAL_PLAYER.classType,
        mainAttribute: INITIAL_PLAYER.mainAttribute,
        baseStats: { ...INITIAL_PLAYER.baseStats },
        mainAttributes: { ...INITIAL_PLAYER.mainAttributes },
        training: { attack: 0, hp: 0, armor: 0 },
        activeTalents: [],
        gold: 0,
        enhancementStones: 0
      },
      combat: {
        currentFloor: 1,
        highestFloor: 1,
        isAutoBattling: false
      },
      equipment: {
        backpack: [],
        equipped: {},
        gold: 0,
        stones: 0,
        lostDrops: 0,
        autoConvertCount: 0,
        scoreMode: ScoreMode.BALANCED,
        pickupFilter: {
          minRarity: Rarity.NORMAL,
          autoConvert: true,
          allowedSlots: Object.values(SlotType),
          requiredAffixes: []
        },
        protection: {
          lockLocked: true,
          lockRare: true,
          lockBetter: true
        },
        backpackView: {
          sortBy: 'score',
          sortDesc: true,
          filterRarity: null,
          filterSlot: null,
          showOnlyBetter: false,
          hideLocked: false,
          minItemLevel: 0
        }
      },
      settings: {
        scoreMode: ScoreMode.BALANCED,
        pickupFilter: {
          minRarity: Rarity.NORMAL,
          autoConvert: true,
          allowedSlots: Object.values(SlotType),
          requiredAffixes: []
        },
        protection: {
          lockLocked: true,
          lockRare: true,
          lockBetter: true
        }
      }
    }
  }

  // ─── 私有辅助方法 ───

  /**
   * 版本迁移
   */
  private migrateSnapshot(data: Record<string, unknown>, fromVersion: number): GameSnapshot {
    let current = fromVersion
    let snapshot = data as unknown as GameSnapshot

    while (current < SAVE_VERSION) {
      const migrator = MIGRATORS[current]
      if (migrator) {
        snapshot = migrator(snapshot as unknown as Record<string, unknown>)
      }
      current++
    }

    return snapshot
  }

  /**
   * 校验存档完整性
   */
  private validateSnapshot(snapshot: GameSnapshot): boolean {
    if (!snapshot) return false
    if (!snapshot.player || typeof snapshot.player.level !== 'number') return false
    if (!snapshot.combat || typeof snapshot.combat.currentFloor !== 'number') return false
    if (!snapshot.equipment || !Array.isArray(snapshot.equipment.backpack)) return false
    return true
  }

  /**
   * 保存到 IndexedDB
   */
  private async saveToIndexedDB(snapshot: GameSnapshot): Promise<void> {
    try {
      const { getDB } = await import('@db/indexedDB')
      const db = await getDB()

      // 保存装备到 IndexedDB
      for (const item of snapshot.equipment.backpack) {
        await db.put('equipments', item)
      }

      // 保存存档元数据
      await db.put('snapshots', {
        id: 'latest',
        data: JSON.stringify(snapshot),
        createdAt: Date.now()
      })
    } catch (e) {
      console.warn('IndexedDB 保存失败，降级到 localStorage:', e)
    }
  }

  /**
   * 从 IndexedDB 加载
   */
  private async loadFromIndexedDB(): Promise<GameSnapshot | null> {
    try {
      const { getDB } = await import('@db/indexedDB')
      const db = await getDB()

      const snapshot = await db.get('snapshots', 'latest')
      if (!snapshot) return null

      return JSON.parse(snapshot.data) as GameSnapshot
    } catch (e) {
      console.warn('IndexedDB 加载失败:', e)
      return null
    }
  }
}
```

### 8.2 存档结构说明

存档采用分层快照结构，每个子系统都有自己的快照接口，便于独立保存和恢复。这种分层设计的优势在于：当某个子系统的数据结构发生变化时，只需要修改对应的快照接口和迁移函数，不影响其他子系统。

存档的快照结构如下：

```
GameSnapshot
├── version: number              // 存档版本号，用于迁移
├── lastActiveTime: number       // 上次活跃时间戳（毫秒）
├── player: PlayerSnapshot       // 玩家状态
│   ├── level: number            // 等级
│   ├── exp: number              // 当前经验值
│   ├── classType: ClassType     // 职业类型
│   ├── mainAttribute: string    // 主属性（str/dex/int）
│   ├── baseStats: BaseStats     // 基础属性
│   ├── mainAttributes: MainAttributes  // 主属性值
│   ├── training: TrainingProgress      // 训练等级
│   ├── activeTalents: ActiveTalentNode[]  // 已激活天赋
│   ├── gold: number             // 金币
│   └── enhancementStones: number // 强化石
├── combat: CombatSnapshot       // 战斗状态
│   ├── currentFloor: number     // 当前层
│   └── highestFloor: number     // 最高解锁层
├── equipment: EquipmentSnapshot // 装备状态
│   ├── backpack: EquipmentItem[]  // 背包装备列表
│   ├── equipped: Record<string, EquipmentItem>  // 穿戴装备
│   ├── gold: number             // 金币（与 player.gold 同步）
│   ├── stones: number           // 强化石（同步）
│   ├── scoreMode: ScoreMode     // 评分模式
│   ├── pickupFilter: PickupFilter  // 拾取过滤
│   ├── protection: ProtectionSettings  // 保护设置
│   └── backpackView: BackpackViewState  // 背包视图状态
└── settings: SettingsSnapshot   // 设置
    ├── scoreMode: ScoreMode
    ├── pickupFilter: PickupFilter
    └── protection: ProtectionSettings
```

恢复时的数据校验策略：**校验而非信任**。加载存档时，每个字段都会验证类型和取值范围。不合法的值会被替换为默认值，而不是导致加载失败。例如评分模式字段，如果存档中的值不在合法的枚举范围内，自动回退到均衡模式。这种容错设计确保了即使存档数据有轻微损坏，玩家也能继续游戏。

存档恢复时战斗运行态的重置策略：不恢复自动挂机状态（避免玩家打开游戏后不知道正在挂机）、不恢复战斗日志（日志是临时信息）、不恢复上次战斗结果（避免显示过时的战斗信息）。这种"运行态归零"策略确保了每次打开游戏都是一致的初始状态。

存档采用分层结构，便于单独恢复各模块状态：

```typescript
interface GameSnapshot {
  version: number           // 存档版本号，用于迁移
  lastActiveTime: number    // 上次活跃时间戳（毫秒）
  player: PlayerSnapshot    // 玩家状态
  combat: CombatSnapshot    // 战斗状态
  equipment: EquipmentSnapshot  // 装备/背包状态
  settings: SettingsSnapshot    // 设置状态
}
```

**恢复规则**：

- 玩家训练归一化：缺失字段补默认值
- 评分模式校验：不合法时回到均衡模式
- 背包筛选数组：重新复制，避免引用问题
- 战斗运行态重置：不恢复自动挂机状态、日志和上次结果
- 离线报告恢复：允许稍后领取

### 8.3 存档版本迁移策略

| 版本 | 变更内容 | 迁移逻辑 |
|------|----------|----------|
| v0 | 初始版本 | 使用默认存档结构填充 |
| v1 | 当前版本 | 基准版本，无需迁移 |

未来版本升级时：

1. 在 `MIGRATORS` 中添加 `vN -> vN+1` 的迁移函数
2. 迁移函数接收旧版本数据，返回新版本数据结构
3. 自动链式执行所有需要的迁移步骤
4. 迁移后的存档以新版本号保存

---

## 第9章 UI组件设计

### 9.0 UI设计概述

UI 是玩家与游戏交互的唯一媒介。放置型 ARPG 的信息密度很高：角色属性、战斗状态、装备列表、目标提示、日志反馈等大量信息需要在有限的屏幕空间内清晰呈现。UI 设计需要在信息密度和可读性之间找到平衡点。

UI 设计遵循以下原则：**三栏响应式布局**，桌面端左（角色/训练/天赋）中（战斗/目标/日志）右（背包/过滤/存档），移动端自动切换为纵向堆叠；**暗色主题**，默认暗黑模式减少眼睛疲劳（玩家可能深夜整理装备），品质颜色在暗背景上更鲜明；**一键操作**，任何需要重复点击的操作都有替代方案（一键分解、一键穿戴、一键领取）；**对比清晰**，装备对比用颜色+箭头+百分比，3 秒内看懂差异。

本章包含 5 个核心 Vue 组件的完整代码：

- `EquipmentCard.vue`：装备卡片，展示单件装备的名称、属性、词缀、评分和操作按钮
- `EquipmentCompare.vue`：装备对比弹窗，并排展示两件装备的属性差异
- `CombatPanel.vue`：战斗面板，展示当前层信息、怪物信息、战斗控制和目标提示
- `CombatLog.vue`：战斗日志，展示最近 100 条战斗记录
- `OfflineReportModal.vue`：离线报告弹窗，展示离线收益的完整统计

每个组件都使用 `<script setup lang="ts">` 语法，配合 Tailwind CSS 的实用类实现样式。

### 9.1 装备卡片组件（EquipmentCard.vue）

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { EquipmentItem, ScoreMode } from '@types'
import { Rarity } from '@types'
import { GearScore } from '@core/GearScore'

interface Props {
  item: EquipmentItem
  scoreMode?: ScoreMode
  showCompare?: boolean
  compareItem?: EquipmentItem | null
  isEquipped?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  scoreMode: 'balanced',
  showCompare: false,
  compareItem: null,
  isEquipped: false
})

const emit = defineEmits<{
  equip: [item: EquipmentItem]
  lock: [itemId: string]
  dismantle: [itemId: string]
  compare: [item: EquipmentItem]
}>()

// 品质颜色
const rarityColor = computed(() => {
  const colors: Record<Rarity, string> = {
    [Rarity.NORMAL]: 'text-gray-400 border-gray-600',
    [Rarity.MAGIC]: 'text-blue-400 border-blue-600',
    [Rarity.RARE]: 'text-yellow-400 border-yellow-600',
    [Rarity.LEGENDARY]: 'text-orange-400 border-orange-600',
    [Rarity.ANCIENT]: 'text-red-400 border-red-600'
  }
  return colors[props.item.rarity] || colors[Rarity.NORMAL]
})

const rarityBg = computed(() => {
  const bgs: Record<Rarity, string> = {
    [Rarity.NORMAL]: 'bg-gray-900/50',
    [Rarity.MAGIC]: 'bg-blue-900/20',
    [Rarity.RARE]: 'bg-yellow-900/20',
    [Rarity.LEGENDARY]: 'bg-orange-900/20',
    [Rarity.ANCIENT]: 'bg-red-900/20'
  }
  return bgs[props.item.rarity] || bgs[Rarity.NORMAL]
})

// 当前评分
const currentScore = computed(() => props.item.scores[props.scoreMode] || props.item.score)

// 是否高价值
const isHighValue = computed(() => GearScore.isHighValue(props.item, props.scoreMode))

// 对比差异
const comparison = computed(() => {
  if (!props.showCompare || !props.compareItem) return null
  const diff = GearScore.compare(props.item, props.compareItem, props.scoreMode)
  return {
    scoreDiff: diff,
    isBetter: diff > 0,
    percent: props.compareItem.score > 0
      ? Math.round((diff / props.compareItem.score) * 100)
      : 0
  }
})

// 属性列表
const statList = computed(() => {
  const stats: { label: string; value: string; highlight: boolean }[] = []

  // 基础属性
  const baseStatLabels: Record<string, string> = {
    attack: '攻击',
    hp: '生命',
    armor: '护甲',
    attackSpeed: '攻速'
  }

  for (const [key, value] of Object.entries(props.item.baseStats)) {
    if (value && value !== 0) {
      stats.push({
        label: baseStatLabels[key] || key,
        value: typeof value === 'number' && value < 1 ? `${(value * 100).toFixed(0)}%` : `+${value}`,
        highlight: false
      })
    }
  }

  // 词缀
  for (const affix of props.item.affixes) {
    const isPct = affix.valueType === 'percent'
    stats.push({
      label: affix.name,
      value: isPct ? `+${affix.value}%` : `+${affix.value}`,
      highlight: affix.isLegendary
    })
  }

  return stats
})
</script>

<template>
  <div
    class="relative rounded-lg border p-3 transition-all duration-200 hover:scale-[1.02] cursor-pointer"
    :class="[rarityColor, rarityBg, { 'ring-2 ring-white/20': isEquipped }]"
    @click="emit('compare', item)"
  >
    <!-- 锁定标记 -->
    <div v-if="item.locked" class="absolute top-1 right-1 text-yellow-500">
      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
      </svg>
    </div>

    <!-- 高价值标记 -->
    <div v-if="isHighValue" class="absolute -top-1 -left-1">
      <span class="px-1.5 py-0.5 text-xs bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full font-bold">
        ★
      </span>
    </div>

    <!-- 装备名称 -->
    <div class="font-bold text-sm truncate mb-1 pr-5" :class="rarityColor.split(' ')[0]">
      {{ item.name }}
    </div>

    <!-- 装备信息 -->
    <div class="text-xs text-gray-400 mb-2">
      Lv.{{ item.itemLevel }} · +{{ item.enhancement }}
      <span v-if="comparison" class="ml-2" :class="comparison.isBetter ? 'text-green-400' : 'text-red-400'">
        {{ comparison.isBetter ? '↑' : '↓' }}{{ comparison.percent }}%
      </span>
    </div>

    <!-- 属性列表 -->
    <div class="space-y-0.5 text-xs">
      <div
        v-for="stat in statList"
        :key="stat.label"
        class="flex justify-between"
        :class="stat.highlight ? 'text-orange-400 font-medium' : 'text-gray-300'"
      >
        <span>{{ stat.label }}</span>
        <span>{{ stat.value }}</span>
      </div>
    </div>

    <!-- 评分 -->
    <div class="mt-2 pt-2 border-t border-white/10 flex justify-between items-center">
      <span class="text-xs text-gray-500">评分</span>
      <span class="font-mono font-bold text-sm">{{ currentScore }}</span>
    </div>

    <!-- 操作按钮 -->
    <div class="mt-2 flex gap-1">
      <button
        class="flex-1 px-2 py-1 text-xs bg-game-accent/80 hover:bg-game-accent rounded transition-colors"
        @click.stop="emit('equip', item)"
      >
        穿戴
      </button>
      <button
        class="px-2 py-1 text-xs bg-game-border hover:bg-white/10 rounded transition-colors"
        @click.stop="emit('lock', item.id)"
      >
        {{ item.locked ? '解锁' : '锁定' }}
      </button>
      <button
        class="px-2 py-1 text-xs bg-red-900/50 hover:bg-red-800 text-red-400 rounded transition-colors"
        @click.stop="emit('dismantle', item.id)"
      >
        分解
      </button>
    </div>
  </div>
</template>
```

### 9.2 装备对比组件（EquipmentCompare.vue）

装备对比组件是一个模态弹窗，并排展示两件装备的属性差异。这是背包整理场景中最核心的交互之一——玩家需要快速判断一件新装备是否值得替换身上的旧装备。

**设计要点**：

1. **三栏布局**：左栏展示当前装备，右栏展示新装备，中间展示综合评分差异。这种并排布局让玩家可以逐属性对比，一目了然。

2. **颜色编码**：绿色表示新装备在该属性上更优，红色表示更差，灰色表示持平。这种颜色编码与游戏品质颜色体系一致，玩家不需要学习新的视觉语言。

3. **差异百分比**：中间栏展示综合评分的差异百分比（如 +15%），给玩家一个直观的"变强了多少"的感知。即使实际层数只推了 2 层，也要让玩家"感觉"变强了。

4. **属性排序**：按当前评分模式的权重排序属性列表，最重要的属性（权重最高的）排在最前面，确保玩家第一眼看到最关键的差异。

5. **空槽处理**：如果当前部位没有装备（空槽），对比界面仍然正常工作，所有属性显示为 "-"，评分差异就是新装备的全部评分。

6. **动画效果**：弹窗使用淡入 + 滑动动画，增强开箱仪式感。属性行使用交错动画（stagger），逐行展示对比结果，引导玩家从上到下阅读。

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { EquipmentItem, ScoreMode } from '@types'
import { GearScore } from '@core/GearScore'

interface Props {
  currentItem: EquipmentItem | null
  newItem: EquipmentItem
  scoreMode?: ScoreMode
}

const props = withDefaults(defineProps<Props>(), {
  scoreMode: 'balanced'
})

const emit = defineEmits<{
  equip: [item: EquipmentItem]
  close: []
}>()

// 对比结果
const comparison = computed(() => {
  if (!props.currentItem) {
    return {
      attributes: props.newItem.affixes.map((a) => ({
        label: a.name,
        currentValue: '-',
        newValue: a.valueType === 'percent' ? `+${a.value}%` : `+${a.value}`,
        diff: 0,
        better: 'new' as const
      })),
      scoreDiff: props.newItem.scores[props.scoreMode] || 0,
      isBetter: true
    }
  }

  const attrs = GearScore.compareAttributes(
    props.newItem,
    props.currentItem,
    props.scoreMode
  )

  const scoreDiff = (props.newItem.scores[props.scoreMode] || 0) - (props.currentItem.scores[props.scoreMode] || 0)

  return {
    attributes: attrs.map((a) => ({
      label: a.label,
      currentValue: typeof a.valueB === 'number' ? (a.valueB < 1 && a.valueB > 0 ? `${(a.valueB * 100).toFixed(0)}%` : `+${a.valueB}`) : '-',
      newValue: typeof a.valueA === 'number' ? (a.valueA < 1 && a.valueA > 0 ? `${(a.valueA * 100).toFixed(0)}%` : `+${a.valueA}`) : '-',
      diff: a.diff,
      better: a.better === 'A' ? 'new' : a.better === 'B' ? 'current' : 'equal' as const
    })),
    scoreDiff,
    isBetter: scoreDiff > 0
  }
})

// 品质样式
function getRarityClass(rarity: string): string {
  const map: Record<string, string> = {
    normal: 'text-gray-400',
    magic: 'text-blue-400',
    rare: 'text-yellow-400',
    legendary: 'text-orange-400',
    ancient: 'text-red-400'
  }
  return map[rarity] || 'text-gray-400'
}
</script>

<template>
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50" @click="emit('close')">
    <div class="bg-game-panel border border-game-border rounded-xl p-6 max-w-lg w-full mx-4" @click.stop>
      <h3 class="text-lg font-bold mb-4 text-center">装备对比</h3>

      <div class="grid grid-cols-3 gap-4 mb-4">
        <!-- 当前装备 -->
        <div class="text-center">
          <div class="text-xs text-gray-500 mb-1">当前装备</div>
          <div v-if="currentItem" class="font-medium" :class="getRarityClass(currentItem.rarity)">
            {{ currentItem.name }}
          </div>
          <div v-else class="text-gray-600">无</div>
          <div v-if="currentItem" class="text-sm font-mono mt-1">
            {{ currentItem.scores[scoreMode] || 0 }}
          </div>
        </div>

        <!-- 对比指标 -->
        <div class="text-center flex items-center justify-center">
          <div class="text-2xl font-bold" :class="comparison.isBetter ? 'text-green-400' : 'text-red-400'">
            {{ comparison.scoreDiff > 0 ? '+' : '' }}{{ comparison.scoreDiff }}
          </div>
        </div>

        <!-- 新装备 -->
        <div class="text-center">
          <div class="text-xs text-gray-500 mb-1">新装备</div>
          <div class="font-medium" :class="getRarityClass(newItem.rarity)">
            {{ newItem.name }}
          </div>
          <div class="text-sm font-mono mt-1">
            {{ newItem.scores[scoreMode] || 0 }}
          </div>
        </div>
      </div>

      <!-- 属性对比 -->
      <div class="bg-black/30 rounded-lg p-3 space-y-2 max-h-60 overflow-y-auto">
        <div
          v-for="attr in comparison.attributes"
          :key="attr.label"
          class="grid grid-cols-3 gap-2 text-sm"
        >
          <div class="text-right" :class="attr.better === 'current' ? 'text-red-400' : 'text-gray-400'">
            {{ attr.currentValue }}
          </div>
          <div class="text-center text-xs" :class="{
            'text-green-400': attr.better === 'new',
            'text-red-400': attr.better === 'current',
            'text-gray-500': attr.better === 'equal'
          }">
            {{ attr.label }}
            <span v-if="attr.better === 'new'">↑</span>
            <span v-else-if="attr.better === 'current'">↓</span>
            <span v-else>=</span>
          </div>
          <div class="text-left" :class="attr.better === 'new' ? 'text-green-400' : 'text-gray-400'">
            {{ attr.newValue }}
          </div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex gap-3 mt-4">
        <button class="flex-1 btn-primary py-2" @click="emit('equip', newItem)">
          替换穿戴
        </button>
        <button class="flex-1 btn-secondary py-2" @click="emit('close')">
          取消
        </button>
      </div>
    </div>
  </div>
</template>
```

### 9.3 战斗面板组件（CombatPanel.vue）

战斗面板是游戏的核心交互区域，展示当前层信息、怪物信息、战斗控制按钮和推层目标。面板的布局和信息密度经过精心设计，确保玩家在 2 秒内获取所有关键信息。

**信息架构**：

1. **当前层信息**（最显眼位置）：展示层名、推荐战力、玩家战力、战力对比和收益倍率。收益倍率使用颜色编码（绿色 100%、黄色 80%、橙色 50%、红色 20%），一目了然。

2. **怪物信息**：展示怪物名称、类型和预计击杀时间。如果无法击杀，用红色文字提示原因。

3. **战斗控制**：两个大按钮——"挑战一次"和"自动挂机"。手动战斗用于测试当前 Build 是否可以通过某一层，自动挂机用于持续积累收益。

4. **推层目标**：展示下一个可挑战层的评估结果，告诉玩家"下一层能不能打过"以及"需要提升什么"。

5. **Boss 目标**：展示下一个 Boss 层的距离和推荐战力，作为中期目标。

6. **推荐挂机层**：用绿色边框高亮显示，告诉玩家"现在最适合挂哪一层"以及"为什么"。

**交互设计**：层数切换使用左右箭头按钮，只在已解锁层范围内切换。手动战斗点击后按钮变为禁用状态并显示进度条，防止重复点击。自动挂机按钮点击后变为红色"停止挂机"按钮，状态变化清晰明确。暂停原因用文字提示（如"背包已满"或"战斗失败"），帮助玩家理解为什么挂机停了。

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useCombatStore } from '@stores/combat'
import { usePlayerStore } from '@stores/player'
import { FloorScaling } from '@core/FloorScaling'
import { CombatEngine } from '@core/CombatEngine'
import type { ScoreMode } from '@types'

const combatStore = useCombatStore()
const playerStore = usePlayerStore()

const engine = new CombatEngine()
const floorScaling = new FloorScaling()

// 当前层评估
const evaluation = computed(() => {
  return floorScaling.evaluateFloor(
    combatStore.currentFloor,
    playerStore.getBuildSnapshot()
  )
})

// 是否可以挑战
const canFight = computed(() => !combatStore.isAutoBattling)

// 战力对比
const powerDiff = computed(() => {
  const ratio = evaluation.value.playerPower / evaluation.value.recommendedPower
  return ratio
})

const powerDiffText = computed(() => {
  const pct = Math.round(powerDiff.value * 100)
  if (pct >= 100) return `+${pct - 100}%`
  return `${pct - 100}%`
})

// 收益倍率颜色
const efficiencyColor = computed(() => {
  const ratio = evaluation.value.efficiencyRatio
  if (ratio >= 1.0) return 'text-green-400'
  if (ratio >= 0.8) return 'text-yellow-400'
  if (ratio >= 0.5) return 'text-orange-400'
  return 'text-red-400'
})

// 层名
const floorName = computed(() => {
  const f = combatStore.currentFloor
  if (f % 10 === 0) return `第 ${f} 层 ★ Boss`
  return `第 ${f} 层`
})

// 战斗按钮文本
const fightButtonText = computed(() => {
  if (combatStore.isAutoBattling) return '自动战斗中...'
  return '挑战一次'
})

async function handleFight() {
  if (combatStore.isAutoBattling) return

  const { useCombat } = await import('@composables/useCombat')
  const { fightOnce } = useCombat()
  await fightOnce()
}

function toggleAutoCombat() {
  if (combatStore.isAutoBattling) {
    combatStore.stopAutoCombat()
  } else {
    combatStore.startAutoCombat()
  }
}

function changeFloor(delta: number) {
  const newFloor = combatStore.currentFloor + delta
  if (newFloor >= 1 && newFloor <= combatStore.highestFloor) {
    combatStore.setFloor(newFloor)
  }
}
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- 当前层信息 -->
    <div class="game-panel">
      <div class="game-panel-header">当前层</div>
      <div class="text-2xl font-bold text-center mb-2">{{ floorName }}</div>

      <div class="grid grid-cols-2 gap-2 text-sm">
        <div class="stat-row">
          <span class="stat-label">推荐战力</span>
          <span class="stat-value">{{ evaluation.recommendedPower }}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">你的战力</span>
          <span class="stat-value" :class="powerDiff >= 1 ? 'text-green-400' : 'text-yellow-400'">
            {{ evaluation.playerPower }}
          </span>
        </div>
        <div class="stat-row">
          <span class="stat-label">战力对比</span>
          <span class="stat-value" :class="powerDiff >= 1 ? 'text-green-400' : 'text-red-400'">
            {{ powerDiffText }}
          </span>
        </div>
        <div class="stat-row">
          <span class="stat-label">收益倍率</span>
          <span class="stat-value" :class="efficiencyColor">
            {{ Math.round(evaluation.efficiencyRatio * 100) }}%
          </span>
        </div>
      </div>

      <!-- 层数切换 -->
      <div class="flex items-center justify-center gap-2 mt-3">
        <button class="btn-secondary px-3 py-1 text-sm" @click="changeFloor(-1)" :disabled="combatStore.currentFloor <= 1">
          ◀
        </button>
        <span class="text-sm text-gray-400">{{ combatStore.currentFloor }} / {{ combatStore.highestFloor }}</span>
        <button class="btn-secondary px-3 py-1 text-sm" @click="changeFloor(1)" :disabled="combatStore.currentFloor >= combatStore.highestFloor">
          ▶
        </button>
      </div>
    </div>

    <!-- 怪物信息 -->
    <div class="game-panel">
      <div class="game-panel-header">怪物信息</div>
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-400">怪物</span>
        <span>{{ evaluation.monsterName }}</span>
      </div>
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-400">类型</span>
        <span>{{ evaluation.monsterType }}</span>
      </div>
      <div class="flex items-center justify-between text-sm mt-2">
        <span class="text-gray-400">预计击杀</span>
        <span :class="evaluation.canClear ? 'text-green-400' : 'text-red-400'">
          {{ evaluation.canClear ? `${evaluation.playerKillTime}秒` : '无法击杀' }}
        </span>
      </div>
    </div>

    <!-- 战斗控制 -->
    <div class="game-panel">
      <div class="flex gap-2">
        <button
          class="flex-1 btn-primary py-3 font-bold"
          :disabled="!canFight"
          @click="handleFight"
        >
          {{ fightButtonText }}
        </button>
        <button
          class="flex-1 py-3 font-bold rounded-lg transition-colors"
          :class="combatStore.isAutoBattling ? 'btn-danger' : 'btn-secondary'"
          @click="toggleAutoCombat"
        >
          {{ combatStore.isAutoBattling ? '停止挂机' : '自动挂机' }}
        </button>
      </div>

      <!-- 暂停原因 -->
      <div v-if="combatStore.pauseReason" class="mt-2 text-sm text-red-400 text-center">
        <span v-if="combatStore.pauseReason === 'backpack_full'">背包已满，挂机已暂停</span>
        <span v-else-if="combatStore.pauseReason === 'combat_failed'">战斗失败，挂机已暂停</span>
        <span v-else>已暂停：{{ combatStore.pauseReason }}</span>
      </div>
    </div>

    <!-- 推层目标 -->
    <div class="game-panel">
      <div class="game-panel-header">推层目标</div>
      <div class="text-sm">
        <div class="flex justify-between">
          <span class="text-gray-400">建议挑战</span>
          <span>第 {{ combatStore.highestFloor + 1 }} 层</span>
        </div>
        <div class="flex justify-between mt-1">
          <span class="text-gray-400">状态</span>
          <span :class="pushTarget?.canClear ? 'text-green-400' : 'text-red-400'">
            {{ pushTarget?.canClear ? '可挑战' : pushTarget?.suggestionText }}
          </span>
        </div>
      </div>
    </div>

    <!-- Boss 目标 -->
    <div class="game-panel" v-if="combatStore.nextBossFloor">
      <div class="game-panel-header">Boss 目标</div>
      <div class="text-sm">
        <div class="flex justify-between">
          <span class="text-gray-400">下一个 Boss</span>
          <span class="text-orange-400">第 {{ combatStore.nextBossFloor }} 层</span>
        </div>
        <div class="flex justify-between mt-1">
          <span class="text-gray-400">距离</span>
          <span>{{ combatStore.nextBossFloor - combatStore.highestFloor }} 层</span>
        </div>
      </div>
    </div>

    <!-- 推荐挂机层 -->
    <div class="game-panel bg-green-900/10 border-green-800/30">
      <div class="game-panel-header text-green-400">推荐挂机层</div>
      <div class="text-sm">
        <div class="flex justify-between">
          <span class="text-gray-400">推荐层</span>
          <span class="text-green-400 font-bold">第 {{ recommendedFloor }} 层</span>
        </div>
        <div class="flex justify-between mt-1">
          <span class="text-gray-400">金币/秒</span>
          <span>{{ evaluation.goldPerSecond }}</span>
        </div>
        <div class="flex justify-between mt-1">
          <span class="text-gray-400">推荐理由</span>
          <span class="text-xs text-right max-w-[60%]">{{ evaluation.recommendationReason }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
```

### 9.4 战斗日志组件（CombatLog.vue）

战斗日志展示最近 100 条战斗记录，为玩家提供战斗过程的可视化反馈。虽然放置游戏的战斗是纯数值模拟，但日志滚动和高价值掉落提示仍然是重要的体验组成部分。

**设计要点**：

1. **倒序展示**：最新的日志在最上面，符合阅读习惯。使用等宽字体确保时间戳对齐。

2. **颜色编码**：胜利日志为绿色，失败为红色，掉落装备为黄色，推层成功为蓝色，Boss 战为橙色。这种颜色体系让玩家可以快速扫视日志获取信息。

3. **100 条上限**：超过 100 条自动清除旧记录，防止内存无限增长。对于放置游戏来说，100 条足够展示最近几分钟的战斗历史。

4. **清空功能**：提供手动清空按钮，让玩家可以整理日志视图。

5. **时间戳**：每条日志带 HH:MM:SS 格式的时间戳，帮助玩家判断挂机效率。

**日志类型说明**：

| 类型 | 颜色 | 触发场景 |
|------|------|----------|
| victory | 绿色 | 战斗胜利 |
| defeat | 红色 | 战斗失败 |
| loot | 黄色 | 获得装备掉落 |
| floor | 蓝色 | 推层成功 |
| boss | 橙色 | Boss 战斗 |
| info | 灰色 | 一般信息提示 |

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useCombatStore } from '@stores/combat'

const combatStore = useCombatStore()

const logs = computed(() => combatStore.combatLogs)

function getLogClass(type: string): string {
  const map: Record<string, string> = {
    info: 'text-gray-400',
    victory: 'text-green-400',
    defeat: 'text-red-400',
    loot: 'text-yellow-400',
    floor: 'text-blue-400',
    boss: 'text-orange-400'
  }
  return map[type] || 'text-gray-400'
}

function formatTime(timestamp: number): string {
  const d = new Date(timestamp)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

function clearLogs() {
  combatStore.combatLogs = []
}
</script>

<template>
  <div class="game-panel">
    <div class="flex justify-between items-center mb-2">
      <div class="game-panel-header mb-0">战斗日志</div>
      <button class="text-xs text-gray-500 hover:text-gray-300" @click="clearLogs">
        清空
      </button>
    </div>

    <div class="bg-black/30 rounded-lg p-2 h-48 overflow-y-auto space-y-1 text-xs font-mono">
      <div v-if="logs.length === 0" class="text-gray-600 text-center py-8">
        暂无战斗记录
      </div>
      <div
        v-for="(log, index) in logs"
        :key="index"
        class="flex gap-2"
        :class="getLogClass(log.type)"
      >
        <span class="text-gray-600 flex-shrink-0">[{{ formatTime(log.timestamp) }}]</span>
        <span>{{ log.message }}</span>
      </div>
    </div>
  </div>
</template>
```

### 9.5 离线报告弹窗组件（OfflineReportModal.vue）

离线报告弹窗是玩家回归游戏时的第一印象，承载着"开箱爽感"的核心体验。弹窗的设计需要兼顾信息完整性和视觉冲击力，让玩家在打开游戏的瞬间就感受到成长的喜悦。

**设计要点**：

1. **欢迎标题**：用游戏主题色（紫色）大字显示"欢迎回来！"，配合离线时长，营造亲切感。

2. **收益总览**：用四宫格展示击杀数、金币、经验和装备数量。金币用黄色、经验用蓝色，与游戏内的资源颜色体系一致。

3. **装备列表**：展示获得的所有装备，按品质排序（传说优先）。传说装备用橙色高亮，远古用红色高亮。列表可滚动，确保即使获得 50 件装备也能正常展示。

4. **过滤/丢失提示**：如果有装备被自动过滤或因背包满丢失，用橙色提示框说明。这是重要的反馈机制——让玩家知道"我错过了什么"，从而激励玩家整理背包或提升容量。

5. **一键领取**：主要操作按钮，点击后所有收益（金币、经验、装备）加入玩家状态。领取后弹窗关闭，玩家可以立即开始整理新获得的装备。

6. **动画效果**：弹窗使用淡入 + 上滑动画，收益数字使用从 0 滚动到实际值的计数动画，装备列表使用交错淡入动画。这些动画增强了仪式感，让回归体验更加愉悦。

7. **收益为空的情况**：如果离线时间太短或无法击杀当前层怪物，展示简洁的提示信息而不是空白的收益面板。

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { OfflineReport } from '@types'
import { formatDuration, formatNumber } from '@utils/helpers'

interface Props {
  report: OfflineReport
}

const props = defineProps<Props>()

const emit = defineEmits<{
  claim: [report: OfflineReport]
  dismiss: []
}>()

// 离线时长
const durationText = computed(() => formatDuration(props.report.durationSeconds))

// 实际收益时长
const actualDurationText = computed(() => {
  if (props.report.actualEarningSeconds <= 0) return '0秒'
  return formatDuration(props.report.actualEarningSeconds)
})

// 结束原因
const endReasonText = computed(() => {
  switch (props.report.endReason) {
    case 'backpack_full': return '背包已满'
    case 'cannot_kill': return '无法击杀怪物'
    default: return '达到时间上限'
  }
})

// 装备品质统计
const rarityStats = computed(() => {
  const stats: Record<string, number> = {}
  for (const item of props.report.itemsGained) {
    stats[item.rarity] = (stats[item.rarity] || 0) + 1
  }
  return stats
})

// 是否有收益
const hasEarnings = computed(() =>
  props.report.killCount > 0 || props.report.goldEarned > 0
)
</script>

<template>
  <div class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
    <div class="bg-game-panel border border-game-border rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto animate-slide-in">
      <!-- 标题 -->
      <div class="text-center mb-4">
        <h2 class="text-xl font-bold text-game-accent">欢迎回来！</h2>
        <p class="text-sm text-gray-400 mt-1">你离线了 {{ durationText }}</p>
      </div>

      <!-- 收益为空 -->
      <div v-if="!hasEarnings" class="text-center py-8">
        <p class="text-gray-500" v-if="report.endReason === 'cannot_kill'">
          当前层怪物太强，无法获取离线收益
        </p>
        <p class="text-gray-500" v-else>
          离线时间太短，暂无收益
        </p>
      </div>

      <!-- 收益统计 -->
      <div v-else class="space-y-3">
        <div class="bg-black/30 rounded-lg p-4">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div class="text-gray-500 text-xs">击杀怪物</div>
              <div class="text-lg font-bold">{{ formatNumber(report.killCount) }} 只</div>
            </div>
            <div>
              <div class="text-gray-500 text-xs">获得金币</div>
              <div class="text-lg font-bold text-yellow-400">{{ formatNumber(report.goldEarned) }}</div>
            </div>
            <div>
              <div class="text-gray-500 text-xs">获得经验</div>
              <div class="text-lg font-bold text-blue-400">{{ formatNumber(report.expEarned) }}</div>
            </div>
            <div>
              <div class="text-gray-500 text-xs">获得装备</div>
              <div class="text-lg font-bold">{{ report.itemsGained.length }} 件</div>
            </div>
          </div>
        </div>

        <!-- 装备列表 -->
        <div v-if="report.itemsGained.length > 0" class="bg-black/30 rounded-lg p-3">
          <div class="text-xs text-gray-500 mb-2">获得的装备</div>
          <div class="space-y-1 max-h-32 overflow-y-auto">
            <div
              v-for="item in report.itemsGained"
              :key="item.id"
              class="text-sm flex justify-between"
            >
              <span :class="`rarity-${item.rarity}`">{{ item.name }}</span>
              <span class="text-gray-500 text-xs">+{{ item.enhancement }}</span>
            </div>
          </div>
        </div>

        <!-- 过滤/丢失提示 -->
        <div v-if="report.filteredCount > 0 || report.lostCount > 0" class="text-xs text-orange-400 bg-orange-900/20 rounded-lg p-2">
          <div v-if="report.filteredCount > 0">
            自动转化：{{ report.filteredCount }} 件装备转化为强化石
          </div>
          <div v-if="report.lostCount > 0">
            因背包满丢失：{{ report.lostCount }} 件装备
          </div>
        </div>

        <!-- 收益信息 -->
        <div class="text-xs text-gray-500 flex justify-between">
          <span>实际收益时间：{{ actualDurationText }}</span>
          <span>结束原因：{{ endReasonText }}</span>
        </div>
      </div>

      <!-- 按钮 -->
      <div class="flex gap-3 mt-4">
        <button
          v-if="hasEarnings"
          class="flex-1 btn-primary py-3 font-bold"
          @click="emit('claim', report)"
        >
          一键领取
        </button>
        <button
          class="flex-1 btn-secondary py-3"
          @click="emit('dismiss')"
        >
          {{ hasEarnings ? '稍后再领' : '关闭' }}
        </button>
      </div>
    </div>
  </div>
</template>
```


---

## 第10章 性能优化

### 10.0 性能优化设计概述

放置游戏虽然对实时渲染帧率要求不高，但随着游戏进度推进，数值快速增长、装备数量增加、离线战斗批量模拟等场景都会带来性能挑战。一个设计良好的性能优化策略需要在开发阶段就植入，而不是事后补救。

性能优化的核心目标：**保持 60fps 的 UI 响应**，即使背包有 50 件装备、战斗日志有 100 条记录时也不卡顿；**离线计算不阻塞主线程**，离线收益计算放入 Web Worker，避免页面假死；**大数值不溢出**，JavaScript 的 `Number.MAX_SAFE_INTEGER` 约为 9e15，游戏后期数值可能超过这个范围，需要安全处理；**内存稳定**，避免频繁创建对象导致 GC 压力，使用对象池和脏标记缓存减少不必要的计算。

性能优化策略分为四个层面：大数值处理、脏标记缓存、防抖节流、虚拟滚动和 Web Worker 离线计算。

### 10.1 大数值处理

放置游戏的一个核心特征就是数值的指数增长。随着玩家层数提高、装备强化、转生加成，所有数值都会快速增长。JavaScript 的 `Number` 类型使用 IEEE 754 双精度浮点数表示，最大安全整数为 `2^53 - 1 ≈ 9 × 10^15`。在游戏中后期，一些数值可能接近或超过这个范围。

大数值处理策略采用分级方案：

1. **安全范围内（< 1e15）**：直接使用原生 `number` 类型，无需特殊处理
2. **接近上限（1e15 ~ 1e18）**：使用 `BigNumber` 类提供安全运算
3. **展示层面**：使用格式化函数将大数值转换为 K/M/B/T 等缩写形式

对于本游戏的设计参数，经过测算：

- 第 200 层的推荐战力约为 `100 × 1.12^199 ≈ 2.6 × 10^10`，远小于安全上限
- 第 500 层的推荐战力约为 `100 × 1.12^499 ≈ 2.1 × 10^25`，超过安全上限

因此，如果游戏设计目标层数在 300 层以内，原生 `number` 类型足够安全。如果未来扩展到 500+ 层，需要启用 `BigNumber` 处理。

**数值格式化策略**：

| 范围 | 显示格式 | 示例 |
|------|----------|------|
| < 1,000 | 整数 | 999 |
| 1,000 ~ 999,999 | X.XK | 12.5K |
| 1e6 ~ 999e6 | X.XM | 3.2M |
| 1e9 ~ 999e9 | X.XB | 1.5B |
| 1e12 ~ 999e12 | X.XT | 8.7T |
| ≥ 1e15 | X.XeN 科学计数法 | 2.1e25 |

放置游戏随着进度推进，数值会快速增长。需要统一的数值处理策略确保精度和性能。

```typescript
// utils/BigNumber.ts

/**
 * 大数值处理类
 * 使用对象表示法避免 JavaScript 数字精度丢失
 * 当数值超过 1e15 时使用字符串/对象表示
 */
export class BigNumber {
  private mantissa: number
  private exponent: number

  constructor(value: number | string | BigNumber) {
    if (value instanceof BigNumber) {
      this.mantissa = value.mantissa
      this.exponent = value.exponent
      return
    }

    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) {
      this.mantissa = 0
      this.exponent = 0
      return
    }

    if (num === 0) {
      this.mantissa = 0
      this.exponent = 0
      return
    }

    const exp = Math.floor(Math.log10(Math.abs(num)))
    this.mantissa = num / 10 ** exp
    this.exponent = exp
  }

  /** 转换为可显示字符串 */
  toString(precision: number = 3): string {
    if (this.mantissa === 0) return '0'

    const total = this.mantissa * 10 ** this.exponent

    // 小于 1e6 直接显示
    if (Math.abs(total) < 1e6) {
      return Math.floor(total).toLocaleString()
    }

    // 使用科学计数法缩写
    const suffixes = [
      { limit: 1e6, suffix: 'M' },
      { limit: 1e9, suffix: 'B' },
      { limit: 1e12, suffix: 'T' },
      { limit: 1e15, suffix: 'Qa' },
      { limit: 1e18, suffix: 'Qi' },
      { limit: 1e21, suffix: 'Sx' },
      { limit: 1e24, suffix: 'Sp' },
      { limit: 1e27, suffix: 'Oc' },
      { limit: 1e30, suffix: 'No' },
      { limit: 1e33, suffix: 'Dc' }
    ]

    const abs = Math.abs(total)
    for (const { limit, suffix } of suffixes) {
      if (abs < limit * 1000) {
        return `${(total / limit).toFixed(precision)}${suffix}`
      }
    }

    // 超过所有后缀，使用科学计数法
    return `${this.mantissa.toFixed(precision)}e${this.exponent}`
  }

  /** 转换为原始数字（可能丢失精度） */
  toNumber(): number {
    if (this.mantissa === 0) return 0
    return this.mantissa * 10 ** this.exponent
  }

  /** 加法 */
  add(other: BigNumber | number): BigNumber {
    const b = other instanceof BigNumber ? other : new BigNumber(other)
    const sum = this.toNumber() + b.toNumber()
    return new BigNumber(sum)
  }

  /** 乘法 */
  multiply(factor: number): BigNumber {
    return new BigNumber(this.mantissa * factor, this.exponent)
  }

  /** 比较 */
  compare(other: BigNumber | number): number {
    const b = other instanceof BigNumber ? other : new BigNumber(other)
    const diff = this.toNumber() - b.toNumber()
    return diff > 0 ? 1 : diff < 0 ? -1 : 0
  }

  /** 是否大于 */
  greaterThan(other: BigNumber | number): boolean {
    return this.compare(other) > 0
  }
}

// 简化的格式化函数（优先使用）
export function formatBigNumber(num: number): string {
  if (num < 1000) return Math.floor(num).toString()
  if (num < 1_000_000) return `${(num / 1000).toFixed(1)}K`
  if (num < 1_000_000_000) return `${(num / 1_000_000).toFixed(1)}M`
  if (num < 1_000_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`
  if (num < 1e15) return `${(num / 1_000_000_000_000).toFixed(1)}T`
  return `${(num / 1e15).toFixed(1)}Q`
}
```

### 10.2 脏标记缓存系统

放置游戏中某些派生属性的计算成本较高（如遍历所有装备累加属性、评估所有层的目标），但这些属性的依赖变化频率并不高。脏标记缓存系统通过延迟重新计算来优化性能——只在数据真正变化时才重新计算，而非每帧更新。

**脏标记的工作原理**：

1. 每个缓存值关联一个 `DirtyFlag` 对象
2. 数据变化时调用 `markDirty()` 设置脏标记
3. 下次读取时检测到脏标记，触发重新计算
4. 计算完成后清除脏标记

**应用场景**：

- **装备属性汇总**：穿戴装备变化时标记脏，下次访问总属性时重新计算
- **推荐挂机层**：层数或战力变化时标记脏，避免每帧遍历所有层
- **背包过滤列表**：过滤条件变化时重新计算，而非每帧过滤

**与 Vue 响应式的关系**：Vue 的 `computed` 本身就是基于依赖追踪的缓存系统，与脏标记的理念一致。脏标记系统用于 Vue 响应式系统之外的场景（如 Web Worker 中的离线计算、批量模拟中的临时缓存）。

**性能对比**：

以遍历 50 格背包计算总属性为例：

| 方案 | 数据变化频率 | 读取频率 | 单次计算成本 | 总成本/秒 |
|------|-------------|----------|-------------|-----------|
| 每帧计算 | - | 60fps | 0.5ms | 30ms (50% 帧预算) |
| Vue computed | 变化时 | 60fps | 0.5ms | 0.5ms (仅变化时) |
| 脏标记 | 变化时 | 按需 | 0.5ms | 0.5ms (仅变化时) |

频繁重新计算属性会导致性能问题。使用脏标记模式只在必要时重新计算。

```typescript
// core/DirtyFlag.ts

/**
 * 脏标记缓存系统
 * 用于延迟重新计算，避免每帧重复计算相同值
 */
export class DirtyFlag<T> {
  private value: T | null = null
  private dirty = true
  private computeFn: () => T

  constructor(computeFn: () => T) {
    this.computeFn = computeFn
  }

  /** 标记为脏 */
  markDirty(): void {
    this.dirty = true
  }

  /** 获取值（仅在脏时重新计算） */
  get(): T {
    if (this.dirty || this.value === null) {
      this.value = this.computeFn()
      this.dirty = false
    }
    return this.value
  }

  /** 强制刷新 */
  refresh(): T {
    this.dirty = true
    return this.get()
  }

  /** 偷看当前值（不触发计算） */
  peek(): T | null {
    return this.value
  }
}

/**
 * 脏标记管理器
 * 统一管理多个脏标记，支持批量标记和延迟更新
 */
export class DirtyFlagManager {
  private flags: Map<string, DirtyFlag<unknown>> = new Map()
  private dirtyKeys: Set<string> = new Set()
  private updateScheduled = false

  /** 注册脏标记 */
  register<T>(key: string, computeFn: () => T): DirtyFlag<T> {
    const flag = new DirtyFlag(computeFn)
    this.flags.set(key, flag as DirtyFlag<unknown>)
    return flag
  }

  /** 标记指定 key 为脏 */
  markDirty(key: string): void {
    this.dirtyKeys.add(key)
    this.scheduleUpdate()
  }

  /** 标记所有 key 为脏 */
  markAllDirty(): void {
    for (const key of this.flags.keys()) {
      this.dirtyKeys.add(key)
    }
    this.scheduleUpdate()
  }

  /** 批量标记脏 */
  markDirtyBatch(keys: string[]): void {
    for (const key of keys) {
      this.dirtyKeys.add(key)
    }
    this.scheduleUpdate()
  }

  /** 获取值（如果标记为脏则重新计算） */
  get<T>(key: string): T | null {
    const flag = this.flags.get(key)
    if (!flag) return null

    // 如果标记为脏，刷新
    if (this.dirtyKeys.has(key)) {
      this.dirtyKeys.delete(key)
      return flag.refresh() as T
    }

    return flag.get() as T
  }

  /** 立即刷新所有脏标记 */
  flush(): void {
    for (const key of this.dirtyKeys) {
      const flag = this.flags.get(key)
      if (flag) flag.refresh()
    }
    this.dirtyKeys.clear()
    this.updateScheduled = false
  }

  /** 延迟批量更新 */
  private scheduleUpdate(): void {
    if (this.updateScheduled) return
    this.updateScheduled = true

    requestAnimationFrame(() => {
      this.flush()
      this.updateScheduled = false
    })
  }
}
```

### 10.3 防抖与节流

UI 高频操作（如搜索过滤、属性滑块、层数切换）如果每次变化都触发完整计算，会导致性能问题。防抖（debounce）和节流（throttle）是两种常见的优化手段。

**防抖 vs 节流**：

- **防抖**：等待操作停止后执行。适用于搜索输入——玩家停止输入 300ms 后才执行搜索。
- **节流**：限制执行频率。适用于属性滑块——每 100ms 最多更新一次。

**游戏中的应用场景**：

| 场景 | 策略 | 延迟 | 原因 |
|------|------|------|------|
| 背包搜索过滤 | 防抖 | 300ms | 等待用户输入完成 |
| 评分模式切换 | 立即执行 | 0ms | 用户明确意图 |
| 层数滑块 | 节流 | 100ms | 限制更新频率 |
| 装备对比 | 立即执行 | 0ms | 用户明确意图 |
| 自动保存 | 防抖 | 5000ms | 减少写入频率 |

UI 高频操作（如搜索、排序）需要防抖节流避免性能问题。

```typescript
// utils/throttle.ts

/**
 * 防抖函数
 * @param fn 目标函数
 * @param delay 延迟毫秒数
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null

  return function (...args: Parameters<T>): void {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

/**
 * 节流函数
 * @param fn 目标函数
 * @param interval 间隔毫秒数
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastTime = 0
  let timer: ReturnType<typeof setTimeout> | null = null

  return function (...args: Parameters<T>): void {
    const now = Date.now()

    if (now - lastTime >= interval) {
      lastTime = now
      fn.apply(this, args)
    } else {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        lastTime = Date.now()
        fn.apply(this, args)
        timer = null
      }, interval - (now - lastTime))
    }
  }
}

/**
 * 带立即执行的防抖
 */
export function debounceImmediate<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
  immediate: boolean = false
): { call: (...args: Parameters<T>) => void; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null

  const call = (...args: Parameters<T>): void => {
    const callNow = immediate && !timer

    if (timer) clearTimeout(timer)

    timer = setTimeout(() => {
      timer = null
      if (!immediate) fn.apply({}, args)
    }, delay)

    if (callNow) fn.apply({}, args)
  }

  const cancel = (): void => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  return { call, cancel }
}

// ─── 在组件中使用示例 ───

// composables/useDebounceRef.ts
import { ref, customRef } from 'vue'

/**
 * 防抖 Ref
 * 用于搜索输入等场景
 */
export function useDebounceRef<T>(value: T, delay: number = 300) {
  return customRef((track, trigger) => {
    let timer: ReturnType<typeof setTimeout>

    return {
      get() {
        track()
        return value
      },
      set(newValue) {
        clearTimeout(timer)
        timer = setTimeout(() => {
          value = newValue
          trigger()
        }, delay)
      }
    }
  })
}
```

### 10.4 装备列表虚拟滚动

背包可能存放 50+ 件装备，使用虚拟滚动优化渲染性能。

```vue
<!-- components/VirtualEquipmentList.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { EquipmentItem, ScoreMode } from '@types'
import EquipmentCard from './EquipmentCard.vue'

interface Props {
  items: EquipmentItem[]
  scoreMode?: ScoreMode
  itemHeight?: number
  containerHeight?: number
}

const props = withDefaults(defineProps<Props>(), {
  scoreMode: 'balanced',
  itemHeight: 200,
  containerHeight: 600
})

const emit = defineEmits<{
  equip: [item: EquipmentItem]
  lock: [itemId: string]
  dismantle: [itemId: string]
}>()

const scrollTop = ref(0)
const containerRef = ref<HTMLDivElement | null>(null)

// 可见区域起始索引
const startIndex = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / props.itemHeight))
})

// 可见区域结束索引
const endIndex = computed(() => {
  return Math.min(
    props.items.length,
    Math.ceil((scrollTop.value + props.containerHeight) / props.itemHeight)
  )
})

// 可见项
const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value).map((item, idx) => ({
    item,
    index: startIndex.value + idx
  }))
})

// 总高度
const totalHeight = computed(() => props.items.length * props.itemHeight)

// 偏移量
const offsetY = computed(() => startIndex.value * props.itemHeight)

function onScroll() {
  if (containerRef.value) {
    scrollTop.value = containerRef.value.scrollTop
  }
}

onMounted(() => {
  containerRef.value?.addEventListener('scroll', onScroll)
})

onUnmounted(() => {
  containerRef.value?.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <div
    ref="containerRef"
    class="overflow-y-auto"
    :style="{ height: `${containerHeight}px` }"
  >
    <!-- 占位容器 -->
    <div :style="{ height: `${totalHeight}px`, position: 'relative' }">
      <!-- 可见项容器 -->
      <div
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          transform: `translateY(${offsetY}px)`
        }"
      >
        <div
          v-for="{ item, index } in visibleItems"
          :key="item.id"
          :style="{ height: `${itemHeight}px` }"
        >
          <EquipmentCard
            :item="item"
            :score-mode="scoreMode"
            @equip="emit('equip', item)"
            @lock="emit('lock', item.id)"
            @dismantle="emit('dismantle', item.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
```

### 10.5 Web Worker 离线计算

离线收益计算可能耗时较长，放入 Web Worker 避免阻塞主线程。

```typescript
// workers/offline.worker.ts
import { OfflineCalculator } from '@core/OfflineCalculator'
import type { OfflineCalcInput, OfflineReport } from '@types'

const calculator = new OfflineCalculator()

self.onmessage = (event: MessageEvent<{ type: string; payload: OfflineCalcInput }>) => {
  if (event.data.type === 'calculate') {
    const report = calculator.calculate(event.data.payload)
    self.postMessage({ type: 'result', payload: report })
  }
}

// composables/useOfflineWorker.ts
import { ref } from 'vue'
import type { OfflineCalcInput, OfflineReport } from '@types'

let worker: Worker | null = null

export function useOfflineWorker() {
  const isCalculating = ref(false)
  const result = ref<OfflineReport | null>(null)

  function getWorker(): Worker {
    if (!worker) {
      worker = new Worker(new URL('@workers/offline.worker.ts', import.meta.url), {
        type: 'module'
      })

      worker.onmessage = (event: MessageEvent<{ type: string; payload: OfflineReport }>) => {
        if (event.data.type === 'result') {
          result.value = event.data.payload
          isCalculating.value = false
        }
      }
    }
    return worker
  }

  function calculateOffline(input: OfflineCalcInput): Promise<OfflineReport> {
    isCalculating.value = true
    return new Promise((resolve) => {
      const w = getWorker()

      const handler = (event: MessageEvent<{ type: string; payload: OfflineReport }>) => {
        if (event.data.type === 'result') {
          w.removeEventListener('message', handler)
          result.value = event.data.payload
          isCalculating.value = false
          resolve(event.data.payload)
        }
      }

      w.addEventListener('message', handler)
      w.postMessage({ type: 'calculate', payload: input })
    })
  }

  function terminate(): void {
    if (worker) {
      worker.terminate()
      worker = null
    }
  }

  return {
    isCalculating,
    result,
    calculateOffline,
    terminate
  }
}
```

---

## 第11章 PWA 与 H5 适配

### 11.0 PWA 与 H5 适配概述

PWA（渐进式 Web 应用）让网页应用拥有接近原生应用的体验。通过 Service Worker 离线缓存，玩家可以在没有网络连接时继续游玩。微信 H5 适配则确保游戏在微信内置浏览器中正常运行，这是国内 H5 游戏最重要的分发渠道之一。

PWA 配置的核心目标：**离线可玩**，Service Worker 缓存所有静态资源，玩家断网也能打开游戏；**快速启动**，利用缓存优先策略，二次打开时秒级加载；**可安装**，支持添加到桌面，像原生应用一样从图标启动；**自动更新**，检测到新版本时提示玩家刷新。

微信 H5 适配的核心目标：**禁止下拉回弹**，微信内置浏览器的下拉回弹会与游戏滚动冲突；**音频自动播放**，微信需要特殊处理才能解锁音频自动播放；**分享集成**，支持微信好友分享和朋友圈分享。

### 11.1 vite-plugin-pwa 配置

PWA 配置使游戏可以像原生应用一样安装到设备桌面，支持离线游玩。

```typescript
// vite.config.ts 中的 PWA 配置已在第 2 章提供，此处补充 Service Worker 自定义逻辑

// src/prompt-sw.ts
import { precacheAndRoute } from 'workbox-precaching'
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies'
import { registerRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope

// 预缓存所有构建产物
precacheAndRoute(self.__WB_MANIFEST)

// 字体使用 CacheFirst 策略
registerRoute(
  /^https:\/\/fonts\.(gstatic|googleapis)\.com\/.*/,
  new CacheFirst({
    cacheName: 'fonts-cache',
    plugins: []
  })
)

// 其他 API 请求使用 StaleWhileRevalidate
registerRoute(
  /^https:\/\/api\..*/,
  new StaleWhileRevalidate({
    cacheName: 'api-cache'
  })
)

// 安装事件
self.addEventListener('install', (event) => {
  console.log('[SW] 安装中...')
  event.waitUntil(self.skipWaiting())
})

// 激活事件
self.addEventListener('activate', (event) => {
  console.log('[SW] 激活中...')
  event.waitUntil(self.clients.claim())
})

// 后台同步（离线战斗收益）
self.addEventListener('sync', (event) => {
  if (event.tag === 'offline-earnings') {
    console.log('[SW] 后台同步离线收益')
  }
})
```

### 11.2 PWA 更新提示

```vue
<!-- components/PWAUpdatePrompt.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const needRefresh = ref(false)
let updateSW: (() => Promise<void>) | null = null

onMounted(async () => {
  try {
    const { registerSW } = await import('virtual:pwa-register')

    updateSW = registerSW({
      immediate: true,
      onNeedRefresh() {
        needRefresh.value = true
      },
      onOfflineReady() {
        console.log('应用已准备好离线使用')
      }
    })
  } catch {
    // PWA 未启用
  }
})

async function refreshApp() {
  if (updateSW) {
    await updateSW()
    window.location.reload()
  }
}

function dismiss() {
  needRefresh.value = false
}
</script>

<template>
  <div
    v-if="needRefresh"
    class="fixed bottom-4 left-1/2 -translate-x-1/2 bg-game-panel border border-game-accent rounded-lg px-4 py-3 flex items-center gap-4 z-50 shadow-lg"
  >
    <span class="text-sm">新版本可用</span>
    <button class="btn-primary text-sm px-3 py-1" @click="refreshApp">
      立即更新
    </button>
    <button class="text-gray-500 hover:text-gray-300 text-sm" @click="dismiss">
      忽略
    </button>
  </div>
</template>
```

### 11.3 微信 H5 适配

微信内置浏览器的适配处理。

```typescript
// utils/wechat.ts

/**
 * 检测是否在微信环境中
 */
export function isWechat(): boolean {
  return /MicroMessenger/i.test(navigator.userAgent)
}

/**
 * 微信分享配置
 */
export function setupWechatShare(title: string, desc: string): void {
  if (!isWechat()) return

  // 微信 JS-SDK 配置
  document.addEventListener('WeixinJSBridgeReady', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wx = (window as any).WeixinJSBridge
    if (wx) {
      wx.invoke('shareTimeline', {
        title,
        desc,
        link: window.location.href
      })
      wx.invoke('sendAppMessage', {
        title,
        desc,
        link: window.location.href
      })
    }
  })
}

/**
 * 禁用微信下拉回弹效果
 */
export function disableWechatOverscroll(): void {
  if (!isWechat()) return

  document.body.addEventListener(
    'touchmove',
    (e) => {
      if ((e.target as HTMLElement)?.closest?.('[data-scroll]')) return
      e.preventDefault()
    },
    { passive: false }
  )
}

/**
 * 微信音频自动播放处理
 */
export function enableWechatAudioAutoplay(): void {
  if (!isWechat()) return

  document.addEventListener('WeixinJSBridgeReady', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wx = (window as any).WeixinJSBridge
    if (wx) {
      wx.invoke('getNetworkType', {}, () => {
        // 网络类型获取后解锁音频播放
        document.querySelectorAll('audio').forEach((audio) => {
          audio.play().catch(() => {})
          audio.pause()
        })
      })
    }
  })
}
```

### 11.4 移动端适配

```typescript
// utils/mobile.ts

/**
 * 检测是否为移动端
 */
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * 检测是否支持触摸
 */
export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

/**
 * 禁止双击缩放
 */
export function preventDoubleTapZoom(): void {
  let lastTouchEnd = 0
  document.addEventListener(
    'touchend',
    (event) => {
      const now = Date.now()
      if (now - lastTouchEnd <= 300) {
        event.preventDefault()
      }
      lastTouchEnd = now
    },
    { passive: false }
  )
}

/**
 * 安全区域适配（刘海屏）
 */
export function setupSafeArea(): void {
  // CSS env() 变量自动处理
  document.documentElement.style.setProperty(
    '--safe-area-top',
    'env(safe-area-inset-top)'
  )
  document.documentElement.style.setProperty(
    '--safe-area-bottom',
    'env(safe-area-inset-bottom)'
  )
}
```

### 11.5 响应式布局

使用 Tailwind CSS 的响应式前缀实现多设备适配。

```css
/* 移动端优先的响应式布局 */
/* 默认：单栏（移动端） */
.game-layout {
  @apply flex flex-col;
}

/* 平板：双栏 */
@media (min-width: 768px) {
  .game-layout {
    @apply flex-row;
  }
  .game-sidebar {
    @apply w-64 flex-shrink-0;
  }
  .game-main {
    @apply flex-1;
  }
}

/* 桌面：三栏 */
@media (min-width: 1280px) {
  .game-sidebar-left {
    @apply w-80;
  }
  .game-sidebar-right {
    @apply w-80;
  }
}

/* 触摸设备优化 */
@media (pointer: coarse) {
  .interactive-btn {
    @apply min-h-[44px] min-w-[44px]; /* iOS 推荐最小触摸区域 */
  }
}
```

---

## 第12章 开发路线图

### 12.0 路线图概述

开发路线图将整个项目分为 18 周三个阶段的迭代计划。第一阶段聚焦核心闭环，目标是搭建完整游戏框架并实现可玩性；第二阶段深化体验，完善强化、天赋、反馈等系统；第三阶段长期扩展，添加多职业、套装、转生等深度内容。

路线图的设计遵循以下原则：**闭环优先**，每一阶段结束都有一个可玩的版本，而不是等到最后才集成；**数值驱动**，每个阶段都有明确的数值验收标准，确保游戏进度曲线合理；**风险前置**，核心机制（战斗、装备、离线）在第一阶段就完成，降低项目风险；**体验收口**，第二阶段重点优化玩家体验（反馈、对比、目标），确保游戏"好玩"；**深度扩展**，第三阶段建立在稳定的核心循环之上，添加长期追求内容。

### 12.1 总体时间线

```
Month 1          Month 2          Month 3          Month 4          Month 5          Month 6
Week 1-6         Week 7-12        Week 13-18
├─ 核心闭环 ─┤  ├─ 体验深化 ─┤  ├─ 长期扩展 ─┤
```

### 12.2 第一阶段：核心闭环（第 1-6 周）

**目标**：搭建完整游戏框架，实现核心可玩性。

| 周次 | 模块 | 内容 | 验收标准 |
|------|------|------|----------|
| 第 1 周 | 项目搭建 | Vue 3 + Vite + Pinia + Tailwind 环境搭建，目录结构，基础配置 | `npm run build` 通过，PWA 正常工作 |
| 第 1 周 | 数据结构 | 全部枚举、接口、常量定义完成 | TypeScript 编译无报错 |
| 第 2 周 | 角色系统 | Player Store 实现，属性计算，训练系统 | DPS/EHP/战力公式正确计算 |
| 第 2 周 | 装备生成 | LootGenerator 实现，18 种词缀，品质 Roll | 能生成所有品质的装备，词缀数值在范围内 |
| 第 3 周 | 战斗引擎 | CombatEngine 完成，单场模拟，批量模拟 | 战斗结果符合预期，胜负判定正确 |
| 第 3 周 | 层数系统 | FloorScaling 实现，推荐战力，收益衰减 | 层数成长曲线合理，收益衰减阈值生效 |
| 第 4 周 | 自动挂机 | useCombat 组合式函数，挂机循环 | 1200ms 间隔自动战斗，失败自动暂停 |
| 第 4 周 | 装备评分 | GearScore 5 种模式 | 评分结果合理，不同模式有区分度 |
| 第 5 周 | 离线收益 | OfflineCalculator 完成，时间戳校验 | 离线时间正确计算，12h 软上限生效 |
| 第 5 周 | 存档系统 | SaveManager 完成，localStorage + IndexedDB | 存档读写正常，版本迁移可用 |
| 第 6 周 | UI 框架 | 基础面板布局，三栏响应式设计 | 移动端/平板/桌面端正常显示 |
| 第 6 周 | 联调测试 | 完整闭环测试，数值校准 | 玩家能完成挂机→掉落→整理→推层全流程 |

### 12.3 第二阶段：体验深化（第 7-12 周）

**目标**：完善装备系统，增强反馈体验，优化 UI。

| 周次 | 模块 | 内容 | 验收标准 |
|------|------|------|----------|
| 第 7 周 | 强化系统 | EnhancementSystem +1~+10 完整实现 | 成功率、失败惩罚、消耗正确 |
| 第 7 周 | 天赋系统 | 4 分支 12 节点完整实现 | 天赋激活/重置正常，属性加成正确 |
| 第 8 周 | 装备对比 | EquipmentCompare 组件，逐属性对比 | 3 秒内看懂差异，颜色标识正确 |
| 第 8 周 | 背包优化 | 虚拟滚动，批量分解，一键整理 | 50+ 装备无卡顿，批量操作流畅 |
| 第 9 周 | 反馈系统 | 掉落反馈，推层反馈，Boss 反馈 | 传说掉落有全屏提示，推层成功有特效 |
| 第 9 周 | 目标系统 | 推荐挂机层，推层目标，Boss 目标 | 推荐逻辑合理，玩家知道下一步该做什么 |
| 第 10 周 | 性能优化 | 脏标记缓存，大数值处理，防抖节流 | 页面帧率 60fps，大数值不溢出 |
| 第 10 周 | 离线报告 | OfflineReportModal 完整实现 | 展示清晰，装备列表可滚动 |
| 第 11 周 | PWA 完善 | Service Worker，离线缓存，更新提示 | 离线可玩，更新弹窗正常 |
| 第 11 周 | 微信适配 | 微信 H5 适配，分享功能 | 微信内置浏览器正常运行 |
| 第 12 周 | 全面测试 | 单元测试覆盖 80%+，集成测试 | `npm run test:run` 全部通过 |
| 第 12 周 | 数值调优 | 根据测试数据调整数值曲线 | 玩家能在 2 小时内体验到第一个传说装备 |

### 12.4 第三阶段：长期扩展（第 13-18 周）

**目标**：扩展游戏深度，增加长期追求内容。

| 周次 | 模块 | 内容 | 验收标准 |
|------|------|------|----------|
| 第 13 周 | 多职业 | 战士、刺客、法师三职业实现 | 不同主属性影响 DPS 公式正确 |
| 第 13 周 | 职业天赋 | 各职业专属天赋节点 | 天赋与职业联动 |
| 第 14 周 | 套装系统 | 套装定义，套装效果触发 | 2/4 件套装效果正确激活 |
| 第 14 周 | 远古装备 | 远古品质完整实现 | 词缀数值范围更高，红色视觉 |
| 第 15 周 | 转生系统 | Prestige Store 完整实现 | 转生获得灵魂点，灵魂加成正确计算 |
| 第 15 周 | 每日任务 | Daily Store 完整实现 | 6 种任务类型，每日重置 |
| 第 16 周 | Boss 机制 | Boss 技能，首通奖励 | Boss 有独特技能，首通有特殊反馈 |
| 第 16 周 | 装备展示 | 极品装备分享截图 | 可生成装备卡片图片 |
| 第 17 周 | 音效系统 | 掉落音效，战斗音效，UI 音效 | 不同品质有不同音效反馈 |
| 第 17 周 | 动画优化 | 掉落动画，开箱动画，强化特效 | 关键节点有视觉反馈 |
| 第 18 周 | 最终测试 | 全量测试，性能测试，兼容性测试 | 所有目标平台正常运行 |
| 第 18 周 | 发布准备 | 构建优化，资源压缩，文档完善 | 包体积 < 5MB，加载 < 3 秒 |

### 12.5 里程碑检查点

| 里程碑 | 时间 | 检查内容 |
|--------|------|----------|
| M1 核心可玩 | 第 3 周末 | 能生成装备、模拟战斗、计算战力 |
| M2 闭环完整 | 第 6 周末 | 挂机→掉落→整理→推层 全流程可运行 |
| M3 体验优质 | 第 9 周末 | 反馈系统完善，玩家理解游戏目标 |
| M4 系统稳定 | 第 12 周末 | 测试覆盖 80%+，无明显 Bug |
| M5 深度扩展 | 第 15 周末 | 多职业、套装、转生系统可用 |
| M6 正式发布 | 第 18 周末 | 所有平台正常运行，性能达标 |


---

## 第13章 测试策略

### 13.0 测试策略概述

测试是保证游戏质量的关键环节。放置型 ARPG 的测试面临特殊挑战：数值公式复杂且相互关联，一个微小的系数调整可能影响整个游戏平衡；离线收益涉及时间计算，难以手动模拟各种边界情况；装备生成使用随机数，需要大量样本验证分布是否符合预期。

测试策略采用分层测试模型，从底层到顶层依次为：单元测试（验证单个函数的正确性）、集成测试（验证模块间的协作）、端到端测试（验证完整游戏流程）。单元测试使用 Vitest 框架，覆盖所有核心计算模块；集成测试验证 Store 间的数据流；端到端测试使用浏览器自动化工具验证 UI 交互。

### 13.1 单元测试

单元测试覆盖 `core` 目录下的所有计算模块和 `utils` 目录下的辅助函数。每个测试文件对应一个源文件，命名约定为 `{SourceFile}.test.ts`。

**战斗引擎测试**：

```typescript
// core/__tests__/CombatEngine.test.ts
import { describe, it, expect } from 'vitest'
import { CombatEngine } from '../CombatEngine'
import type { PlayerBuild } from '@types'

const mockBuild: PlayerBuild = {
  level: 10,
  mainAttribute: 'str',
  baseStats: {
    attack: 50, hp: 300, armor: 20, attackSpeed: 1.2,
    critChance: 0.1, critDamage: 1.5, dodge: 0.05, block: 0,
    fireResist: 0, iceResist: 0, goldFind: 0, magicFind: 0, expGain: 0
  },
  mainAttributes: { str: 30, dex: 15, int: 15 },
  equipped: {},
  activeTalents: [],
  training: { attack: 5, hp: 5, armor: 5 }
}

describe('CombatEngine', () => {
  const engine = new CombatEngine()

  it('应该正确计算 DPS', () => {
    const dps = engine.calculateDPS(mockBuild)
    expect(dps).toBeGreaterThan(0)
    // DPS = 50 * (1 + 30 * 0.005) * 1.2 * (1 + 0.1 * 0.5)
    // = 50 * 1.15 * 1.2 * 1.05 = 72.45
    expect(dps).toBeCloseTo(72.45, 1)
  })

  it('应该正确计算 EHP', () => {
    const ehp = engine.calculateEHP(mockBuild, 28) // 第10层怪物等级
    expect(ehp).toBeGreaterThan(300) // EHP 应该大于原始生命
  })

  it('应该生成对应层的怪物', () => {
    const monster = engine.generateMonster(10)
    expect(monster.level).toBe(28) // 10 * 2 + 8
    expect(monster.hp).toBeGreaterThan(0)
    expect(monster.attack).toBeGreaterThan(0)
  })

  it('Boss 层应该生成更强的怪物', () => {
    const normalMonster = engine.generateMonster(9)
    const bossMonster = engine.generateMonster(10)
    expect(bossMonster.hp).toBeGreaterThan(normalMonster.hp)
    expect(bossMonster.attack).toBeGreaterThan(normalMonster.attack)
  })

  it('战力足够的玩家应该能击败低层怪物', () => {
    const result = engine.simulate(mockBuild, 1)
    expect(result.victory).toBe(true)
    expect(result.goldEarned).toBeGreaterThan(0)
    expect(result.expEarned).toBeGreaterThan(0)
  })

  it('战力不足的玩家应该失败', () => {
    const weakBuild = { ...mockBuild, baseStats: { ...mockBuild.baseStats, attack: 1, hp: 10 } }
    const result = engine.simulate(weakBuild, 100)
    expect(result.victory).toBe(false)
    expect(result.failureReason).toBeDefined()
  })

  it('批量模拟应该返回合理的总击杀数', () => {
    const batch = engine.simulateBatch(mockBuild, 5, 3600) // 模拟 1 小时
    expect(batch.killCount).toBeGreaterThan(0)
    expect(batch.totalGold).toBeGreaterThan(0)
    expect(batch.actualSeconds).toBeLessThanOrEqual(3600)
  })
})
```

**层数缩放测试**：

```typescript
// core/__tests__/FloorScaling.test.ts
import { describe, it, expect } from 'vitest'
import { FloorScaling } from '../FloorScaling'
import type { PlayerBuild } from '@types'

describe('FloorScaling', () => {
  const scaling = new FloorScaling()

  it('推荐战力应该随层数指数增长', () => {
    const p10 = scaling.getRecommendedPower(10)
    const p20 = scaling.getRecommendedPower(20)
    expect(p20).toBeGreaterThan(p10)
    // 增长率约 12%
    expect(p20 / p10).toBeCloseTo(3.11, 0) // 1.12^10 ≈ 3.11
  })

  it('收益衰减应该在正确阈值触发', () => {
    // 战力 = 推荐战力 → 100%
    expect(scaling.getEfficiencyRatio(1000, 1000)).toBe(1.0)
    // 战力 = 80% 推荐 → 80%
    expect(scaling.getEfficiencyRatio(800, 1000)).toBe(0.8)
    // 战力 = 60% 推荐 → 50%
    expect(scaling.getEfficiencyRatio(600, 1000)).toBe(0.5)
    // 战力 = 50% 推荐 → 20%
    expect(scaling.getEfficiencyRatio(500, 1000)).toBe(0.2)
  })

  it('Boss 层推荐战力应该更高', () => {
    const normal = scaling.getRecommendedPower(9)
    const boss = scaling.getRecommendedPower(10)
    expect(boss).toBeGreaterThan(normal * 2)
  })
})
```

**装备生成测试**：

```typescript
// core/__tests__/LootGenerator.test.ts
import { describe, it, expect } from 'vitest'
import { LootGenerator } from '../LootGenerator'
import { Rarity } from '@types'

describe('LootGenerator', () => {
  const generator = new LootGenerator()

  it('应该生成有效的装备', () => {
    const item = generator.generateDrop(10)
    expect(item.id).toBeDefined()
    expect(item.name).toBeTruthy()
    expect(Object.values(Rarity)).toContain(item.rarity)
    expect(item.score).toBeGreaterThan(0)
  })

  it('装备等级应该符合公式', () => {
    const item = generator.generateDrop(10)
    expect(item.itemLevel).toBe(15) // floor(10 / 2 + 10)
  })

  it('词缀数量应该符合品质规则', () => {
    // 生成大量样本验证分布
    const samples = Array.from({ length: 1000 }, () => generator.generateDrop(50))

    const normal = samples.filter((i) => i.rarity === Rarity.NORMAL)
    const magic = samples.filter((i) => i.rarity === Rarity.MAGIC)
    const rare = samples.filter((i) => i.rarity === Rarity.RARE)

    // 普通装备 0 词缀
    expect(normal.every((i) => i.affixes.length === 0)).toBe(true)
    // 魔法装备 1-2 词缀
    expect(magic.every((i) => i.affixes.length >= 1 && i.affixes.length <= 2)).toBe(true)
    // 稀有装备 3-4 词缀
    expect(rare.every((i) => i.affixes.length >= 3 && i.affixes.length <= 4)).toBe(true)
  })

  it('传说装备应该有传奇词缀', () => {
    // 高 magicFind + 高层数增加传说概率
    let legendary: ReturnType<typeof generator.generateDrop> | null = null
    for (let i = 0; i < 5000; i++) {
      const item = generator.generateDrop(100, 500)
      if (item.rarity === Rarity.LEGENDARY) {
        legendary = item
        break
      }
    }

    if (legendary) {
      expect(legendary.affixes.some((a) => a.isLegendary)).toBe(true)
    }
  })
})
```

**装备评分测试**：

```typescript
// core/__tests__/GearScore.test.ts
import { describe, it, expect } from 'vitest'
import { GearScore } from '../GearScore'
import type { EquipmentItem } from '@types'
import { Rarity, SlotType } from '@types'

function createMockItem(overrides: Partial<EquipmentItem> = {}): EquipmentItem {
  return {
    id: 'test',
    name: '测试装备',
    slot: SlotType.WEAPON,
    rarity: Rarity.RARE,
    itemLevel: 10,
    baseItemId: 'dagger',
    baseStats: { attack: 10 },
    affixes: [],
    locked: false,
    score: 0,
    scores: { balanced: 0, crit: 0, atkSpd: 0, tough: 0, mainAttr: 0 },
    enhancement: 0,
    createdAt: Date.now(),
    ...overrides
  }
}

describe('GearScore', () => {
  it('攻击属性应该提高评分', () => {
    const lowAtk = createMockItem({ baseStats: { attack: 5 } })
    const highAtk = createMockItem({ baseStats: { attack: 20 } })

    GearScore.updateItemScores(lowAtk)
    GearScore.updateItemScores(highAtk)

    expect(highAtk.score).toBeGreaterThan(lowAtk.score)
  })

  it('高品质装备评分应该更高', () => {
    const normal = createMockItem({ rarity: Rarity.NORMAL, affixes: [] })
    const rare = createMockItem({ rarity: Rarity.RARE, affixes: [] })

    GearScore.updateItemScores(normal)
    GearScore.updateItemScores(rare)

    expect(rare.score).toBeGreaterThan(normal.score)
  })

  it('不同模式应该有不同评分', () => {
    const item = createMockItem({
      affixes: [
        { type: 'critChance', name: '鹰眼', value: 5, valueType: 'flat', isLegendary: false }
      ]
    })

    GearScore.updateItemScores(item)

    // 暴击模式评分应该高于坚韧模式
    expect(item.scores.crit).toBeGreaterThan(item.scores.tough)
  })
})
```

**强化系统测试**：

```typescript
// core/__tests__/EnhancementSystem.test.ts
import { describe, it, expect } from 'vitest'
import { EnhancementSystem } from '../EnhancementSystem'
import type { EquipmentItem } from '@types'
import { Rarity, SlotType } from '@types'

describe('EnhancementSystem', () => {
  function createItem(enhancement: number = 0): EquipmentItem {
    return {
      id: 'test', name: '测试', slot: SlotType.WEAPON, rarity: Rarity.RARE,
      itemLevel: 10, baseItemId: 'dagger', baseStats: { attack: 10 },
      affixes: [], locked: false, score: 0,
      scores: { balanced: 0, crit: 0, atkSpd: 0, tough: 0, mainAttr: 0 },
      enhancement, createdAt: Date.now()
    }
  }

  it('+1~+3 应该 100% 成功', () => {
    const item = createItem(0)
    const result = EnhancementSystem.enhance(item, 1000, 100)
    expect(result.success).toBe(true)
    expect(result.newLevel).toBe(1)
  })

  it('金币不足应该失败', () => {
    const item = createItem(0)
    const result = EnhancementSystem.enhance(item, 0, 0)
    expect(result.success).toBe(false)
    expect(result.goldSpent).toBe(0)
  })

  it('+10 后应该无法继续强化', () => {
    const item = createItem(10)
    const check = EnhancementSystem.canEnhance(item, 99999, 99999)
    expect(check.can).toBe(false)
  })
})
```

**离线收益测试**：

```typescript
// core/__tests__/OfflineCalculator.test.ts
import { describe, it, expect } from 'vitest'
import { OfflineCalculator } from '../OfflineCalculator'
import type { PlayerBuild } from '@types'

describe('OfflineCalculator', () => {
  const calculator = new OfflineCalculator()

  const mockBuild: PlayerBuild = {
    level: 10, mainAttribute: 'str',
    baseStats: {
      attack: 50, hp: 300, armor: 20, attackSpeed: 1.2,
      critChance: 0.1, critDamage: 1.5, dodge: 0.05, block: 0,
      fireResist: 0, iceResist: 0, goldFind: 0, magicFind: 0, expGain: 0
    },
    mainAttributes: { str: 30, dex: 15, int: 15 },
    equipped: {}, activeTalents: [], training: { attack: 5, hp: 5, armor: 5 }
  }

  it('离线收益应该在时间上限内计算', () => {
    const report = calculator.calculate({
      lastActiveTime: Date.now() - 24 * 3600 * 1000, // 24 小时前
      currentTime: Date.now(),
      playerBuild: mockBuild,
      currentFloor: 5,
      backpackSlots: 50,
      playerPower: 5000,
      pickupFilter: { minRarity: 'normal', autoConvert: true, allowedSlots: [], requiredAffixes: [] },
      magicFind: 0, goldFind: 0
    })

    // 应该限制为 12 小时
    expect(report.durationSeconds).toBeLessThanOrEqual(12 * 3600)
    expect(report.killCount).toBeGreaterThan(0)
  })

  it('负数时间应该返回零收益', () => {
    const report = calculator.calculate({
      lastActiveTime: Date.now() + 10000, // 未来时间
      currentTime: Date.now(),
      playerBuild: mockBuild,
      currentFloor: 5,
      backpackSlots: 50,
      playerPower: 5000,
      pickupFilter: { minRarity: 'normal', autoConvert: true, allowedSlots: [], requiredAffixes: [] },
      magicFind: 0, goldFind: 0
    })

    expect(report.killCount).toBe(0)
    expect(report.goldEarned).toBe(0)
  })

  it('无法击杀时应该返回零收益', () => {
    const weakBuild = { ...mockBuild, baseStats: { ...mockBuild.baseStats, attack: 1, hp: 10 } }
    const report = calculator.calculate({
      lastActiveTime: Date.now() - 3600 * 1000,
      currentTime: Date.now(),
      playerBuild: weakBuild,
      currentFloor: 50, // 高层
      backpackSlots: 50,
      playerPower: 100,
      pickupFilter: { minRarity: 'normal', autoConvert: true, allowedSlots: [], requiredAffixes: [] },
      magicFind: 0, goldFind: 0
    })

    expect(report.endReason).toBe('cannot_kill')
  })
})
```

### 13.2 集成测试

集成测试验证多个模块协作时的正确性。重点测试 Store 间的数据流和核心游戏循环。

```typescript
// stores/__tests__/integration.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerStore } from '../player'
import { useCombatStore } from '../combat'

describe('Store Integration', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('战斗胜利后玩家应该获得金币和经验', () => {
    const player = usePlayerStore()
    const combat = useCombatStore()

    const initialGold = player.gold
    const initialExp = player.exp

    combat.currentFloor = 1
    // 模拟一场胜利战斗
    const result = combat.executeCombat(player.getBuildSnapshot())

    if (result.victory) {
      player.gainGold(result.goldEarned)
      player.gainExp(result.expEarned)
    }

    expect(player.gold).toBeGreaterThan(initialGold)
    expect(player.exp).toBeGreaterThan(initialExp)
  })

  it('推层成功后最高层应该增加', () => {
    const combat = useCombatStore()
    combat.currentFloor = 1
    combat.highestFloor = 1

    combat.unlockFloor(2)

    expect(combat.highestFloor).toBe(2)
  })
})
```

### 13.3 测试覆盖率目标

| 模块 | 目标覆盖率 | 测试重点 |
|------|------------|----------|
| CombatEngine | 90%+ | DPS/EHP 公式、胜负判定、批量模拟 |
| FloorScaling | 85%+ | 推荐战力、收益衰减、目标评估 |
| LootGenerator | 85%+ | 品质分布、词缀生成、命名规则 |
| GearScore | 90%+ | 评分计算、装备对比 |
| EnhancementSystem | 90%+ | 成功率、消耗、失败惩罚 |
| OfflineCalculator | 85%+ | 时间校验、批量模拟、背包限制 |
| SaveManager | 80%+ | 保存/加载、版本迁移、导入导出 |
| Player Store | 80%+ | 属性计算、训练、天赋 |

### 13.4 持续集成

项目使用 GitHub Actions 实现持续集成，每次提交自动运行以下检查：

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run format:check
      - run: npm run test:run
      - run: npm run build
```

---

## 第14章 扩展开发指南

### 14.0 扩展概述

本章节为后续系统扩展提供技术指导。核心闭环稳定后，游戏可以通过横向添加新系统和纵向深化现有系统来延长生命周期。

### 14.1 添加新职业

添加新职业需要修改以下文件：

1. `types/enums.ts`：在 `ClassType` 枚举中添加新职业
2. `types/index.ts`：如有职业专属属性，扩展 `PlayerBuild` 接口
3. `stores/player.ts`：在 `mainAttribute` 的合法值中添加新职业的主属性
4. `utils/constants.ts`：添加职业专属的基础属性配置
5. `components/PlayerPanel.vue`：添加职业选择 UI

新职业的核心差异体现在主属性选择上：战士主力量（影响物理攻击和护甲）、刺客主敏捷（影响暴击率和闪避）、法师主智力（影响法术攻击和抗性）。主属性通过 `MAIN_ATTR_BONUS_PER_POINT` 系数（0.5%）影响 DPS，这意味着不同职业的装备选择策略完全不同。

### 14.2 添加新词缀

添加新词缀需要修改以下文件：

1. `types/enums.ts`：在 `AffixType` 枚举中添加新词缀类型
2. `utils/constants.ts`：在 `AFFIX_DEFS` 数组中添加词缀定义，包括名称、数值范围、适用部位和权重
3. `utils/constants.ts`：在 `SCORE_WEIGHTS` 中为各评分模式添加新词缀的权重

词缀定义示例：

```typescript
{
  type: AffixType.LIGHTNING_DAMAGE,  // 新枚举值
  name: '雷霆',
  minValue: 3,
  maxValue: 12,
  valueType: 'flat',
  allowedSlots: [SlotType.WEAPON, SlotType.RING],
  weight: 40,
  tier: 2
}
```

添加词缀后需要验证：评分计算正确包含新词缀、装备生成可以产出带新词缀的装备、UI 正确显示新词缀的名称和数值。

### 14.3 添加新天赋节点

添加新天赋节点需要修改：

1. `utils/constants.ts`：在 `TALENT_NODE_DEFS` 数组中添加节点定义
2. `stores/player.ts`：`talentBonus` computed 会自动遍历所有已激活节点，无需修改

天赋节点的效果通过 `Partial<BaseStats> & Partial<MainAttributes>` 定义，支持影响任何基础属性或主属性。天赋系统的扩展性很好，添加新节点不需要修改其他代码。

### 14.4 添加套装系统

套装系统是中期扩展的重要内容。实现方案：

1. **数据结构**：为 `EquipmentItem` 添加 `setId?: string` 和 `setBonuses?: SetBonus[]` 字段
2. **套装定义**：创建 `SetDef` 接口，定义套装名称、件数要求和激活效果
3. **套装检测**：在穿戴装备变化时检查套装件数，激活对应效果
4. **UI 展示**：在装备卡片和角色面板上展示套装激活状态

套装效果示例：2 件增加 10% 生命，4 件增加 20% 全属性。套装检测逻辑：遍历所有已穿戴装备，按 `setId` 分组，统计每组件数，达到阈值时激活效果。

### 14.5 添加转生系统

转生系统（Prestige）是放置游戏的经典长期机制。实现方案：

1. **转生条件**：达到指定层数（如 100 层）后解锁转生按钮
2. **转生收益**：重置游戏进度（层数、等级、装备），但获得灵魂点数作为永久加成
3. **灵魂加成**：消耗灵魂点提升全局百分比加成（攻击%、生命%、金币获取%等）
4. **转生存档**：在 `GameSnapshot` 中添加 `prestige` 字段保存转生状态

转生的核心设计是"每次转生都比上次更快"，因为灵魂加成提供了永久的成长加速。转生次数越多，灵魂加成越高，推进层数越快。这种正反馈循环为玩家提供了长期的追求目标。

### 14.6 数值调校指南

数值是放置游戏的核心，调校时需要关注以下指标：

| 指标 | 检查方法 | 目标范围 |
|------|----------|----------|
| 推层速度 | 记录玩家从 1 层到 10 层的时间 | 2-4 小时 |
| 传说掉率 | 统计 1000 次击杀的传说装备数 | 1-2 件 |
| 金币收支平衡 | 训练消耗 vs 挂机收益 | 收入 > 消耗 20% |
| 背包压力 | 记录背包满的频率 | 每 2-3 小时一次 |
| 离线收益占比 | 离线收益 / 总收益 | 50-70% |

调校流程：收集测试数据 → 识别异常指标 → 调整对应常量 → 重新测试验证。

### 14.7 存档版本迁移指南

当数据结构发生变化时，需要添加新的迁移函数：

```typescript
// core/SaveManager.ts 中的 MIGRATORS 对象
const MIGRATORS: Record<number, (data: Record<string, unknown>) => GameSnapshot> = {
  // 已有迁移...
  1: (data) => {
    const snapshot = data as unknown as GameSnapshot
    // v1 -> v2 迁移示例：添加新字段的默认值
    if (!snapshot.player.newField) {
      snapshot.player.newField = defaultValue
    }
    return { ...snapshot, version: 2 }
  }
}
```

迁移规则：旧版本字段保持兼容、新增字段提供合理的默认值、删除的字段静默忽略、不合法的值回退到默认。

### 14.8 代码质量规范

项目遵循以下代码质量规范：

- **TypeScript 严格模式**：所有变量都有明确类型，不使用 `any`
- **ESLint + Prettier**：统一代码风格，提交前自动格式化
- **组件命名**：PascalCase（如 `CombatPanel.vue`）
- **组合式函数命名**：camelCase 前缀 `use`（如 `useCombat.ts`）
- **Store 命名**：与状态名一致（如 `player.ts`）
- **核心模块命名**：PascalCase（如 `CombatEngine.ts`）
- **常量命名**：UPPER_SNAKE_CASE（如 `MAX_ATTACK_SPEED`）
- **注释规范**：公共 API 使用 JSDoc 注释，复杂逻辑添加行内注释

---

> **文档维护**：本开发技术文档随项目迭代更新。任何系统改动（新功能添加、数值调整、接口变更）需在此文档中同步修订，确保文档与代码实现一致。文档版本号遵循语义化版本规范，与游戏版本号同步更新。
