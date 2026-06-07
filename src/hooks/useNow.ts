import { useState, useEffect } from "react";
import { setInterval, clearInterval } from "worker-timers";

export function useNow(intervalMs: number = 500) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return now;
}
