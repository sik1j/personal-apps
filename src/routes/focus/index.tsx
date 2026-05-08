import { useCallback, useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createFileRoute } from "@tanstack/react-router";
import { useNow } from "@/hooks/useNow";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { cn } from "@/lib/utils";
import {
  millisToSecondsCeil,
  millisToSecondsFloor,
  addSession,
} from "./-utils";
import { formatTime } from "./-utils";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";

export const Route = createFileRoute("/focus/")({
  component: RouteComponent,
});

type Session =
  | { type: "cancelled"; remainingMillis: number }
  | { type: "overtime"; overTimeFocusedMillis: number };

function TimeDisplay({
  timeSeconds,
  className,
}: {
  timeSeconds: number;
  className?: string;
}) {
  return (
    <div className={cn("tabular-nums tracking-tighter", className)}>
      {formatTime(timeSeconds)}
    </div>
  );
}

function SetGoal({
  startTimer,
  goalSeconds,
  setGoalSeconds,
  tag,
  setTag,
}: {
  startTimer: (endAtMillis: number) => void;
  goalSeconds: number;
  setGoalSeconds: (goalSeconds: number) => void;
  tag: string | null;
  setTag: (tag: string | null) => void;
}) {
  const [tags, setTags] = useLocalStorage<string[]>("tags", []);
  const tagObjects = tags.map((tag) => ({ value: tag, creatable: false }));

  const [query, setQuery] = useState(tag ?? "");
  const [value, setValue] = useState(
    tagObjects.find((obj) => obj.value === tag) ?? null,
  );

  const trimmedQuery = query.trim();
  if (
    trimmedQuery &&
    !tags.some((tag) => tag.toLowerCase() === trimmedQuery.toLowerCase())
  ) {
    tagObjects.push({ value: trimmedQuery, creatable: true });
  }

  return (
    <div className="flex flex-col items-center gap-10">
      <div>value: {value?.value}</div>
      <div>query: {query}</div>
      <Combobox
        items={tagObjects}
        itemToStringValue={(item) => item.value}
        value={value}
        onValueChange={(value) => {
          if (value?.creatable) {
            setTags((prev) => [...prev, trimmedQuery]);
          }

          setValue(value);
          setTag(value ? value.value : null);
        }}
        inputValue={query}
        onInputValueChange={setQuery}
        autoHighlight
      >
        <ComboboxInput placeholder="Untagged" showClear />
        <ComboboxContent>
          <ComboboxEmpty>Start typing to create a new tag.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={item.value} value={item}>
                {item.creatable ? <Plus /> : null} {item.value}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      <div className="flex items-center gap-6">
        <Button
          variant="ghost"
          size="icon"
          className="size-16 rounded-full text-muted-foreground hover:text-foreground"
          onClick={() => setGoalSeconds(Math.max(0, goalSeconds - 5 * 60))}
        >
          <ChevronLeft className="size-10" />
        </Button>

        <TimeDisplay
          timeSeconds={goalSeconds}
          className="text-8xl font-bold md:text-[10rem]"
        />

        <Button
          variant="ghost"
          size="icon"
          className="size-16 rounded-full text-muted-foreground hover:text-foreground"
          onClick={() => setGoalSeconds(goalSeconds + 5 * 60)}
        >
          <ChevronRight className="size-10" />
        </Button>
      </div>

      <Button
        size="lg"
        className="size-16 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
        onClick={() => startTimer(Date.now() + goalSeconds * 1000)}
      >
        <Play className="size-8" />
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
    <div className="flex flex-col items-center gap-10">
      <TimeDisplay
        timeSeconds={timeRemainingSeconds}
        className="text-8xl font-bold md:text-[10rem]"
      />

      <div className="flex gap-6">
        <Button
          variant="outline"
          size="lg"
          className="size-16 rounded-full border-2"
          onClick={() => pauseTimer(Math.max(0, endAtMillis - Date.now()))}
        >
          <Pause className="size-8" />
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="size-16 rounded-full border-2"
          onClick={() =>
            endSession({
              type: "cancelled",
              remainingMillis: Math.max(0, endAtMillis - Date.now()),
            })
          }
        >
          <X className="size-8" />
        </Button>
      </div>
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
    <div className="flex flex-col items-center gap-10">
      <TimeDisplay
        timeSeconds={millisToSecondsCeil(remainingMillis)}
        className="text-8xl font-bold opacity-50 md:text-[10rem]"
      />

      <div className="flex gap-6">
        <Button
          variant="default"
          size="lg"
          className="size-16 rounded-full shadow-md"
          onClick={() => resumeTimer(Date.now() + remainingMillis)}
        >
          <Play className="size-8" />
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="size-16 rounded-full border-2"
          onClick={() =>
            endSession({ type: "cancelled", remainingMillis: remainingMillis })
          }
        >
          <X className="size-8" />
        </Button>
      </div>
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
  useNow();

  return (
    <div className="flex flex-col items-center gap-10">
      <div className="relative flex items-center justify-center">
        <span className="absolute right-full mr-2 text-6xl font-bold md:text-8xl">
          +
        </span>
        <TimeDisplay
          timeSeconds={millisToSecondsFloor(Date.now() - overTimeStartMillis)}
          className="text-8xl font-bold md:text-[10rem]"
        />
      </div>
      <Button
        size="lg"
        className="size-16 rounded-full shadow-lg bg-primary text-primary-foreground transition-transform hover:scale-105 hover:bg-primary/90 active:scale-95"
        onClick={() =>
          endSession({
            type: "overtime",
            overTimeFocusedMillis: Date.now() - overTimeStartMillis,
          })
        }
      >
        <Check className="size-8" />
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
  const [appState, setAppState] = useLocalStorage<TimerState>("appState", {
    status: "setting-goal",
  });

  const [goalSeconds, setGoalSeconds] = useLocalStorage("goalSeconds", 25 * 60);
  const [tag, setTag] = useLocalStorage<string | null>("tag", null);

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
        const _exhaustive: never = session;
        return _exhaustive;
      }
    }

    addSession(Date.now(), focusedMillis, tag);

    setAppState({
      status: "setting-goal",
    });

    console.log("focusedSeconds", millisToSecondsFloor(focusedMillis));
    return focusedMillis;
  }

  let content;
  switch (appState.status) {
    case "setting-goal":
      content = (
        <SetGoal
          goalSeconds={goalSeconds}
          setGoalSeconds={setGoalSeconds}
          tag={tag}
          setTag={setTag}
          startTimer={(endAtMillis) => {
            setAppState({
              status: "running",
              endAtMillis: endAtMillis,
            });
          }}
        />
      );
      break;
    case "running":
      content = (
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
      break;
    case "paused":
      content = (
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
      break;
    case "overtime":
      content = (
        <Overtime
          overTimeStartMillis={appState.overTimeStartMillis}
          endSession={endSession}
        />
      );
      break;
    default:
      return appState satisfies never;
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6">
      {content}
    </div>
  );
}

function RouteComponent() {
  return <FocusTimer />;
}
