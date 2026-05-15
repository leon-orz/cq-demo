import { onBeforeUnmount } from 'vue';
import { useCombatStore } from '@/stores/combat';

export function useCombatLoop() {
  const combatStore = useCombatStore();

  onBeforeUnmount(() => {
    combatStore.stopAutoCombat('');
  });

  return {
    start: combatStore.startAutoCombat,
    stop: combatStore.stopAutoCombat,
    executeBattle: combatStore.executeBattle,
  };
}
