import { create } from "zustand";
import { millisToSecondsFloor, type SessionType } from "./-utils";
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

  endSession: (session: SessionType) => void;
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

      endSession: (session: SessionType) => {
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

        useHistoryStore.getState().addSession({
          endTimeMillis: Date.now(),
          focusedSeconds: millisToSecondsFloor(focusedMillis),
          tag: get().tag,
        });

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

export interface Session {
  endTimeMillis: number;
  focusedSeconds: number;
  tag: string | null;
}

interface HistoryState {
  history: Session[];
}

interface HistoryActions {
  addSession: (session: Session) => void;
}

export const useHistoryStore = create<HistoryState & HistoryActions>()(
  persist(
    (set, get) => ({
      history: [],
      addSession: (session: Session) =>
        set({ history: [...get().history, session] }),
    }),
    {
      name: "history-store",
    },
  ),
);
