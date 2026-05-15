# MVP-Dev-03：UI组件 + 存档系统 + 性能优化

> **MVP模块说明**
> - **前置依赖**：`MVP-Dev-01-Foundation.md`（类型定义、Store）、`MVP-Dev-02-CoreSystems.md`（战斗引擎、装备系统）
> - **产出文件**：`components/equipment/*.vue`, `components/combat/*.vue`, `components/ui/*.vue`, `core/SaveManager.ts`, `utils/format.ts`, `utils/bigNumber.ts`
> - **对应设计文档章节**：第8章（存档系统）、第9章（UI组件）、第10章（性能优化）
> - **MVP边界**：保留EquipmentCard.vue、EquipmentCompare.vue、CombatPanel.vue（基础版）、OfflineReportModal.vue；去掉CombatLog.vue（独立100条日志组件MVP不做）、DamageFloat.vue（伤害飘字MVP不做）；简化战斗面板（去掉策略切换按钮、爆发技能按钮、药水栏）；保留SaveManager（基础localStorage版）；去掉多存档槽、版本迁移、IndexedDB、PWA配置；保留大数值处理、对象池、脏标记缓存等性能优化。

---

## 第6章 存档系统（MVP基础版）

### 6.1 存档管理器 `SaveManager.ts`

MVP只使用localStorage实现单槽存档，去掉多存档槽、IndexedDB、版本迁移。

```typescript
/**
 * @file core/SaveManager.ts
 * @description 存档管理器 - MVP基础版（单槽localStorage）
 * 
 * MVP变更说明：
 * - 单存档槽（多槽功能在第二阶段实现）
 * - 使用localStorage存储（IndexedDB在第二阶段实现）
 * - 去掉版本迁移逻辑（MVP只有v1版本）
 * - 保留JSON导入导出（手动备份）
 * - 保留lz-string压缩（可选，MVP可先不压缩）
 * 
 * [第二阶段] 待实现：
 * - 多存档槽（最多3个）
 * - IndexedDB持久化备份
 * - 存档版本迁移（v1→v2→v3）
 * - PWA离线缓存
 */

/** 存档数据结构 */
export interface GameSaveData {
  version: number;           // 存档版本（MVP固定为1）
  savedAt: number;           // 保存时间戳
  player: object;            // 玩家数据（playerStore.serialize()）
  equipment: object;         // 装备数据（equipmentStore.serialize()）
  combat: {                  // 战斗数据
    currentFloor: number;
    maxFloorCleared: number;
    totalKills: number;
    // [第二阶段] strategyMode: string;
    // [第二阶段] burstCooldown: number;
  };
  settings: {                // 游戏设置
    autoCombat: boolean;
    preferredScoreMode: number;
    // [第二阶段] theme: string;
    // [第二阶段] notificationEnabled: boolean;
  };
  // [第二阶段] 以下字段在MVP中不存储
  // prestige: object;       // 转生数据
  // dailyTasks: object;     // 每日任务
  // achievements: object;   // 成就数据
}

/** localStorage键名 */
const SAVE_KEY = 'rift_save_v1';
const SAVE_TIMESTAMP_KEY = 'rift_save_time';

export class SaveManager {
  /** 是否正在保存中（防并发） */
  private isSaving = false;
  /** 自动保存间隔(ms) */
  private readonly AUTO_SAVE_INTERVAL = 30000; // 30秒
  /** 自动保存计时器 */
  private autoSaveTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * 保存当前游戏状态
   * @param data 完整的游戏存档数据
   */
  async save(data: GameSaveData): Promise<boolean> {
    if (this.isSaving) return false;
    this.isSaving = true;

    try {
      data.savedAt = Date.now();
      const json = JSON.stringify(data);
      localStorage.setItem(SAVE_KEY, json);
      localStorage.setItem(SAVE_TIMESTAMP_KEY, String(Date.now()));
      
      console.log(`[SaveManager] 存档已保存，大小: ${(json.length / 1024).toFixed(1)}KB`);
      return true;
    } catch (e) {
      console.error('[SaveManager] 保存失败:', e);
      return false;
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * 读取存档
   * @returns 存档数据，不存在返回null
   */
  load(): GameSaveData | null {
    try {
      const json = localStorage.getItem(SAVE_KEY);
      if (!json) return null;
      return JSON.parse(json) as GameSaveData;
    } catch (e) {
      console.error('[SaveManager] 读取存档失败:', e);
      return null;
    }
  }

  /**
   * 检查是否有存档
   */
  hasSave(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  /**
   * 获取上次保存时间
   */
  getLastSaveTime(): number {
    const ts = localStorage.getItem(SAVE_TIMESTAMP_KEY);
    return ts ? parseInt(ts) : 0;
  }

  /**
   * 计算离线时长
   */
  getOfflineSeconds(): number {
    const lastSave = this.getLastSaveTime();
    if (lastSave === 0) return 0;
    return Math.floor((Date.now() - lastSave) / 1000);
  }

  /**
   * 导出存档为JSON文件（手动备份）
   */
  exportToFile(): void {
    const data = this.load();
    if (!data) {
      console.warn('[SaveManager] 没有可导出的存档');
      return;
    }

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `rift_save_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('[SaveManager] 存档已导出');
  }

  /**
   * 从JSON文件导入存档
   * @param file 用户选择的文件
   */
  async importFromFile(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const data = JSON.parse(text) as GameSaveData;
      
      // 基础验证
      if (!data.version || !data.player) {
        console.error('[SaveManager] 无效的存档文件');
        return false;
      }
      
      // 直接覆盖当前存档
      await this.save(data);
      console.log('[SaveManager] 存档已导入');
      return true;
    } catch (e) {
      console.error('[SaveManager] 导入失败:', e);
      return false;
    }
  }

  /**
   * 删除存档
   */
  deleteSave(): void {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(SAVE_TIMESTAMP_KEY);
    console.log('[SaveManager] 存档已删除');
  }

  /**
   * 启动自动保存
   * @param getData 获取当前游戏数据的回调
   */
  startAutoSave(getData: () => GameSaveData): void {
    this.stopAutoSave();
    this.autoSaveTimer = setInterval(() => {
      const data = getData();
      this.save(data);
    }, this.AUTO_SAVE_INTERVAL);
    console.log('[SaveManager] 自动保存已启动');
  }

  /**
   * 停止自动保存
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * 获取存档大小信息
   */
  getSaveInfo(): { size: number; lastSave: number; hasSave: boolean } {
    const json = localStorage.getItem(SAVE_KEY);
    return {
      size: json ? json.length : 0,
      lastSave: this.getLastSaveTime(),
      hasSave: this.hasSave(),
    };
  }
}

/** 单例导出 */
export const saveManager = new SaveManager();

// [第二阶段] 多存档槽支持
// export interface SaveSlot {
//   id: string;
//   name: string;
//   createdAt: number;
//   data: GameSaveData;
// }
// export class MultiSlotSaveManager extends SaveManager { ... }

// [第二阶段] IndexedDB持久化
// export class IndexedDBSaveManager extends SaveManager { ... }

// [第二阶段] 存档版本迁移
// export function migrateSave(data: GameSaveData): GameSaveData { ... }
```

### 6.2 存档集成示例

```typescript
/**
 * @file composables/useGameSave.ts
 * @description 存档集成组合式函数
 */
import { saveManager, type GameSaveData } from '@/core/SaveManager';
import { usePlayerStore } from '@/stores/player';
import { useEquipmentStore } from '@/stores/equipment';
import { useCombatStore } from '@/stores/combat';

export function useGameSave() {
  const playerStore = usePlayerStore();
  const equipmentStore = useEquipmentStore();
  const combatStore = useCombatStore();

  /** 收集当前游戏状态 */
  function collectSaveData(): GameSaveData {
    return {
      version: 1,
      savedAt: Date.now(),
      player: playerStore.serialize(),
      equipment: equipmentStore.serialize(),
      combat: {
        currentFloor: playerStore.currentFloor,
        maxFloorCleared: playerStore.maxFloor,
        totalKills: playerStore.player.progress.totalKills,
      },
      settings: {
        autoCombat: combatStore.autoCombat,
        preferredScoreMode: playerStore.player.preferredScoreMode || 1,
      },
    };
  }

  /** 从存档数据恢复游戏状态 */
  function restoreFromSave(data: GameSaveData): void {
    playerStore.deserialize(data.player);
    equipmentStore.deserialize(data.equipment);
    if (data.settings) {
      combatStore.autoCombat = data.settings.autoCombat ?? false;
    }
    console.log('[GameSave] 存档已恢复');
  }

  /** 初始化：加载存档或创建新游戏 */
  function init(): { isNewGame: boolean; offlineSeconds: number } {
    const data = saveManager.load();
    
    if (data) {
      // 有存档，恢复
      restoreFromSave(data);
      const offlineSeconds = saveManager.getOfflineSeconds();
      return { isNewGame: false, offlineSeconds };
    } else {
      // 新游戏
      console.log('[GameSave] 新游戏开始');
      return { isNewGame: true, offlineSeconds: 0 };
    }
  }

  return {
    collectSaveData,
    restoreFromSave,
    init,
  };
}
```

---

## 第7章 UI组件（MVP精简版）

### 7.1 装备卡片组件 `EquipmentCard.vue`

MVP完整保留。

```vue
<!-- src/components/equipment/EquipmentCard.vue -->
<template>
  <div
    class="equipment-card"
    :class="[
      `rarity-${rarityClass}`,
      { 'is-selected': selected, 'is-detailed': detailed }
    ]"
    @click="$emit('click', equipment)"
  >
    <!-- 品质光效 -->
    <div v-if="equipment.enhancement.level >= 5" class="glow-enhanced"></div>

    <!-- 头部：名称 -->
    <div class="card-header">
      <span class="enhance-badge" v-if="equipment.enhancement.level > 0">
        +{{ equipment.enhancement.level }}
      </span>
      <span class="equip-name" :class="`rarity-${rarityClass}-text`">
        {{ equipment.name }}
      </span>
      <span class="equip-slot">{{ slotLabel }}</span>
    </div>

    <!-- 基础属性 -->
    <div v-if="detailed" class="base-stats">
      <div class="stat-row">
        <span class="stat-label">基础数值</span>
        <span class="stat-value">{{ equipment.baseValue }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">装备评分</span>
        <span class="stat-value score">{{ equipment.score }}</span>
      </div>
      <div class="stat-row" v-if="equipment.requiredLevel > 1">
        <span class="stat-label">需求等级</span>
        <span class="stat-value">Lv.{{ equipment.requiredLevel }}</span>
      </div>
    </div>

    <!-- 词缀列表 -->
    <div v-if="detailed && equipment.affixes.length > 0" class="affix-list">
      <div
        v-for="affix in equipment.affixes"
        :key="affix.type"
        class="affix-row"
        :class="{ 'is-legendary': affix.isLegendary }"
      >
        <span class="affix-bullet">•</span>
        <span class="affix-text">{{ formatAffix(affix) }}</span>
        <span class="roll-tier" :class="rollTierClass(affix.rollTier)">
          {{ (affix.rollTier * 100).toFixed(0) }}%
        </span>
      </div>
    </div>

    <!-- 底部操作（详情模式） -->
    <div v-if="detailed && showActions" class="card-actions">
      <button class="btn-equip" @click.stop="$emit('equip', equipment)">
        装备
      </button>
      <button class="btn-compare" @click.stop="$emit('compare', equipment)">
        对比
      </button>
      <button class="btn-enhance" @click.stop="$emit('enhance', equipment)">
        强化
      </button>
      <button class="btn-sell" @click.stop="$emit('sell', equipment)">
        出售
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { EquipmentItem } from '@/types';
import { SlotType, AffixType } from '@/types/enums';

interface Props {
  equipment: EquipmentItem;
  selected?: boolean;
  detailed?: boolean;
  showActions?: boolean;
}

withDefaults(defineProps<Props>(), {
  selected: false,
  detailed: false,
  showActions: false,
});

defineEmits<{
  click: [EquipmentItem];
  equip: [EquipmentItem];
  compare: [EquipmentItem];
  enhance: [EquipmentItem];
  sell: [EquipmentItem];
}>();

/** 部位中文标签 */
const slotLabel = computed(() => {
  const map: Record<number, string> = {
    [SlotType.WEAPON]: '武器',
    [SlotType.OFFHAND]: '副手',
    [SlotType.HELMET]: '头盔',
    [SlotType.ARMOR]: '胸甲',
    [SlotType.GLOVES]: '手套',
    [SlotType.BOOTS]: '靴子',
    [SlotType.RING_LEFT]: '左戒',
    [SlotType.RING_RIGHT]: '右戒',
    [SlotType.NECKLACE]: '项链',
  };
  return '';
});

/** 品质CSS类名 */
const rarityClass = computed(() => {
  const map = ['', 'normal', 'magic', 'rare', 'legendary', 'ancient'];
  return '';
});

/** 格式化词缀显示 */
function formatAffix(affix: { type: AffixType; value: number; isPercent: boolean }): string {
  const affixNames: Record<number, string> = {
    [AffixType.SHARP]: '攻击力', [AffixType.CRUEL]: '暴击伤害',
    [AffixType.EAGLE_EYE]: '暴击率', [AffixType.SWIFT]: '攻击速度',
    [AffixType.ACCURATE]: '命中率', [AffixType.PENETRATING]: '穿透',
    [AffixType.STURDY]: '护甲', [AffixType.VITAL]: '生命值',
    [AffixType.ELUSIVE]: '闪避', [AffixType.RESISTANT]: '抗性',
    [AffixType.REGENERATING]: '生命恢复', [AffixType.LEECHING]: '吸血',
    [AffixType.STRONG]: '力量', [AffixType.AGILE]: '敏捷',
    [AffixType.WISE]: '智力', [AffixType.RIFT]: '裂隙',
    [AffixType.GREEDY]: '贪婪', [AffixType.LUCKY]: '幸运',
  };
  const name = affixNames[affix.type] || '未知';
  const suffix = affix.isPercent ? '%' : '';
  return `${name}: +${affix.value}${suffix}`;
}

/** Roll值品质颜色 */
function rollTierClass(tier: number): string {
  if (tier >= 0.9) return 'tier-god';
  if (tier >= 0.7) return 'tier-high';
  if (tier >= 0.4) return 'tier-mid';
  return 'tier-low';
}
</script>

<style scoped>
.equipment-card {
  position: relative;
  border: 2px solid;
  border-radius: 8px;
  padding: 12px;
  background: #1e293b;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
}
.equipment-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
.equipment-card.is-selected { border-color: #f59e0b; box-shadow: 0 0 0 2px rgba(245,158,11,0.3); }

/* 品质颜色 */
.rarity-normal { border-color: #9ca3af; }
.rarity-magic { border-color: #3b82f6; }
.rarity-rare { border-color: #eab308; }
.rarity-legendary { border-color: #f59e0b; }
.rarity-ancient { border-color: #ef4444; }

.rarity-normal-text { color: #d1d5db; }
.rarity-magic-text { color: #60a5fa; }
.rarity-rare-text { color: #facc15; }
.rarity-legendary-text { color: #fbbf24; }
.rarity-ancient-text { color: #f87171; }

.card-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.enhance-badge { 
  background: linear-gradient(135deg, #f59e0b, #d97706); 
  color: white; font-size: 12px; font-weight: 700; 
  padding: 2px 6px; border-radius: 4px; 
}
.equip-name { font-weight: 700; font-size: 14px; }
.equip-slot { margin-left: auto; font-size: 12px; color: #94a3b8; }

.base-stats { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px; margin-bottom: 8px; }
.stat-row { display: flex; justify-content: space-between; font-size: 13px; padding: 2px 0; }
.stat-label { color: #94a3b8; }
.stat-value { color: #e2e8f0; font-weight: 600; }
.stat-value.score { color: #fbbf24; }

.affix-list { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 8px; }
.affix-row { display: flex; align-items: center; gap: 6px; font-size: 12px; padding: 2px 0; }
.affix-bullet { color: #22c55e; font-size: 14px; }
.affix-row.is-legendary .affix-bullet { color: #f59e0b; }
.affix-text { color: #93c5fd; flex: 1; }
.affix-row.is-legendary .affix-text { color: #fbbf24; }
.roll-tier { font-size: 11px; padding: 1px 4px; border-radius: 3px; }
.tier-god { background: #ef4444; color: white; }
.tier-high { background: #f59e0b; color: white; }
.tier-mid { background: #3b82f6; color: white; }
.tier-low { background: #6b7280; color: #d1d5db; }

.card-actions { 
  display: flex; gap: 6px; margin-top: 10px; 
  border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; 
}
.card-actions button { 
  flex: 1; padding: 6px; border: none; border-radius: 6px; 
  font-size: 12px; cursor: pointer; transition: all 0.15s; 
}
.btn-equip { background: #16a34a; color: white; }
.btn-equip:hover { background: #22c55e; }
.btn-compare { background: #2563eb; color: white; }
.btn-compare:hover { background: #3b82f6; }
.btn-enhance { background: #9333ea; color: white; }
.btn-enhance:hover { background: #a855f7; }
.btn-sell { background: #475569; color: #d1d5db; }
.btn-sell:hover { background: #64748b; }

/* +5光效 */
.glow-enhanced { 
  position: absolute; inset: -2px; 
  background: conic-gradient(from 0deg, transparent, rgba(245,158,11,0.2), transparent); 
  border-radius: inherit; animation: rotate 4s linear infinite; pointer-events: none; z-index: 0; 
}
@keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
```

### 7.2 装备对比组件 `EquipmentCompare.vue`

MVP完整保留装备对比功能。

```vue
<!-- src/components/equipment/EquipmentCompare.vue -->
<template>
  <div class="compare-overlay" @click.self="$emit('close')">
    <div class="compare-panel">
      <div class="compare-header">
        <h3>装备对比</h3>
        <button class="btn-close" @click="$emit('close')">✕</button>
      </div>

      <div class="compare-body">
        <!-- 当前装备 -->
        <div class="compare-col">
          <div class="col-label">当前装备</div>
          <EquipmentCard :equipment="current" detailed />
          <div class="score-display">
            评分: <span class="score-value">{{ currentScore }}</span>
          </div>
        </div>

        <!-- 对比区 -->
        <div class="compare-mid">
          <div class="vs-badge">VS</div>
          <div class="diff-list">
            <div v-for="diff in diffs" :key="diff.label" class="diff-row" :class="diff.type">
              <span class="diff-arrow">
                {{ diff.type === 'up' ? '↑' : diff.type === 'down' ? '↓' : '→' }}
              </span>
              <span class="diff-label">{{ diff.label }}</span>
              <span class="diff-value" :class="diff.type">
                {{ diff.formatted }}
              </span>
            </div>
          </div>
          <div class="recommendation" :class="recommendation.type">
            {{ recommendation.text }}
          </div>
        </div>

        <!-- 新装备 -->
        <div class="compare-col">
          <div class="col-label new">新装备</div>
          <EquipmentCard :equipment="candidate" detailed />
          <div class="score-display">
            评分: <span class="score-value new">{{ candidateScore }}</span>
          </div>
        </div>
      </div>

      <div class="compare-footer">
        <button class="btn-replace" @click="$emit('replace', candidate)">
          替换装备
        </button>
        <button class="btn-cancel" @click="$emit('close')">
          保留当前
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { EquipmentItem } from '@/types';
import { GearScore } from '@/core/GearScore';
import EquipmentCard from './EquipmentCard.vue';

interface Props {
  current: EquipmentItem;
  candidate: EquipmentItem;
}

const props = defineProps<Props>();
defineEmits<{
  close: [];
  replace: [EquipmentItem];
}>();

const currentScore = computed(() => GearScore.calculate(props.current));
const candidateScore = computed(() => GearScore.calculate(props.candidate));

/** 逐项对比差异 */
const diffs = computed(() => {
  const results: { label: string; type: 'up' | 'down' | 'same'; formatted: string }[] = [];
  
  // 基础数值
  const baseDiff = props.candidate.baseValue - props.current.baseValue;
  results.push({
    label: '基础数值',
    type: baseDiff > 0 ? 'up' : baseDiff < 0 ? 'down' : 'same',
    formatted: `${props.candidate.baseValue} (${baseDiff >= 0 ? '+' : ''}${baseDiff})`,
  });
  
  // 评分
  const scoreDiff = candidateScore.value - currentScore.value;
  results.push({
    label: '装备评分',
    type: scoreDiff > 0 ? 'up' : scoreDiff < 0 ? 'down' : 'same',
    formatted: `${candidateScore.value} (${scoreDiff >= 0 ? '+' : ''}${scoreDiff})`,
  });
  
  // 词缀数量
  const affixDiff = props.candidate.affixes.length - props.current.affixes.length;
  results.push({
    label: '词缀数量',
    type: affixDiff > 0 ? 'up' : affixDiff < 0 ? 'down' : 'same',
    formatted: `${props.candidate.affixes.length} (${affixDiff >= 0 ? '+' : ''}${affixDiff})`,
  });
  
  // 强化等级
  const enhDiff = props.candidate.enhancement.level - props.current.enhancement.level;
  results.push({
    label: '强化等级',
    type: enhDiff > 0 ? 'up' : enhDiff < 0 ? 'down' : 'same',
    formatted: `+${props.candidate.enhancement.level} (${enhDiff >= 0 ? '+' : ''}${enhDiff})`,
  });
  
  return results;
});

/** 替换建议 */
const recommendation = computed(() => {
  const diff = candidateScore.value - currentScore.value;
  const pct = currentScore.value > 0 ? (diff / currentScore.value * 100) : 0;
  
  if (pct > 20) return { type: 'up', text: `强烈推荐替换！提升 ${pct.toFixed(1)}%` };
  if (pct > 5) return { type: 'up', text: `略有提升（+${pct.toFixed(1)}%），建议替换` };
  if (pct > -5) return { type: 'same', text: '基本持平，按需选择' };
  return { type: 'down', text: `新装备较弱（${pct.toFixed(1)}%），建议保留` };
});
</script>

<style scoped>
.compare-overlay { 
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); 
  display: flex; align-items: center; justify-content: center; z-index: 100; 
}
.compare-panel { 
  background: #0f172a; border: 2px solid #334155; border-radius: 12px; 
  padding: 20px; max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; 
}
.compare-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.compare-header h3 { color: #e2e8f0; margin: 0; }
.btn-close { background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer; }

.compare-body { display: grid; grid-template-columns: 1fr 200px 1fr; gap: 16px; }
.compare-col { display: flex; flex-direction: column; gap: 8px; }
.col-label { text-align: center; color: #94a3b8; font-size: 14px; }
.col-label.new { color: #4ade80; }
.score-display { text-align: center; color: #94a3b8; font-size: 14px; }
.score-value { color: #fbbf24; font-weight: 700; font-size: 18px; }
.score-value.new { color: #4ade80; }

.compare-mid { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; }
.vs-badge { 
  width: 48px; height: 48px; border-radius: 50%; 
  background: linear-gradient(135deg, #f59e0b, #d97706); 
  display: flex; align-items: center; justify-content: center; 
  font-weight: 800; font-size: 16px; color: white; 
}
.diff-list { width: 100%; }
.diff-row { display: flex; align-items: center; gap: 8px; font-size: 13px; padding: 4px 0; }
.diff-arrow { width: 20px; text-align: center; }
.diff-label { flex: 1; color: #94a3b8; }
.diff-value { font-weight: 600; }
.diff-value.up { color: #4ade80; }
.diff-value.down { color: #f87171; }
.diff-value.same { color: #94a3b8; }

.recommendation { padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; text-align: center; }
.recommendation.up { background: rgba(34,197,94,0.2); color: #4ade80; }
.recommendation.down { background: rgba(239,68,68,0.2); color: #f87171; }
.recommendation.same { background: rgba(148,163,184,0.2); color: #94a3b8; }

.compare-footer { display: flex; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1); }
.compare-footer button { flex: 1; padding: 10px; border: none; border-radius: 8px; font-size: 14px; cursor: pointer; }
.btn-replace { background: linear-gradient(135deg, #16a34a, #22c55e); color: white; font-weight: 600; }
.btn-cancel { background: #334155; color: #d1d5db; }
</style>
```

### 7.3 战斗面板组件 `CombatPanel.vue`（MVP基础版）

MVP简化版：去掉策略模式切换按钮、爆发技能按钮、药水栏。只在面板显示当前战斗日志（最多20条）。

```vue
<!-- src/components/combat/CombatPanel.vue -->
<template>
  <div class="combat-panel">
    <!-- 战斗状态栏 -->
    <div class="status-bar">
      <div class="status-left">
        <span class="floor-badge">第 {{ playerStore.currentFloor }} 层</span>
        <span class="power-badge">战力 {{ formatNumber(playerStore.totalPower) }}</span>
      </div>
      <div class="status-right">
        <span class="kill-badge">击杀 {{ playerStore.player.progress.totalKills }}</span>
      </div>
    </div>

    <!-- 怪物信息区 -->
    <div class="monster-area" v-if="combatStore.currentMonster">
      <div class="monster-info">
        <div class="monster-name">{{ combatStore.currentMonster.displayName }}</div>
        <div class="monster-meta">
          Lv.{{ combatStore.currentMonster.level }} | 
          攻击 {{ combatStore.currentMonster.baseAttack }} |
          DPS ~{{ formatNumber(monsterDPS) }}
        </div>
        <!-- 血条 -->
        <div class="hp-bar">
          <div class="hp-fill" :style="{ width: combatStore.monsterHpPercent + '%' }"></div>
          <span class="hp-text">
            {{ formatNumber(combatStore.monsterCurrentHp) }} / {{ formatNumber(combatStore.monsterMaxHp) }}
          </span>
        </div>
      </div>
    </div>

    <!-- 玩家信息区 -->
    <div class="player-area">
      <div class="player-hp-bar">
        <div class="player-hp-fill" :style="{ width: playerHpPercent + '%' }"></div>
        <span class="hp-text">
          {{ formatNumber(playerStore.player.defense.currentHealth) }} / {{ formatNumber(playerStore.player.defense.maxHealth) }}
        </span>
      </div>
      <div class="player-stats">
        <span>攻击 {{ playerStore.player.combat.baseAttack }}</span>
        <span>攻速 {{ playerStore.player.combat.attackSpeed.toFixed(2) }}</span>
        <span>暴击 {{ (playerStore.player.combat.critChance * 100).toFixed(1) }}%</span>
      </div>
    </div>

    <!-- 战斗日志（MVP内联显示，最多20条） -->
    <!-- [第二阶段] 独立CombatLog.vue组件，支持100条日志、连杀合并、虚拟滚动 -->
    <div class="combat-log-inline">
      <div class="log-header">
        <span>战斗记录</span>
        <button class="btn-clear" @click="combatStore.clearLog">清空</button>
      </div>
      <div class="log-entries">
        <div 
          v-for="(entry, i) in combatStore.combatLog" 
          :key="i" 
          class="log-entry"
          :class="getLogClass(entry)"
        >
          {{ entry }}
        </div>
        <div v-if="combatStore.combatLog.length === 0" class="log-empty">
          等待战斗开始...
        </div>
      </div>
    </div>

    <!-- 控制栏（MVP精简版） -->
    <!-- [第二阶段] 此处应有：策略模式切换（激进/稳健/平衡）、爆发技能按钮、药水栏 -->
    <div class="controls">
      <button 
        class="btn-auto-combat"
        :class="{ active: combatStore.autoCombat }"
        @click="toggleAutoCombat"
      >
        {{ combatStore.autoCombat ? '停止战斗' : '自动战斗' }}
      </button>
      
      <!-- [第二阶段] 策略模式切换按钮 -->
      <!-- <div class="strategy-buttons">
        <button :class="{ active: strategy === 'aggressive' }">激进</button>
        <button :class="{ active: strategy === 'balanced' }">平衡</button>
        <button :class="{ active: strategy === 'defensive' }">稳健</button>
      </div> -->
      
      <!-- [第二阶段] 爆发技能按钮 -->
      <!-- <button class="btn-burst" :disabled="burstCooldown > 0">
        爆发 {{ burstCooldown > 0 ? `(${burstCooldown}s)` : '' }}
      </button> -->
      
      <!-- [第二阶段] 药水栏 -->
      <!-- <div class="potion-bar">
        <button v-for="potion in potions" :key="potion.id" :disabled="potion.count === 0">
          {{ potion.icon }} {{ potion.count }}
        </button>
      </div> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePlayerStore } from '@/stores/player';
import { useCombatStore } from '@/stores/combat';

const playerStore = usePlayerStore();
const combatStore = useCombatStore();

/** 怪物DPS估算 */
const monsterDPS = computed(() => {
  if (!combatStore.currentMonster) return 0;
  return combatStore.currentMonster.baseAttack * combatStore.currentMonster.attackSpeed;
});

/** 玩家血量百分比 */
const playerHpPercent = computed(() => {
  const max = playerStore.player.defense.maxHealth;
  return max > 0 ? (playerStore.player.defense.currentHealth / max) * 100 : 0;
});

/** 切换自动战斗 */
function toggleAutoCombat(): void {
  combatStore.autoCombat = !combatStore.autoCombat;
}

/** 日志样式分类 */
function getLogClass(entry: string): string {
  if (entry.includes('击杀')) return 'log-kill';
  if (entry.includes('掉落')) return 'log-loot';
  if (entry.includes('推进')) return 'log-progress';
  if (entry.includes('失败')) return 'log-fail';
  return '';
}

/** 数字格式化 */
function formatNumber(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.floor(n).toString();
}
</script>

<style scoped>
.combat-panel { 
  display: flex; flex-direction: column; gap: 12px; 
  background: #0f172a; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; 
}

/* 状态栏 */
.status-bar { display: flex; justify-content: space-between; align-items: center; }
.status-left, .status-right { display: flex; gap: 12px; align-items: center; }
.floor-badge { 
  background: linear-gradient(135deg, #7c3aed, #6d28d9); 
  color: white; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 14px; 
}
.power-badge, .kill-badge { color: #94a3b8; font-size: 13px; }

/* 怪物区 */
.monster-area { 
  background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); 
  border-radius: 8px; padding: 12px; 
}
.monster-info { display: flex; flex-direction: column; gap: 6px; }
.monster-name { font-size: 16px; font-weight: 700; color: #fca5a5; }
.monster-meta { font-size: 12px; color: #94a3b8; }

/* 血条 */
.hp-bar, .player-hp-bar { 
  position: relative; height: 24px; background: #1e293b; 
  border-radius: 12px; overflow: hidden; 
}
.hp-fill { 
  height: 100%; background: linear-gradient(90deg, #ef4444, #dc2626); 
  border-radius: 12px; transition: width 0.3s ease; 
}
.player-hp-fill { 
  height: 100%; background: linear-gradient(90deg, #22c55e, #16a34a); 
  border-radius: 12px; transition: width 0.3s ease; 
}
.hp-text { 
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; 
  font-size: 12px; font-weight: 600; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.8); 
}

/* 玩家区 */
.player-area { display: flex; flex-direction: column; gap: 8px; }
.player-stats { display: flex; gap: 16px; font-size: 13px; color: #94a3b8; }
.player-stats span { color: #e2e8f0; }

/* 内联日志（MVP） */
.combat-log-inline { 
  background: rgba(0,0,0,0.3); border-radius: 8px; 
  display: flex; flex-direction: column; max-height: 200px; 
}
.log-header { 
  display: flex; justify-content: space-between; align-items: center; 
  padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.1); 
  font-size: 12px; color: #94a3b8; 
}
.btn-clear { background: none; border: none; color: #64748b; cursor: pointer; font-size: 12px; }
.btn-clear:hover { color: #e2e8f0; }
.log-entries { 
  overflow-y: auto; padding: 8px 12px; 
  font-size: 12px; display: flex; flex-direction: column; gap: 2px; 
}
.log-entry { color: #94a3b8; padding: 2px 0; }
.log-entry.log-kill { color: #fca5a5; font-weight: 600; }
.log-entry.log-loot { color: #fbbf24; }
.log-entry.log-progress { color: #4ade80; }
.log-entry.log-fail { color: #f87171; }
.log-empty { color: #475569; text-align: center; padding: 16px; }

/* 控制栏 */
.controls { display: flex; gap: 8px; align-items: center; }
.btn-auto-combat { 
  flex: 1; padding: 12px; border: none; border-radius: 8px; 
  background: #dc2626; color: white; font-size: 14px; font-weight: 600; cursor: pointer; 
  transition: all 0.2s; 
}
.btn-auto-combat:hover { background: #ef4444; }
.btn-auto-combat.active { background: linear-gradient(135deg, #16a34a, #22c55e); }

/* [第二阶段] 策略按钮、爆发按钮、药水栏的CSS预留 */
/* .strategy-buttons { display: flex; gap: 4px; } */
/* .btn-burst { ... } */
/* .potion-bar { ... } */
</style>
```

### 7.4 离线报告弹窗 `OfflineReportModal.vue`

MVP完整保留。

```vue
<!-- src/components/ui/OfflineReportModal.vue -->
<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="visible" class="modal-overlay" @click.self="$emit('close')">
        <Transition name="modal-scale">
          <div v-if="visible" class="modal-content">
            <!-- 头部 -->
            <div class="modal-header">
              <div class="modal-icon">🏕️</div>
              <h2>离线收益报告</h2>
              <p class="offline-time">离线时长: {{ formattedOfflineTime }}</p>
            </div>

            <!-- 核心数据网格 -->
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon">⚔️</div>
                <div class="stat-value">{{ formatNumber(report.totalKills) }}</div>
                <div class="stat-label">击杀怪物</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">💰</div>
                <div class="stat-value">{{ formatNumber(report.totalGold) }}</div>
                <div class="stat-label">金币收益</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">⭐</div>
                <div class="stat-value">{{ formatNumber(report.totalExp) }}</div>
                <div class="stat-label">经验收益</div>
              </div>
              <div class="stat-card">
                <div class="stat-icon">🏰</div>
                <div class="stat-value">+{{ report.floorsCleared }}</div>
                <div class="stat-label">层数推进</div>
              </div>
            </div>

            <!-- 效率提示 -->
            <div class="efficiency-tip">
              <span>💡</span>
              <span>离线收益为在线效率的 {{ (report.decayRate * 100).toFixed(0) }}%</span>
              <span v-if="report.wasCapped" class="cap-warning">（已达8小时上限）</span>
            </div>

            <!-- 底部按钮 -->
            <div class="modal-footer">
              <button class="btn-claim" @click="$emit('claim')">
                领取收益
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { OfflineReport } from '@/types';

interface Props {
  visible: boolean;
  report: OfflineReport;
}

defineProps<Props>();
defineEmits<{
  close: [];
  claim: [];
}>();

/** 格式化离线时长 */
const formattedOfflineTime = computed(() => {
  const s = report.offlineSeconds;
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (hours > 0) return `${hours}小时${minutes}分钟`;
  return `${minutes}分钟`;
});

/** 注意：上面computed访问了props，实际代码应通过变量 */
// 修正：
const props = defineProps<Props>();
const formattedOfflineTime = computed(() => {
  const s = props.report.offlineSeconds;
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  if (hours > 0) return `${hours}小时${minutes}分钟`;
  return `${minutes}分钟`;
});

function formatNumber(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.floor(n).toLocaleString();
}
</script>

<style scoped>
.modal-overlay { 
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); 
  display: flex; align-items: center; justify-content: center; z-index: 1000; 
  padding: 16px; 
}
.modal-content { 
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%); 
  border: 1px solid #334155; border-radius: 16px; 
  width: 100%; max-width: 420px; padding: 24px; 
  box-shadow: 0 24px 48px rgba(0,0,0,0.5); 
}
.modal-header { text-align: center; margin-bottom: 20px; }
.modal-icon { font-size: 40px; margin-bottom: 8px; }
.modal-header h2 { color: #e2e8f0; margin: 0; font-size: 20px; }
.offline-time { color: #94a3b8; font-size: 14px; margin: 4px 0 0; }

.stats-grid { 
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px; 
}
.stat-card { 
  background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); 
  border-radius: 10px; padding: 16px; text-align: center; 
}
.stat-icon { font-size: 24px; margin-bottom: 4px; }
.stat-value { font-size: 20px; font-weight: 800; color: #e2e8f0; }
.stat-label { font-size: 12px; color: #64748b; margin-top: 4px; }

.efficiency-tip { 
  display: flex; align-items: center; justify-content: center; gap: 8px; 
  padding: 10px; background: rgba(251,191,36,0.1); border-radius: 8px; 
  font-size: 13px; color: #d4d4d8; margin-bottom: 16px; 
}
.cap-warning { color: #f87171; font-size: 12px; }

.modal-footer { text-align: center; }
.btn-claim { 
  width: 100%; padding: 14px; border: none; border-radius: 10px; 
  background: linear-gradient(135deg, #16a34a, #22c55e); 
  color: white; font-size: 16px; font-weight: 700; cursor: pointer; 
  transition: all 0.2s; 
}
.btn-claim:hover { filter: brightness(1.15); transform: translateY(-2px); }

/* 动画 */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

.modal-scale-enter-active { transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.modal-scale-leave-active { transition: all 0.2s ease; }
.modal-scale-enter-from { opacity: 0; transform: scale(0.85) translateY(20px); }
.modal-scale-leave-to { opacity: 0; transform: scale(0.95); }
</style>
```

### 7.5 已移除的组件说明

| 组件 | 移除原因 | 第二阶段计划 |
|------|----------|-------------|
| `CombatLog.vue` | MVP阶段在CombatPanel内联显示20条日志，足够满足基本需求 | 实现独立100条日志组件，支持连杀合并、虚拟滚动、分类筛选 |
| `DamageFloat.vue` | 伤害飘字是视觉增强功能，MVP核心循环可正常运行 | 实现伤害飘字动画，支持暴击放大、金色高亮、拖尾效果 |
| 策略模式切换UI | MVP不做策略模式 | 在CombatPanel中添加激进/稳健/平衡三按钮 |
| 爆发技能按钮 | MVP不做爆发技能 | 添加爆发技能按钮及冷却遮罩动画 |
| 药水栏 | MVP不做药水系统 | 添加药水快捷栏，支持点击使用 |

---

## 第8章 性能优化（MVP完整保留）

### 8.1 大数值处理 `utils/bigNumber.ts`

MVP完整保留。

```typescript
/**
 * @file utils/bigNumber.ts
 * @description 大数值处理工具 - MVP完整保留
 */

/** 中文数字单位 */
const UNITS = ['', '万', '亿', '万亿', '万万亿'] as const;

/**
 * 格式化数字（中文单位）
 * 小于1万直接显示，超过逐级用万进制单位
 */
export function formatNumber(num: number, digits: number = 2): string {
  if (!isFinite(num)) return num > 0 ? '∞' : '-∞';
  if (num === 0) return '0';
  if (num < 0) return '-' + formatNumber(-num, digits);
  if (num < 10000) return num.toLocaleString('zh-CN', { maximumFractionDigits: digits });

  let unitIndex = 0;
  let value = num;
  while (value >= 10000 && unitIndex < UNITS.length - 1) {
    value /= 10000;
    unitIndex++;
  }
  if (value >= 10000) return num.toExponential(digits);
  return `${value.toFixed(digits)}${UNITS[unitIndex]}`;
}

/** 紧凑格式（K/M/B/T） */
export function formatCompact(num: number, digits: number = 2): string {
  if (!isFinite(num)) return '∞';
  if (num === 0) return '0';
  if (num < 1000) return num.toFixed(digits);
  const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa'];
  const tier = Math.min(Math.floor(Math.log10(num) / 3), suffixes.length - 1);
  const scaled = num / Math.pow(10, tier * 3);
  return scaled.toFixed(digits) + suffixes[tier];
}

/** 安全加法（防溢出） */
export function safeAdd(a: number, b: number): number {
  const sum = a + b;
  return isFinite(sum) ? sum : Number.MAX_VALUE;
}

/** 安全乘法（防溢出） */
export function safeMultiply(a: number, b: number): number {
  const product = a * b;
  return isFinite(product) ? product : Number.MAX_VALUE;
}
```

### 8.2 对象池 `utils/objectPool.ts`

MVP完整保留。

```typescript
/**
 * @file utils/objectPool.ts
 * @description 通用对象池 - MVP完整保留
 * 用于复用战斗中高频创建的对象，减少GC压力
 */
export class ObjectPool<T> {
  private available: T[] = [];
  private borrowed = new Set<T>();
  private readonly maxSize: number;
  private readonly factory: () => T;
  private readonly reset: (obj: T) => void;

  constructor(factory: () => T, reset: (obj: T => void, maxSize: number = 100) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
  }

  /** 获取对象 */
  acquire(): T {
    let obj: T;
    if (this.available.length > 0) {
      obj = this.available.pop()!;
    } else if (this.borrowed.size < this.maxSize) {
      obj = this.factory();
    } else {
      console.warn('[ObjectPool] 池已满，创建临时对象');
      obj = this.factory();
    }
    this.reset(obj);
    this.borrowed.add(obj);
    return obj;
  }

  /** 归还对象 */
  release(obj: T): void {
    if (!this.borrowed.has(obj)) {
      console.warn('[ObjectPool] 归还了不属于本池的对象');
      return;
    }
    this.borrowed.delete(obj);
    if (this.available.length < this.maxSize) {
      this.available.push(obj);
    }
  }

  get freeCount() { return this.available.length; }
  get borrowedCount() { return this.borrowed.size; }
}
```

### 8.3 脏标记缓存 `composables/useCachedStats.ts`

MVP完整保留脏标记缓存机制。

```typescript
/**
 * @file composables/useCachedStats.ts
 * @description 脏标记缓存计算 - MVP完整保留
 * 装备/天赋变更时标记脏，下次访问时重新计算
 */
import { ref, computed } from 'vue';

export interface CachedCombatStats {
  dps: number;
  ehp: number;
  power: number;
  critChance: number;
  critDamage: number;
  attackSpeed: number;
}

/**
 * 创建带脏标记的缓存计算
 * @param calculator 实际计算函数
 * @returns 缓存的响应式数据和脏标记控制
 */
export function useCachedStats<T>(calculator: () => T) {
  const dirty = ref(true);
  const cache = ref<T | null>(null);

  /** 标记缓存失效 */
  function markDirty(): void {
    dirty.value = true;
  }

  /** 访问时自动检查脏标记 */
  const stats = computed<T>(() => {
    if (dirty.value || cache.value === null) {
      cache.value = calculator();
      dirty.value = false;
    }
    return cache.value;
  });

  /** 强制立即重算 */
  function forceRecalculate(): T {
    cache.value = calculator();
    dirty.value = false;
    return cache.value;
  }

  return {
    stats,
    markDirty,
    forceRecalculate,
  };
}
```

### 8.4 防抖节流 `utils/throttle.ts`

MVP完整保留。

```typescript
/**
 * @file utils/throttle.ts
 * @description 防抖与节流工具 - MVP完整保留
 */

/** 防抖 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T, delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return function (...args: Parameters<T>): void {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { fn(...args); timer = null; }, delay);
  };
}

/** 节流 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T, interval: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  return function (...args: Parameters<T>): void {
    const now = Date.now();
    if (now - lastTime >= interval) {
      lastTime = now;
      fn(...args);
    }
  };
}
```

---

## MVP第二阶段标注汇总

| 系统/功能 | 标注位置 | 说明 |
|-----------|----------|------|
| 多存档槽 | 6.1节 | SaveManager中注释掉MultiSlotSaveManager |
| IndexedDB | 6.1节 | 注释标注[第二阶段] |
| 版本迁移 | 6.1节 | 注释标注[第二阶段] |
| PWA配置 | — | 整行删除，MVP不做 |
| CombatLog.vue（100条） | 7.3节 | 在CombatPanel内联20条日志替代 |
| DamageFloat.vue | 7.5节 | 整行删除，第二阶段实现 |
| 策略模式切换UI | 7.3节 | CombatPanel中注释掉策略按钮 |
| 爆发技能按钮 | 7.3节 | CombatPanel中注释掉爆发按钮 |
| 药水栏 | 7.3节 | CombatPanel中注释掉药水栏 |
| 存档压缩(lz-string) | 6.1节 | 注释标注为可选优化 |
