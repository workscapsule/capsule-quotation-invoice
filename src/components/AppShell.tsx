'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import { Menu, Plus, FileSpreadsheet, Receipt, UserPlus, FolderPlus } from 'lucide-react';
import Link from 'next/link';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col lg:flex-row">
      <Sidebar
        currentUser={currentUser}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#E8E2D9] px-4 py-3 sm:px-6 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-stone-700 hover:bg-stone-100 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-stone-600 font-medium">
              <span className="font-semibold text-stone-800">Capsule Company</span>
            </div>
          </div>

          {/* Quick Create Buttons */}
          <div className="flex items-center gap-2">
            <Link
              href="/quotations/new"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Quotation</span>
            </Link>
            <Link
              href="/invoices/new"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1F2937] hover:bg-black text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Invoice</span>
            </Link>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
