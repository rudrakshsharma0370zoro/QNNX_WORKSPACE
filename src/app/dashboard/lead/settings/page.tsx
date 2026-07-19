"use client";

import { Settings, ChevronDown, Plus } from 'lucide-react';

export default function LeadSettings() {
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

      </div>
    </div>
  );
}
