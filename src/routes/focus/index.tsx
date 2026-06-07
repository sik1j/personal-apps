import { useEffect, useState } from "react";
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
import { useNotifications } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";
import { millisToSecondsCeil, millisToSecondsFloor } from "./-utils";
import { formatTimeMMSS } from "./-utils";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { useFocusStore } from "./-store";
import { useSound } from "use-sound";
import halfLifeAlarm from "./-half-life-alarm.mp3";

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
      {formatTimeMMSS(timeSeconds)}
    </div>
  );
}

type ComboboxItem = {
  value: string;
  creatable: boolean;
};

function TagCombobox() {
  const selectableTags = useFocusStore((state) => state.selectableTags);
  const currentTag = useFocusStore((state) => state.currentTag);
  const addSelectableTag = useFocusStore((state) => state.addSelectableTag);
  const setCurrentTag = useFocusStore((state) => state.setCurrentTag);

  const [query, setQuery] = useState(currentTag ?? "");
  const trimmedQuery = query.trim();

  const comboboxValue: ComboboxItem | null = currentTag
    ? {
        value: currentTag,
        creatable: false,
      }
    : null;

  let items: ComboboxItem[] = selectableTags.map((tag) => ({
    value: tag,
    creatable: false,
  }));

  if (trimmedQuery && !selectableTags.includes(trimmedQuery)) {
    items = [
      ...items,
      {
        value: trimmedQuery,
        creatable: true,
      },
    ];
  }

  return (
    <>
      <div>Trimmed Query: {trimmedQuery}</div>
      <div>Query: {query}</div>
      <div>Value: {comboboxValue?.value ?? "No value"}</div>
      <Combobox
        items={items}
        value={comboboxValue}
        onValueChange={(value: ComboboxItem | null) => {
          if (value?.creatable) {
            addSelectableTag(trimmedQuery);
          }
          setCurrentTag(value?.value ?? null);
        }}
        inputValue={query}
        onInputValueChange={(value) => {
          console.log("onInputValueChange", value);
          setQuery(value);
        }}
        autoHighlight
      >
        <ComboboxInput placeholder="Untagged" showClear />
        <ComboboxContent>
          <ComboboxEmpty>Start typing to create a new tag.</ComboboxEmpty>
          <ComboboxList>
            {(item: ComboboxItem) => (
              <ComboboxItem key={item.value} value={item}>
                <Plus className={item.creatable ? "" : "invisible"} />
                {item.value}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </>
  );
}

function SetGoal({ initializeAlarm }: { initializeAlarm: () => void }) {
  const goalSeconds = useFocusStore((state) => state.goalSeconds);
  const setGoalSeconds = useFocusStore((state) => state.setGoalSeconds);
  const startTimer = useFocusStore((state) => state.startTimer);

  setGoalSeconds(60);
  return (
    <div className="flex flex-col items-center gap-10">
      <TagCombobox />
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
        onClick={() => {
          startTimer(Date.now() + goalSeconds * 1000);

          // HACKY: sound is played and insta-paused on button press
          // to 'bless' (let the sound play later with no button press)
          // the audio object by the browser
          initializeAlarm();
        }}
      >
        <Play className="size-8" />
      </Button>
    </div>
  );
}

function Running({
  endAtMillis,
  playAlarm,
}: {
  endAtMillis: number;
  playAlarm: () => void;
}) {
  const now = useNow();
  const { requestPermission, notify } = useNotifications();

  const remainingMillis = Math.max(0, endAtMillis - now);
  const timeRemainingSeconds = millisToSecondsCeil(remainingMillis);

  const pauseTimer = useFocusStore((state) => state.pauseTimer);
  const gotoOvertime = useFocusStore((state) => state.gotoOvertime);
  const endSession = useFocusStore((state) => state.endSession);

  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  useEffect(() => {
    if (timeRemainingSeconds <= 0) {
      notify("⏱️ Session Over!", { body: "The time will keep ticking." });
      gotoOvertime(endAtMillis);
      playAlarm();
    }
  }, [timeRemainingSeconds, endAtMillis, gotoOvertime, notify]);

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
          onClick={() => {
            resumeTimer(Date.now() + remainingMillis);
          }}
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
  const [playAlarm, { pause: pauseAlarm }] = useSound(halfLifeAlarm, {
    volume: 0.25,
    interrupt: true,
  });
  const state = useFocusStore((state) => state.state);

  let component: React.ReactNode;
  switch (state.status) {
    case "setting-goal":
      component = (
        <SetGoal
          // HACKY: sound is played and insta-paused on button press
          // to 'bless' (let the sound play later with no button press)
          // the audio object by the browser
          initializeAlarm={() => {
            playAlarm();
            pauseAlarm();
          }}
        />
      );
      break;
    case "running":
      component = (
        <Running endAtMillis={state.endAtMillis} playAlarm={playAlarm} />
      );
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
