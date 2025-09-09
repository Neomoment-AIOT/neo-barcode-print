"use client";
import { useEffect, useState } from "react";
import { Poppins } from "next/font/google";
import Image from "next/image";
import { useRouter } from "next/navigation";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export default function LandingPage() {
  const [time, setTime] = useState("");

  useEffect(() => {
    function updateTime() {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setTime(`${hours}:${minutes}`);
    }

    updateTime(); // initial call

    const interval = setInterval(updateTime, 1000); // check every second for minute change

    return () => clearInterval(interval);
  }, []);

  const today = new Date().toLocaleDateString();
  const router = useRouter();
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("pharmacyId"); // ✅ read from localStorage
    setPharmacyId(id);
  }, []);

  return (
    <div className={`relative flex h-screen items-center justify-center bg-gray-100 ${poppins.className}`}>
      {/* Pharmacy ID top-right */}
      {pharmacyId && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-lg bg-yellow-200 text-gray-800 font-semibold shadow-md">
          Pharmacy ID: <span className="font-semibold text-blue-600">{pharmacyId}</span>
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl shadow-lg text-center w-96">
        {/* Logo / Image */}
        <div className="flex justify-center mb-6">
          <Image src="/logo.jpg" alt="Company Logo" width={120} height={120} />
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-4">
          <button
            onClick={() => router.push("/patient")}
            className="px-6 py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition"
          >
            Patient
          </button>

          <button
            onClick={() => router.push("/pharmacy")}
            className="px-6 py-3 rounded-lg bg-green-500 text-white font-semibold hover:bg-green-600 transition"
          >
            Pharmacy
          </button>
        </div>
      </div>
       <div className="fixed bottom-4 right-4 bg-gray-800 !text-white px-3 py-1 rounded shadow-lg font-mono text-sm">
        {today} {time}
      </div>
    </div>
  );
}
