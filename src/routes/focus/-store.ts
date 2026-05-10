import { create } from "zustand";
import { addSession, type Session } from "./-utils";
import { persist } from "zustand/middleware";

interface StoreState {
  goalSeconds: number;
  tag: string | null;
  state:
    | {
        status: "setting-goal";
      }
    | { status: "running"; endAtMillis: number }
    | { status: "paused"; timeRemainingMillis: number }
    | { status: "overtime"; endedAtMillis: number };
}

interface StoreActions {
  setGoalSeconds: (goalSeconds: number) => void;

  startTimer: (endAtMillis: number) => void;
  pauseTimer: (timeRemainingMillis: number) => void;
  gotoOvertime: (endedAtMillis: number) => void;
  resumeTimer: (endAtMillis: number) => void;

  endSession: (session: Session) => void;
}

export const useFocusStore = create<StoreState & StoreActions>()(
  persist(
    (set, get) => ({
      goalSeconds: 0,
      tag: null,
      state: { status: "setting-goal" },

      setGoalSeconds: (goalSeconds: number) => set({ goalSeconds }),

      startTimer: (endAtMillis: number) =>
        set({ state: { status: "running", endAtMillis } }),
      pauseTimer: (timeRemainingMillis: number) =>
        set({ state: { status: "paused", timeRemainingMillis } }),
      gotoOvertime: (endedAtMillis: number) =>
        set({ state: { status: "overtime", endedAtMillis } }),
      resumeTimer: (endAtMillis: number) =>
        set({ state: { status: "running", endAtMillis } }),

      endSession: (session: Session) => {
        let focusedMillis = 0;
        switch (session.type) {
          case "cancelled":
            focusedMillis = get().goalSeconds * 1000 - session.remainingMillis;
            break;
          case "overtime":
            focusedMillis =
              session.overTimeFocusedMillis + get().goalSeconds * 1000;
            break;
          default: {
            const _exhaustive: never = session;
            return _exhaustive;
          }
        }

        addSession(Date.now(), focusedMillis, get().tag);

        set({
          state: { status: "setting-goal" },
        });
      },
    }),
    {
      name: "focus-store",
    },
  ),
);
