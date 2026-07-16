import React from 'react';
import { Plus, Edit2, Trash2, Calendar, User, MoreVertical } from 'lucide-react';

// Demo data - Tasks
const tasksList = [
  { id: 1, title: 'Update Dashboard Layout', description: 'Redesign the main overview page.', priority: 'High', dueDate: 'Oct 25, 2026', assignee: 'Alex Chen', status: 'In Progress', statusColor: 'bg-blue-100 text-blue-700' },
  { id: 2, title: 'Review API Documentation', description: 'Check endpoints for the new mobile app.', priority: 'Medium', dueDate: 'Oct 26, 2026', assignee: 'Sarah Jenkins', status: 'Pending', statusColor: 'bg-amber-100 text-amber-700' },
  { id: 3, title: 'Fix Authentication Bug', description: 'Resolve the JWT token expiration issue.', priority: 'High', dueDate: 'Oct 24, 2026', assignee: 'John Doe', status: 'Completed', statusColor: 'bg-emerald-100 text-emerald-700' },
  { id: 4, title: 'Design Assets Upload', description: 'Upload latest Figma exports to storage.', priority: 'Low', dueDate: 'Oct 28, 2026', assignee: 'Maria Garcia', status: 'Pending', statusColor: 'bg-amber-100 text-amber-700' },
];

export default function TasksPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
          <p className="text-gray-500 mt-1">Assign tasks, update statuses, and track team progress.</p>
        </div>
        {/* Create Task Button */}
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Create Task
        </button>
      </div>

      {/* Task Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="px-6 py-4">Task Name & Desc</th>
                <th className="px-6 py-4">Assignee</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasksList.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                  {/* Title & Description */}
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-gray-900">{task.title}</p>
                    <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">{task.description}</p>
                  </td>
                  
                  {/* Assignee */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                        {task.assignee.charAt(0)}
                      </div>
                      {task.assignee}
                    </div>
                  </td>

                  {/* Due Date */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {task.dueDate}
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                      task.priority === 'High' ? 'bg-red-50 text-red-700' : 
                      task.priority === 'Medium' ? 'bg-amber-50 text-amber-700' : 
                      'bg-green-50 text-green-700'
                    }`}>
                      {task.priority}
                    </span>
                  </td>

                  {/* Status Dropdown (Simulated) */}
                  <td className="px-6 py-4">
                    <select className={`text-xs font-medium px-2 py-1.5 rounded-lg border-none focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer ${task.statusColor}`} defaultValue={task.status}>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>

                  {/* Actions (Edit / Delete) */}
                  <td className="px-6 py-4">
                    <div className="flex justify-end items-center gap-3">
                      <button className="text-gray-400 hover:text-indigo-600 transition-colors" title="Edit Task">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="text-gray-400 hover:text-red-600 transition-colors" title="Delete Task">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}