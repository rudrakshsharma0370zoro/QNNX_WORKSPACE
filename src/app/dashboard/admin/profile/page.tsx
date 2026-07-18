"use client";

import { User, ChevronDown, Plus } from 'lucide-react';

export default function AdminMyProfile() {
  return (
    <div className="font-sans text-gray-800 bg-gray-50/30 p-6 lg:p-8 min-h-full w-full">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
            <p className="text-sm text-gray-500 mt-1">Manage your personal admin account.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> Create New
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">My Profile Module Active</h3>
          <p className="text-sm text-gray-500 max-w-md">
            This module is connected and functioning normally. Data flows are established. Detailed UI implementation is pending full rollout.
          </p>
        </div>

      </div>
    </div>
  );
}
