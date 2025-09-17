"use client";
import { useState } from "react";
import Image from "next/image";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (data.success) {
      window.location.href = "/landing";
    } else {
      setError(data.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm text-center space-y-6">
        
        {/* Logo */}
        <div className="flex flex-col items-center space-y-2">
          <Image src="/logo.jpg" alt="Logo" width={120} height={120} />
        </div>

        {/* Login Form */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Login</h2>
          <input
            className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            className="w-full border border-gray-300 px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            onClick={handleLogin}
          >
            Login
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      </div>
    </div>
  );
}