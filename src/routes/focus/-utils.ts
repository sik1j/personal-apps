export type SessionType =
  | { type: "cancelled"; remainingMillis: number }
  | { type: "overtime"; overTimeFocusedMillis: number };

export function formatTimeMMSS(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const mins = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (safeSeconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}

export function formatTimeHHMM(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const remainingMinutes = Math.floor((totalSeconds % 3600) / 60);
  const minutes = remainingMinutes.toString().padStart(2, "0");
  return `${hours}h:${minutes}m`;
}

export function millisToSecondsCeil(millis: number) {
  return Math.ceil(millis / 1000);
}

export function millisToSecondsFloor(millis: number) {
  return Math.floor(millis / 1000);
}
