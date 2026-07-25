"use client";
import { useState, useEffect, useRef } from 'react';
import { Edit2, Trash2, X, Plus, CloudUpload, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { useAuth } from '@/components/AuthProvider';
import { auth } from '@/config/firebaseConfig';

export default function AdminTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<{title: string, description: string, projectId: string, priority: string, assignees: string[], status: string, attachments: string[]}>({ title: '', description: '', projectId: '', priority: 'Medium', assignees: [], status: 'Pending', attachments: [] });
  const [loading, setLoading] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [editTaskForm, setEditTaskForm] = useState<{title: string, description: string, projectId: string, priority: string, assignees: string[], attachments: string[]}>({ title: '', description: '', projectId: '', priority: 'Medium', assignees: [], attachments: [] });
  const [editTaskLoading, setEditTaskLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
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

  const cycleStatus = async (task: any) => {
    const isUnassigned = !task.assigneeId && (!Array.isArray(task.assignees) || task.assignees.length === 0);
    if (isUnassigned) {
      alert("An Unassigned task cannot be marked as In Progress or Completed. Please assign it to a user first.");
      return;
    }
    const currentStatus = task.status;
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
      const res = await fetchWithAuth(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.details || 'Failed to update status');
      }
    } catch(e) { console.error(e); }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploading(true);
      const presignRes = await fetchWithAuth('/api/uploads/presign', {
        method: 'POST',
        body: JSON.stringify({ filename: file.name, contentType: file.type, category: 'task-files', size: file.size })
      });
      const presignData = await presignRes.json();
      if (!presignRes.ok) throw new Error(presignData.details || 'Failed to get upload URL');
      const uploadRes = await fetch(presignData.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!uploadRes.ok) throw new Error('Failed to upload file to S3');
      return presignData.s3Key;
    } catch (err: any) {
      alert(err.message || 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title) return;
    setLoading(true);
    try {
      await fetchWithAuth('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          assignees: newTask.assignees,
          priority: newTask.priority.toLowerCase(),
          projectId: newTask.projectId,
          attachments: newTask.attachments,
        }),
      });
      setIsAddModalOpen(false);
      setNewTask({ title: '', description: '', projectId: '', priority: 'Medium', assignees: [], status: 'Pending', attachments: [] });
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
      description: task.description || '',
      projectId: task.projectId || '',
      priority: task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium',
      assignees: Array.isArray(task.assignees) ? task.assignees : (task.assigneeId ? [task.assigneeId] : []),
      attachments: Array.isArray(task.attachments) ? task.attachments : (task.s3Key ? [task.s3Key] : []),
    });
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !editTaskForm.title) return;
    setEditTaskLoading(true);
    try {
      // assigneeId is required to be non-empty by the API when present at all
      // (unlike projectId, which accepts null) — omit it entirely rather than
      // send '' when the task is left unassigned, so the update still goes
      // through for every other field.
      const body: Record<string, unknown> = {
        title: editTaskForm.title,
        description: editTaskForm.description,
        projectId: editTaskForm.projectId || null,
        priority: editTaskForm.priority.toLowerCase(),
        assignees: editTaskForm.assignees,
        attachments: editTaskForm.attachments,
      };

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
            {tasks.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 text-gray-300 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      <p className="text-sm font-medium">No tasks found</p>
                      <p className="text-xs text-gray-400 mt-1">Create your first task to get started.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : (
            <tbody className="divide-y divide-gray-100">
              {tasks.map((task) => {
                const taskAssignees = Array.isArray(task.assignees) 
                  ? task.assignees.map((id: string) => users.find(u => u.id === id)).filter(Boolean)
                  : (task.assigneeId ? [users.find(u => u.id === task.assigneeId)].filter(Boolean) : []);
                const primaryAssignee = taskAssignees[0];

                return (
                  <tr key={task.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 w-[35%]">
                      <div className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{task.title}</div>
                      <div className="text-[12px] text-gray-400 mt-0.5 truncate max-w-xs">
                        Details and subtasks for {task.title.toLowerCase()}...
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center relative group/assignee">
                      {primaryAssignee ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                            {primaryAssignee?.name ? primaryAssignee.name.charAt(0).toUpperCase() : '?'}
                          </div>
                          <span className="text-[13px] text-gray-600 font-medium">{primaryAssignee.name || primaryAssignee.email}</span>
                          {taskAssignees.length > 1 && (
                            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold cursor-help">
                              +{taskAssignees.length - 1}
                            </span>
                          )}
                          {taskAssignees.length > 1 && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 hidden group-hover/assignee:block z-50 bg-gray-900 text-white text-[11px] py-1 px-2 rounded whitespace-nowrap shadow-lg">
                              {taskAssignees.slice(1).map((a: any) => a.name || a.email).join(', ')}
                            </div>
                          )}
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
                        <button 
                          onClick={() => cycleStatus(task)}
                          title="Click to cycle status"
                          className={`flex items-center justify-between w-[110px] mx-auto px-3 py-1.5 rounded-md border text-[11px] font-bold ${getStatusColor(task.status || 'pending')} hover:opacity-80 transition-opacity`}
                        >
                          {(task.status || 'pending').toUpperCase()}
                          <svg className="w-3 h-3 ml-2 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3 transition-opacity">
                        <button onClick={() => openEditModal(task)} className="p-1.5 bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 rounded transition-colors" title="Edit Task"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDelete(task.id)} className="p-1.5 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            )}
          </table>
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
            
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Task Title</label>
                  <input type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[80px]" />
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
                    <div className="max-h-[120px] overflow-y-auto bg-white border border-gray-200 rounded-lg p-2 space-y-1">
                      {users.map(u => (
                        <label key={u.id} className="flex items-center gap-2 text-[13px] text-gray-700 p-1 hover:bg-gray-50 rounded cursor-pointer">
                          <input type="checkbox" checked={newTask.assignees.includes(u.id)} onChange={e => {
                            if (e.target.checked) setNewTask({...newTask, assignees: [...newTask.assignees, u.id]});
                            else setNewTask({...newTask, assignees: newTask.assignees.filter(id => id !== u.id)});
                          }} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                          {u.name || u.email}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Attachments</label>
                  <input type="file" ref={fileInputRef} onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const s3Key = await handleFileUpload(file);
                      if (s3Key) setNewTask({...newTask, attachments: [...newTask.attachments, s3Key]});
                    }
                  }} className="hidden" />
                  <div 
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50 flex flex-col items-center justify-center py-4 px-4 text-center transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}
                  >
                    {uploading ? (
                      <Loader2 className="w-5 h-5 text-indigo-400 mb-2 animate-spin" />
                    ) : (
                      <CloudUpload className="w-5 h-5 text-indigo-400 mb-2" />
                    )}
                    <p className="text-[12px] font-semibold text-indigo-600">{uploading ? 'Uploading...' : 'Click to add attachment'}</p>
                  </div>
                  {newTask.attachments.length > 0 && (
                    <div className="mt-2 text-[12px] text-gray-500">
                      {newTask.attachments.length} attachment(s) added
                    </div>
                  )}
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

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Task Title</label>
                <input type="text" value={editTaskForm.title} onChange={e => setEditTaskForm({...editTaskForm, title: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={editTaskForm.description} onChange={e => setEditTaskForm({...editTaskForm, description: e.target.value})} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-h-[80px]" />
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
                  <div className="max-h-[120px] overflow-y-auto bg-white border border-gray-200 rounded-lg p-2 space-y-1">
                    {users.map(u => (
                      <label key={u.id} className="flex items-center gap-2 text-[13px] text-gray-700 p-1 hover:bg-gray-50 rounded cursor-pointer">
                        <input type="checkbox" checked={editTaskForm.assignees.includes(u.id)} onChange={e => {
                          if (e.target.checked) setEditTaskForm({...editTaskForm, assignees: [...editTaskForm.assignees, u.id]});
                          else setEditTaskForm({...editTaskForm, assignees: editTaskForm.assignees.filter(id => id !== u.id)});
                        }} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        {u.name || u.email}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Attachments</label>
                <input type="file" ref={editFileInputRef} onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const s3Key = await handleFileUpload(file);
                    if (s3Key) setEditTaskForm({...editTaskForm, attachments: [...editTaskForm.attachments, s3Key]});
                  }
                }} className="hidden" />
                <div 
                  onClick={() => !uploading && editFileInputRef.current?.click()}
                  className={`border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50 flex flex-col items-center justify-center py-4 px-4 text-center transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 text-indigo-400 mb-2 animate-spin" />
                  ) : (
                    <CloudUpload className="w-5 h-5 text-indigo-400 mb-2" />
                  )}
                  <p className="text-[12px] font-semibold text-indigo-600">{uploading ? 'Uploading...' : 'Click to add attachment'}</p>
                </div>
                {editTaskForm.attachments.length > 0 && (
                  <div className="mt-2 text-[12px] text-gray-500">
                    {editTaskForm.attachments.length} attachment(s) added
                  </div>
                )}
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
