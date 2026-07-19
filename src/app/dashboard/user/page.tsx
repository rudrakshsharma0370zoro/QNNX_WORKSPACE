"use client";
import { 
  CheckCircle2, Clock, Briefcase, 
  Target, ChevronRight
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function UserOverview() {
  const { user: authUser } = useAuth();
  const CURRENT_USER_ID = authUser?.uid ?? null;

  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);

  useEffect(() => {
    // Wait for the uid: the tasks query below is filtered by it, and Firestore
    // rules reject the query outright without that filter.
    if (!CURRENT_USER_ID) return;

    const unsubProjects = onSnapshot(query(collection(db, 'projects')), (snapshot) => {
      setAllProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Must be filtered by assigneeId. Firestore rules constrain *queries*, not
    // rows: a plain user listing all tasks is denied entirely, so filtering in
    // memory afterwards would return nothing.
    const unsubTasks = onSnapshot(
      query(collection(db, 'tasks'), where('assigneeId', '==', CURRENT_USER_ID)),
      (snapshot) => {
        setAllTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    return () => { unsubProjects(); unsubTasks(); };
  }, [CURRENT_USER_ID]);

  const myProjects = allProjects.filter(p => p.employeeIds && p.employeeIds.includes(CURRENT_USER_ID));
  // Already scoped to this user by the query above.
  const myTasks = allTasks;
  
  const completedTasks = myTasks.filter(t => t.status === 'Completed').length;
  const inProgressTasks = myTasks.filter(t => t.status === 'In Progress').length;
  const pendingTasks = myTasks.filter(t => t.status === 'Pending').length;

  // Doughnut Chart Data
  const taskStatusData = {
    labels: ['Completed', 'In Progress', 'Pending'],
    datasets: [
      {
        data: [completedTasks, inProgressTasks, pendingTasks],
        backgroundColor: ['#10B981', '#3B82F6', '#F59E0B'],
        borderWidth: 0,
        hoverOffset: 4
      },
    ],
  };

  const doughnutOptions = {
    cutout: '75%',
    plugins: {
      legend: { position: 'bottom' as const, labels: { usePointStyle: true, boxWidth: 6, font: { size: 11, family: 'Inter' } } }
    },
    maintainAspectRatio: false
  };

  // Bar Chart Data (Tasks per Project)
  const projectNames = myProjects.map(p => p.name);
  const tasksPerProject = myProjects.map(p => myTasks.filter(t => t.projectId === p.id).length);

  const projectWorkloadData = {
    labels: projectNames,
    datasets: [
      {
        label: 'Assigned Tasks',
        data: tasksPerProject,
        backgroundColor: '#4F46E5',
        borderRadius: 4,
        barPercentage: 0.5,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1E293B',
        titleFont: { size: 13, family: 'Inter' },
        bodyFont: { size: 12, family: 'Inter' },
        padding: 10,
        cornerRadius: 8,
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11, family: 'Inter' }, color: '#64748B' } },
      y: { border: { dash: [4, 4] }, grid: { color: '#F1F5F9' }, ticks: { stepSize: 1, font: { size: 11, family: 'Inter' }, color: '#64748B' }, beginAtZero: true }
    },
    maintainAspectRatio: false
  };


  return (
    <div className="font-sans text-gray-800 bg-[#F8FAFC] p-6 lg:p-8 min-h-full w-full">
      <div className="max-w-[1200px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-[22px] font-bold text-[#111827]">Good Morning, {authUser?.displayName || authUser?.email?.split('@')[0] || 'User'}</h2>
          <p className="text-[13px] text-gray-500 mt-1">Here is the overview of your workday and pending assignments.</p>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-32">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                <Target className="w-5 h-5" />
              </div>
              <p className="text-[13px] font-medium text-gray-500">Total Tasks</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{myTasks.length}</h3>
              <p className="text-[11px] text-blue-500 font-medium mt-1">Across all projects</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-32">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
                <Clock className="w-5 h-5" />
              </div>
              <p className="text-[13px] font-medium text-gray-500">Pending Tasks</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{pendingTasks}</h3>
              <p className="text-[11px] text-orange-500 font-medium mt-1">Requires attention</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-32">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 text-green-500 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-[13px] font-medium text-gray-500">Completed</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{completedTasks}</h3>
              <p className="text-[11px] text-green-500 font-medium mt-1">Great job!</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-32">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 text-purple-500 rounded-lg">
                <Briefcase className="w-5 h-5" />
              </div>
              <p className="text-[13px] font-medium text-gray-500">Active Projects</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{myProjects.length}</h3>
              <p className="text-[11px] text-purple-500 font-medium mt-1">Currently assigned</p>
            </div>
          </div>
        </div>

        {/* Charts Section (New Visualizations) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
          
          {/* Bar Chart: Workload by Project */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 mb-6">Task Distribution by Project</h3>
            <div className="h-[250px] w-full">
              <Bar data={projectWorkloadData} options={barOptions} />
            </div>
          </div>

          {/* Doughnut Chart: Overall Status */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <h3 className="text-sm font-bold text-gray-900 mb-6">Overall Task Status</h3>
            <div className="relative flex-1 min-h-[220px] flex items-center justify-center">
              <Doughnut data={taskStatusData} options={doughnutOptions} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mb-6">
                <span className="text-3xl font-bold text-gray-900">{myTasks.length}</span>
                <span className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider">Total</span>
              </div>
            </div>
          </div>

        </div>

        {/* Detailed Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          
          {/* New/Pending Tasks Feed */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-gray-900">Your Action Items</h3>
              <button className="text-[12px] font-medium text-indigo-600 hover:underline">View all</button>
            </div>
            <div className="space-y-3">
              {myTasks.filter(t => t.status !== 'Completed').map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-gray-50 flex items-center justify-center border border-gray-200">
                      <Clock className="w-4 h-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900">{task.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">Priority: {task.priority}</p>
                    </div>
                  </div>
                  <button className="text-gray-300 group-hover:text-indigo-600 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {pendingTasks === 0 && (
                <p className="text-[13px] text-gray-500 text-center py-4">You are all caught up!</p>
              )}
            </div>
          </div>

          {/* Project Progress */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-gray-900">Project Completion</h3>
            </div>
            <div className="space-y-6">
              {myProjects.map(project => {
                const projTasks = myTasks.filter(t => t.projectId === project.id);
                const projDone = projTasks.filter(t => t.status === 'Completed').length;
                const projTotal = projTasks.length;
                const progress = projTotal === 0 ? 0 : Math.round((projDone / projTotal) * 100);

                return (
                  <div key={project.id}>
                    <div className="flex justify-between text-[13px] mb-2">
                      <span className="font-semibold text-gray-800">{project.name}</span>
                      <span className="font-medium text-gray-500">{progress}% Done</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#4F46E5] rounded-full transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
