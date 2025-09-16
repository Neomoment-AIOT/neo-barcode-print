"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Counter = {
  id: number;
  counter: number;
  phar_id: number;
};

export default function Home() {
  const [counter, setCounter] = useState<Counter | null>(null);
  const [canNext, setCanNext] = useState(false);
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isInitialLoading, setIsInitialLoading] = useState(true); // for page load
  const [isFetching, setIsFetching] = useState(false); // silent fetch
  const [time, setTime] = useState("");

  useEffect(() => {
    function updateTime() {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setTime(`${hours}:${minutes}`);
    }

    updateTime(); // initial call
    const interval = setInterval(updateTime, 1000 * 60); // update every minute

    return () => clearInterval(interval);
  }, []);

  const today = new Date().toLocaleDateString(); // e.g., "9/9/2025"
  const router = useRouter();
  async function markServed(id: number) {
    await fetch(`/api/counter/${id}`, { method: "PUT" });
    setCanNext(true); // enable Next button
  }
  async function handleNext() {
    setCanNext(false);

    if (counter) {
      await fetch(`/api/counter/next/${counter.id}`, { method: "PUT" });
    }

    await fetchCounter(true); // silent fetch, no spinner
  }

  useEffect(() => {
    const id = localStorage.getItem("pharmacyId");
    setPharmacyId(id);
  }, []);

  async function fetchCounter(silent = false) {
    if (!pharmacyId) return;

    if (!silent) setIsInitialLoading(true);
    if (silent) setIsFetching(true);

    try {
      const res = await fetch(`/api/counter?pharmacyId=${pharmacyId}`, { cache: "no-store" });
      const data: Counter | null = await res.json();

      setCounter(data);
      setCanNext(false);
    } catch (err) {
      console.error(err);
      setCounter(null);
    } finally {
      if (!silent) setIsInitialLoading(false);
      if (silent) setIsFetching(false);
    }
  }

  async function fetchCounterJUST() {
    if (!pharmacyId) return;

    setIsLoading(true);
    const res = await fetch(`/api/counter?pharmacyId=${pharmacyId}`, {
      cache: "no-store",
    });
    const data: Counter | null = await res.json();

    if (data) {
      // setCounter(data);
      setCanNext(false);
      setIsLoading(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      setCounter(null);
      setCanNext(false);
      setIsLoading(false);
      if (!intervalRef.current) {
        intervalRef.current = setInterval(fetchCounter, 5000);
      }
    }
  }

  useEffect(() => {
    fetchCounter();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [pharmacyId]);

  const translations = {
    en: {
      counterNumber: "Counter Number",
      served: "Served",
      next: "Next",
      noData: "No unserved Bar Code",
      loading: "Loading...",
      back: "← Back",
    },
    ar: {
      counterNumber: "رقم العداد",
      served: "تم الخدمة",
      next: "التالي",
      noData: "لا توجد أكواد غير مخدومة",
      loading: "جارٍ التحميل...",
      back: "← رجوع",
    },
  };
  const [pharmacyName, setPharmacyName] = useState<string | null>(null);

  useEffect(() => {
    const name = localStorage.getItem("pharmacyName");
    setPharmacyName(name);
  }, []);
  const t = translations[language];

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 relative">
      {/* Top-center pharmacy name */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-gray-800 !text-white rounded-lg font-semibold shadow-lg">
        {pharmacyName || "No pharmacy selected"}
      </div>


      {/* Back button */}
      <button
        onClick={() => router.push("/landing")}
        className="absolute top-4 left-4 px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition text-sm font-semibold"
      >
        {t.back}
      </button>

      {/* Language toggle */}
      <div className="absolute top-4 right-4">
        <div
          onClick={() => setLanguage(language === "en" ? "ar" : "en")}
          className="w-20 h-10 flex items-center bg-gray-300 rounded-full p-1 cursor-pointer transition"
        >
          <div
            className={`w-8 h-8 flex items-center justify-center rounded-full bg-white shadow-md transform transition-transform duration-300 ${language === "ar" ? "translate-x-10" : "translate-x-0"
              }`}
          >
            {language === "en" ? "EN" : "ع"}
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center w-96 min-h-[300px] flex flex-col items-center justify-center">
        {isInitialLoading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600 font-medium">{t.loading}</p>
          </div>
        ) : counter ? (
          <>
            <div className="flex justify-center mb-6">
              <Image src="/logo.jpg" alt="Company Logo" width={130} height={130} />
            </div>
            <h1 className="text-xl font-bold mb-6">
              {t.counterNumber} {counter.counter}
            </h1>
            <div className="flex gap-6 justify-center mt-4">
              <button
                onClick={() => markServed(counter.id)}
                disabled={canNext}
                className={`px-6 py-2 rounded-lg text-white transition ${canNext
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-600"
                  }`}
              >
                {t.served}
              </button>
              <button
                onClick={handleNext}
                disabled={!canNext}
                className={`px-6 py-2 rounded-lg text-white transition ${canNext
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-gray-400 cursor-not-allowed"
                  }`}
              >
                {t.next}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <Image src="/logo.jpg" alt="Company Logo" width={120} height={120} />
            </div>
            <p className="text-gray-600 mb-6">{t.noData}</p>
          </>
        )}
      </div>
      <div className="fixed bottom-4 right-4 bg-gray-800 !text-white px-3 py-1 rounded shadow-lg font-mono text-sm">
        {today} {time}
      </div>
    </div>
  );
}
