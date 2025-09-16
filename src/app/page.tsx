"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (data.success) {
      // ✅ save username in localStorage
      localStorage.setItem("username", data.username);
      router.push("/landing");
    } else {
      setError(data.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-2">
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border px-3 py-2"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border px-3 py-2"
      />
      <button
        onClick={handleLogin}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Login
      </button>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
