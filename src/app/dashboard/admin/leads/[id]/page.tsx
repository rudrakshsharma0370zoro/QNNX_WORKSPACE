"use client";

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { ArrowLeft, Mail, Briefcase, Network } from 'lucide-react';

export default function AdminLeadProfile() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id as string;
  const [lead, setLead] = useState<any>(null);
  const [leadProjects, setLeadProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubLead = onSnapshot(doc(db, 'users', leadId), snapshot => {
      if (snapshot.exists()) {
        setLead({ id: snapshot.id, ...snapshot.data() });
      } else {
        setLead(null);
      }
      setLoading(false);
    });
    const unsubProjects = onSnapshot(query(collection(db, 'projects'), where('leadId', '==', leadId)), snapshot => {
      setLeadProjects(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubTasks = onSnapshot(query(collection(db, 'tasks')), snapshot => {
      setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubLead(); unsubProjects(); unsubTasks(); };
  }, [leadId]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  if (!lead) {
    return (
      <div className="p-8 text-center text-gray-500">
        Lead not found.
      </div>
    );
  }

  return (
    <div className="font-sans text-gray-800 bg-[#F8FAFC] p-6 lg:p-8 min-h-full w-full relative">
      <div className="max-w-[1000px] mx-auto space-y-6">
        
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Leads
        </button>

        {/* Profile Header */}
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm mt-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-3xl font-bold uppercase">
              {lead.name ? lead.name.charAt(0) : '?'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{lead.name}</h2>
              <p className="text-sm text-gray-500 font-medium mt-1">Lead, {lead.department}</p>
              <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                  <Mail className="w-3.5 h-3.5" /> {lead.email}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100 font-semibold">
                  <Network className="w-3.5 h-3.5" /> Dept Manager
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-right flex flex-col gap-3">
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-center min-w-[140px]">
              <p className="text-2xl font-bold text-indigo-600">{leadProjects.length}</p>
              <p className="text-[10px] uppercase tracking-wider font-semibold text-indigo-400 mt-1">Managed Projects</p>
            </div>
          </div>
        </div>

        {/* Managed Projects */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-500" /> Managed Projects
            </h3>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider bg-white border-b border-gray-100">
              <tr>
                <th className="px-5 py-4">Project Name</th>
                <th className="px-5 py-4 text-center">Assigned Employees</th>
                <th className="px-5 py-4 text-center">Overall Progress</th>
                <th className="px-5 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leadProjects.map((project) => {
                const projectTasks = tasks.filter(t => t.projectId === project.id);
                const completedTasks = projectTasks.filter(t => t.status === 'Completed').length;
                const progress = projectTasks.length === 0 ? 0 : Math.round((completedTasks / projectTasks.length) * 100);
                
                return (
                  <tr key={project.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-gray-900 text-[13px]">
                      {project.name}
                      <div className="text-[11px] text-gray-400 mt-0.5 font-normal">Deadline: {new Date(project.deadline).toLocaleDateString()}</div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex justify-center -space-x-2">
                        {project.employeeIds?.map((id: string, idx: number) => (
                          <div key={idx} className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[9px] font-bold text-gray-600">
                            E
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500 rounded-full transition-all" 
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <span className="text-[11px] font-medium text-gray-500 w-6">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                        project.status === 'Completed' ? 'text-green-700 bg-green-50 border-green-200' : 'text-blue-700 bg-blue-50 border-blue-200'
                      }`}>
                        {project.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {leadProjects.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-500 text-[13px]">
                    No projects currently managed by this lead.
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
