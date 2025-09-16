"use client";
import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
interface TokenData {
  lastServed?: { counter: string };
  currentUnserved?: { counter: string };
  nextUnserved?: { counter: string };
  avgServeTime?: number | null;
  avgNextGap?: number | null;
}

export default function TokenMonitorPage() {
  const [data, setData] = useState<TokenData | null>(null);
  const [lang, setLang] = useState<"en" | "ar">("en");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load available voices
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const loadVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);
  // 🕒 Format time
  const formatAvgTime = (seconds: number | null | undefined) => {
    if (seconds == null) return "—";
    if (seconds < 60) return `${Math.round(seconds)} sec`;
    const mins = Math.floor(seconds / 60);
    return `${mins} min`;
  };

  // 🗣️ Speak text (English only)
  const speak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;

      // Always pick English voice if available
      const voice = voices.find((v) => v.lang.startsWith("en")) || null;
      if (voice) utterance.voice = voice;

      utterance.lang = "en-US";
      window.speechSynthesis.speak(utterance);
    }
  };

  // 🔄 Fetch token data every 5s
  // inside useEffect
  useEffect(() => {
    const fetchData = async () => {
      const pharmacyId = localStorage.getItem("pharmacyId");
      if (!pharmacyId) return;

      const res = await fetch(`/api/token-monitor?pharmacyId=${pharmacyId}`);
      const json: TokenData = await res.json();
      setData(json);
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);
 const router = useRouter();
  useEffect(() => {
    const username = localStorage.getItem("username");
    if (!username) {
      router.push("/"); // go back to login
    }
  }, [router]);

  // 🔔 Speak every 2s in selected language
  useEffect(() => {
    if (!data?.currentUnserved?.counter) return;
    const text = `The current token is ${data.currentUnserved.counter}`;

    speak(text);
    const interval = setInterval(() => {
      speak(text);
    }, 20000);
    return () => clearInterval(interval);
  }, [data?.currentUnserved?.counter, lang, voices]);

  if (!data) return <div className="text-4xl p-10">Loading...</div>;

  return (
    <div
      className={`relative flex flex-col items-start justify-center min-h-screen bg-black space-y-8 ${lang === "ar" ? "text-right" : ""
        }`}
      dir={lang === "ar" ? "rtl" : "ltr"} // 👉 switch text direction
    >
      {/* 🌍 Language Toggle Switch */}
      <div className="absolute top-4 right-4 flex items-center space-x-3">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={lang === "ar"}
            onChange={() => setLang(lang === "en" ? "ar" : "en")}
          />
          <div className="w-14 h-8 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 transition-colors"></div>
          <div className="absolute left-1 top-1 w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold transition-transform peer-checked:translate-x-6">
            {lang === "en" ? "EN" : "AR"}
          </div>
        </label>
      </div>



      <div className="text-7xl font-bold !text-white mx-4">
        {lang === "ar" ? "آخر رقم:" : "Last Token:"}{" "}
        <span className="!text-red-400">
          {data.lastServed ? data.lastServed.counter : "—"}
        </span>
      </div>
      <div className="text-9xl font-bold !text-white mx-4">
        {lang === "ar" ? "الرقم الحالي:" : "Current Token:"}{" "}
        <span className="!text-yellow-400">
          {data.currentUnserved ? data.currentUnserved.counter : "—"}
        </span>
      </div>
      <div className="text-7xl font-bold !text-white mx-4">
        {lang === "ar" ? "الرقم التالي:" : "Next Token:"}{" "}
        <span className="!text-blue-400">
          {data.nextUnserved ? data.nextUnserved.counter : "—"}
        </span>
      </div>
      <div className="text-7xl font-bold !text-white mx-4">
        {lang === "ar" ? "متوسط وقت الخدمة:" : "Avg Serve Time:"}{" "}
        <span className="!text-green-400">{formatAvgTime(data.avgServeTime)}</span>
      </div>

      <div className="text-7xl font-bold !text-white mx-4">
        {lang === "ar" ? "متوسط وقت الكاونتر:" : "Avg Counter Time:"}{" "}
        <span className="!text-purple-400">{formatAvgTime(data.avgNextGap)}</span>
      </div>

    </div>
  );
}
