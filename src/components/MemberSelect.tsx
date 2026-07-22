"use client";
import { useState } from 'react';
import { Check, Search } from 'lucide-react';

export interface AssignableUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
}

interface MemberSelectProps {
  users: AssignableUser[];
  selected: string[];
  onChange: (ids: string[]) => void;
  label?: string;
}

/**
 * A searchable, multi-select checklist for assigning people (by uid) to a
 * project or team. Controlled: the parent owns the `selected` uid array.
 */
export default function MemberSelect({ users, selected, onChange, label = 'Assign Members' }: MemberSelectProps) {
  const [search, setSearch] = useState('');

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  const q = search.trim().toLowerCase();
  const filtered = users.filter(
    (u) => !q || (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
        <span className="text-[11px] font-semibold text-indigo-600">{selected.length} selected</span>
      </div>

      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search people..."
          className="w-full pl-8 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        />
      </div>

      <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
        {filtered.length === 0 && (
          <p className="px-3 py-4 text-center text-[12px] text-gray-400">No people found.</p>
        )}
        {filtered.map((u) => {
          const isSel = selected.includes(u.id);
          return (
            <button
              type="button"
              key={u.id}
              onClick={() => toggle(u.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${isSel ? 'bg-indigo-50/50' : ''}`}
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSel ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                {isSel && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[11px] font-bold shrink-0">
                {(u.name || u.email || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-gray-800 truncate">{u.name || 'Unnamed'}</p>
                <p className="text-[11px] text-gray-400 truncate">
                  {u.email}
                  {u.role === 'lead' ? ' · Lead' : ''}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
