import { defineStore } from 'pinia';

interface SaveState {
  version: number;
  lastActiveTime: number;
}

export const useSaveStore = defineStore('save', {
  state: (): SaveState => ({
    version: 1,
    lastActiveTime: Date.now(),
  }),

  actions: {
    markActive(now = Date.now()) {
      this.lastActiveTime = now;
    },
  },

  persist: {
    key: 'save',
  },
});
