"use client";
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { ArrowLeft, Mail, Briefcase, CheckSquare, Clock } from 'lucide-react';

export default function AdminEmployeeProfile() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;
  const [employee, setEmployee] = useState<any>(null);
  const [employeeTasks, setEmployeeTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubUser = onSnapshot(doc(db, 'users', employeeId), snapshot => {
      if (snapshot.exists()) {
        setEmployee({ id: snapshot.id, ...snapshot.data() });
      } else {
        setEmployee(null);
      }
      setLoading(false);
    });
    const unsubTasks = onSnapshot(query(collection(db, 'tasks'), where('assigneeId', '==', employeeId)), snapshot => {
      setEmployeeTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubUser(); unsubTasks(); };
  }, [employeeId]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  if (!employee) {
    return (
      <div className="p-8 text-center text-gray-500">
        Employee not found.
      </div>
    );
  }

  const completedTasks = employeeTasks.filter(t => t.status === 'Completed').length;
  const activeTasks = employeeTasks.length - completedTasks;
  const progress = employeeTasks.length === 0 ? 0 : Math.round((completedTasks / employeeTasks.length) * 100);

  return (
    <div className="font-sans text-gray-800 bg-[#F8FAFC] p-6 lg:p-8 min-h-full w-full relative">
      <div className="max-w-[1000px] mx-auto space-y-6">
        
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Team
        </button>

        {/* Profile Header */}
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm mt-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-3xl font-bold uppercase">
              {employee.name ? employee.name.charAt(0) : '?'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{employee.name}</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">{employee.role}</p>
              <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                  <Mail className="w-3.5 h-3.5" /> {employee.email}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100 font-semibold">
                  Active Status
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-right flex flex-col gap-3">
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-center min-w-[140px]">
              <p className="text-2xl font-bold text-indigo-600">{activeTasks}</p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-indigo-400 mt-1">Active Tasks</p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center min-w-[140px]">
              <p className="text-2xl font-bold text-gray-900">{progress}%</p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mt-1">Completion Rate</p>
            </div>
          </div>
        </div>

        {/* Assigned Tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-indigo-500" /> Current Workload
            </h3>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-white border-b border-gray-100">
              <tr>
                <th className="px-5 py-4">Task Name</th>
                <th className="px-5 py-4 text-center">Priority</th>
                <th className="px-5 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {employeeTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-gray-900 text-[13px]">
                    {task.title}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`px-2 py-1 text-[10px] font-bold rounded border ${
                      task.priority === 'High' ? 'text-red-600 bg-red-50 border-red-100' : 'text-gray-600 bg-gray-50 border-gray-100'
                    }`}>
                      {task.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                      task.status === 'Completed' ? 'text-green-700 bg-green-50 border-green-200' : 
                      task.status === 'In Progress' ? 'text-blue-700 bg-blue-50 border-blue-200' : 'text-orange-700 bg-orange-50 border-orange-200'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                </tr>
              ))}
              {employeeTasks.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-gray-500 text-[13px]">
                    No tasks currently assigned to this employee.
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
