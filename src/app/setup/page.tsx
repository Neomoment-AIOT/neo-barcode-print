"use client";

import { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";

export default function PharmacySelector() {
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [selectedPharmacy, setSelectedPharmacy] = useState<{ phar_id: number; pharmacy_name: string } | null>(null);

  // Fetch pharmacies from API
  useEffect(() => {
    async function fetchPharmacies() {
      try {
        const res = await fetch("/api/pharmacies"); // your API route
        if (res.ok) {
          const data = await res.json();
          setPharmacies(data);
        }
      } catch (err) {
        console.error("Error fetching pharmacies", err);
      }
    }
    fetchPharmacies();
  }, []);

  const handleSelect = (pharmacy: { phar_id: number; pharmacy_name: string }) => {
    setSelectedPharmacy(pharmacy);
  };

  const linkSelectedPharmacy = () => {
    if (!selectedPharmacy) return toast.error("No pharmacy selected!");

    localStorage.setItem("pharmacyId", selectedPharmacy.phar_id.toString());
    localStorage.setItem("pharmacyName", selectedPharmacy.pharmacy_name);

    toast.success("Linked selected pharmacy!");
  };

  return (<div className="relative flex flex-col bg-white w-full h-full rounded-2xl shadow-lg p-6 overflow-y-auto">
    <Toaster position="top-right" />

    {/* Top buttons: Back & Link */}
    <div className="flex justify-between mb-4 sticky top-0 bg-white z-10 p-2">
      {/* Back button */}
      <button
        onClick={() => history.back()}
        className="px-4 py-2 rounded-lg font-semibold bg-gray-300 text-gray-700 hover:bg-gray-400 transition"
      >
        Back
      </button>

      {/* Link Selected Pharmacy */}
      <button
        onClick={linkSelectedPharmacy}
        disabled={!selectedPharmacy}
        className={`px-4 py-2 rounded-lg font-semibold transition ${selectedPharmacy
            ? "bg-blue-500 hover:bg-blue-600 text-white"
            : "bg-gray-300 text-gray-600 cursor-not-allowed"
          }`}
      >
        Link Selected Pharmacy
      </button>
    </div>

    <h2 className="text-xl font-semibold mb-4 border-b pb-2">
      Registered Pharmacies
    </h2>

    <div className="grid gap-4">
      {pharmacies.length === 0 ? (
        <p className="text-gray-500">No pharmacies registered yet.</p>
      ) : (
        pharmacies.map((pharmacy) => {
          const isSelected = selectedPharmacy?.phar_id === pharmacy.phar_id;
          return (
            <div
              key={pharmacy.id}
              onClick={() =>
                handleSelect({
                  phar_id: pharmacy.phar_id,
                  pharmacy_name: pharmacy.pharmacy_name,
                })
              }
              className={`flex items-center justify-between p-3 rounded-lg shadow-sm transition cursor-pointer ${isSelected
                  ? "bg-blue-100 border border-blue-400"
                  : "bg-white hover:shadow-md"
                }`}
            >
              {/* Left: Name & Address */}
              <div className="flex flex-col w-2/3">
                <span className="font-medium text-gray-800 text-sm">
                  {pharmacy.pharmacy_name}
                </span>
                <span className="text-xs text-gray-500">
                  {pharmacy.address || "No address"}
                </span>
              </div>

              {/* Right: Info */}
              <div className="flex flex-col items-end gap-1 w-1/3">
                <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded whitespace-nowrap">
                  ID: {pharmacy.phar_id}
                </span>
                {pharmacy.functional ? (
                  <span className="text-[10px] font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded whitespace-nowrap">
                    ✔ Functional
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-red-700 bg-red-100 px-2 py-0.5 rounded whitespace-nowrap">
                    ✘ Not Functional
                  </span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  </div>
  );
}
