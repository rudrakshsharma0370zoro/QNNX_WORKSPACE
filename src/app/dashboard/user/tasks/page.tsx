"use client";
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

export default function UserTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubTasks = onSnapshot(query(collection(db, 'tasks'), where('assigneeId', '==', user.uid)), snapshot => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubProjects = onSnapshot(query(collection(db, 'projects')), snapshot => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubTasks(); unsubProjects(); };
  }, [user?.uid]);

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'High': return 'text-red-500 bg-red-50 border-red-100';
      case 'Medium': return 'text-orange-500 bg-orange-50 border-orange-100';
      case 'Low': return 'text-green-500 bg-green-50 border-green-100';
      default: return 'text-gray-500 bg-gray-50 border-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'In Progress': return 'text-blue-700 bg-blue-100 border-blue-200';
      case 'Pending': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'Completed': return 'text-green-700 bg-green-100 border-green-200';
      default: return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const updateTaskStatus = async (id: string, newStatus: string) => {
    // Optimistic update
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
    try {
      await fetchWithAuth(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="font-sans text-gray-800 bg-[#F8FAFC] p-6 lg:p-8 min-h-full w-full">
      <div className="max-w-[1200px] mx-auto space-y-6">
        
        <div className="mb-6">
          <h2 className="text-[22px] font-bold text-[#111827]">My Tasks</h2>
          <p className="text-[13px] text-gray-500 mt-1">Manage your active assignments and update statuses.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50/50">
              <tr>
                <th className="px-6 py-4">Task Details</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4 text-center">Priority</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.map((task) => {
                const project = projects.find(p => p.id === task.projectId);

                return (
                  <tr key={task.id} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4 w-1/2">
                      <div className="font-semibold text-gray-900 text-[14px] group-hover:text-indigo-600 transition-colors">{task.title}</div>
                      <div className="text-[12px] text-gray-400 mt-1">Due: Oct 25, 2026</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[13px] font-medium text-gray-600">{project?.name || 'General'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select 
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        className={`w-32 px-3 py-1.5 rounded-md text-[12px] font-semibold border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer transition-colors ${getStatusColor(task.status)}`}
                      >
                        <option value="Pending" className="bg-white text-gray-900">Pending</option>
                        <option value="In Progress" className="bg-white text-gray-900">In Progress</option>
                        <option value="Completed" className="bg-white text-gray-900">Completed</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
              
              {tasks.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-medium">
                    You have no assigned tasks.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
