"use client";

import { useState } from 'react';
import { Settings, ChevronDown, Plus, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

export default function LeadSettings() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  return (
    <div className="font-sans text-gray-800 bg-gray-50/30 p-6 lg:p-8 min-h-full w-full">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <p className="text-sm text-gray-500 mt-1">Configure your personal and team settings.</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
            <Settings className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Settings Module Active</h3>
          <p className="text-sm text-gray-500 max-w-md">
            This module is connected and functioning normally. Detailed UI implementation for team settings is pending full rollout.
          </p>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl border border-red-200 shadow-sm overflow-hidden max-w-3xl">
          <div className="px-8 py-6 border-b border-red-100 flex items-center gap-4 bg-red-50/50">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-900">Danger Zone</h3>
              <p className="text-sm text-red-500">Irreversible and destructive actions.</p>
            </div>
          </div>
          <div className="p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Delete Account</h4>
                <p className="text-[13px] text-gray-500 mt-1 max-w-md">
                  Permanently delete your account and authentication data. This action cannot be undone.
                </p>
                {error && <span className="text-red-500 text-sm mt-2 block">{error}</span>}
              </div>
              <button 
                disabled={deleting}
                onClick={async () => {
                  if (confirm("Are you absolutely sure you want to delete your account? This is permanent!")) {
                    setDeleting(true);
                    setError("");
                    try {
                      if (!user?.uid) throw new Error("Not logged in");
                      const res = await fetchWithAuth(`/api/users/${user.uid}`, { method: 'DELETE' });
                      if (!res.ok) throw new Error("Failed to delete account");
                      await logout();
                      router.push("/");
                    } catch (err: any) {
                      setError(err.message || "Failed to delete account");
                      setDeleting(false);
                    }
                  }
                }}
                className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
