# 存档管理美术资源需求

## 目录建议

```text
public/assets/ui/save/
```

## 资源清单

| 优先级 | 资源             | 规格建议          | 建议文件名                     | 用途             |
| ------ | ---------------- | ----------------- | ------------------------------ | ---------------- |
| P0     | 保存图标         | SVG/PNG，64x64    | `icon_save_local.svg`          | 本地保存按钮     |
| P0     | 读取图标         | SVG/PNG，64x64    | `icon_load_local.svg`          | 本地读取按钮     |
| P0     | 导出图标         | SVG/PNG，64x64    | `icon_save_export.svg`         | 导出存档按钮     |
| P0     | 导入图标         | SVG/PNG，64x64    | `icon_save_import.svg`         | 导入存档按钮     |
| P0     | 覆盖警告图标     | SVG/PNG，64x64    | `icon_save_overwrite_warn.svg` | 导入覆盖确认弹窗 |
| P1     | 存档成功状态图标 | SVG/PNG，64x64    | `icon_save_success.svg`        | 保存和导入成功   |
| P1     | 存档失败状态图标 | SVG/PNG，64x64    | `icon_save_failed.svg`         | 读取和导入失败   |
| P1     | 存档面板底板     | PNG/WebP 或九宫格 | `ui_save_panel.png`            | 存档管理区域     |
| P2     | 存档写入动效     | 序列帧或粒子贴图  | `effect_save_write.png`        | 保存完成反馈     |

## 当前代码占位点

- `src/components/save/SaveManagementPanel.vue`：当前用文字按钮、边框面板和成功/失败文本状态占位。
- `src/components/layout/RightPanel.vue`：存档管理面板已接入右侧管理区域。

## 当前占位策略

当前版本不依赖正式资源，使用深色面板、描边按钮和文字状态完成导入导出闭环。正式资源补齐后，可替换按钮图标、覆盖警告图标和存档状态反馈。
