"use client";
import { useState } from 'react';
import { mockProjects, mockLeads } from '../../../../utils/adminMockData';
import { Briefcase, ChevronRight, Filter, Plus, Edit2, Trash2, X } from 'lucide-react';
import Link from 'next/link';

export default function AdminProjects() {
  const [projects, setProjects] = useState(mockProjects);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="font-sans text-gray-800 bg-[#F8FAFC] p-6 lg:p-8 min-h-full w-full relative">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Projects Overview</h2>
            <p className="text-sm text-gray-500 mt-1">Track all active company projects and their leadership.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <Filter className="w-4 h-4" /> Filter
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Project
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map((project) => {
            const lead = mockLeads.find(l => l.id === project.leadId);
            
            return (
              <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-indigo-300 transition-all hover:shadow-md group flex flex-col justify-between h-52 relative">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <span className={`px-2 py-1 text-[10px] font-bold rounded border ${
                      project.status === 'Completed' ? 'text-green-600 bg-green-50 border-green-100' : 'text-blue-600 bg-blue-50 border-blue-100'
                    }`}>
                      {project.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 leading-tight group-hover:text-indigo-600 transition-colors">{project.name}</h3>
                  <p className="text-[12px] text-gray-500 font-medium">Deadline: {new Date(project.deadline).toLocaleDateString()}</p>
                </div>

                <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">
                      {lead?.avatar}
                    </div>
                    <span className="text-[11px] font-semibold text-gray-600 truncate max-w-[100px]">{lead?.name}</span>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded transition-colors" title="Edit">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-1.5 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Add Project Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-[450px] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600" /> Create New Project
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Project Name</label>
                <input type="text" placeholder="e.g. Website Redesign" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Deadline</label>
                  <input type="date" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700">
                    <option>In Progress</option>
                    <option>Pending</option>
                    <option>Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Assign Lead</label>
                <select className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700">
                  {mockLeads.map(l => (
                    <option key={l.id} value={l.id}>{l.name} - {l.department}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-semibold hover:bg-indigo-700 transition-colors">
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
