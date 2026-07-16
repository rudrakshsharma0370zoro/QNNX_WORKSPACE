import React from 'react';
import { Mail, Briefcase, CheckCircle2 } from 'lucide-react';

// Demo data - Team members
const teamMembers = [
  { id: 1, name: 'Sarah Jenkins', email: 'sarah.j@qnnx.com', role: 'Project Lead', tasks: 5, workload: 80, initials: 'SJ', color: 'bg-indigo-100 text-indigo-700' },
  { id: 2, name: 'Alex Chen', email: 'alex.c@qnnx.com', role: 'Backend Developer', tasks: 3, workload: 45, initials: 'AC', color: 'bg-emerald-100 text-emerald-700' },
  { id: 3, name: 'Maria Garcia', email: 'maria.g@qnnx.com', role: 'UX Designer', tasks: 2, workload: 30, initials: 'MG', color: 'bg-amber-100 text-amber-700' },
  { id: 4, name: 'John Doe', email: 'john.d@qnnx.com', role: 'Frontend Engineer', tasks: 4, workload: 65, initials: 'JD', color: 'bg-blue-100 text-blue-700' },
];

export default function TeamPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-500 mt-1">Manage your team, view roles, and monitor workload distribution.</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
          Add Member
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="px-6 py-4">Name & Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Assigned Tasks</th>
                <th className="px-6 py-4">Workload Distribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {teamMembers.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                  {/* Name and Email */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${member.color}`}>
                        {member.initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.name}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                          <Mail className="w-3 h-3" />
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Role */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      {member.role}
                    </div>
                  </td>

                  {/* Assigned Tasks */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      {member.tasks} Active
                    </div>
                  </td>

                  {/* Workload Distribution */}
                  <td className="px-6 py-4 w-64">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${member.workload > 70 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                          style={{ width: `${member.workload}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-gray-600">{member.workload}%</span>
                    </div>
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