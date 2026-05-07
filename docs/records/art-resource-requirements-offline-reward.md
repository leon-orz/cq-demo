# 离线收益报告美术资源需求

## 目录建议

```text
public/assets/
├── offline/
├── effects/
├── ui/
├── items/
└── icons/
```

## 优先级说明

- P0：离线收益报告最小可用界面需要。
- P1：开箱占位、奖励识别、满包提示需要。
- P2：后续仪式感增强和高品质掉落表现需要。

## 资源清单

| 优先级 | 资源             | 规格建议                       | 命名建议                            | 用途               |
| ------ | ---------------- | ------------------------------ | ----------------------------------- | ------------------ |
| P0     | 离线报告弹窗底板 | PNG/WebP，900x1200，支持九宫格 | `ui_offline_report_panel.png`       | 离线收益弹窗主体   |
| P0     | 半透明遮罩纹理   | PNG/WebP，1920x1080，可平铺    | `ui_modal_backdrop_dark.webp`       | 弹窗打开时压暗界面 |
| P0     | 战利品箱关闭态   | PNG/WebP，512x512，透明底      | `offline_chest_closed.png`          | 领取按钮区域       |
| P0     | 战利品箱打开态   | PNG/WebP，512x512，透明底      | `offline_chest_open.png`            | 领取后的开箱占位   |
| P0     | 金币图标         | SVG/PNG，96x96                 | `icon_currency_gold.png`            | 金币收益展示       |
| P0     | 经验图标         | SVG/PNG，96x96                 | `icon_currency_exp.png`             | 经验收益展示       |
| P0     | 装备数量图标     | SVG/PNG，96x96                 | `icon_loot_items.png`               | 掉落装备总数       |
| P0     | 离线时长图标     | SVG/PNG，96x96                 | `icon_offline_time.png`             | 离线时长展示       |
| P1     | 背包满警告图标   | SVG/PNG，96x96                 | `icon_inventory_full.svg`           | 满包截断提示       |
| P1     | 满包损失插画     | PNG/WebP，512x384              | `ui_inventory_full_notice.png`      | 说明收益提前停止   |
| P1     | 装备展示底座     | PNG/WebP，512x512，透明底      | `ui_loot_reveal_pedestal.png`       | 开箱逐件展示       |
| P1     | 奖励分隔条       | PNG/SVG，900x24                | `ui_offline_reward_divider.png`     | 报告内分组         |
| P1     | 领取按钮底图     | PNG/SVG，360x96                | `ui_button_claim_reward.png`        | 领取按钮美化       |
| P2     | 开箱爆发光效     | PNG/WebP 序列，768x768         | `effect_chest_burst_gold_01.png`    | 开箱瞬间光效       |
| P2     | 掉落飞出粒子     | PNG/WebP，64x64                | `effect_loot_trail_spark.png`       | 装备从箱子飞出     |
| P2     | 稀有掉落光柱     | PNG/WebP 序列，512x768         | `effect_drop_beam_rare_01.png`      | 稀有装备揭示       |
| P2     | 传说占位光柱     | PNG/WebP 序列，768x1080        | `effect_drop_beam_legendary_01.png` | 传说装备预留       |
| P2     | 开箱完成横幅     | PNG/SVG，900x160               | `ui_banner_offline_complete.png`    | 奖励领取完成提示   |

## 当前代码占位点

- `src/components/offline/RewardReport.vue`：报告底板、遮罩、宝箱、领取按钮、奖励图标。
- `src/App.vue`：离线报告弹窗挂载点。
- `src/components/inventory/ItemSlot.vue`：装备图标、品质边框和光晕可与离线报告复用。
- `src/components/layout/RightPanel.vue`：金币、强化石和丢失掉落图标可复用。

## 当前占位策略

当前版本使用暗色弹窗、边框卡片和文字“箱”作为战利品箱占位。没有正式资源时，不阻塞功能测试。
