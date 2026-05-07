export function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const mins = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (safeSeconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export function millisToSecondsCeil(millis: number) {
  return Math.ceil(millis / 1000);
}

export function millisToSecondsFloor(millis: number) {
  return Math.floor(millis / 1000);
}

export type History = {
  endTimeMillis: number;
  focusedSeconds: number;
}[];

export function addSession(endTimeMillis: number, focusedMillis: number) {
  const historyString = localStorage.getItem("history");
  const history = historyString ? (JSON.parse(historyString) as History) : [];

  history.push({
    endTimeMillis,
    focusedSeconds: millisToSecondsFloor(focusedMillis),
  });
  localStorage.setItem("history", JSON.stringify(history));
}
