"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

const SignupPage = () => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; color: string } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    if (!API_URL) {
      setNotification({ message: "API URL not configured", color: "red" });
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL.replace(/\/$/, "")}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password_hash: password })
      });
      if (res.ok) {
        setNotification({ message: "Account created! Please log in.", color: "green" });
        setTimeout(() => router.push("/login"), 1500);
      } else {
        const data = await res.json();
        setNotification({ message: data.error || "Signup failed", color: "red" });
      }
    } catch {
      setNotification({ message: "Signup failed. Please try again.", color: "red" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 16px rgba(0,0,0,0.08)", padding: "2.5rem 2rem", minWidth: 320 }}>
        <h1 style={{ color: "#111", textAlign: "center", marginBottom: 24 }}>Sign Up</h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="username" style={{ color: "#111", display: "block", marginBottom: 6 }}>Username</label>
            <input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4, color: "#111", background: "#fff" }} required />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="email" style={{ color: "#111", display: "block", marginBottom: 6 }}>Email</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4, color: "#111", background: "#fff" }} required />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label htmlFor="password" style={{ color: "#111", display: "block", marginBottom: 6 }}>Password</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 4, color: "#111", background: "#fff" }} required />
          </div>
          <button type="submit" disabled={loading} style={{ width: "100%", padding: "10px 0", background: "#111", color: "#fff", border: "none", borderRadius: 4, fontWeight: 600, fontSize: 16 }}>{loading ? "Signing up..." : "Sign Up"}</button>
        </form>
        {notification && (
          <div style={{ marginTop: 18, color: "#fff", background: notification.color, borderRadius: 4, padding: "10px 0", textAlign: "center", fontWeight: 500, fontSize: 15, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
            {notification.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default SignupPage; 