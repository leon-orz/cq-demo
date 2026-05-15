# 放置裂隙 — 开发精华版

技术栈：Vue 3 + TypeScript + Vite + Pinia + Tailwind CSS。纯前端。

---

## 1. 项目配置

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [vue(), VitePWA({ registerType: 'autoUpdate' })],
  resolve: { alias: { '@': '/src' } },
})
```

```json
// tsconfig.json — 严格模式
target: "ES2020", strict: true, noImplicitAny: true,
noUnusedLocals: true, moduleResolution: "bundler"
```

```json
// package.json 关键依赖
"vue": "^3.4", "pinia": "^2.1", "vue-router": "^4",
"typescript": "^5.3", "vite": "^5.0", "tailwindcss": "^3.4"
```

目录结构见文末。

---

## 2. 类型定义

```typescript
// === enums.ts ===
export enum ClassType { WARRIOR = 'warrior', ROGUE = 'rogue', MAGE = 'mage' }
export enum SlotType { WEAPON, OFFHAND, HELMET, ARMOR, GLOVES, BOOTS, RING_LEFT, RING_RIGHT, NECKLACE }
export enum Rarity { NORMAL = 0, MAGIC = 1, RARE = 2, LEGENDARY = 3, ANCIENT = 4 }
export enum ScoreMode { BALANCED, CRIT, ATK_SPEED, TOUGHNESS, MAIN_ATTR }
export enum MonsterType { BALANCED, HIGH_HP, HIGH_ATK, REWARD }
export enum AffixType {
  SHARP, CRUEL, EAGLE_EYE, SWIFT,           // 攻击
  FIRE, ICE, LIGHTNING,                      // 元素
  VITALITY, GUARDIAN, NIMBLE,                // 防御
  FIRE_RES, ICE_RES, LIGHTNING_RES,          // 抗性
  GREED, FORTUNE, EXPERIENCE, LEECH          // 功能
}
export enum TalentBranch { /* 6条分支 */ }

// === index.ts 核心接口 ===
export interface Player {
  classType: ClassType; level: number; exp: number; expToNext: number;
  strength: number; agility: number; intelligence: number;
  hp: number; maxHp: number; atk: number; atkSpd: number;
  critRate: number; critDmg: number; armor: number; dodge: number;
  fireRes: number; iceRes: number; lightningRes: number;
  gold: number; enhancementStones: number; ancientEssence: number;
  currentFloor: number; highestFloor: number;
  training: { attack: number; vitality: number; defense: number };
}

export interface EquipmentItem {
  id: string; name: string; slot: SlotType; rarity: Rarity;
  itemLevel: number; baseStats: Partial<Player>;
  affixes: Affix[]; enhanceLevel: number; locked: boolean;
}

export interface Affix { type: AffixType; value: number; isPercentage: boolean; }

export interface Monster {
  name: string; hp: number; atk: number; atkSpd: number;
  armor: number; critRate: number; level: number; type: MonsterType;
}

export interface CombatResult {
  win: boolean; rounds: number;
  playerDmgTotal: number; monsterDmgTotal: number;
  playerHpRemaining: number; monsterHpRemaining: number;
  drops: EquipmentItem[]; goldEarned: number; expEarned: number;
  killTime: number; survivalTime: number;
}

export interface OfflineReport {
  offlineSeconds: number; adjustedSeconds: number;
  totalKills: number; totalGold: number; totalExp: number;
  totalDrops: EquipmentItem[]; qualityCounts: Record<string, number>;
  effectiveMultiplier: number; message: string;
}

export interface SoulBonus { type: string; level: number; value: number; }
export interface TalentNode { id: string; branch: TalentBranch; tier: number; name: string; description: string; effect: (player: Player) => void; unlocked: boolean; purchased: boolean; prerequisites: string[]; }
export interface DailyTask { id: string; type: string; target: number; current: number; completed: boolean; reward: { gold?: number; stones?: number; essence?: number }; }
export interface PrestigeState { count: number; souls: number; soulBonuses: SoulBonus[]; canPrestige: boolean; }
```

---

## 3. 游戏常量

```typescript
// utils/constants.ts
export const GAME_CONSTANTS = {
  MAX_ATK_SPD: 5.0, MAX_CRIT_RATE: 0.75, MAX_DODGE: 0.60,
  ITEM_SCALE_BASE: 1.05, MONSTER_GROWTH: 1.1, RECOMMENDED_GROWTH: 1.12,
  TRAINING_COST_GROWTH: 1.25, ENHANCE_COST_GROWTH: 1.5,
  BASE_RECOMMENDED_POWER: 100, COMBAT_INTERVAL_MS: 1200, COMBAT_TIME_LIMIT_S: 60,
  OFFLINE_SOFT_CAP_HOURS: 12, INVENTORY_SIZE: 50, MAX_TRAINING_LEVEL: 200,
  RARITY_AFFIX_COUNT: [1, 2, 3, 4, 5],
  RARITY_MULTIPLIERS: [1.0, 1.3, 1.6, 2.0, 2.5],
  BASE_LEGENDARY_RATE: 0.001, LEGENDARY_RATE_PER_TEN: 0.0005, MAX_LEGENDARY_RATE: 0.02,
  GOLD_FIND_CAP: 50, MAGIC_FIND_CAP: 50,
  ENHANCE_RATES: [1.0, 1.0, 1.0, 0.85, 0.85, 0.85, 0.65, 0.65, 0.65, 0.45, 0.30],
  MONSTER_TYPES: { [MonsterType.BALANCED]: { hpMod: 1.0, atkMod: 1.0, rewardMod: 1.0 }, [MonsterType.HIGH_HP]: { hpMod: 1.5, atkMod: 0.8, rewardMod: 1.1 }, [MonsterType.HIGH_ATK]: { hpMod: 0.8, atkMod: 1.5, rewardMod: 1.1 }, [MonsterType.REWARD]: { hpMod: 0.6, atkMod: 0.6, rewardMod: 1.3 } },
  OFFLINE_MULTIPLIERS: [
    { hours: 12, multiplier: 1.0 }, { hours: 18, multiplier: 0.5 },
    { hours: 24, multiplier: 0.25 }, { hours: Infinity, multiplier: 0.1 }
  ],
  MAIN_ATTR_BONUS: 0.01,
} as const;
```

---

## 4. Store 设计

### playerStore
```typescript
export const usePlayerStore = defineStore('player', () => {
  // State
  const player = ref<Player>(createDefaultPlayer())
  
  // Getters
  const dps = computed(() => CombatEngine.calculateDPS(player.value))
  const ehp = computed(() => CombatEngine.calculateEHP(player.value))
  const power = computed(() => CombatEngine.calculatePower(dps.value, ehp.value))
  const mainAttribute = computed(() => getMainAttribute(player.value))
  const totalGoldFind = computed(() => calculateTotalGoldFind(player.value))
  const totalMagicFind = computed(() => calculateTotalMagicFind(player.value))
  
  // Actions
  function train(type: 'attack' | 'vitality' | 'defense'): boolean
  function spendGold(amount: number): boolean
  function gainGold(amount: number): void
  function gainExp(amount: number): void
  function levelUp(): void
  function changeClass(classType: ClassType): void
  function recalculateStats(): void
  function $reset(): void
  
  return { player, dps, ehp, power, train, spendGold, gainGold, gainExp, levelUp, changeClass, recalculateStats, $reset }
})
```

### combatStore
```typescript
export const useCombatStore = defineStore('combat', () => {
  const currentFloor = ref(1)
  const isAutoCombat = ref(false)
  const combatLog = ref<CombatLogEntry[]>([])
  const killCount = ref(0)
  const isPaused = ref(false)
  const pauseReason = ref<'' | 'death' | 'inventory_full' | 'manual'>('')
  const lastCombatResult = ref<CombatResult | null>(null)
  
  const currentMonster = computed(() => FloorScaling.getMonsterForFloor(currentFloor.value))
  const recommendedFloor = computed(() => FloorScaling.getRecommendedFloor(playerStore.player))
  const canAdvanceFloor = computed(() => /* 战力>推荐×0.6 */)
  const rewardMultiplier = computed(() => FloorScaling.getRewardMultiplier(playerStore.power, FloorScaling.getRecommendedPower(currentFloor.value)))
  
  function startAutoCombat(): void
  function stopAutoCombat(): void
  function executeBattle(): CombatResult
  function changeFloor(floor: number): boolean
  function handleDeath(): void
  function handleInventoryFull(): void
  function resumeCombat(): void
  function $reset(): void
  
  return { currentFloor, isAutoCombat, combatLog, executeBattle, changeFloor, startAutoCombat, stopAutoCombat, currentMonster, recommendedFloor, canAdvanceFloor, rewardMultiplier }
})
```

### equipmentStore
```typescript
export const useEquipmentStore = defineStore('equipment', () => {
  const equipped = ref<Record<SlotType, EquipmentItem | null>>(createEmptyEquipmentSlots())
  const inventory = ref<EquipmentItem[]>([])
  const enhancementStones = ref(0)
  const maxInventorySize = ref(GAME_CONSTANTS.INVENTORY_SIZE)
  const scoreMode = ref<ScoreMode>(ScoreMode.BALANCED)
  
  const totalGearScore = computed(() => calculateTotalGearScore(equipped.value, scoreMode.value))
  const inventoryCount = computed(() => inventory.value.length)
  const inventoryPressure = computed(() => inventoryCount.value / maxInventorySize.value)
  const isInventoryFull = computed(() => inventoryCount.value >= maxInventorySize.value)
  const setBonuses = computed(() => detectSetBonuses(equipped.value))
  
  function equip(item: EquipmentItem): void
  function unequip(slot: SlotType): void
  function swapEquipment(newItem: EquipmentItem): { slot: SlotType; oldItem: EquipmentItem | null; dpsDiff: number; ehpDiff: number }
  function addToInventory(item: EquipmentItem): void
  function removeFromInventory(index: number): EquipmentItem
  function disenchant(item: EquipmentItem): void
  function disenchantAllNormal(): number
  function disenchantAllBelow(minRarity: Rarity): number
  function findBestEquipmentForScoreMode(mode?: ScoreMode): Record<SlotType, EquipmentItem | null>
  function equipBestForScoreMode(mode?: ScoreMode): { slot: SlotType; equipped: EquipmentItem | null; unequipped: EquipmentItem | null }[]
  function enhance(item: EquipmentItem): EnhanceResult
  function lockItem(itemId: string): void
  function unlockItem(itemId: string): void
  function compareWithEquipped(item: EquipmentItem): { slot: SlotType; dpsDiff: number; ehpDiff: number; scoreDiff: number; isBetter: boolean }
  function getItemsForSlot(slot: SlotType): EquipmentItem[]
  function sortInventory(): void
  function $reset(): void
  
  return { equipped, inventory, enhancementStones, equip, unequip, addToInventory, disenchant, enhance, equipBestForScoreMode, isInventoryFull, totalGearScore, setBonuses }
})
```

---

## 5. 核心引擎

### CombatEngine
```typescript
export class CombatEngine {
  static calculateDPS(player: Player): number {
    const mainAttr = player.strength // TODO: switch by class
    const attrBonus = 1 + mainAttr * GAME_CONSTANTS.MAIN_ATTR_BONUS
    const critMultiplier = 1 + player.critRate * (player.critDmg - 1)
    const atkSpdCapped = Math.min(player.atkSpd, GAME_CONSTANTS.MAX_ATK_SPD)
    return player.atk * attrBonus * atkSpdCapped * critMultiplier
  }

  static calculateEHP(player: Player): number {
    const armorDR = player.armor / (player.armor + 500)
    const dodgeCapped = Math.min(player.dodge, GAME_CONSTANTS.MAX_DODGE)
    return player.hp / ((1 - armorDR) * (1 - dodgeCapped))
  }

  static calculatePower(dps: number, ehp: number): number {
    return Math.sqrt(dps * ehp * 10)
  }

  static simulateBattle(player: Player, monster: Monster, options?: BattleOptions): CombatResult {
    let playerHp = player.hp, monsterHp = monster.hp
    let playerDmgTotal = 0, monsterDmgTotal = 0, round = 0
    const maxRounds = GAME_CONSTANTS.COMBAT_TIME_LIMIT_S * 1000 / GAME_CONSTANTS.COMBAT_INTERVAL_MS
    const playerDmgPerRound = this.calculateDPS(player) * GAME_CONSTANTS.COMBAT_INTERVAL_MS / 1000
    const monsterDmgPerRound = monster.atk * monster.atkSpd * GAME_CONSTANTS.COMBAT_INTERVAL_MS / 1000 * (1 - player.armor / (player.armor + 500 + monster.level * 50))
    while (round < maxRounds && playerHp > 0 && monsterHp > 0) {
      monsterHp -= playerDmgPerRound; playerDmgTotal += playerDmgPerRound
      if (monsterHp <= 0) break
      playerHp -= monsterDmgPerRound; monsterDmgTotal += monsterDmgPerRound
      round++
    }
    const win = monsterHp <= 0 && playerHp > 0
    return { win, rounds: round, playerDmgTotal, monsterDmgTotal, playerHpRemaining: playerHp, monsterHpRemaining: monsterHp, drops: [], goldEarned: 0, expEarned: 0, killTime: 0, survivalTime: 0 }
  }

  static simulateBatch(player: Player, monster: Monster, durationMs: number): CombatResult[] {
    const results: CombatResult[] = []
    let elapsed = 0
    while (elapsed < durationMs) {
      const result = this.simulateBattle(player, monster)
      results.push(result)
      if (!result.win) break
      elapsed += GAME_CONSTANTS.COMBAT_INTERVAL_MS
    }
    return results
  }
}
```

### FloorScaling
```typescript
export class FloorScaling {
  static getRecommendedPower(floor: number): number {
    return GAME_CONSTANTS.BASE_RECOMMENDED_POWER * Math.pow(GAME_CONSTANTS.RECOMMENDED_GROWTH, floor - 1)
  }
  static getMonsterForFloor(floor: number, type?: MonsterType): Monster {
    const mtype = type ?? this.getMonsterTypeForFloor(floor)
    const mods = GAME_CONSTANTS.MONSTER_TYPES[mtype]
    const baseHp = 100 * Math.pow(GAME_CONSTANTS.MONSTER_GROWTH, floor - 1)
    const baseAtk = 10 * Math.pow(GAME_CONSTANTS.MONSTER_GROWTH, floor - 1)
    return { name: this.getMonsterName(floor, mtype), hp: baseHp * mods.hpMod, atk: baseAtk * mods.atkMod, atkSpd: 1.0, armor: floor * 2, critRate: 0.05, level: floor, type: mtype }
  }
  static getRewardMultiplier(power: number, recommended: number): number {
    return Math.pow(Math.min(power / recommended, 1.0), 1.5)
  }
  static getItemLevelForFloor(floor: number): number { return Math.floor(floor / 2) + 10 }
  static getRecommendedFloor(player: Player): number {
    const combatStore = useCombatStore()
    const power = CombatEngine.calculatePower(combatStore.playerDPS, combatStore.playerEHP)
    let floor = 1
    while (this.getRecommendedPower(floor + 1) <= power && floor < 1000) floor++
    return floor
  }
  private static getMonsterTypeForFloor(floor: number): MonsterType {
    const types = [MonsterType.BALANCED, MonsterType.HIGH_HP, MonsterType.HIGH_ATK, MonsterType.REWARD]
    return types[floor % 4]
  }
}
```

### LootGenerator
```typescript
export class LootGenerator {
  static generateDrop(floor: number, magicFind: number): EquipmentItem {
    const itemLevel = FloorScaling.getItemLevelForFloor(floor)
    const rarity = this.rollRarity(magicFind)
    const slot = this.randomSlot()
    const baseStats = this.calculateBaseStats(slot, itemLevel)
    const affixCount = GAME_CONSTANTS.RARITY_AFFIX_COUNT[rarity]
    const affixes = this.rollAffixes(affixCount, slot, itemLevel, rarity)
    return { id: generateId(), name: this.generateName(slot, rarity), slot, rarity, itemLevel, baseStats, affixes, enhanceLevel: 0, locked: false }
  }
  static rollRarity(magicFind: number): Rarity {
    const roll = Math.random()
    const mfBonus = magicFind / 100
    if (roll < 0.001 * (1 + mfBonus)) return Rarity.ANCIENT
    if (roll < 0.01 * (1 + mfBonus)) return Rarity.LEGENDARY
    if (roll < 0.05 * (1 + mfBonus)) return Rarity.RARE
    if (roll < 0.20 * (1 + mfBonus)) return Rarity.MAGIC
    return Rarity.NORMAL
  }
  private static calculateBaseStats(slot: SlotType, itemLevel: number): Partial<Player> {
    const scale = Math.pow(GAME_CONSTANTS.ITEM_SCALE_BASE, itemLevel)
    const stats: Partial<Player> = {}
    switch (slot) { case SlotType.WEAPON: stats.atk = Math.floor(10 * scale); break; case SlotType.ARMOR: stats.hp = Math.floor(50 * scale); break; /* ... */ }
    return stats
  }
  private static rollAffixes(count: number, slot: SlotType, itemLevel: number, rarity: Rarity): Affix[] {
    const validAffixes = AFFIX_POOL.filter(a => a.slots.includes(slot))
    const selected: Affix[] = []
    for (let i = 0; i < count; i++) {
      const affixType = validAffixes[Math.floor(Math.random() * validAffixes.length)].type
      const value = this.rollAffixValue(affixType, itemLevel, rarity)
      selected.push({ type: affixType, value, isPercentage: isPercentageAffix(affixType) })
    }
    return selected
  }
}
```

### GearScore
```typescript
export class GearScore {
  static scoreEquipment(item: EquipmentItem, player: Player, mode: ScoreMode): number {
    const weights = SCORE_MODE_WEIGHTS[mode]
    let score = 0
    for (const [stat, value] of Object.entries(item.baseStats)) {
      score += (value ?? 0) * (weights[stat] ?? 1)
    }
    for (const affix of item.affixes) {
      const affixWeight = weights[affix.type] ?? 1
      const rarityMultiplier = 1 + item.rarity * 0.12
      score += affix.value * affixWeight * rarityMultiplier
    }
    return Math.floor(score)
  }
  static compareEquipment(newItem: EquipmentItem, oldItem: EquipmentItem | null, player: Player, mode: ScoreMode): { dpsDiff: number; ehpDiff: number; scoreDiff: number } {
    const newScore = this.scoreEquipment(newItem, player, mode)
    const oldScore = oldItem ? this.scoreEquipment(oldItem, player, mode) : 0
    return { dpsDiff: 0, ehpDiff: 0, scoreDiff: newScore - oldScore } // DPS/EHP需要模拟计算
  }
}

const SCORE_MODE_WEIGHTS: Record<ScoreMode, Record<string, number>> = {
  [ScoreMode.BALANCED]: { /* 均权 */ atk: 1, hp: 1, armor: 1, critRate: 1, critDmg: 1, atkSpd: 1 },
  [ScoreMode.CRIT]: { /* 暴击权重×2 */ atk: 1, hp: 0.5, armor: 0.5, critRate: 2, critDmg: 2, atkSpd: 1 },
  [ScoreMode.ATK_SPEED]: { /* 攻速权重×2 */ atk: 1, hp: 0.5, armor: 0.5, critRate: 1, critDmg: 1, atkSpd: 2 },
  [ScoreMode.TOUGHNESS]: { /* EHP权重×2 */ atk: 0.5, hp: 2, armor: 2, critRate: 0.5, critDmg: 0.5, atkSpd: 0.5 },
  [ScoreMode.MAIN_ATTR]: { /* 主属性权重×3 */ atk: 1, hp: 1, armor: 1, critRate: 1, critDmg: 1, atkSpd: 1 /* 主属性×3 */ },
}
```

### EnhancementSystem
```typescript
export class EnhancementSystem {
  static enhance(item: EquipmentItem, stones: number): EnhanceResult {
    const rate = GAME_CONSTANTS.ENHANCE_RATES[Math.min(item.enhanceLevel, 10)]
    const cost = this.getCost(item.enhanceLevel)
    if (stones < cost.stones) return { success: false, newLevel: item.enhanceLevel, cost, message: '强化石不足' }
    if (Math.random() < rate) {
      item.enhanceLevel++
      return { success: true, newLevel: item.enhanceLevel, cost, message: `强化成功！+${item.enhanceLevel}` }
    }
    if (item.enhanceLevel >= 7 && item.enhanceLevel <= 9) {
      item.enhanceLevel--
      return { success: false, newLevel: item.enhanceLevel, cost, message: '强化失败，等级下降' }
    }
    if (item.enhanceLevel >= 10) {
      return { success: false, newLevel: item.enhanceLevel, cost, message: '强化失败（有保护未破碎）' }
    }
    return { success: false, newLevel: item.enhanceLevel, cost, message: '强化失败' }
  }
  static getCost(level: number): { gold: number; stones: number } {
    return { gold: Math.floor(100 * Math.pow(GAME_CONSTANTS.ENHANCE_COST_GROWTH, level)), stones: Math.floor(5 * Math.pow(1.3, level)) }
  }
  static getTotalStats(item: EquipmentItem): Partial<Player> {
    const multiplier = 1 + item.enhanceLevel * 0.1
    return Object.fromEntries(Object.entries(item.baseStats).map(([k, v]) => [k, Math.floor((v ?? 0) * multiplier)]))
  }
}
```

### OfflineCalculator
```typescript
export class OfflineCalculator {
  static calculate(offlineSeconds: number, floor: number, player: Player): OfflineReport {
    const capMult = this.softCapMultiplier(offlineSeconds)
    const adjustedSeconds = Math.min(offlineSeconds, 86400) // 24h上限
    const battleCount = Math.floor(adjustedSeconds * 1000 / GAME_CONSTANTS.COMBAT_INTERVAL_MS)
    const monster = FloorScaling.getMonsterForFloor(floor)
    let totalKills = 0, totalGold = 0, totalExp = 0
    const drops: EquipmentItem[] = []
    for (let i = 0; i < battleCount; i++) {
      const result = CombatEngine.simulateBattle(player, monster)
      if (result.win) {
        totalKills++
        totalGold += result.goldEarned * capMult
        totalExp += result.expEarned * capMult
        drops.push(...result.drops)
      } else break
    }
    return { offlineSeconds, adjustedSeconds, totalKills, totalGold, totalExp, totalDrops: drops, qualityCounts: this.countByQuality(drops), effectiveMultiplier: capMult, message: `离线${this.formatTime(offlineSeconds)}，击杀${totalKills}只怪物` }
  }
  private static softCapMultiplier(seconds: number): number {
    const hours = seconds / 3600
    if (hours <= 12) return 1.0
    if (hours <= 18) return 0.5
    if (hours <= 24) return 0.25
    return 0.1
  }
}
```

### SaveManager
```typescript
export class SaveManager {
  private static readonly SAVE_KEY = 'idle_rift_save'
  private static readonly SAVE_VERSION = 1
  
  static save(gameState: GameState): void {
    try { localStorage.setItem(this.SAVE_KEY, JSON.stringify({ version: this.SAVE_VERSION, timestamp: Date.now(), data: gameState })) } catch (e) { console.error('存档失败:', e) }
  }
  static load(): GameState | null {
    try { const raw = localStorage.getItem(this.SAVE_KEY); if (!raw) return null; const save = JSON.parse(raw); if (save.version !== this.SAVE_VERSION) return this.migrate(save); return save.data } catch (e) { return null }
  }
  static export(): string { return localStorage.getItem(this.SAVE_KEY) ?? '' }
  static import(jsonString: string): boolean { try { JSON.parse(jsonString); localStorage.setItem(this.SAVE_KEY, jsonString); return true } catch { return false } }
  static autoSave(gameState: GameState): void { debounce(() => this.save(gameState), 5000)() }
  private static migrate(oldSave: any): GameState | null { /* 版本迁移逻辑 */ return null }
}
```

---

## 6. UI组件规格

### EquipmentCard.vue
```
Props:  item: EquipmentItem
equipped: boolean (是否已装备)
Emits:  equip, disenchant, lock, click
功能: 名称(品质色边框)、基础属性列表、词缀列表(百分比绿色)、强化等级(+N金色)、锁定图标
交互: 悬停Tooltip(详细数值)、点击选中emit、右键菜单(分解/锁定/对比)
```

### EquipmentCompare.vue
```
Props:  newItem: EquipmentItem
Emits:  equip, cancel
功能: 左侧=身上装备/右侧=新装备、属性并排差值绿↑红↓、底部DPS/EHP变化量
交互: "替换"按钮一键equip
```

### CombatPanel.vue
```
数据源: combatStore
功能: 当前怪物(名称/HP/DPS)、实时战斗日志(最近5条)、挂机开关按钮、当前层数/推荐层
        DPS/EHP/战力数字、收益倍率
交互: 开始/停止挂机、手动切换层数输入框
```

### OfflineReportModal.vue
```
Props:  report: OfflineReport
Emits:  claim
功能: 离线时长(格式化)、击杀数、金币/经验、装备列表(品质色图标+名称)
        收益倍率标签(绿色100%/黄色50%/红色25%)
交互: "领取全部"按钮 → emit claim → 分发到各Store
```

---

## 7. 目录结构

```
src/
  main.ts                          # Vue+Pinia+Router实例
  App.vue                          # 三栏布局根组件
  views/
    MainView.vue                   # 主游戏界面
  stores/
    player.ts                      # 角色Store
    combat.ts                      # 战斗Store
    equipment.ts                   # 装备Store
  core/
    CombatEngine.ts                # 战斗计算
    FloorScaling.ts                # 怪物/层数
    LootGenerator.ts               # 装备生成
    GearScore.ts                   # 装备评分
    EnhancementSystem.ts           # 强化系统
    OfflineCalculator.ts           # 离线收益
    SaveManager.ts                 # 存档管理
  types/
    enums.ts                       # 8个枚举
    index.ts                       # 20+接口
  composables/
    useAutoSave.ts                 # 自动保存
    useCombatLoop.ts               # 挂机循环
  components/
    equipment/
      EquipmentCard.vue            # 装备卡片
      EquipmentCompare.vue         # 装备对比
    combat/
      CombatPanel.vue              # 战斗面板
    ui/
      OfflineReportModal.vue       # 离线报告弹窗
  utils/
    constants.ts                   # 游戏常量
    format.ts                      # 格式化
    debounce.ts                    # 防抖
```

---

详细代码实现请参阅 `DevelopmentDocument.md`
