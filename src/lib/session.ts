import type { Workout } from './types';

/** In-memory hand-off between screens (custom workouts, timer results). */
let pending: Workout | null = null;
let result: { workout: Workout; durationSec: number; rounds?: number; completed: boolean } | null = null;

export const session = {
  setWorkout(w: Workout) {
    pending = w;
  },
  takeWorkout() {
    return pending;
  },
  setResult(r: NonNullable<typeof result>) {
    result = r;
  },
  getResult() {
    return result;
  },
  clearResult() {
    result = null;
  },
};
