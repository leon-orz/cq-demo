# 装备排序和筛选面板美术资源需求

## 目录建议

```text
public/assets/
├── inventory/
├── effects/
├── ui/
└── icons/
```

## 资源清单

| 优先级 | 资源           | 规格建议                        | 命名建议                                  | 用途                       |
| ------ | -------------- | ------------------------------- | ----------------------------------------- | -------------------------- |
| P0     | 筛选面板底板   | PNG/WebP 或九宫格，720x960      | `ui_inventory_filter_panel.png`           | 排序筛选抽屉或弹窗底板     |
| P0     | 排序图标       | SVG/PNG，64x64                  | `icon_inventory_sort.svg`                 | 打开排序菜单或当前排序入口 |
| P0     | 筛选图标       | SVG/PNG，64x64                  | `icon_inventory_filter.svg`               | 打开筛选面板入口           |
| P0     | 重置筛选图标   | SVG/PNG，64x64                  | `icon_filter_reset.svg`                   | 清空筛选条件               |
| P0     | 评分图标       | SVG/PNG，64x64                  | `icon_item_score.svg`                     | 评分排序字段和评分筛选提示 |
| P0     | 品质图标       | SVG/PNG，64x64                  | `icon_item_quality.svg`                   | 品质筛选分组标题           |
| P0     | 部位图标       | SVG/PNG，64x64                  | `icon_item_slot.svg`                      | 部位筛选分组标题           |
| P0     | 更优装备图标   | SVG/PNG，64x64                  | `icon_item_upgrade.svg`                   | 只看更优装备筛选           |
| P0     | 锁定图标       | SVG/PNG，64x64                  | `icon_item_locked.svg`                    | 锁定状态筛选和装备角标     |
| P0     | 未锁定图标     | SVG/PNG，64x64                  | `icon_item_unlocked.svg`                  | 未锁定状态筛选             |
| P0     | 升序图标       | SVG/PNG，64x64                  | `icon_sort_ascending.svg`                 | 排序方向切换               |
| P0     | 降序图标       | SVG/PNG，64x64                  | `icon_sort_descending.svg`                | 排序方向切换               |
| P1     | 已启用筛选角标 | SVG/PNG，48x48，透明底          | `badge_filter_active.svg`                 | 标记当前存在筛选条件       |
| P1     | 空结果插画     | PNG/WebP，480x360，透明或深色底 | `illustration_inventory_empty_filter.png` | 筛选结果为空时展示         |
| P1     | 品质筛选徽章   | SVG/PNG，160x64，按品质提供变体 | `badge_filter_quality_{quality}.png`      | 品质筛选选项和已选条件展示 |
| P1     | 部位筛选徽章   | SVG/PNG，160x64，按部位提供变体 | `badge_filter_slot_{slot}.png`            | 部位筛选选项和已选条件展示 |
| P1     | 推荐装备光晕   | PNG/WebP 序列或单图，256x256    | `effect_item_recommended_glow.png`        | 筛选后突出更优或推荐装备   |

## 风格要求

- 资源应贴合当前暗黑背包界面，优先使用低饱和金属、皮革、暗色石材和品质色点缀。
- 图标需要在 32x32 显示尺寸下仍可识别，避免依赖细碎文字。
- 品质筛选徽章需要与现有品质颜色体系一致，不能创造另一套品质色。
- 推荐装备光晕应控制亮度和透明度，不能遮挡装备品质边框、锁定角标和更优标记。

## 当前代码占位点

- `components/inventory/`：排序按钮、筛选按钮、筛选面板、空结果状态、装备列表展示。
- `components/layout/RightPanel.vue`：背包区域入口、已启用筛选角标、重置筛选入口。
- `core/item/`：排序和筛选纯逻辑不直接引用资源，但需要输出 UI 可消费的状态。

## 当前占位策略

正式资源未交付前，使用现有深色面板、文本按钮、品质色边框、CSS 光晕和简单图标占位。资源补齐后优先替换入口图标、筛选面板底板、已启用角标和空结果插画，再补齐徽章和推荐光晕。
