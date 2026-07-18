"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockEmployees, mockTasks } from '../../../../utils/adminMockData';
import { X } from 'lucide-react';

export default function AdminEmployees() {
  const router = useRouter();
  const [employees, setEmployees] = useState(mockEmployees);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="font-sans text-gray-800 bg-[#F8FAFC] p-6 lg:p-8 min-h-full w-full relative">
      <div className="max-w-[1200px] mx-auto space-y-6">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-[22px] font-bold text-[#111827]">Team Members</h2>
            <p className="text-[13px] text-gray-500 mt-1">Manage your team, view roles, and monitor workload distribution.</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-[#4F46E5] text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Add Member
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Name & Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Assigned Tasks</th>
                <th className="px-6 py-4">Workload Distribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employees.map((employee, idx) => {
                const activeTasks = mockTasks.filter(t => t.assigneeId === employee.id && t.status !== 'Completed').length;
                const workload = activeTasks * 15; // Mock calculation
                
                const getWorkloadColor = (val: number) => {
                  if (val > 70) return 'bg-orange-500';
                  return 'bg-indigo-500';
                };

                const avatarColors = [
                  'bg-indigo-100 text-indigo-700',
                  'bg-green-100 text-green-700',
                  'bg-orange-100 text-orange-700',
                  'bg-blue-100 text-blue-700',
                  'bg-purple-100 text-purple-700'
                ];
                const avatarColor = avatarColors[idx % avatarColors.length];

                return (
                  <tr 
                    key={employee.id} 
                    onClick={() => router.push(`/dashboard/admin/employees/${employee.id}`)}
                    className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${avatarColor}`}>
                          {employee.avatar}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{employee.name}</div>
                          <div className="text-[13px] text-gray-500 flex items-center gap-1.5 mt-0.5">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                            {employee.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                        {employee.role}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-green-600">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        <span className="font-medium text-[13px] text-gray-600">{activeTasks} Active</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getWorkloadColor(workload)}`}
                            style={{ width: `${Math.min(workload, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-[13px] font-medium text-gray-500 w-8">{Math.min(workload, 100)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-[400px] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900">Add New Employee</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <input type="text" placeholder="e.g. Jane Smith" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
                <input type="email" placeholder="jane.smith@qnnx.com" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Role</label>
                <input type="text" placeholder="e.g. Software Engineer" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-semibold hover:bg-indigo-700">Add Member</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
