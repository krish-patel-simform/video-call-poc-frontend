import { useState, useEffect } from "react";

export function useClock(): string {
  const [currentTime, setCurrentTime] = useState<string>("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
          " • " +
          now.toLocaleDateString([], {
            weekday: "short",
            month: "short",
            day: "numeric",
          }),
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return currentTime;
}
