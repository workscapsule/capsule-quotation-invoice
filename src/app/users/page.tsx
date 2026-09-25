'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import UserModal from '@/components/UserModal';
import { ShieldCheck, Plus, Mail, Phone, UserX, UserCheck } from 'lucide-react';
import { formatDate } from '@/lib/formatters';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D9]">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#C88A6E]" />
              <span>User & Role Management</span>
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Admin access control, staff accounts, and quotation/invoice generation permissions
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C88A6E] hover:bg-[#B37356] text-white text-xs font-bold shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add User / Staff</span>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-[#E8E2D9] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E8E2D9] bg-[#FAF7F2] text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4 text-center">Role</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-stone-400">Created Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-stone-400">Loading users...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-stone-400">No users found.</td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">{u.name}</div>
                        <div className="text-[11px] text-stone-500">{u.email}</div>
                      </td>

                      <td className="py-3 px-4 text-stone-600">
                        {u.phone || '-'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {u.isActive ? (
                          <span className="text-emerald-600 font-semibold text-[11px]">Active</span>
                        ) : (
                          <span className="text-stone-400 text-[11px]">Inactive</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                        {formatDate(u.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <UserModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => fetchUsers()}
      />
    </AppShell>
  );
}
