'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Tags,
  FileText,
  Receipt,
  CreditCard,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
  X,
  FileSpreadsheet
} from 'lucide-react';

interface SidebarProps {
  currentUser?: {
    name: string;
    email: string;
    role: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ currentUser, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Projects', href: '/projects', icon: FolderKanban },
    { name: 'Categories', href: '/categories', icon: Tags },
    { name: 'Quotations', href: '/quotations', icon: FileSpreadsheet },
    { name: 'Invoices', href: '/invoices', icon: Receipt },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  if (currentUser?.role === 'ADMIN') {
    navItems.push({ name: 'Users', href: '/users', icon: ShieldCheck });
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#171514] text-white flex flex-col border-r border-[#2C2825] transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 border-b border-[#2C2825] flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-lg bg-white p-1 flex items-center justify-center shadow-md overflow-hidden transition-transform group-hover:scale-105">
              <img
                src="/capsule-logo.png"
                alt="Capsule Company Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-bold tracking-wider text-base text-white block uppercase">
                Capsule Company
              </span>
              <span className="text-[10px] tracking-widest text-[#C88A6E] block font-semibold uppercase">
                Your Space Maker
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-stone-400 hover:text-white hover:bg-stone-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
            Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#C88A6E] text-white shadow-sm font-semibold'
                    : 'text-stone-300 hover:bg-[#25221F] hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* User Profile & Logout */}
        <div className="p-3 border-t border-[#2C2825] bg-[#131110]">
          <div className="flex items-center justify-between p-2 rounded-lg bg-[#201D1A]">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-[#C88A6E] text-white font-bold flex items-center justify-center text-xs shrink-0">
                {currentUser?.name?.[0] || 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">
                  {currentUser?.name || 'Capsule User'}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="text-[10px] text-stone-400 uppercase font-semibold">
                    {currentUser?.role || 'STAFF'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-stone-800 rounded transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
