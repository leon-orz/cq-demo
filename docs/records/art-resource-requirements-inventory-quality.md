# 背包整理阶段美术资源需求

## 目录建议

```text
public/assets/
├── inventory/
├── items/
├── effects/
├── ui/
└── icons/
```

## 优先级说明

- P0：装备锁定、过滤、对比和分解保护必须资源。
- P1：正式面板、边框、光晕和批量操作反馈。
- P2：分解粒子、材料飞入、高价值保护横幅等表现增强。

## 资源清单

| 优先级 | 资源             | 规格建议                   | 命名建议                          | 用途             |
| ------ | ---------------- | -------------------------- | --------------------------------- | ---------------- |
| P0     | 锁定图标         | SVG/PNG，64x64，透明底     | `icon_item_lock.svg`              | 装备锁定         |
| P0     | 解锁图标         | SVG/PNG，64x64，透明底     | `icon_item_unlock.svg`            | 锁定切换         |
| P0     | 分解保护图标     | SVG/PNG，64x64             | `icon_decompose_protected.svg`    | 标记保护装备     |
| P0     | 更优装备角标     | SVG/PNG，96x96             | `badge_item_upgrade.svg`          | 高亮更优装备     |
| P0     | 属性上升箭头     | SVG/PNG，48x48             | `icon_stat_up.svg`                | 正向差值         |
| P0     | 属性下降箭头     | SVG/PNG，48x48             | `icon_stat_down.svg`              | 负向差值         |
| P0     | 属性持平图标     | SVG/PNG，48x48             | `icon_stat_equal.svg`             | 无变化差值       |
| P0     | 筛选按钮图标     | SVG/PNG，64x64             | `icon_filter_loot.svg`            | 自动拾取过滤入口 |
| P0     | 分解按钮图标     | SVG/PNG，64x64             | `icon_decompose.svg`              | 一键分解按钮     |
| P0     | 警告图标         | SVG/PNG，64x64             | `icon_warning_triangle.svg`       | 分解确认         |
| P1     | 过滤规则面板底板 | PNG/WebP 或九宫格，720x960 | `ui_filter_panel.png`             | 自动拾取规则面板 |
| P1     | 分解确认面板底板 | PNG/WebP 或九宫格，720x720 | `ui_decompose_confirm_panel.png`  | 分解确认弹窗     |
| P1     | 装备对比浮窗底板 | PNG/WebP 或九宫格，640x900 | `ui_item_compare_panel.png`       | 装备对比         |
| P1     | 更优装备光晕     | PNG/WebP，256x256，透明底  | `effect_item_upgrade_glow.png`    | 推荐装备高亮     |
| P1     | 保护边框         | PNG/SVG，128x128           | `ui_item_frame_protected.png`     | 锁定或保护装备   |
| P1     | 待分解遮罩       | PNG/WebP，128x128，透明底  | `ui_item_overlay_decompose.png`   | 分解预览         |
| P1     | 保留规则命中角标 | SVG/PNG，96x96             | `badge_rule_matched.svg`          | 命中过滤保留规则 |
| P1     | 评分提升徽章     | SVG/PNG，120x64            | `badge_score_up.svg`              | 评分提升提示     |
| P1     | 评分降低徽章     | SVG/PNG，120x64            | `badge_score_down.svg`            | 评分降低提示     |
| P2     | 推荐闪光         | PNG/WebP 序列，256x256     | `effect_recommend_spark_01.png`   | 推荐装备周期闪光 |
| P2     | 分解粒子         | PNG/WebP，64x64，透明底    | `effect_decompose_dust.png`       | 分解反馈         |
| P2     | 材料飞入轨迹     | PNG/WebP，64x64，透明底    | `effect_material_trail_spark.png` | 材料飞入资源栏   |

## 当前代码占位点

- `src/components/inventory/ItemSlot.vue`：锁定角标、更优角标、评分差值、保护边框、品质光晕。
- `src/components/layout/RightPanel.vue`：过滤入口、分解按钮、分解确认和资源统计。
- 后续 `components/inventory/ItemTooltip.vue`：装备详情和属性差值箭头。
- 后续 `components/inventory/DecomposeConfirmModal.vue`：正式分解确认面板。
- 后续 `components/inventory/LootFilterPanel.vue`：正式拾取过滤面板。

## 当前占位策略

当前版本使用文字角标“锁”“更优”、CSS 边框和阴影做占位，不阻塞功能开发。
