"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function PharmacyLogin() {
  const router = useRouter();
  const [pharmacyId, setPharmacyId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleProceed = async () => {
    if (!pharmacyId.trim()) {
      alert("Please enter Pharmacy ID");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`/api/pharmacy/check?pharmacyId=${pharmacyId}`, {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (res.ok && data.exists) {
        localStorage.setItem("pharmacyId", pharmacyId); // save id
        router.push("/landing");
      }
      else {
        alert("❌ Wrong ID or ID not existing");
      }
    } catch (error) {
      console.error("Error checking pharmacy ID:", error);
      alert("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center w-96">
        <div className="flex justify-center mb-6">
          <Image src="/logo.jpg" alt="Company Logo" width={120} height={120} />
        </div>

        <input
          type="text"
          placeholder="Enter Pharmacy ID"
          value={pharmacyId}
          onChange={(e) => setPharmacyId(e.target.value)}
          className="w-full px-4 py-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <button
          onClick={handleProceed}
          disabled={loading}
          className="w-full px-6 py-3 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
          {loading ? "Checking..." : "Proceed"}
        </button>

      </div>
    </div>
  );
}
