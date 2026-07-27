"use client";
import { useEffect, useState } from 'react';
import { Plus, Trash2, X, CheckSquare, Square } from 'lucide-react';
import { fetchWithAuth } from '@/utils/fetchWithAuth';

interface Todo {
  id: string;
  description: string;
  deadline: string;
  isComplete: boolean;
  createdAt: string;
}

export default function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTodo, setNewTodo] = useState({ description: '', deadline: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/api/todos');
      if (!res.ok) throw new Error('Failed to fetch to-do list');
      const data = await res.json();
      setTodos(data.todos || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.description || !newTodo.deadline) {
      alert("Please fill in both the description and the deadline.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetchWithAuth('/api/todos', {
        method: 'POST',
        body: JSON.stringify(newTodo)
      });
      if (!res.ok) throw new Error('Failed to add to-do');
      const data = await res.json();
      
      setTodos([data, ...todos]);
      setIsAddModalOpen(false);
      setNewTodo({ description: '', deadline: '' });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleComplete = async (todo: Todo) => {
    const newStatus = !todo.isComplete;
    // Optimistic update
    setTodos(todos.map(t => t.id === todo.id ? { ...t, isComplete: newStatus } : t));
    
    try {
      const res = await fetchWithAuth(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isComplete: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
    } catch (err) {
      // Revert on error
      setTodos(todos.map(t => t.id === todo.id ? { ...t, isComplete: !newStatus } : t));
      console.error(err);
    }
  };

  const deleteTodo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this to-do item?')) return;
    
    // Optimistic update
    const previousTodos = [...todos];
    setTodos(todos.filter(t => t.id !== id));
    
    try {
      const res = await fetchWithAuth(`/api/todos/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete to-do');
    } catch (err) {
      // Revert on error
      setTodos(previousTodos);
      console.error(err);
    }
  };

  return (
    <div className="font-sans text-gray-800 bg-[#F8FAFC] p-6 lg:p-8 min-h-full w-full relative">
      <div className="max-w-[1200px] mx-auto space-y-8">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-[22px] font-bold text-[#111827]">Personal To-Do List</h2>
            <p className="text-[13px] text-gray-500 mt-1">Manage your private tasks and deadlines.</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#4F46E5] text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add To-Do
          </button>
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">{error}</div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 w-16 text-center">S. No</th>
                <th className="px-6 py-4">To Do Item</th>
                <th className="px-6 py-4 w-40 text-center">Deadline</th>
                <th className="px-6 py-4 w-32 text-center">Complete</th>
                <th className="px-6 py-4 w-24 text-right">Actions</th>
              </tr>
            </thead>
            
            {loading ? (
              <tbody>
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 mx-auto"></div>
                  </td>
                </tr>
              </tbody>
            ) : todos.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <CheckSquare className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-sm font-medium">No to-do items found</p>
                      <p className="text-xs text-gray-400 mt-1">Click "Add To-Do" to create your first personal task.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-100">
                {todos.map((todo, idx) => (
                  <tr key={todo.id} className={`hover:bg-gray-50/50 transition-colors group ${todo.isComplete ? 'bg-gray-50/50' : ''}`}>
                    <td className="px-6 py-4 text-center text-gray-400 font-medium text-xs">
                      {idx + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-medium transition-colors ${todo.isComplete ? 'text-gray-400 line-through' : 'text-gray-900 group-hover:text-indigo-600'}`}>
                        {todo.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-md border ${todo.isComplete ? 'text-gray-400 border-gray-200 bg-gray-50' : 'text-indigo-700 bg-indigo-50 border-indigo-100'}`}>
                        {new Date(todo.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => toggleComplete(todo)}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors ${todo.isComplete ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-gray-300 hover:text-indigo-500 hover:bg-indigo-50'}`}
                      >
                        {todo.isComplete ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3 transition-opacity">
                        <button 
                          onClick={() => deleteTodo(todo.id)} 
                          className="p-1.5 bg-white border border-gray-200 shadow-sm hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors"
                          title="Delete To-Do"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      </div>

      {/* Add To-Do Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-[450px] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900">Add Personal To-Do</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                <input 
                  type="text" 
                  value={newTodo.description} 
                  onChange={e => setNewTodo({...newTodo, description: e.target.value})} 
                  placeholder="What needs to be done?" 
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                />
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Deadline</label>
                <input 
                  type="date" 
                  value={newTodo.deadline} 
                  onChange={e => setNewTodo({...newTodo, deadline: e.target.value})} 
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddTodo}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save To-Do'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
