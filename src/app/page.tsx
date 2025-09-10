"use client";

import { useEffect, useState } from "react";
import { Poppins } from "next/font/google";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDeviceId } from "../utils/useDeviceId";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export default function LandingPage() {
  const [time, setTime] = useState("");
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [pharmacyName, setPharmacyName] = useState<string | null>(null);
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

  // Load from localStorage or fetch
  useEffect(() => {
    const storedId = localStorage.getItem("pharmacyId");
    const storedName = localStorage.getItem("pharmacyName");

    if (storedId && storedName) {
      setPharmacyId(storedId);
      setPharmacyName(storedName);
      console.log("✅ Using localStorage values", storedId, storedName);
    } else if (deviceId) {
      fetchPharmacyData(deviceId);
    }
  }, [deviceId]);

  async function fetchPharmacyData(deviceId: string) {
    try {
      const res = await fetch(`/api/getPharmacyId?deviceId=${deviceId}`);
      const data = await res.json();
      console.log("🌐 Fetched pharmacy data:", data);

      if (data.success && data.phar_id && data.phar_name) {
        const pharIdStr = data.phar_id.toString();
        localStorage.setItem("pharmacyId", pharIdStr);
        localStorage.setItem("pharmacyName", data.phar_name);

        setPharmacyId(pharIdStr);
        setPharmacyName(data.phar_name);

        console.log("✅ State updated, buttons enabled, name shown");
      } else {
        localStorage.removeItem("pharmacyId");
        localStorage.removeItem("pharmacyName");
        setPharmacyId(null);
        setPharmacyName(null);
      }
    } catch (err) {
      console.error("❌ Error fetching pharmacy data", err);
      localStorage.removeItem("pharmacyId");
      localStorage.removeItem("pharmacyName");
      setPharmacyId(null);
      setPharmacyName(null);
    }
  }

  const isDisabled = !pharmacyId;
  const today = new Date().toLocaleDateString();

  return (
    <div
      className={`relative flex h-screen items-center justify-center bg-gray-100 ${poppins.className}`}
    >
      {/* Top-center pharmacy name */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-gray-800 !text-white rounded-lg font-semibold shadow-lg">
        {pharmacyName || "No pharmacy selected"}
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-lg text-center w-96">
        <div className="flex justify-center mb-6">
          <Image src="/logo.jpg" alt="Company Logo" width={120} height={120} />
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={() => router.push("/patient")}
            disabled={isDisabled}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              isDisabled
                ? "bg-blue-300 cursor-not-allowed !text-white"
                : "bg-blue-500 hover:bg-blue-600 !text-white"
            }`}
          >
            Patient
          </button>

          <button
            onClick={() => router.push("/pharmacy")}
            disabled={isDisabled}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              isDisabled
                ? "bg-green-300 cursor-not-allowed !text-white"
                : "bg-green-500 hover:bg-green-600 !text-white"
            }`}
          >
            Pharmacy
          </button>

          <button
            onClick={() => router.push("/setup")}
            className="px-6 py-3 rounded-lg bg-gray-700 !text-white font-semibold hover:bg-gray-900 transition"
          >
            Setup
          </button>
        </div>
      </div>

      <div className="fixed bottom-4 right-4 bg-gray-800 !text-white px-3 py-1 rounded shadow-lg font-mono text-sm">
        {today} {time}
      </div>
    </div>
  );
}
