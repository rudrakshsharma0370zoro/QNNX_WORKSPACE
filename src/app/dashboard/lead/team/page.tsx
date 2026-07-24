"use client";
import React, { useState, useEffect } from 'react';
import { Mail, Briefcase, CheckCircle2 } from 'lucide-react';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';

export default function TeamPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return; // Wait for auth to resolve before fetching
    // Fetch all team members (users with role 'user')
    const unsubUsers = onSnapshot(query(collection(db, 'users'), where('role', '==', 'user')), snapshot => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    // Fetch all active tasks to calculate workload
    const unsubTasks = onSnapshot(query(collection(db, 'tasks')), snapshot => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubUsers(); unsubTasks(); };
  }, [user]);

  // Compute active tasks (Pending or In Progress) per user
  const userTaskCounts: Record<string, number> = {};
  const userWeightedScores: Record<string, number> = {};
  
  tasks.forEach(t => {
    if (t.status !== 'Completed') {
      const assignees = Array.isArray(t.assignees) ? t.assignees : (t.assigneeId ? [t.assigneeId] : []);
      assignees.forEach(uid => {
        userTaskCounts[uid] = (userTaskCounts[uid] || 0) + 1;
        userWeightedScores[uid] = (userWeightedScores[uid] || 0) + (1 / assignees.length);
      });
    }
  });

  const teamMembers = users.map(user => {
    const activeTasks = userTaskCounts[user.id] || 0;
    const weightedScore = userWeightedScores[user.id] || 0;
    // Assuming 10 full active tasks is 100% workload capacity
    const workload = Math.min(100, Math.round((weightedScore / 10) * 100));
    
    // Assign a consistent color class based on the first letter of their name
    const charCode = user.name ? user.name.charCodeAt(0) : 0;
    const colors = [
      'bg-indigo-100 text-indigo-700',
      'bg-emerald-100 text-emerald-700',
      'bg-amber-100 text-amber-700',
      'bg-blue-100 text-blue-700',
      'bg-purple-100 text-purple-700'
    ];
    const color = colors[charCode % colors.length];

    return {
      ...user,
      activeTasks,
      workload,
      color,
      initials: user.name ? user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : '?'
    };
  });

  const handleAddMemberClick = () => {
    alert("Role assignment is managed by Admins. Please ask your administrator to approve new team members.");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-500 mt-1">Manage your team, view roles, and monitor workload distribution.</p>
        </div>
        <button 
          onClick={handleAddMemberClick}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
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
                <th className="px-6 py-4">Active Tasks</th>
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
                        <p className="text-sm font-medium text-gray-900">{member.name || 'Unknown Name'}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                          <Mail className="w-3 h-3" />
                          {member.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Role */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700 capitalize">
                      <Briefcase className="w-4 h-4 text-gray-400" />
                      {member.role || 'Member'}
                    </div>
                  </td>

                  {/* Assigned Tasks */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      {member.activeTasks} Active
                    </div>
                  </td>

                  {/* Workload Distribution */}
                  <td className="px-6 py-4 w-64">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${member.workload > 70 ? 'bg-amber-500' : 'bg-indigo-500'}`}
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
          {teamMembers.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">
              No active team members found. 
            </div>
          )}
        </div>
      </div>
    </div>
  );
}