<template>
  <section class="mt-5">
    <div class="mb-2 flex items-center justify-between gap-3">
      <div>
        <h2 class="text-sm font-semibold text-slate-300">天赋</h2>
        <p class="text-xs text-slate-500">可用 {{ player.availableSkillPoints }} / 总计 {{ player.skillPoints }}</p>
      </div>
      <button
        class="rounded border border-line px-2 py-1 text-xs text-slate-300 hover:border-slate-500 disabled:cursor-not-allowed disabled:opacity-45"
        :disabled="player.spentSkillPoints === 0"
        @click="player.resetSkillNodes()"
      >
        重置
      </button>
    </div>

    <div class="space-y-2">
      <section v-for="branch in branches" :key="branch" class="rounded border border-line bg-ink">
        <button
          class="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
          :aria-expanded="expandedBranches[branch]"
          @click="toggleBranch(branch)"
        >
          <span>
            <span class="block text-sm font-semibold text-slate-200">{{ skillBranchLabels[branch] }}</span>
            <span class="block text-xs text-slate-500">{{ skillBranchDescriptions[branch] }}</span>
          </span>
          <span class="shrink-0 text-xs text-slate-500">
            {{ activeCountByBranch[branch] }}/{{ nodesByBranch[branch].length }}
          </span>
        </button>
        <div v-if="expandedBranches[branch]" class="space-y-2 border-t border-line p-3">
          <SkillNode
            v-for="node in nodesByBranch[branch]"
            :key="node.id"
            :node="node"
            :can-activate="player.availableSkillPoints > 0"
            @activate="player.activateSkillNode"
          />
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue';
import SkillNode from '@/components/skilltree/SkillNode.vue';
import { skillBranchDescriptions, skillBranchLabels } from '@/data/skills';
import { usePlayerStore } from '@/stores/player';
import type { SkillBranch } from '@/types/player';

const player = usePlayerStore();
player.normalizeSkillNodes();

const branches: SkillBranch[] = ['crit', 'speed', 'tank', 'treasure'];
const expandedBranches = reactive(
  branches.reduce(
    (state, branch) => {
      state[branch] = branch === 'treasure' || player.skillNodes.some((node) => node.branch === branch && node.active);
      return state;
    },
    {} as Record<SkillBranch, boolean>,
  ),
);
const nodesByBranch = computed(() => {
  return branches.reduce(
    (grouped, branch) => {
      grouped[branch] = player.skillNodes.filter((node) => node.branch === branch);
      return grouped;
    },
    {} as Record<SkillBranch, typeof player.skillNodes>,
  );
});

const activeCountByBranch = computed(() => {
  return branches.reduce(
    (grouped, branch) => {
      grouped[branch] = nodesByBranch.value[branch].filter((node) => node.active).length;
      return grouped;
    },
    {} as Record<SkillBranch, number>,
  );
});

function toggleBranch(branch: SkillBranch) {
  expandedBranches[branch] = !expandedBranches[branch];
}
</script>
