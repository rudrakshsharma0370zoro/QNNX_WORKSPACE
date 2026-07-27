"use client";

import { useState, useEffect, useMemo } from 'react';
import { ShieldCheck, UserCog, User } from 'lucide-react';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { useUsers } from '@/components/AppDataProvider';

export default function AdminRolesPermissionsRBAC() {
  // const [users, setUsers] = useState<any[]>([]);
  const rawUsers = useUsers(); // shared roster — see src/components/AppDataProvider.tsx

  // Same filter/dedupe/sort pipeline as before, now derived from the shared
  // roster in memory instead of re-running on every Firestore snapshot.
  const users = useMemo(() => {
    // Filter out logically deleted users (if a deletedAt or isActive flag exists)
    let usersData = rawUsers.filter((u: any) => !u.deletedAt && u.isActive !== false);

    // Deduplicate by email, keeping the most recently updated record
    const uniqueUsersMap = new Map<string, any>();

    // Sort users by updatedAt descending first, so the most recent is encountered first
    usersData = [...usersData].sort((a: any, b: any) => {
      const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (new Date(a.updatedAt || 0)).getTime();
      const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (new Date(b.updatedAt || 0)).getTime();
      return timeB - timeA;
    });

    usersData.forEach((user: any) => {
      if (!user.email) return;
      const emailLower = user.email.toLowerCase();
      if (!uniqueUsersMap.has(emailLower)) {
        uniqueUsersMap.set(emailLower, user);
      }
    });

    return Array.from(uniqueUsersMap.values());
  }, [rawUsers]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    // Optimistic update
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    try {
      await fetchWithAuth(`/api/users/${userId}/role`, {
        method: 'POST',
        body: JSON.stringify({ role: newRole.toLowerCase() }),
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="font-sans text-gray-800 bg-gray-50/30 p-6 lg:p-8 min-h-full w-full">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Roles & Permissions</h2>
            <p className="text-sm text-gray-500 mt-1">Assign system roles and manage access control for all users.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
              <ShieldCheck className="w-4 h-4" /> Active Backend Mapping
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium">User Details</th>
                <th className="px-6 py-4 font-medium">Department / Title</th>
                <th className="px-6 py-4 font-medium text-center">System Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold uppercase">
                        {user.name ? user.name.charAt(0) : <User className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-700 font-medium">{(user as any).department || user.role}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <select 
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="admin">Admin</option>
                      <option value="lead">Lead</option>
                      <option value="user">Employee (User)</option>
                      <option value="pending">Pending</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
