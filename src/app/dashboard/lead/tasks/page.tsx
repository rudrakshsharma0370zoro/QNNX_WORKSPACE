"use client";
import { useState, useEffect } from 'react';
import { Edit2, Trash2, X, Plus } from 'lucide-react';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { useAuth } from '@/components/AuthProvider';

export default function LeadTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', projectId: '', priority: 'Medium', assigneeId: '', status: 'Pending' });
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [editTaskForm, setEditTaskForm] = useState({ title: '', projectId: '', priority: 'Medium', assigneeId: '' });
  const [editTaskLoading, setEditTaskLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const unsubTasks = onSnapshot(query(collection(db, 'tasks')), snapshot => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubUsers = onSnapshot(query(collection(db, 'users')), snapshot => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubProjects = onSnapshot(query(collection(db, 'projects')), snapshot => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubTasks(); unsubUsers(); unsubProjects(); };
  }, []);

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

  const cycleStatus = async (id: string, currentStatus: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'in-progress',
      'in-progress': 'completed',
      'completed': 'pending',
      'Pending': 'in-progress',
      'In Progress': 'completed',
      'Completed': 'pending'
    };
    const nextStatus = statusMap[currentStatus] || 'pending';
    try {
      await fetchWithAuth(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch(e) { console.error(e); }
  };

  const handleCreateTask = async () => {
    if (!newTask.title) return;
    setLoading(true);
    try {
      await fetchWithAuth('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: newTask.title,
          assignedTo: newTask.assigneeId,
          priority: newTask.priority.toLowerCase(),
          projectId: newTask.projectId,
        }),
      });
      setIsAddModalOpen(false);
      setNewTask({ title: '', projectId: '', priority: 'Medium', assigneeId: '', status: 'Pending' });
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      await fetchWithAuth(`/api/tasks/${id}`, { method: 'DELETE' });
    }
  };

  const openEditModal = (task: any) => {
    setEditingTask(task);
    setEditTaskForm({
      title: task.title || '',
      projectId: task.projectId || '',
      priority: task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium',
      assigneeId: task.assigneeId || '',
    });
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !editTaskForm.title) return;
    setEditTaskLoading(true);
    try {
      const body: Record<string, unknown> = {
        title: editTaskForm.title,
        projectId: editTaskForm.projectId || null,
        priority: editTaskForm.priority.toLowerCase(),
      };
      if (editTaskForm.assigneeId) body.assigneeId = editTaskForm.assigneeId;

      await fetchWithAuth(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setEditingTask(null);
    } catch (e) {
      console.error(e);
    } finally {
      setEditTaskLoading(false);
    }
  };

  return (
    <div className="font-sans text-gray-800 bg-[#F8FAFC] p-6 lg:p-8 min-h-full w-full relative">
      <div className="max-w-[1200px] mx-auto space-y-6">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-[22px] font-bold text-[#111827]">Task Management</h2>
            <p className="text-[13px] text-gray-500 mt-1">Assign tasks, update statuses, and track team progress.</p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Task
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Task Name & Desc</th>
                <th className="px-6 py-4 text-center">Assignee</th>
                <th className="px-6 py-4 text-center">Priority</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tasks.map((task) => {
                const assignee = users.find(e => e.id === task.assigneeId);

                return (
                  <tr key={task.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 w-[35%]">
                      <div className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{task.title}</div>
                      <div className="text-[12px] text-gray-400 mt-0.5 truncate max-w-xs">
                        Details and subtasks for {task.title.toLowerCase()}...
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {assignee ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 uppercase">
                            {assignee?.name ? assignee.name.charAt(0) : '?'}
                          </div>
                          <span className="text-[13px] text-gray-600 font-medium">{assignee.name || assignee.email}</span>
                        </div>
                      ) : (
                        <span className="text-[13px] text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {/* For Leads, let them cycle status of any task or just their assigned tasks? Let's allow them to update any task since they manage tasks. */}
                      <button 
                        onClick={() => cycleStatus(task.id, task.status)}
                        title="Click to cycle status"
                        className={`flex items-center justify-between w-[110px] mx-auto px-3 py-1.5 rounded-md border text-[11px] font-bold ${getStatusColor(task.status || 'pending')} hover:opacity-80 transition-opacity cursor-pointer`}
                      >
                        {(task.status || 'pending').toUpperCase()}
                        <svg className="w-3 h-3 ml-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(task)} className="p-1.5 bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded transition-colors" title="Edit Task"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(task.id)} className="p-1.5 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {tasks.length === 0 && (
            <p className="text-center text-sm text-gray-500 py-8">No tasks found.</p>
          )}
        </div>
      </div>

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-[450px] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900">Create New Task</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Task Title</label>
                <input type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="e.g. Design Login Page" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Project</label>
                <select value={newTask.projectId} onChange={e => setNewTask({...newTask, projectId: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700">
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Priority</label>
                  <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Assign To</label>
                  <select value={newTask.assigneeId} onChange={e => setNewTask({...newTask, assigneeId: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700">
                    <option value="">Unassigned</option>
                    {users.filter(u => u.role === 'user').map(e => (
                      <option key={e.id} value={e.id}>{e.name || e.email}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleCreateTask} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-semibold hover:bg-indigo-700 transition-colors">
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-gray-900/40 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-[450px] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900">Edit Task</h3>
              <button onClick={() => setEditingTask(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Task Title</label>
                <input type="text" value={editTaskForm.title} onChange={e => setEditTaskForm({...editTaskForm, title: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Project</label>
                <select value={editTaskForm.projectId} onChange={e => setEditTaskForm({...editTaskForm, projectId: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700">
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Priority</label>
                  <select value={editTaskForm.priority} onChange={e => setEditTaskForm({...editTaskForm, priority: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Assign To</label>
                  <select value={editTaskForm.assigneeId} onChange={e => setEditTaskForm({...editTaskForm, assigneeId: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700">
                    <option value="">Unassigned</option>
                    {users.filter(u => u.role === 'user').map(e => (
                      <option key={e.id} value={e.id}>{e.name || e.email}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setEditingTask(null)} className="px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleUpdateTask} disabled={editTaskLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-semibold hover:bg-indigo-700 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}