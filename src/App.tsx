import { useCallback, useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Pause, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import "./App.css";

type Session =
  | { type: "cancelled"; remainingMillis: number }
  | { type: "overtime"; overTimeFocusedMillis: number };

function useNow(intervalMs: number = 500) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return now;
}

function useLocalStorage<T>(key: string, defaultValue: T) {
  // 1. Get initial value from storage or use default
  const [value, setValue] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    return saved !== null ? JSON.parse(saved) : defaultValue;
  });

  // 2. Update localStorage whenever value changes
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

function millisToSecondsCeil(millis: number) {
  return Math.ceil(millis / 1000);
}

function millisToSecondsFloor(millis: number) {
  return Math.floor(millis / 1000);
}

function TimeDisplay({ timeSeconds }: { timeSeconds: number }) {
  const minsDisplay = Math.floor(timeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secsDisplay = (timeSeconds % 60).toString().padStart(2, "0");
  const timeString = `${minsDisplay}:${secsDisplay}`;
  return <div>{timeString}</div>;
}

function SetGoal({
  startTimer,
  goalSeconds,
  setGoalSeconds,
}: {
  startTimer: (endAtMillis: number) => void;
  goalSeconds: number;
  setGoalSeconds: (goalSeconds: number) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <Button
          onClick={() => setGoalSeconds(Math.max(0, goalSeconds - 5 * 60))}
        >
          <ChevronLeft />
        </Button>
        <TimeDisplay timeSeconds={goalSeconds} />

        <Button onClick={() => setGoalSeconds(goalSeconds + 5 * 60)}>
          <ChevronRight />
        </Button>
      </div>

      <Button onClick={() => startTimer(Date.now() + goalSeconds * 1000)}>
        <Play />
      </Button>
    </div>
  );
}

function Running({
  endAtMillis,
  pauseTimer,
  gotoOvertime,
  endSession,
}: {
  endAtMillis: number;
  pauseTimer: (timeRemainingMillis: number) => void;
  gotoOvertime: (endAtMillis: number) => void;
  endSession: (session: Session) => number;
}) {
  const now = useNow();
  const remainingMillis = Math.max(0, endAtMillis - now);
  const timeRemainingSeconds = millisToSecondsCeil(remainingMillis);

  useEffect(() => {
    if (timeRemainingSeconds <= 0) {
      gotoOvertime(endAtMillis);
    }
  }, [timeRemainingSeconds, endAtMillis, gotoOvertime]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <TimeDisplay timeSeconds={timeRemainingSeconds} />
      </div>

      <Button onClick={() => pauseTimer(endAtMillis - Date.now())}>
        <Pause />
      </Button>
      <Button
        onClick={() =>
          endSession({
            type: "cancelled",
            remainingMillis: endAtMillis - Date.now(),
          })
        }
      >
        <X />
      </Button>
    </div>
  );
}

function Paused({
  remainingMillis,
  resumeTimer,
  endSession,
}: {
  remainingMillis: number;
  resumeTimer: (endAtMillis: number) => void;
  endSession: (session: Session) => number;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <TimeDisplay timeSeconds={millisToSecondsCeil(remainingMillis)} />
      </div>

      <Button onClick={() => resumeTimer(Date.now() + remainingMillis)}>
        <Play />
      </Button>

      <Button
        onClick={() =>
          endSession({ type: "cancelled", remainingMillis: remainingMillis })
        }
      >
        <X />
      </Button>
    </div>
  );
}

function Overtime({
  overTimeStartMillis,
  endSession,
}: {
  overTimeStartMillis: number;
  endSession: (session: Session) => number;
}) {
  const _tick = useNow();

  return (
    <div>
      +
      <TimeDisplay
        timeSeconds={millisToSecondsFloor(Date.now() - overTimeStartMillis)}
      />
      <Button
        onClick={() =>
          endSession({
            type: "overtime",
            overTimeFocusedMillis: Date.now() - overTimeStartMillis,
          })
        }
      >
        <Check />
      </Button>
    </div>
  );
}

type TimerState =
  | { status: "setting-goal" }
  | { status: "running"; endAtMillis: number }
  | { status: "paused"; remainingMillis: number }
  | { status: "overtime"; overTimeStartMillis: number };

function FocusTimer() {
  const [appState, setAppState] = useState<TimerState>({
    status: "setting-goal",
  });

  const [goalSeconds, setGoalSeconds] = useLocalStorage("goalSeconds", 5);

  const gotoOvertime = useCallback(
    (currentTimeMillis: number) =>
      setAppState({
        status: "overtime",
        overTimeStartMillis: currentTimeMillis,
      }),
    [],
  );

  function endSession(session: Session) {
    let focusedMillis = 0;
    switch (session.type) {
      case "cancelled":
        focusedMillis = goalSeconds * 1000 - session.remainingMillis;
        break;
      case "overtime":
        focusedMillis = session.overTimeFocusedMillis + goalSeconds * 1000;
        break;
      default: {
        const _exhaustiveCheck: never = session;
        focusedMillis = 0;
        break;
      }
    }

    setAppState({
      status: "setting-goal",
    });

    console.log("focusedSeconds", millisToSecondsFloor(focusedMillis));
    return focusedMillis;
  }

  switch (appState.status) {
    case "setting-goal":
      return (
        <SetGoal
          goalSeconds={goalSeconds}
          setGoalSeconds={setGoalSeconds}
          startTimer={(endAtMillis) => {
            setAppState({
              status: "running",
              endAtMillis: endAtMillis,
            });
          }}
        />
      );
    case "running":
      return (
        <Running
          endAtMillis={appState.endAtMillis}
          pauseTimer={(remainingMillis: number) =>
            setAppState({
              status: "paused",
              remainingMillis: remainingMillis,
            })
          }
          gotoOvertime={gotoOvertime}
          endSession={endSession}
        />
      );
    case "paused":
      return (
        <Paused
          remainingMillis={appState.remainingMillis}
          resumeTimer={(endAtMillis: number) =>
            setAppState({
              status: "running",
              endAtMillis: endAtMillis,
            })
          }
          endSession={endSession}
        />
      );

    case "overtime":
      return (
        <Overtime
          overTimeStartMillis={appState.overTimeStartMillis}
          endSession={endSession}
        />
      );
    default: {
      const _exhaustiveCheck: never = appState;
      return _exhaustiveCheck;
    }
  }
}

function App() {
  return <FocusTimer />;
}

export default App;
