"use client";
import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';
import { Briefcase, X } from 'lucide-react';

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Completed'];

export default function LeadProjects() {
  const { user } = useAuth();
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [updatingProject, setUpdatingProject] = useState<any | null>(null);
  const [statusValue, setStatusValue] = useState('In Progress');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, 'projects')), snapshot => {
      setAllProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // A lead only manages the status of projects they're assigned to lead —
  // matches how tasks/meetings scope a lead's own dashboard elsewhere in the app.
  const projects = allProjects.filter((p: any) => p.leadId === user?.uid);

  const openStatusModal = (project: any) => {
    setUpdatingProject(project);
    setStatusValue(project.status || 'In Progress');
  };

  const handleUpdateStatus = async () => {
    if (!updatingProject) return;
    setSaving(true);
    try {
      await fetchWithAuth(`/api/projects/${updatingProject.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: statusValue }),
      });
      setUpdatingProject(null);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="font-sans text-gray-800 bg-[#F8FAFC] p-6 lg:p-8 min-h-full w-full relative">
      <div className="max-w-[1400px] mx-auto space-y-6">

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">My Projects</h2>
          <p className="text-sm text-gray-500 mt-1">Projects you lead. Update their status as work progresses.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:border-indigo-300 transition-all hover:shadow-md group flex flex-col justify-between h-52 relative">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-bold rounded border ${
                    project.status === 'Completed' ? 'text-green-600 bg-green-50 border-green-100' : 'text-blue-600 bg-blue-50 border-blue-100'
                  }`}>
                    {(project.status || 'Pending').toUpperCase()}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 mb-1 leading-tight group-hover:text-indigo-600 transition-colors">{project.name}</h3>
                <p className="text-[12px] text-gray-500 font-medium">Deadline: {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}</p>
              </div>

              <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-end">
                <button
                  onClick={() => openStatusModal(project)}
                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[11px] font-bold rounded-md transition-colors"
                >
                  Update Status
                </button>
              </div>
            </div>
          ))}

          {projects.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-[14px] text-gray-500 font-medium">No projects assigned to you yet.</p>
            </div>
          )}
        </div>

      </div>

      {/* Update Status Modal */}
      {updatingProject && (
        <div className="fixed inset-0 bg-gray-900/40 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-[400px] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600" /> Update Status
              </h3>
              <button onClick={() => setUpdatingProject(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-[13px] text-gray-600 font-medium">{updatingProject.name}</p>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                <select value={statusValue} onChange={e => setStatusValue(e.target.value)} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700">
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setUpdatingProject(null)} className="px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleUpdateStatus} disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-semibold hover:bg-indigo-700 transition-colors">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
