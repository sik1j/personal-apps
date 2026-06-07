import { useState, useCallback } from "react";

export function useNotifications() {
  const [permission, setPermission] = useState(Notification.permission);

  const requestPermission = useCallback(async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const notify = useCallback((title: string, options?: NotificationOptions) => {
    if (Notification.permission === "granted") {
      new Notification(title, options);
    }
  }, []);

  return { permission, requestPermission, notify };
}
