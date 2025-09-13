"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDeviceId } from "../utils/useDeviceId";

export default function LandingPage() {
  const [time, setTime] = useState("");
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [pharmacyName, setPharmacyName] = useState<string | null>(null);
  const [isCounter, setIsCounter] = useState(false); // ✅ toggle state
  const deviceId = useDeviceId();
  const router = useRouter();

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        `${now.getHours().toString().padStart(2, "0")}:${now
          .getMinutes()
          .toString()
          .padStart(2, "0")}`
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Pharmacy verify loop
  useEffect(() => {
    const storedId = localStorage.getItem("pharmacyId");
    const storedName = localStorage.getItem("pharmacyName");

    if (storedId && storedName) {
      verifyPharmacy(storedId, storedName);
      const interval = setInterval(() => {
        verifyPharmacy(storedId, storedName);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [pharmacyId, pharmacyName]);

  useEffect(() => {
    const storedId = localStorage.getItem("pharmacyId");
    const storedName = localStorage.getItem("pharmacyName");
    if (storedId && storedName) {
      setPharmacyId(storedId);
      setPharmacyName(storedName);
    } else if (deviceId) {
      // fetchPharmacyData(deviceId);
    }
  }, [deviceId]);

  async function verifyPharmacy(pharId: string, pharName: string) {
    try {
      const res = await fetch(
        `/api/verifyPharmacy?phar_id=${pharId}&phar_name=${encodeURIComponent(
          pharName
        )}`
      );
      const data = await res.json();

      if (data.exists && data.functional) {
        setPharmacyId(pharId);
        setPharmacyName(pharName);
      } else {
        localStorage.removeItem("pharmacyId");
        localStorage.removeItem("pharmacyName");
        setPharmacyId(null);
        setPharmacyName(null);
      }
    } catch (err) {
      console.error(err);
    }
  }
useEffect(() => {
  if (!deviceId || !pharmacyId) return;

  const fetchStatus = async () => {
    try {
      const res = await fetch(
        `/api/getCounterStatus?device_id=${deviceId}&phar_id=${pharmacyId}`
      );
      const data = await res.json();
      if (data.success) {
        setIsCounter(data.status); // 👈 sync UI with DB
      }
    } catch (err) {
      console.error("Failed to fetch counter status", err);
    }
  };

  // Run when tab is focused again
  const handleFocus = () => fetchStatus();

  window.addEventListener("focus", handleFocus);

  // Also check once when mounted
  fetchStatus();

  return () => {
    window.removeEventListener("focus", handleFocus);
  };
}, [deviceId, pharmacyId]);


  async function updateCounterState(newState: boolean) {
    if (!pharmacyId || !deviceId) return;

    const res = await fetch("/api/updateActiveCounter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        device_id: deviceId,
        phar_id: pharmacyId,
        status: newState, // 👈 send status to backend
      }),
    });

    const data = await res.json();

    if (data.success) {
      if (data.status) {
        // ✅ Active counter: show counter index
        alert(`This device is Counter #${data.counter_index}`);
      } else {
        // ❌ Inactive counter
        alert("This counter has been deactivated");
      }
    } else {
      alert(`Error: ${data.error || "Unknown error"}`);
    }
  }


  // When toggle is changed
  const handleToggle = () => {
    const newState = !isCounter;
    setIsCounter(newState);
    updateCounterState(newState);
  };

  const isDisabled = !pharmacyId;
  const today = new Date().toLocaleDateString();

  return (
    <div className="relative flex h-screen items-center justify-center bg-gray-100">
      {/* ✅ Top-center pharmacy name */}
      {/* ✅ Responsive top bar */}
<div className="absolute top-4 left-0 right-0 px-4 flex flex-col sm:flex-row items-center sm:justify-between gap-2">
  {/* Pharmacy name */}
  <div className="px-3 py-2 bg-gray-800 !text-white rounded-lg font-semibold shadow-md text-center sm:text-left w-full sm:w-auto">
    {pharmacyName || "No pharmacy selected"}
  </div>

  {/* Counter toggle */}
  {pharmacyId && (
    <div className="flex items-center space-x-2">
      <span className="text-gray-800 font-semibold text-sm sm:text-base">
        {isCounter ? "Counter" : "Not Counter"}
      </span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={isCounter}
          onChange={handleToggle}
          className="sr-only peer"
        />
        <div className="w-12 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 transition-colors"></div>
        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform peer-checked:translate-x-6"></div>
      </label>
    </div>
  )}
</div>

      <div className="bg-white p-8 rounded-2xl shadow-lg text-center w-96">
        <div className="flex justify-center mb-6">
          <Image src="/logo.jpg" alt="Company Logo" width={120} height={120} />
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => router.push("/patient")}
            disabled={isDisabled}
            className={`px-6 py-3 rounded-lg font-semibold transition ${isDisabled
              ? "bg-blue-300 cursor-not-allowed !text-white"
              : "bg-blue-500 hover:bg-blue-600 !text-white"
              }`}
          >
            Patient
          </button>

          <button
            onClick={() => router.push("/pharmacy")}
            disabled={isDisabled}
            className={`px-6 py-3 rounded-lg font-semibold transition ${isDisabled
              ? "bg-green-300 cursor-not-allowed !text-white"
              : "bg-green-500 hover:bg-green-600 !text-white"
              }`}
          >
            Pharmacy
          </button>

          <button
            onClick={() => router.push("/tokenmoniter")}
            disabled={isDisabled}
            className={`px-6 py-3 rounded-lg font-semibold transition ${isDisabled
              ? "bg-green-300 cursor-not-allowed !text-white"
              : "bg-green-500 hover:bg-green-600 !text-white"
              }`}
          >
            Display
          </button>

          <button
            onClick={() => router.push("/setup")}
            className="px-6 py-3 rounded-lg bg-gray-700 !text-white font-semibold hover:bg-gray-900 transition"
          >
            Setup
          </button>
        </div>
      </div>

      {/* Bottom clock */}
      <div className="fixed bottom-4 right-4 bg-gray-800 !text-white px-3 py-1 rounded shadow-lg font-mono text-sm">
        {today} {time}
      </div>
    </div>
  );
}
