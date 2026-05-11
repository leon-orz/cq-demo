import { defineStore } from 'pinia';
import type { RewardFeedbackEvent } from '@/types/combat';

interface FeedbackState {
  events: RewardFeedbackEvent[];
}

const MAX_FEEDBACK_EVENTS = 3;

export const useFeedbackStore = defineStore('feedback', {
  state: (): FeedbackState => ({
    events: [],
  }),

  getters: {
    latestEvent: (state) => state.events[0] ?? null,
  },

  actions: {
    pushFeedback(event: RewardFeedbackEvent | null) {
      if (!event) return;
      this.events = [event, ...this.events].slice(0, MAX_FEEDBACK_EVENTS);
    },

    dismissFeedback(id: number) {
      this.events = this.events.filter((event) => event.id !== id);
    },

    clearFeedback() {
      this.events = [];
    },
  },
});
