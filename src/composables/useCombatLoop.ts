import { onBeforeUnmount, watch } from 'vue';
import { useCombatStore } from '@/stores/combat';
import { AUTO_COMBAT_INTERVAL_MS } from '@/utils/constants';

export function useCombatLoop() {
  const combat = useCombatStore();
  let timer: ReturnType<typeof window.setInterval> | null = null;

  function stopTimer() {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  function startTimer() {
    if (timer !== null) return;
    timer = window.setInterval(() => {
      if (!combat.isAutoFighting) {
        stopTimer();
        return;
      }
      combat.runSingleCombat('auto');
    }, AUTO_COMBAT_INTERVAL_MS);
  }

  watch(
    () => combat.isAutoFighting,
    (isAutoFighting) => {
      if (isAutoFighting) {
        startTimer();
      } else {
        stopTimer();
      }
    },
    { immediate: true },
  );

  onBeforeUnmount(stopTimer);

  return {
    startTimer,
    stopTimer,
  };
}
