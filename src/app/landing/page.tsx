"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";


export default function LandingPage() {
  const [time, setTime] = useState("");
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    function updateTime() {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setTime(`${hours}:${minutes}`);
    }
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function fetchPharmacyId() {
      try {
        const res = await fetch("/api/getPharmacyId");
        const data = await res.json();

        if (data.success && data.phar_id) {
          localStorage.setItem("pharmacyId", data.phar_id.toString());
          setPharmacyId(data.phar_id.toString());
        } else {
          setPharmacyId(null);
        }
      } catch (err) {
        console.error("Error fetching pharmacy ID", err);
        setPharmacyId(null);
      }
    }

    fetchPharmacyId();
  }, []);

  const isDisabled = !pharmacyId;
  const today = new Date().toLocaleDateString();

  return (
    <div className={`relative flex h-screen items-center justify-center bg-gray-100`}>
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center w-96">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image src="/logo.jpg" alt="Company Logo" width={120} height={120} />
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => router.push("/patient")}
            disabled={isDisabled}
            className={`px-6 py-3 rounded-lg font-semibold transition 
              ${isDisabled 
                ? "bg-blue-300 cursor-not-allowed text-white" 
                : "bg-blue-500 hover:bg-blue-600 text-white"}`}
          >
            Patient
          </button>

          <button
            onClick={() => router.push("/pharmacy")}
            disabled={isDisabled}
            className={`px-6 py-3 rounded-lg font-semibold transition 
              ${isDisabled 
                ? "bg-green-300 cursor-not-allowed text-white" 
                : "bg-green-500 hover:bg-green-600 text-white"}`}
          >
            Pharmacy
          </button>

          <button
            onClick={() => router.push("/setup")}
            className="px-6 py-3 rounded-lg bg-gray-700 text-white font-semibold hover:bg-gray-900 transition"
          >
            Setup
          </button>
        </div>
      </div>

      <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-1 rounded shadow-lg font-mono text-sm">
        {today} {time}
      </div>
    </div>
  );
}
