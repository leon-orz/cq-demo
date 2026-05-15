<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import CombatPanel from '@/components/combat/CombatPanel.vue';
import EquipmentCard from '@/components/equipment/EquipmentCard.vue';
import EquipmentCompare from '@/components/equipment/EquipmentCompare.vue';
import OfflineReportModal from '@/components/ui/OfflineReportModal.vue';
import { useGameSave } from '@/composables/useGameSave';
import { EnhancementSystem } from '@/core/EnhancementSystem';
import type { EquipmentItem } from '@/types';
import { ScoreMode, Rarity } from '@/types/enums';
import { GAME_CONSTANTS, SCORE_MODE_LABELS, SLOT_LABELS } from '@/utils/constants';
import { formatNumber, formatPercent, formatStatValue } from '@/utils/format';
import { useCombatStore } from '@/stores/combat';
import { useEquipmentStore } from '@/stores/equipment';
import { usePlayerStore } from '@/stores/player';

const playerStore = usePlayerStore();
const equipmentStore = useEquipmentStore();
const combatStore = useCombatStore();
const gameSave = useGameSave();
const selectedItem = ref<EquipmentItem | null>(null);
const lastMessage = ref('');

const scoreModes = Object.values(ScoreMode);

const inventoryStatus = computed(() => {
  const count = equipmentStore.inventoryCount;
  const max = equipmentStore.maxInventorySize;
  const pressure = max > 0 ? count / max : 1;
  if (count >= max) {
    return {
      label: '已满',
      detail: '背包已满，挂机会暂停或丢失新掉落',
      textClass: 'text-red-200',
      barClass: 'bg-red-500',
      borderClass: 'border-red-500/70 bg-red-950/20',
    };
  }
  if (pressure >= 0.9) {
    return {
      label: '危急',
      detail: '空间极少，建议立刻分解或穿戴',
      textClass: 'text-orange-200',
      barClass: 'bg-orange-400',
      borderClass: 'border-orange-400/70 bg-orange-950/20',
    };
  }
  if (pressure >= 0.7) {
    return {
      label: '警告',
      detail: '背包压力升高，留意掉落空间',
      textClass: 'text-amber-200',
      barClass: 'bg-amber-300',
      borderClass: 'border-amber-300/60 bg-amber-950/20',
    };
  }
  return {
    label: '正常',
    detail: '仍有充足掉落空间',
    textClass: 'text-emerald-200',
    barClass: 'bg-emerald-400',
    borderClass: 'border-emerald-400/50 bg-emerald-950/20',
  };
});

const inventoryPressurePercent = computed(() => {
  if (equipmentStore.maxInventorySize <= 0) return 100;
  return Math.min(100, Math.round(equipmentStore.inventoryPressure * 100));
});

const selectedEnhanceCost = computed(() => {
  if (!selectedItem.value || selectedItem.value.enhanceLevel >= GAME_CONSTANTS.MAX_ENHANCE_LEVEL) return null;
  return EnhancementSystem.getCost(selectedItem.value.enhanceLevel);
});

const selectedEnhanceAtCap = computed(() => {
  const item = selectedItem.value;
  return Boolean(item && item.enhanceLevel >= GAME_CONSTANTS.MAX_ENHANCE_LEVEL);
});

onMounted(() => {
  gameSave.initialize();
});

function handleEquip(item: EquipmentItem): void {
  equipmentStore.equip(item);
  selectedItem.value = null;
  lastMessage.value = `已穿戴 ${item.name}`;
}

function handleDisenchant(item: EquipmentItem): void {
  const stones = equipmentStore.disenchant(item);
  lastMessage.value = stones > 0 ? `分解获得 ${stones} 强化石` : '该装备无法分解';
  if (selectedItem.value?.id === item.id) selectedItem.value = null;
}

function handleLock(item: EquipmentItem): void {
  if (item.locked) {
    equipmentStore.unlockItem(item.id);
    lastMessage.value = '已解锁装备';
  } else {
    equipmentStore.lockItem(item.id);
    lastMessage.value = '已锁定装备';
  }
}

function train(type: 'attack' | 'vitality' | 'defense'): void {
  lastMessage.value = playerStore.train(type) ? '训练完成' : '金币不足或训练已满';
}

function equipBest(): void {
  const changes = equipmentStore.equipBestForScoreMode();
  lastMessage.value = changes.length > 0 ? `已替换 ${changes.length} 件装备` : '当前已是推荐装备';
}

function enhanceSelected(): void {
  if (!selectedItem.value) return;
  lastMessage.value = equipmentStore.enhance(selectedItem.value);
}

function claimOfflineReport(): void {
  const report = gameSave.offlineReport.value;
  if (!report) return;
  const dropCount = report.totalDrops.length;
  gameSave.claimOfflineReport();
  lastMessage.value = `已领取离线收益：${formatNumber(report.totalGold)} 金币、${formatNumber(
    report.totalExp,
  )} 经验、${dropCount} 件装备`;
}

function handleFloorChange(success: boolean, floor: number): void {
  lastMessage.value = success ? `已切换到第 ${floor} 层` : `第 ${floor} 层暂不可挑战`;
}
</script>

<template>
  <main
    class="mx-auto grid min-h-screen max-w-[1600px] gap-4 px-4 py-4 lg:grid-cols-[minmax(260px,25%)_1fr_minmax(300px,25%)]"
  >
    <aside class="space-y-4">
      <section class="panel rounded-lg p-4">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h1 class="text-lg font-semibold text-zinc-100">放置裂隙</h1>
            <p class="text-sm text-zinc-400">Lv.{{ playerStore.player.level }} 战士</p>
          </div>
          <button
            class="rounded border border-zinc-600 px-2.5 py-1 text-xs text-zinc-200"
            data-testid="save-button"
            type="button"
            @click="gameSave.saveNow"
          >
            保存
          </button>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div class="rounded border border-zinc-700 p-2">
            <div class="text-xs text-zinc-500">金币</div>
            <div class="font-semibold">{{ formatNumber(playerStore.player.gold) }}</div>
          </div>
          <div class="rounded border border-zinc-700 p-2">
            <div class="text-xs text-zinc-500">强化石</div>
            <div class="font-semibold">{{ formatNumber(playerStore.player.enhancementStones) }}</div>
          </div>
          <div class="rounded border border-zinc-700 p-2">
            <div class="text-xs text-zinc-500">DPS</div>
            <div class="font-semibold">{{ formatNumber(playerStore.dps) }}</div>
          </div>
          <div class="rounded border border-zinc-700 p-2">
            <div class="text-xs text-zinc-500">战力</div>
            <div class="font-semibold">{{ formatNumber(playerStore.power) }}</div>
          </div>
        </div>

        <dl class="mt-4 space-y-2 text-sm text-zinc-300">
          <div class="flex justify-between">
            <dt>生命</dt>
            <dd>{{ formatNumber(playerStore.player.maxHp) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt>攻击</dt>
            <dd>{{ formatNumber(playerStore.player.atk) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt>攻速</dt>
            <dd>{{ formatNumber(playerStore.player.atkSpd) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt>暴击</dt>
            <dd>{{ formatPercent(playerStore.player.critRate) }} / {{ formatPercent(playerStore.player.critDmg) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt>护甲</dt>
            <dd>{{ formatNumber(playerStore.player.armor) }}</dd>
          </div>
          <div class="flex justify-between">
            <dt>闪避</dt>
            <dd>{{ formatPercent(playerStore.player.dodge) }}</dd>
          </div>
        </dl>
      </section>

      <section class="panel rounded-lg p-4">
        <h2 class="text-sm font-semibold text-zinc-100">训练</h2>
        <div class="mt-3 space-y-2">
          <button
            class="w-full rounded border border-zinc-600 px-3 py-2 text-left text-sm"
            data-testid="train-attack"
            type="button"
            @click="train('attack')"
          >
            攻击训练 Lv.{{ playerStore.player.training.attack }}
            <span class="float-right text-zinc-400">{{ playerStore.getTrainingCost('attack') }} 金币</span>
          </button>
          <button
            class="w-full rounded border border-zinc-600 px-3 py-2 text-left text-sm"
            data-testid="train-vitality"
            type="button"
            @click="train('vitality')"
          >
            体魄训练 Lv.{{ playerStore.player.training.vitality }}
            <span class="float-right text-zinc-400">{{ playerStore.getTrainingCost('vitality') }} 金币</span>
          </button>
          <button
            class="w-full rounded border border-zinc-600 px-3 py-2 text-left text-sm"
            data-testid="train-defense"
            type="button"
            @click="train('defense')"
          >
            防御训练 Lv.{{ playerStore.player.training.defense }}
            <span class="float-right text-zinc-400">{{ playerStore.getTrainingCost('defense') }} 金币</span>
          </button>
        </div>
      </section>

      <section class="panel rounded-lg p-4">
        <h2 class="text-sm font-semibold text-zinc-100">已装备</h2>
        <div class="mt-3 space-y-2">
          <div
            v-for="(item, slot) in equipmentStore.equipped"
            :key="slot"
            class="rounded border border-zinc-700 p-2 text-sm"
          >
            <div class="mb-1 flex justify-between text-xs text-zinc-500">
              <span>{{ SLOT_LABELS[slot] }}</span>
              <span v-if="item">Lv.{{ item.itemLevel }}</span>
            </div>
            <button v-if="item" class="w-full text-left text-zinc-100" type="button" @click="selectedItem = item">
              {{ item.name }}
            </button>
            <span v-else class="text-zinc-600">空</span>
          </div>
        </div>
      </section>
    </aside>

    <section class="space-y-4">
      <CombatPanel @floor-change="handleFloorChange" />
      <EquipmentCompare
        v-if="selectedItem"
        :new-item="selectedItem"
        :equipped-item="equipmentStore.equipped[selectedItem.slot]"
        :player="playerStore.player"
        :score-mode="equipmentStore.scoreMode"
        @equip="handleEquip"
        @cancel="selectedItem = null"
      />

      <section class="panel rounded-lg p-4">
        <h2 class="text-sm font-semibold text-zinc-100">当前状态</h2>
        <div class="mt-3 grid gap-3 md:grid-cols-3">
          <div class="rounded border border-zinc-700 p-3 text-sm">
            <div class="text-zinc-500">最高层</div>
            <div class="font-semibold">{{ playerStore.player.highestFloor }}</div>
          </div>
          <div class="rounded border border-zinc-700 p-3 text-sm">
            <div class="text-zinc-500">推荐层</div>
            <div class="font-semibold">{{ combatStore.recommendedFloor }}</div>
          </div>
          <div class="rounded border border-zinc-700 p-3 text-sm">
            <div class="text-zinc-500">装备总分</div>
            <div class="font-semibold">{{ formatNumber(equipmentStore.totalGearScore) }}</div>
          </div>
        </div>
        <p
          v-if="lastMessage"
          class="mt-3 rounded border border-zinc-700 bg-zinc-950/50 px-3 py-2 text-sm text-zinc-300"
        >
          {{ lastMessage }}
        </p>
      </section>
    </section>

    <aside class="space-y-4">
      <section class="panel rounded-lg p-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h2 class="text-sm font-semibold text-zinc-100">背包</h2>
            <p class="text-xs" :class="inventoryStatus.textClass">
              {{ equipmentStore.inventoryCount }} / {{ equipmentStore.maxInventorySize }} · {{ inventoryStatus.label }}
            </p>
          </div>
          <button
            class="rounded bg-ember px-3 py-1.5 text-xs font-semibold text-zinc-950"
            data-testid="equip-best"
            type="button"
            @click="equipBest"
          >
            一键穿戴
          </button>
        </div>

        <div class="mt-3 rounded border p-3" :class="inventoryStatus.borderClass">
          <div class="flex items-center justify-between text-xs">
            <span :class="inventoryStatus.textClass">背包压力 {{ inventoryStatus.label }}</span>
            <span class="text-zinc-400">{{ inventoryPressurePercent }}%</span>
          </div>
          <div class="mt-2 h-2 overflow-hidden rounded bg-zinc-800">
            <div
              class="h-full rounded"
              :class="inventoryStatus.barClass"
              :style="{ width: `${inventoryPressurePercent}%` }"
            />
          </div>
          <p class="mt-2 text-xs text-zinc-400">{{ inventoryStatus.detail }}</p>
        </div>

        <div class="mt-3 flex flex-wrap gap-2">
          <button
            v-for="mode in scoreModes"
            :key="mode"
            class="rounded border px-2.5 py-1 text-xs"
            :class="
              equipmentStore.scoreMode === mode
                ? 'border-ember bg-ember text-zinc-950'
                : 'border-zinc-600 text-zinc-300'
            "
            type="button"
            @click="equipmentStore.setScoreMode(mode)"
          >
            {{ SCORE_MODE_LABELS[mode] }}
          </button>
        </div>

        <div class="mt-3 flex gap-2">
          <button
            class="rounded border border-zinc-600 px-2.5 py-1 text-xs text-zinc-300"
            type="button"
            @click="equipmentStore.disenchantAllBelow(Rarity.MAGIC)"
          >
            分解普通
          </button>
          <button
            class="rounded border px-2.5 py-1 text-xs"
            data-testid="enhance-selected"
            :class="
              selectedItem
                ? selectedEnhanceAtCap
                  ? 'border-amber-300/70 bg-amber-950/30 text-amber-100'
                  : 'border-ember bg-ember/15 text-ember'
                : 'border-zinc-600 text-zinc-500'
            "
            type="button"
            :disabled="!selectedItem || selectedEnhanceAtCap"
            @click="enhanceSelected"
          >
            强化选中
          </button>
        </div>

        <div
          class="mt-3 rounded border p-3 text-xs"
          :class="selectedItem ? 'border-zinc-600 bg-zinc-950/50' : 'border-zinc-700 bg-zinc-950/30'"
        >
          <template v-if="selectedItem">
            <div class="flex items-center justify-between gap-3">
              <span class="text-zinc-400">当前强化</span>
              <span class="font-semibold text-zinc-100"
                >+{{ selectedItem.enhanceLevel }} / +{{ GAME_CONSTANTS.MAX_ENHANCE_LEVEL }}</span
              >
            </div>
            <div v-if="selectedEnhanceCost" class="mt-2 flex items-center justify-between gap-3">
              <span class="text-zinc-400">本次消耗</span>
              <span class="text-zinc-100">
                {{ formatNumber(selectedEnhanceCost.gold) }} 金币 /
                {{ formatNumber(selectedEnhanceCost.stones) }} 强化石
              </span>
            </div>
            <p v-else class="mt-2 font-semibold text-amber-200">已达到 +{{ GAME_CONSTANTS.MAX_ENHANCE_LEVEL }} 上限</p>
          </template>
          <p v-else class="text-zinc-500">选择一件背包装备后可查看强化消耗</p>
        </div>

        <div class="mt-4 max-h-[calc(100vh-220px)] space-y-3 overflow-auto pr-1">
          <EquipmentCard
            v-for="item in equipmentStore.inventory"
            :key="item.id"
            :item="item"
            :player="playerStore.player"
            :score-mode="equipmentStore.scoreMode"
            :selected="selectedItem?.id === item.id"
            @click="selectedItem = item"
            @equip="handleEquip"
            @disenchant="handleDisenchant"
            @lock="handleLock"
          />
          <div
            v-if="equipmentStore.inventory.length === 0"
            class="rounded border border-dashed border-zinc-700 p-6 text-center text-sm text-zinc-500"
          >
            背包为空，开始挂机后会获得装备
          </div>
        </div>
      </section>
    </aside>

    <OfflineReportModal
      v-if="gameSave.offlineReport.value"
      :report="gameSave.offlineReport.value"
      @claim="claimOfflineReport"
    />
  </main>
</template>
