"use client";
import { useState, useEffect } from "react";
import { Poppins } from "next/font/google";
import Image from "next/image";
import { toast, Toaster } from "react-hot-toast";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
interface Pharmacy {
  id: number;
  phar_id: string;
  pharmacy_name: string;
  address?: string;
  functional: boolean;
}

export default function PharmacyRegister() {
  const [time, setTime] = useState("");
  const [deviceId, setDeviceId] = useState<string>("");
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);

  const [formData, setFormData] = useState({
    pharmacy_name: "",
    geo_location: "",
    address: "",
    contact_name: "",
    contact_number: "",
    functional: false,
  });

  // Clock
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setTime(`${hours}:${minutes}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch pharmacies from API
  useEffect(() => {
    async function fetchPharmacies() {
      try {
        const res = await fetch("/api/pharmacies");
        if (res.ok) {
          const data: Pharmacy[] = await res.json();
          setPharmacies(data);
        }
      } catch (err) {
        console.error("Error fetching pharmacies", err);
      }
    }

    fetchPharmacies();
  }, []);

  // UUID fallback (v4-like)
  function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  async function fetchPharmacies() {
    try {
      const res = await fetch("/api/pharmacies");
      if (res.ok) {
        const data = await res.json();
        setPharmacies(data);
      }
    } catch (err) {
      console.error("Error fetching pharmacies", err);
    }
  }

  useEffect(() => {
    fetchPharmacies();
  }, []);
  const handleDelete = async (id: number, name: string, pharId: string) => {
  if (!confirm("Are you sure you want to delete this pharmacy?")) return;

  try {
    const res = await fetch(`/api/pharmacies/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phar_id: pharId }), // send pharId in body
    });

    const data = await res.json();

    if (res.ok) {
      toast.success("Pharmacy deleted successfully!");

      // Clear localStorage if it contains deleted pharmacy
      const storedName = localStorage.getItem("pharmacyName");
      const storedId = localStorage.getItem("pharmacyId");
      if (storedName === name || storedId === pharId) {
        localStorage.removeItem("pharmacyName");
        localStorage.removeItem("pharmacyId");
      }

      // Refresh the list
      fetchPharmacies();
    } else {
      toast.error(data.error || "Failed to delete pharmacy.");
    }
  } catch (err) {
    console.error(err);
    toast.error("Something went wrong.");
  }
};


  // Generate/read deviceId
  useEffect(() => {
    try {
      let id = localStorage.getItem("deviceId");
      if (!id) {
        // Use crypto.randomUUID if available
        const rndUUID =
          typeof crypto?.randomUUID === "function"
            ? crypto.randomUUID()
            : generateUUID();
        id = rndUUID;
        localStorage.setItem("deviceId", id);
      }
      setDeviceId(id);
    } catch (err) {
      console.error(err);
      const id = generateUUID();
      try {
        localStorage.setItem("deviceId", id);
      } catch {
        // fail silently
      }
      setDeviceId(id);
    }
  }, []);


  const today = new Date().toLocaleDateString();

  // Form change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const finalDeviceId = deviceId || generateUUID();

  const payload = {
    ...formData,
    device_id: finalDeviceId,
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.pharmacy_name) {
      toast.error("Pharmacy name is required!");
      return;
    }

    try {
      const res = await fetch("/api/pharmacyinfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {




        toast.success("Pharmacy registered successfully!");
        setFormData({
          pharmacy_name: "",
          geo_location: "",
          address: "",
          contact_name: "",
          contact_number: "",
          functional: false,


        });
      } else {
        toast.error("Failed to register pharmacy.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong.");
    }
    await fetchPharmacies(); // refresh the list without reloading page

  };

  return (
    <div
      className={`relative flex h-screen bg-gray-100 ${poppins.className}`}
    >
      <Toaster position="top-right" />

      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-96">
          <div className="flex justify-center mb-6">
            <Image src="/logo.jpg" alt="Logo" width={100} height={100} />
          </div>
          <h2 className="text-xl font-semibold mb-4">Register Pharmacy</h2>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <input
              type="text"
              name="pharmacy_name"
              placeholder="Pharmacy Name *"
              value={formData.pharmacy_name}
              onChange={handleChange}
              className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              name="geo_location"
              placeholder="Geo Location"
              value={formData.geo_location}
              onChange={handleChange}
              className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
              className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="contact_name"
              placeholder="Contact Name"
              value={formData.contact_name}
              onChange={handleChange}
              className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="contact_number"
              placeholder="Contact Number"
              value={formData.contact_number}
              onChange={handleChange}
              className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="functional"
                checked={formData.functional}
                onChange={handleChange}
                className="w-4 h-4 accent-blue-500"
              />
              Functional
            </label>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 !text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Register
            </button>
            {/* <div className="text-xs text-gray-500 mt-2 break-words">
              Device ID: {deviceId || "initializing..."}
            </div> */}
          </form>
        </div>
      </div>

      {/* Right: Pharmacy list */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white w-full h-full rounded-2xl shadow-lg p-6 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-6 border-b pb-2">
            Registered Pharmacies
          </h2>

          <div className="grid gap-6">
            {pharmacies.length === 0 ? (
              <p className="text-gray-500">No pharmacies registered yet.</p>
            ) : (
              pharmacies.map((pharmacy) => (
                <div
                  key={pharmacy.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white shadow-sm hover:shadow-md transition"
                >
                  {/* Left side */}
                  <div className="flex flex-col w-2/3">
                    <span className="font-medium text-gray-800 text-sm">
                      {pharmacy.pharmacy_name}
                    </span>

                    <span className="text-xs text-gray-500">
                      {pharmacy.address && pharmacy.address.length > 1000
                        ? pharmacy.address.substring(0, 1000) + "..."
                        : pharmacy.address || "No address"}
                    </span>
                  </div>

                  {/* Right side */}
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

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(pharmacy.id, pharmacy.pharmacy_name, pharmacy.phar_id)}
                      className="text-red-500 text-xs px-2 py-0.5 bg-red-100 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>

                  </div>
                </div>

              ))
            )}
          </div>
        </div>
      </div>


      {/* Date + Time */}
      {/*   <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-1 rounded shadow-lg font-mono text-sm">
        {today} {time}
      </div> */}
    </div>
  );
}
