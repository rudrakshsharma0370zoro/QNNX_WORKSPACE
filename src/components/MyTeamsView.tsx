"use client";
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';
import { Users, Briefcase, CheckCircle2 } from 'lucide-react';

export default function MyTeamsView() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubTeams = onSnapshot(query(collection(db, 'teams')), snap => {
      setTeams(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubUsers = onSnapshot(query(collection(db, 'users')), snap => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubProjects = onSnapshot(query(collection(db, 'projects')), snap => {
      setProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubTasks = onSnapshot(query(collection(db, 'tasks')), snap => {
      setTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubTeams(); unsubUsers(); unsubProjects(); unsubTasks(); };
  }, [user]);

  useEffect(() => {
    if (teams.length && users.length) setLoading(false);
  }, [teams, users]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading teams...</div>;

  // Filter teams where current user is a member or lead
  const myTeams = teams.filter(t => t.leadId === user?.uid || (Array.isArray(t.members) && t.members.includes(user?.uid)));

  return (
    <div className="font-sans text-gray-800 bg-[#F8FAFC] p-6 lg:p-8 min-h-full w-full">
      <div className="max-w-[1400px] mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Teams</h2>
          <p className="text-sm text-gray-500 mt-1">Overview of your teams, members, projects, and active tasks.</p>
        </div>

        {myTeams.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
            You are not assigned to any teams yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {myTeams.map(team => {
              // Gather team members
              const memberUids = new Set([team.leadId, ...(team.members || [])].filter(Boolean));
              const teamMembers = users.filter(u => memberUids.has(u.id));

              // Find projects related to this team (projects led by team lead or involving team members)
              const teamProjects = projects.filter(p => p.leadId === team.leadId || (Array.isArray(p.employeeIds) && p.employeeIds.some((id: string) => memberUids.has(id))));

              // Find tasks assigned to team members
              const teamTasks = tasks.filter(t => Array.isArray(t.assignees) && t.assignees.some((id: string) => memberUids.has(id)));

              return (
                <div key={team.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-500" /> {team.name}
                      </h3>
                      <p className="text-xs text-gray-500 font-semibold mt-1">DEPARTMENT: {team.department}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                    
                    {/* Members List */}
                    <div className="p-6">
                      <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" /> Members ({teamMembers.length})
                      </h4>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {teamMembers.map(m => (
                          <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                              {m.name ? m.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{m.name}</p>
                              <p className="text-[11px] text-gray-500 truncate">{m.role === 'lead' ? 'Lead' : 'Member'}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Projects List */}
                    <div className="p-6">
                      <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5" /> Active Projects ({teamProjects.length})
                      </h4>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {teamProjects.length === 0 ? <p className="text-sm text-gray-400">No active projects.</p> : null}
                        {teamProjects.map(p => (
                          <div key={p.id} className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                            <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                            <div className="flex justify-between items-center mt-2">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${p.status === 'Completed' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                                {p.status}
                              </span>
                              {p.deadline && <span className="text-[11px] text-gray-500">Due: {p.deadline}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tasks List */}
                    <div className="p-6">
                      <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Team Tasks ({teamTasks.length})
                      </h4>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {teamTasks.length === 0 ? <p className="text-sm text-gray-400">No active tasks.</p> : null}
                        {teamTasks.map(t => (
                          <div key={t.id} className="p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                            <p className="text-sm font-semibold text-gray-900 truncate">{t.title}</p>
                            <div className="flex justify-between items-center mt-2">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${t.status === 'Completed' ? 'bg-green-50 text-green-700' : t.status === 'In Progress' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                                {t.status}
                              </span>
                              <span className={`text-[11px] font-semibold ${t.priority === 'high' ? 'text-red-500' : t.priority === 'medium' ? 'text-orange-500' : 'text-green-500'}`}>
                                {t.priority?.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
