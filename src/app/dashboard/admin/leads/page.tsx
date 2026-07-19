"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Users, Plus, Search, Edit2, Trash2, Mail, X } from 'lucide-react';

export default function AdminLeads() {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const unsubLeads = onSnapshot(query(collection(db, 'users'), where('role', '==', 'lead')), snapshot => {
      setLeads(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubProjects = onSnapshot(query(collection(db, 'projects')), snapshot => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubLeads(); unsubProjects(); };
  }, []);

  return (
    <div className="font-sans text-gray-800 bg-gray-50/30 p-6 lg:p-8 min-h-full w-full relative">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Leads Management</h2>
            <p className="text-sm text-gray-500 mt-1">Manage team leads, assign projects, and monitor their departments.</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Lead
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search leads..." 
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Lead Profile</th>
                  <th className="px-6 py-4 font-medium">Department</th>
                  <th className="px-6 py-4 font-medium">Managed Projects</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.map((lead) => {
                  const leadProjects = projects.filter(p => p.leadId === lead.id);
                  
                  return (
                    <tr 
                      key={lead.id} 
                      onClick={() => router.push(`/dashboard/admin/leads/${lead.id}`)}
                      className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-lg font-bold shrink-0 uppercase">
                            {lead.name ? lead.name.charAt(0) : '?'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 text-base group-hover:text-indigo-600 transition-colors">{lead.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {lead.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full border border-gray-200">
                          {lead.department}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {leadProjects.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {leadProjects.map(p => (
                              <span key={p.id} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-semibold rounded border border-blue-100 flex items-center gap-1">
                                {p.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No projects assigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-3 text-gray-400" onClick={e => e.stopPropagation()}>
                          <button className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded transition-colors" title="Edit Lead"><Edit2 className="w-4 h-4" /></button>
                          <button className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded transition-colors" title="Remove Lead"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Lead Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-[400px] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900">Add New Lead</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <input type="text" placeholder="e.g. Alex Rivera" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                <input type="email" placeholder="alex.rivera@qnnx.com" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Department</label>
                <input type="text" placeholder="e.g. Engineering" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-semibold hover:bg-indigo-700">Add Lead</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
