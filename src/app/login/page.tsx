'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter email and password');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error logging in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141211] text-stone-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Subtle Rose-Gold Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#C88A6E]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Banner */}
        <div className="text-center space-y-3">
          <div className="inline-block p-3 rounded-2xl bg-white shadow-xl shadow-black/40 border border-stone-800">
            <img
              src="/capsule-logo.png"
              alt="Capsule Logo"
              className="w-16 h-16 object-contain"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-widest uppercase text-white">
              Capsule Company
            </h1>
            <p className="text-xs font-semibold tracking-widest text-[#C88A6E] uppercase">
              Your Space Maker
            </p>
          </div>
          <p className="text-xs text-stone-400">
            Quotation & Tax Invoice Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#1C1A18] border border-[#2D2825] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            <div>
              <label className="block text-stone-300 font-semibold mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
                <input
                  type="email"
                  required
                  placeholder="capsuleoffice@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg bg-[#272320] border border-[#3C3632] p-2.5 pl-9 text-white placeholder-stone-500 focus:outline-hidden focus:border-[#C88A6E] focus:ring-1 focus:ring-[#C88A6E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-300 font-semibold mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg bg-[#272320] border border-[#3C3632] p-2.5 pl-9 text-white placeholder-stone-500 focus:outline-hidden focus:border-[#C88A6E] focus:ring-1 focus:ring-[#C88A6E]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-[#C88A6E] hover:bg-[#B37356] text-white font-bold tracking-wider uppercase text-xs transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#C88A6E]/20 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Login'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-stone-400">
          Capsule Company Interior Design & Quotation Portal © 2026
        </p>
      </div>
    </div>
  );
}
