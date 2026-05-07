# 装备对比与分解确认美术资源需求

## 目录建议

```text
public/assets/
├── inventory/
├── items/
├── effects/
├── ui/
└── icons/
```

## 资源清单

| 优先级 | 资源             | 规格建议                   | 命名建议                              | 用途             |
| ------ | ---------------- | -------------------------- | ------------------------------------- | ---------------- |
| P0     | 装备对比浮层底板 | PNG/WebP 或九宫格，640x900 | `ui_item_compare_panel.png`           | 装备对比弹窗     |
| P0     | 分解确认弹窗底板 | PNG/WebP 或九宫格，720x720 | `ui_decompose_confirm_panel.png`      | 分解确认弹窗     |
| P0     | 警告图标         | SVG/PNG，64x64             | `icon_warning_triangle.svg`           | 分解风险提示     |
| P0     | 属性上升箭头     | SVG/PNG，48x48             | `icon_stat_up.svg`                    | 正向属性变化     |
| P0     | 属性下降箭头     | SVG/PNG，48x48             | `icon_stat_down.svg`                  | 负向属性变化     |
| P0     | 属性持平图标     | SVG/PNG，48x48             | `icon_stat_equal.svg`                 | 无变化属性       |
| P0     | 分解按钮图标     | SVG/PNG，64x64             | `icon_decompose.svg`                  | 确认分解按钮     |
| P1     | 待分解遮罩       | PNG/WebP，128x128，透明底  | `ui_item_overlay_decompose.png`       | 标记将分解装备   |
| P1     | 保护状态角标     | SVG/PNG，96x96             | `badge_item_protected.svg`            | 标记被保护装备   |
| P1     | 评分提升徽章     | SVG/PNG，120x64            | `badge_score_up.svg`                  | 装备评分提升提示 |
| P1     | 评分降低徽章     | SVG/PNG，120x64            | `badge_score_down.svg`                | 装备评分降低提示 |
| P1     | 强化石图标       | SVG/PNG，96x96             | `icon_currency_enhancement_stone.png` | 分解收益展示     |
| P2     | 分解粒子         | PNG/WebP，64x64，透明底    | `effect_decompose_dust.png`           | 分解完成反馈     |
| P2     | 材料飞入轨迹     | PNG/WebP，64x64，透明底    | `effect_material_trail_spark.png`     | 材料飞入资源栏   |

## 当前代码占位点

- `src/components/inventory/ItemCompareModal.vue`：对比面板底板、属性箭头、评分徽章。
- `src/components/inventory/DecomposeConfirmModal.vue`：分解确认底板、警告图标、待分解遮罩、保护角标。
- `src/components/inventory/ItemSlot.vue`：对比入口、更优角标、锁定角标。
- `src/components/layout/RightPanel.vue`：分解按钮和预计材料收益。

## 当前占位策略

当前版本使用深色弹窗、红绿文本、评分差值和“将被分解/已保护”分组作为占位。正式资源补齐后可替换底板、角标、箭头和分解反馈。
