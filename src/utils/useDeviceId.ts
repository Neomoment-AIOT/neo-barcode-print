"use client";
import { useEffect, useState } from "react";

// UUID fallback (v4-like)
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useDeviceId(): string | null {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    try {
      let id = localStorage.getItem("deviceId");
      if (!id) {
        // Use crypto.randomUUID if available
        const rndUUID = typeof crypto?.randomUUID === "function" 
          ? crypto.randomUUID() 
          : generateUUID();
        id = rndUUID;
        localStorage.setItem("deviceId", id);
      }
      setDeviceId(id);
    } catch (err) {
      console.error(err);
      const id = generateUUID();
      try {
        localStorage.setItem("deviceId", id);
      } catch {
        /* ignore */
      }
      setDeviceId(id);
    }
  }, []);

  return deviceId;
}
