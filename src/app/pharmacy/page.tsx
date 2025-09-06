"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const [counter, setCounter] = useState<any>(null);
  const [canNext, setCanNext] = useState(false);
  const [language, setLanguage] = useState<"en" | "ar">("en");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  async function fetchCounter() {
    const res = await fetch("/api/counter", { cache: "no-store" });
    const data = await res.json();

    if (data) {
      setCounter(data);
      setCanNext(false);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      setCounter(null);
      setCanNext(false);

      if (!intervalRef.current) {
        intervalRef.current = setInterval(fetchCounter, 5000);
      }
    }
  }

  async function markServed(id: number) {
    await fetch(`/api/counter/${id}`, { method: "PUT" });

    const res = await fetch("/api/counter", { cache: "no-store" });
    const data = await res.json();

    if (data) {
      // ✅ Keep showing current served counter, just enable Next
      setCanNext(true);
    } else {
      // ❌ No more unserved → immediately show "No unserved Bar Code"
      setCounter(null);
      setCanNext(false);

      if (!intervalRef.current) {
        intervalRef.current = setInterval(fetchCounter, 5000);
      }
    }
  }


  async function handleNext() {
    setCanNext(false);
    await fetchCounter();
  }

  useEffect(() => {
    fetchCounter();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const translations = {
    en: {
      counterNumber: "Counter Number",
      served: "Served",
      next: "Next",
      noData: "No unserved Bar Code",
      back: "← Back",
    },
    ar: {
      counterNumber: "رقم العداد",
      served: "تم الخدمة",
      next: "التالي",
      noData: "لا توجد أكواد غير مخدومة",
      back: "← رجوع",
    },
  };

  const t = translations[language];

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 relative">
      <button
        onClick={() => router.push("/")}
        className="absolute top-4 left-4 px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition text-sm font-semibold"
      >
        {t.back}
      </button>

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

      <div className="bg-white p-8 rounded-2xl shadow-lg text-center w-96">
        <div className="flex justify-center mb-6">
          <Image src="/logo.jpg" alt="Company Logo" width={120} height={120} />
        </div>

        {counter ? (
          <>
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
  <p className="text-gray-600 mb-6">
    {t.noData}
  </p>
  <div className="flex gap-6 justify-center mt-4">
    {/* your buttons go here */}
  </div>
</>

        )}
      </div>
    </div>
  );
}
