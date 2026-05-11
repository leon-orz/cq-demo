<template>
  <main class="min-h-screen bg-ink text-slate-100">
    <div class="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-3 p-3 lg:grid-cols-[280px_1fr_340px]">
      <LeftPanel />
      <CenterPanel />
      <RightPanel />
    </div>
    <RewardFeedbackLayer />
    <RewardReport />
  </main>
</template>

<script setup lang="ts">
import LeftPanel from '@/components/layout/LeftPanel.vue';
import CenterPanel from '@/components/layout/CenterPanel.vue';
import RightPanel from '@/components/layout/RightPanel.vue';
import RewardFeedbackLayer from '@/components/feedback/RewardFeedbackLayer.vue';
import RewardReport from '@/components/offline/RewardReport.vue';
import { useCombatLoop } from '@/composables/useCombatLoop';
import { useOfflineCheck } from '@/composables/useOfflineCheck';

useCombatLoop();
useOfflineCheck();
</script>
