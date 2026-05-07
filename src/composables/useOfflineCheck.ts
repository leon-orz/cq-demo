import { onBeforeUnmount, onMounted } from 'vue';
import { useOfflineStore } from '@/stores/offline';
import { useSaveStore } from '@/stores/save';

export function useOfflineCheck() {
  const offline = useOfflineStore();
  const save = useSaveStore();

  function markActive() {
    save.markActive();
  }

  function handleVisibilityChange() {
    if (document.visibilityState === 'hidden') {
      markActive();
    }
  }

  onMounted(() => {
    offline.checkOfflineReward();
    window.addEventListener('beforeunload', markActive);
    document.addEventListener('visibilitychange', handleVisibilityChange);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', markActive);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    markActive();
  });
}
