"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { toast, Toaster } from "react-hot-toast";
import { useDeviceId } from "../../../utils/useDeviceId";


interface Pharmacy {
  id: number;
  phar_id: string;
  pharmacy_name: string;
  address?: string;
  functional: boolean;
  geo_location?: string;
  contact_name?: string;
  contact_number?: string;
  number_of_counters?: number;
}

export default function PharmacyRegister() {
  const [time, setTime] = useState("");
  const deviceId = useDeviceId();

  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    pharmacy_name: "",
    geo_location: "",
    address: "",
    contact_name: "",
    contact_number: "",
    functional: false,
    number_of_counters: "" as string | number,  // 👈 empty by default
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
      const res = await fetch(`/api/newdelete/deletepharmacy/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phar_id: pharId }),
      });

      const data = await res.json();

      if (res.ok) {

        toast.success("Pharmacy deleted successfully!");
        fetchPharmacies();
      } else {
        toast.error(data.error || "Failed to delete pharmacy.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong.");
    }
  };

  const today = new Date().toLocaleDateString();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter pharmacies
  const filteredPharmacies = pharmacies.filter((p) =>
    p.pharmacy_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.pharmacy_name) {
      toast.error("Pharmacy name is required!");
      return;
    }

    try {
      if (selectedPharmacyId) {
        // UPDATE existing pharmacy
        const res = await fetch(`/api/pharmaciesupdate/${selectedPharmacyId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });


        if (res.ok) {
          toast.success("Pharmacy updated successfully!");
          // ✅ Clear localStorage if updated pharmacy is the one stored
          const storedPharmacyId = localStorage.getItem("pharmacyId");
          if (storedPharmacyId && Number(storedPharmacyId) === selectedPharmacyId) {
            {
              localStorage.removeItem("pharmacyId");
              localStorage.removeItem("pharmacyName");
            }
          }
          setSelectedPharmacyId(null);

        } else {
          toast.error("Failed to update pharmacy.");
        }
      } else {
        // CREATE new pharmacy
        const res = await fetch("/api/pharmacyinfo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, device_id: deviceId }),
        });

        if (res.ok) {
          toast.success("Pharmacy registered successfully!");
        } else {
          toast.error("Failed to register pharmacy.");
        }
      }

      // Reset form
      setFormData({
        pharmacy_name: "",
        geo_location: "",
        address: "",
        contact_name: "",
        contact_number: "",
        functional: false,
        number_of_counters: 1
      });

      fetchPharmacies();
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong.");
    }
  };

  const handleUpdateClick = (pharmacy: Pharmacy) => {
    setSelectedPharmacyId(parseInt(pharmacy.phar_id));
    setFormData({
      pharmacy_name: pharmacy.pharmacy_name,
      geo_location: pharmacy.geo_location || "",
      address: pharmacy.address || "",
      contact_name: pharmacy.contact_name || "",
      contact_number: pharmacy.contact_number || "",
      functional: pharmacy.functional,
      number_of_counters: pharmacy.number_of_counters ?? 1, // ✅ default to 1 if undefined
    });
  };


  const handleCancel = () => {
    setSelectedPharmacyId(null);
    setFormData({
      pharmacy_name: "",
      geo_location: "",
      address: "",
      contact_name: "",
      contact_number: "",
      functional: false,
      number_of_counters: 1,
    });
    fetchPharmacies();
  };

  return (
    <div className={`relative flex h-screen bg-gray-100`}>
      <Toaster position="top-right" />

      {/* Left: Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-96">
          <div className="flex justify-center mb-6">
            <Image src="/logo.jpg" alt="Logo" width={100} height={100} />
          </div>
          <h2 className="text-xl font-semibold mb-4">
            {selectedPharmacyId ? "Update Pharmacy" : "Register Pharmacy"}
          </h2>

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
              Active
            </label>

            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 !text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              {selectedPharmacyId ? "Update" : "Register"}
            </button>

            {selectedPharmacyId && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 bg-gray-400 !text-white rounded-lg font-semibold hover:bg-gray-500 transition"
              >
                Cancel
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Right: Pharmacy list */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white w-full h-full rounded-2xl shadow-lg p-6 overflow-y-auto">
          {/* Header with Search */}
          <div className="flex items-center justify-between mb-6 border-b pb-2">
            <h2 className="text-xl font-semibold">Registered Pharmacies</h2>

            {/* Search Icon */}
            <button
              onClick={() => setShowSearch((prev) => !prev)}
              className="p-2 rounded-full hover:bg-gray-200 transition"
            >
              🔍
            </button>
          </div>

          {/* Animated Search Field */}
          <div
            className={`transition-all duration-300 overflow-hidden ${showSearch ? "max-h-16 mb-4" : "max-h-0 mb-0"
              }`}
          >
            <input
              type="text"
              placeholder="Search pharmacy..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Pharmacy List */}
          <div className="grid gap-6">
            {filteredPharmacies.length === 0 ? (
              <p className="text-gray-500">No pharmacies found.</p>
            ) : (
              filteredPharmacies.map((pharmacy) => (
                <div
                  key={pharmacy.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white shadow-sm hover:shadow-md transition"
                >
                  {/* Left side */}
                  <div className="flex flex-col w-2/3">
                    <span className="font-medium text-gray-800 text-sm flex items-center gap-2">
                      {pharmacy.functional ? (
                        <span className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center text-white text-[8px]">✔</span>
                      ) : (
                        <span className="w-3 h-3 rounded-full bg-red-500 flex items-center justify-center text-white text-[8px]">✘</span>
                      )}
                      {pharmacy.pharmacy_name}
                    </span>

                    <span className="text-xs text-gray-500">
                      {pharmacy.address || "No address"}
                    </span>
                  </div>

                  {/* Right side */}
                  <div className="flex flex-col items-end gap-1 w-1/3">
                    <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded whitespace-nowrap">
                      ID: {pharmacy.phar_id}
                    </span>

                    <button
                      onClick={() => handleUpdateClick(pharmacy)}
                      className="text-blue-500 text-xs px-2 py-0.5 bg-blue-100 rounded hover:bg-blue-200"
                    >
                      Update
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(pharmacy.id, pharmacy.pharmacy_name, pharmacy.phar_id)
                      }
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

    </div>
  );
}
