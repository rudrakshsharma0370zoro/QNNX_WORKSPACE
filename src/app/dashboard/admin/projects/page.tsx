"use client";
import { useState, useEffect, useRef } from 'react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { Briefcase, ChevronRight, Filter, Plus, Edit2, Trash2, X, Users } from 'lucide-react';
import Link from 'next/link';
import MemberSelect from '@/components/MemberSelect';

export default function AdminProjects() {
  const [projects, setProjects] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProject, setNewProject] = useState<{ name: string; deadline: string; status: string; leadId: string; employeeIds: string[] }>({ name: '', deadline: '', status: 'In Progress', leadId: '', employeeIds: [] });
  const [loading, setLoading] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; deadline: string; status: string; leadId: string; employeeIds: string[] }>({ name: '', deadline: '', status: 'In Progress', leadId: '', employeeIds: [] });
  const [editLoading, setEditLoading] = useState(false);
  const archivingRef = useRef(false);

  useEffect(() => {
    if (projects.length > 15 && !archivingRef.current) {
      const olderProjects = projects.slice(15);
      const projectIds = olderProjects.map(p => p.id);
      
      const archiveProjects = async () => {
        archivingRef.current = true;
        try {
          await fetchWithAuth('/api/projects/archive', {
            method: 'POST',
            body: JSON.stringify({ projectIds })
          });
        } catch (error) {
          console.error("Failed to archive projects", error);
        } finally {
          archivingRef.current = false;
        }
      };

      archiveProjects();
    }
  }, [projects]);

  useEffect(() => {
    const unsubProjects = onSnapshot(query(collection(db, 'projects')), snapshot => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubUsers = onSnapshot(query(collection(db, 'users')), snapshot => {
      const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeads(allUsers.filter((u: any) => u.role === 'lead'));
      // Members can be any active employee or lead (not pending signups or admins).
      setAssignableUsers(allUsers.filter((u: any) => u.role === 'user' || u.role === 'lead'));
    });
    return () => { unsubProjects(); unsubUsers(); };
  }, []);

  const handleCreateProject = async () => {
    if (!newProject.name) return;
    setLoading(true);
    try {
      await fetchWithAuth('/api/projects', {
        method: 'POST',
        body: JSON.stringify(newProject),
      });
      setIsAddModalOpen(false);
      setNewProject({ name: '', deadline: '', status: 'In Progress', leadId: '', employeeIds: [] });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this project?')) {
      await fetchWithAuth(`/api/projects/${id}`, { method: 'DELETE' });
    }
  };

  const openEditModal = (project: any) => {
    setEditingProject(project);
    setEditForm({
      name: project.name || '',
      deadline: project.deadline || '',
      status: project.status || 'In Progress',
      leadId: project.leadId || '',
      employeeIds: Array.isArray(project.employeeIds) ? project.employeeIds : [],
    });
  };

  const handleUpdateProject = async () => {
    if (!editingProject || !editForm.name) return;
    setEditLoading(true);
    try {
      await fetchWithAuth(`/api/projects/${editingProject.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editForm),
      });
      setEditingProject(null);
    } catch (e) {
      console.error(e);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="font-sans text-gray-800 bg-[#F8FAFC] p-6 lg:p-8 min-h-full w-full relative">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Projects Overview</h2>
            <p className="text-sm text-gray-500 mt-1">Track all active company projects and their leadership.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Project
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.slice(0, 15).map((project) => {
            const lead = leads.find(l => l.id === project.leadId);
            
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
                  <p className="text-[12px] text-gray-500 font-medium">Deadline: {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'No deadline'}</p>
                </div>

                <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600">
                      {lead?.name ? lead.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <span className="text-[11px] font-semibold text-gray-600 truncate max-w-[70px]">{lead?.name}</span>
                    <span className="flex items-center gap-1 text-[11px] font-medium text-gray-400" title="Assigned members">
                      <Users className="w-3.5 h-3.5" />
                      {Array.isArray(project.employeeIds) ? project.employeeIds.length : 0}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(project)} className="p-1.5 bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded transition-colors" title="Edit / Update Status">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(project.id)} className="p-1.5 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors" title="Delete">
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
                <input type="text" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} placeholder="e.g. Website Redesign" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Deadline</label>
                  <input type="date" value={newProject.deadline} onChange={e => setNewProject({...newProject, deadline: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select value={newProject.status} onChange={e => setNewProject({...newProject, status: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700">
                    <option value="In Progress">In Progress</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Assign Lead</label>
                <select value={newProject.leadId} onChange={e => setNewProject({...newProject, leadId: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700">
                  <option value="">Select Lead</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.name} - {l.email}</option>
                  ))}
                </select>
              </div>
              <MemberSelect
                users={assignableUsers}
                selected={newProject.employeeIds}
                onChange={(ids) => setNewProject({ ...newProject, employeeIds: ids })}
              />
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleCreateProject} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-semibold hover:bg-indigo-700 transition-colors">
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 bg-gray-900/40 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-[450px] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" /> Edit Project
              </h3>
              <button onClick={() => setEditingProject(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Project Name</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Deadline</label>
                  <input type="date" value={editForm.deadline} onChange={e => setEditForm({...editForm, deadline: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700">
                    <option value="In Progress">In Progress</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Assign Lead</label>
                <select value={editForm.leadId} onChange={e => setEditForm({...editForm, leadId: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700">
                  <option value="">Select Lead</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.name} - {l.email}</option>
                  ))}
                </select>
              </div>
              <MemberSelect
                users={assignableUsers}
                selected={editForm.employeeIds}
                onChange={(ids) => setEditForm({ ...editForm, employeeIds: ids })}
              />
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setEditingProject(null)} className="px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleUpdateProject} disabled={editLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-semibold hover:bg-indigo-700 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
