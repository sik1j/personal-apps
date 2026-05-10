import { useEffect } from "react";
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
import { millisToSecondsCeil, millisToSecondsFloor } from "./-utils";
import { formatTime } from "./-utils";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useFocusStore } from "./-store";

export const Route = createFileRoute("/focus/")({
  component: RouteComponent,
});

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

function SetGoal() {
  // const [tags, setTags] = useLocalStorage<string[]>("tags", []);
  // const tagObjects = tags.map((tag) => ({ value: tag, creatable: false }));

  // const [query, setQuery] = useState(tag ?? "");
  // const [value, setValue] = useState(
  //   tagObjects.find((obj) => obj.value === tag) ?? null,
  // );

  // const trimmedQuery = query.trim();
  // if (
  //   trimmedQuery &&
  //   !tags.some((tag) => tag.toLowerCase() === trimmedQuery.toLowerCase())
  // ) {
  //   tagObjects.push({ value: trimmedQuery, creatable: true });
  // }

  const goalSeconds = useFocusStore((state) => state.goalSeconds);
  const setGoalSeconds = useFocusStore((state) => state.setGoalSeconds);
  const startTimer = useFocusStore((state) => state.startTimer);

  return (
    <div className="flex flex-col items-center gap-10">
      {/* <div>value: {value?.value}</div>
      <div>query: {query}</div> */}
      {/* <Combobox
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
      </Combobox> */}
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

function Running({ endAtMillis }: { endAtMillis: number }) {
  const now = useNow();
  const remainingMillis = Math.max(0, endAtMillis - now);
  const timeRemainingSeconds = millisToSecondsCeil(remainingMillis);

  const pauseTimer = useFocusStore((state) => state.pauseTimer);
  const gotoOvertime = useFocusStore((state) => state.gotoOvertime);
  const endSession = useFocusStore((state) => state.endSession);

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

function Paused({ remainingMillis }: { remainingMillis: number }) {
  const resumeTimer = useFocusStore((state) => state.resumeTimer);
  const endSession = useFocusStore((state) => state.endSession);

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

function Overtime({ overTimeStartMillis }: { overTimeStartMillis: number }) {
  useNow();
  const endSession = useFocusStore((state) => state.endSession);

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

function RouteComponent() {
  const state = useFocusStore((state) => state.state);

  let component: React.ReactNode;
  switch (state.status) {
    case "setting-goal":
      component = <SetGoal />;
      break;
    case "running":
      component = <Running endAtMillis={state.endAtMillis} />;
      break;
    case "paused":
      component = <Paused remainingMillis={state.timeRemainingMillis} />;
      break;
    case "overtime":
      component = <Overtime overTimeStartMillis={state.endedAtMillis} />;
      break;
    default: {
      const _exhaustive: never = state;
      break;
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6">
      {component}
    </div>
  );
}
