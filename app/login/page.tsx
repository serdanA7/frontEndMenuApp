"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from "../context/UserContext";

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useUser();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  if (!API_URL) {
    return <div className="p-4 text-red-500">Error: API URL not configured</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
        setError('Email or password incorrect');
        setLoading(false);
        return;
      }
      const data = await res.json();
      login(data.token);
      router.push('/');
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.08)', padding: '2.5rem 2rem', minWidth: 320 }}>
        <h1 style={{ color: '#111', textAlign: 'center', marginBottom: 24 }}>Login</h1>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="email" style={{ color: '#111', display: 'block', marginBottom: 6 }}>Email</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, color: '#111', background: '#fff' }} required />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label htmlFor="password" style={{ color: '#111', display: 'block', marginBottom: 6 }}>Password</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4, color: '#111', background: '#fff' }} required />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px 0', background: '#111', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600, fontSize: 16 }}>{loading ? 'Logging in...' : 'Login'}</button>
        </form>
        {error && (
          <div style={{ marginTop: 18, color: '#fff', background: '#d32f2f', borderRadius: 4, padding: '10px 0', textAlign: 'center', fontWeight: 500, fontSize: 15, boxShadow: '0 2px 8px rgba(211,47,47,0.08)' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage; 