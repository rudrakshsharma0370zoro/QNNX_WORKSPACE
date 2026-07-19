"use client";
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { ArrowLeft, CheckSquare, Clock } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function UserProjectDetail() {
  const params = useParams();
  const projectId = params.id as string;
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [lead, setLead] = useState<any>(null);
  const [projectTasks, setProjectTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubProject = onSnapshot(doc(db, 'projects', projectId), snapshot => {
      if (snapshot.exists()) {
        const projData = { id: snapshot.id, ...snapshot.data() } as any;
        setProject(projData);
        // Fetch lead once we know the project's leadId
        if (projData.leadId) {
          const unsubLead = onSnapshot(doc(db, 'users', projData.leadId), leadSnap => {
            if (leadSnap.exists()) setLead({ id: leadSnap.id, ...leadSnap.data() });
          });
        }
      } else {
        setProject(null);
      }
      setLoading(false);
    });
    // Both filters are required: `projectId` scopes the view, and `assigneeId`
    // is what the Firestore rule authorizes a plain user against. Filtering on
    // projectId alone would be rejected for non-admin/non-lead accounts.
    // Two equality filters need no composite index.
    const unsubTasks = user?.uid
      ? onSnapshot(
          query(
            collection(db, 'tasks'),
            where('projectId', '==', projectId),
            where('assigneeId', '==', user.uid)
          ),
          snapshot => {
            setProjectTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
          }
        )
      : null;

    return () => { unsubProject(); if (unsubTasks) unsubTasks(); };
  }, [projectId, user?.uid]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  if (!project) {
    return (
      <div className="p-8 text-center text-gray-500">
        Project not found.
      </div>
    );
  }

  const completedTasks = projectTasks.filter(t => t.status === 'Completed').length;
  const progress = projectTasks.length === 0 ? 0 : Math.round((completedTasks / projectTasks.length) * 100);

  return (
    <div className="font-sans text-gray-800 bg-[#F8FAFC] p-6 lg:p-8 min-h-full w-full">
      <div className="max-w-[1000px] mx-auto space-y-6">
        
        <Link href="/dashboard/user/projects" className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to My Projects
        </Link>

        {/* Project Header */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mt-4">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
              <p className="text-[13px] text-gray-500 mt-2 max-w-2xl">
                This project is currently active. Please coordinate with your lead and ensure your assignments are updated promptly.
              </p>
            </div>
            <span className={`px-3 py-1 text-xs font-bold rounded-md border ${
              project.status === 'Completed' ? 'text-green-600 bg-green-50 border-green-100' : 'text-blue-600 bg-blue-50 border-blue-100'
            }`}>
              {project.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-gray-100">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Lead</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold uppercase">
                  {lead?.name ? lead.name.charAt(0) : '?'}
                </div>
                <span className="text-[13px] font-medium text-gray-700">{lead?.name || lead?.email}</span>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Deadline</p>
              <div className="flex items-center gap-2 text-[13px] font-medium text-gray-700">
                <Clock className="w-4 h-4 text-gray-400" />
                {new Date(project.deadline).toLocaleDateString()}
              </div>
            </div>
            <div className="col-span-2">
              <div className="flex justify-between text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                <span>Progress</span>
                <span className="text-indigo-600">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#4F46E5] rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Tasks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-gray-900">Project Tasks</h3>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50">
              <tr>
                <th className="px-5 py-3">Task Name</th>
                <th className="px-5 py-3 text-center">Priority</th>
                <th className="px-5 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projectTasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-gray-900 text-[13px]">
                    {task.title}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                      task.priority === 'High' ? 'text-red-600 bg-red-50 border-red-100' : 'text-gray-600 bg-gray-50 border-gray-100'
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md ${
                      task.status === 'Completed' ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                </tr>
              ))}
              {projectTasks.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-gray-500 text-[13px]">
                    No tasks found for this project.
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
