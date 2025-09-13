"use client";
import { useEffect, useState } from "react";

interface TokenData {
  lastServed?: { counter: string };
  currentUnserved?: { counter: string };
  nextUnserved?: { counter: string };
  avgServeTime?: number | null;
  avgNextGap?: number | null;
}

export default function TokenMonitorPage() {
  const [data, setData] = useState<TokenData | null>(null);

  // 🕒 Format time
  const formatAvgTime = (seconds: number | null | undefined) => {
    if (seconds == null) return "—";
    if (seconds < 60) return `${Math.round(seconds)} sec`;
    const mins = Math.floor(seconds / 60);
    return `${mins} min`; // only minutes, no seconds
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/token-monitor");
      const json: TokenData = await res.json();
      setData(json);
      console.log("🔍 Debug API Response:", json);
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <div className="text-4xl p-10">Loading...</div>;

  return (
    <div className="flex flex-col items-start justify-center min-h-screen bg-black space-y-8">
      <div className="text-8xl font-bold !text-white mx-4">
        Last Served Token:{" "}
        <span className="!text-red-400 inline-block break-words max-w-[90vw]">
          {data.lastServed ? data.lastServed.counter : "—"}
        </span>
      </div>
      <div className="text-8xl font-bold !text-white mx-4">
        Current Unserved Token:{" "}
        <span className="!text-yellow-400 inline-block break-words max-w-[90vw]">
          {data.currentUnserved ? data.currentUnserved.counter : "—"}
        </span>
      </div>
      <div className="text-8xl font-bold !text-white mx-4">
        Next Unserved Token:{" "}
        <span className="!text-blue-400 inline-block break-words max-w-[90vw]">
          {data.nextUnserved ? data.nextUnserved.counter : "—"}
        </span>
      </div>
      <div className="text-8xl font-bold !text-white mx-4">
        Avg Serve Time:{" "}
        <span className="!text-green-400 inline-block break-words max-w-[90vw]">
          {formatAvgTime(data.avgServeTime)}
        </span>
      </div>
      <div className="text-8xl font-bold !text-white mx-4">
        Avg Next Gap:{" "}
        <span className="!text-purple-400 inline-block break-words max-w-[90vw]">
          {formatAvgTime(data.avgNextGap)}
        </span>
      </div>
    </div>
  );
}
