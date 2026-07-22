"use client";
import { useState, useEffect } from 'react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { Users, Plus, Edit2, Trash2, X } from 'lucide-react';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, query } from 'firebase/firestore';
import MemberSelect from '@/components/MemberSelect';

export default function AdminTeams() {
  const [teams, setTeams] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTeam, setNewTeam] = useState<{ name: string; department: string; leadId: string; members: string[] }>({ name: '', department: '', leadId: '', members: [] });
  const [loading, setLoading] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; department: string; leadId: string; members: string[] }>({ name: '', department: '', leadId: '', members: [] });
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    const unsubTeams = onSnapshot(query(collection(db, 'teams')), (snapshot) => {
      const teamsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTeams(teamsData);
    });
    const unsubUsers = onSnapshot(query(collection(db, 'users')), snapshot => {
      const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLeads(allUsers.filter((u: any) => u.role === 'lead'));
      setAssignableUsers(allUsers.filter((u: any) => u.role === 'user' || u.role === 'lead'));
    });
    return () => { unsubTeams(); unsubUsers(); };
  }, []);

  const handleCreateTeam = async () => {
    if (!newTeam.name || !newTeam.department) return;
    setLoading(true);
    try {
      await fetchWithAuth('/api/teams', {
        method: 'POST',
        body: JSON.stringify(newTeam),
      });
      setIsAddModalOpen(false);
      setNewTeam({ name: '', department: '', leadId: '', members: [] });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (team: any) => {
    setEditingTeam(team);
    setEditForm({
      name: team.name || '',
      department: team.department || '',
      leadId: team.leadId || '',
      members: Array.isArray(team.members) ? team.members : [],
    });
  };

  const handleUpdateTeam = async () => {
    if (!editingTeam || !editForm.name) return;
    setEditLoading(true);
    try {
      const res = await fetchWithAuth(`/api/teams/${editingTeam.id}`, {
        method: 'PATCH',
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Update failed: ${err.details || err.error || res.status}`);
        return;
      }
      setEditingTeam(null);
    } catch (e) {
      console.error(e);
      alert('Update failed. Check your connection and try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteTeam = async (team: any) => {
    if (!confirm(`Delete team "${team.name}"? This cannot be undone.`)) return;
    try {
      const res = await fetchWithAuth(`/api/teams/${team.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Delete failed: ${err.details || err.error || res.status}`);
      }
    } catch (e) {
      console.error(e);
      alert('Delete failed. Check your connection and try again.');
    }
  };

  return (
    <div className="font-sans text-gray-800 bg-[#F8FAFC] p-6 lg:p-8 min-h-full w-full relative">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Teams Management</h2>
            <p className="text-sm text-gray-500 mt-1">Create and manage functional teams across departments.</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Team
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium">Team Name</th>
                <th className="px-6 py-4 font-medium">Department</th>
                <th className="px-6 py-4 font-medium">Lead</th>
                <th className="px-6 py-4 font-medium text-center">Members</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teams.map((team) => {
                const lead = leads.find(l => l.id === team.leadId);
                
                return (
                  <tr key={team.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-900">
                      {team.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full border border-gray-200">
                        {team.department}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {lead ? (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">
                            {lead?.name ? lead.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          {lead.name || lead.email}
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-gray-600">
                      {Array.isArray(team.members) ? team.members.length : (team.members || 0)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded border ${
                        team.status === 'Active' || !team.status ? 'text-green-700 bg-green-50 border-green-200' : 'text-gray-600 bg-gray-50 border-gray-200'
                      }`}>
                        {(team.status || 'Active').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3 text-gray-400">
                        <button onClick={() => openEditModal(team)} className="p-1.5 hover:bg-indigo-50 hover:text-indigo-600 rounded transition-colors" title="Edit Team"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteTeam(team)} className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded transition-colors" title="Delete Team"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Team Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-[400px] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900">Create New Team</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Team Name</label>
                <input type="text" value={newTeam.name} onChange={e => setNewTeam({...newTeam, name: e.target.value})} placeholder="e.g. Core Product Design" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Department</label>
                <input type="text" value={newTeam.department} onChange={e => setNewTeam({...newTeam, department: e.target.value})} placeholder="e.g. Design" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Assign Lead</label>
                <select value={newTeam.leadId} onChange={e => setNewTeam({...newTeam, leadId: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                  <option value="">Select Lead</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.name} - {l.email}</option>
                  ))}
                </select>
              </div>
              <MemberSelect
                users={assignableUsers}
                selected={newTeam.members}
                onChange={(ids) => setNewTeam({ ...newTeam, members: ids })}
                label="Team Members"
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleCreateTeam} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-semibold hover:bg-indigo-700">Create Team</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {editingTeam && (
        <div className="fixed inset-0 bg-gray-900/40 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-[420px] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-indigo-600" /> Edit Team
              </h3>
              <button onClick={() => setEditingTeam(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Team Name</label>
                <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Department</label>
                <input type="text" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Assign Lead</label>
                <select value={editForm.leadId} onChange={e => setEditForm({...editForm, leadId: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                  <option value="">Select Lead</option>
                  {leads.map(l => (
                    <option key={l.id} value={l.id}>{l.name} - {l.email}</option>
                  ))}
                </select>
              </div>
              <MemberSelect
                users={assignableUsers}
                selected={editForm.members}
                onChange={(ids) => setEditForm({ ...editForm, members: ids })}
                label="Team Members"
              />
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setEditingTeam(null)} className="px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleUpdateTeam} disabled={editLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-semibold hover:bg-indigo-700">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
