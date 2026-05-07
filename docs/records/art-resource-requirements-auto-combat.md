# 自动挂机阶段美术资源需求

## 资源目录建议

```text
public/assets/
├── combat/
├── monsters/
├── items/
├── effects/
├── ui/
└── offline/
```

## 优先级说明

- P0：当前自动挂机和战斗区优先需要。
- P1：装备掉落、背包、离线收益展示需要。
- P2：传说掉落、开箱仪式和长期表现增强需要。

## 资源清单

| 优先级 | 资源             | 规格建议                    | 命名建议                                                                                        | 用途                 |
| ------ | ---------------- | --------------------------- | ----------------------------------------------------------------------------------------------- | -------------------- |
| P0     | 战斗区背景       | WebP，1920x1080，可裁切     | `combat_bg_dungeon_01.webp`                                                                     | 替换当前纯色战斗区域 |
| P0     | 怪物头像或半身像 | PNG/WebP，透明底，512x512   | `monster_slime_01.webp`、`monster_skeleton_01.webp`                                             | 展示当前怪物         |
| P0     | 怪物阴影底座     | PNG，透明底，512x128        | `monster_shadow_soft.png`                                                                       | 增强怪物站位空间感   |
| P0     | 生命条框         | PNG/SVG，512x48             | `ui_bar_hp_frame.png`                                                                           | 怪物和玩家血条边框   |
| P0     | 生命条填充       | PNG/WebP，512x32            | `ui_bar_hp_fill_red.png`                                                                        | 血条填充纹理         |
| P0     | 自动挂机图标     | SVG/PNG，64x64              | `icon_auto_combat_on.svg`、`icon_auto_combat_off.svg`                                           | 自动挂机按钮状态     |
| P0     | 背包满警告图标   | SVG/PNG，96x96              | `icon_inventory_full.svg`                                                                       | 背包满、收益停止提示 |
| P0     | 通用装备槽底图   | PNG/SVG，96x96              | `ui_item_slot_empty.png`                                                                        | 背包格和装备栏空槽   |
| P0     | 品质边框         | PNG/SVG，96x96              | `ui_item_frame_normal.png`、`ui_item_frame_magic.png`、`ui_item_frame_rare.png`                 | 白、蓝、黄装备识别   |
| P0     | 基础装备图标     | PNG/WebP，透明底，128x128   | `item_weapon_short_sword.png`、`item_weapon_battle_axe.png`、`item_weapon_apprentice_staff.png` | 当前基础武器图标     |
| P1     | 金币图标         | PNG/SVG，96x96              | `icon_currency_gold.png`                                                                        | 资源栏和离线报告     |
| P1     | 强化石图标       | PNG/SVG，96x96              | `icon_currency_enhancement_stone.png`                                                           | 资源栏展示           |
| P1     | 魔法品质光晕     | PNG/WebP，256x256           | `effect_rarity_glow_magic.png`                                                                  | 蓝装背包和掉落反馈   |
| P1     | 稀有品质光晕     | PNG/WebP，256x256           | `effect_rarity_glow_rare.png`                                                                   | 黄装高亮             |
| P1     | 稀有掉落光柱     | PNG/WebP，512x768           | `effect_drop_beam_rare_01.png`                                                                  | 稀有掉落反馈         |
| P1     | 掉落飞入粒子     | PNG，64x64                  | `effect_loot_trail_spark.png`                                                                   | 装备飞入背包轨迹     |
| P1     | 离线报告面板     | PNG/WebP，900x1200 或九宫格 | `ui_offline_report_panel.png`                                                                   | 离线收益弹窗         |
| P1     | 战利品箱关闭态   | PNG/WebP，512x512           | `offline_chest_closed.png`                                                                      | 离线开箱入口         |
| P1     | 战利品箱打开态   | PNG/WebP，512x512           | `offline_chest_open.png`                                                                        | 开箱动画占位         |
| P2     | 传说掉落光柱     | PNG/WebP 序列，768x1080     | `effect_drop_beam_legendary_01.png`                                                             | 传说装备掉落         |
| P2     | 传说公告横幅     | PNG/SVG，1200x180           | `ui_banner_legendary_drop.png`                                                                  | 全屏公告             |
| P2     | 开箱爆发光效     | PNG/WebP 序列，768x768      | `effect_chest_burst_gold_01.png`                                                                | 离线开箱仪式         |
| P2     | 装备展示底座     | PNG/WebP，512x512           | `ui_loot_reveal_pedestal.png`                                                                   | 开箱逐件展示         |

## 规格原则

- 装备、怪物、特效优先使用透明底 PNG 或 WebP。
- 大背景使用 WebP，移动端通过裁切适配。
- UI 边框和图标可以使用 SVG。
- 装备图标统一 128x128，背包内显示时缩放到 48-64px。
- 特效先用单张图占位，后续再扩展为序列帧。
- 命名统一小写英文加下划线，按“分类*对象*状态\_序号”组织。

## 当前代码占位点

- `CenterPanel.vue`：战斗背景、怪物图、血条、自动挂机状态图标。
- `ItemSlot.vue`：装备图标、品质边框、品质光晕。
- `RightPanel.vue`：金币、强化石、背包满提示图标。
- 后续 `RewardReport.vue`：离线报告面板、战利品箱、开箱光效、装备展示底座。
