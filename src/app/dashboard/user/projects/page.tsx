"use client";
import { useState } from 'react';
import Link from 'next/link';
import { mockProjects, mockLeads } from '../../../../utils/adminMockData';
import { Briefcase, ChevronRight } from 'lucide-react';

export default function UserProjects() {
  const CURRENT_USER_ID = 'e1';
  const [projects] = useState(mockProjects.filter(p => p.employeeIds.includes(CURRENT_USER_ID)));

  return (
    <div className="font-sans text-gray-800 bg-[#F8FAFC] p-6 lg:p-8 min-h-full w-full">
      <div className="max-w-[1200px] mx-auto space-y-6">
        
        <div className="mb-6">
          <h2 className="text-[22px] font-bold text-[#111827]">My Projects</h2>
          <p className="text-[13px] text-gray-500 mt-1">Projects you are actively contributing to.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => {
            const lead = mockLeads.find(l => l.id === project.leadId);
            
            return (
              <Link href={`/dashboard/user/projects/${project.id}`} key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-indigo-300 transition-colors cursor-pointer group flex flex-col justify-between h-48 block">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                      project.status === 'Completed' ? 'text-green-600 bg-green-50 border-green-100' : 'text-blue-600 bg-blue-50 border-blue-100'
                    }`}>
                      {project.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{project.name}</h3>
                  <p className="text-[12px] text-gray-500 mt-1">Deadline: {new Date(project.deadline).toLocaleDateString()}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">
                      {lead?.avatar}
                    </div>
                    <span className="text-[11px] font-medium text-gray-500">Lead: {lead?.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                </div>
              </Link>
            );
          })}
          
          {projects.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-[14px] text-gray-500 font-medium">You are not currently assigned to any projects.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
