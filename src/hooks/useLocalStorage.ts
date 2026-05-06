import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, defaultValue: T) {
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
