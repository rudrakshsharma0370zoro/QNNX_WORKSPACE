"use client";

import { 
  Users, Calendar, ChevronDown, ClipboardList, 
  Hourglass, CheckCircle2, Target, AlertTriangle
} from 'lucide-react';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function LeadDashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const unsubTasks = onSnapshot(query(collection(db, 'tasks')), snapshot => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubMeetings = onSnapshot(query(collection(db, 'meetings'), orderBy('date', 'desc'), limit(5)), snapshot => {
      setMeetings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubLogs = onSnapshot(query(collection(db, 'activityLog'), orderBy('timestamp', 'desc'), limit(10)), snapshot => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubTasks(); unsubMeetings(); unsubLogs(); };
  }, []);

  const completedTasks = tasks.filter(t => t.status === 'Completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'Pending').length;

  // Bar Chart Data
  const barChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Completed',
        data: [35, 26, 42, 45, 38, 28, 18],
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        barPercentage: 0.5,
        categoryPercentage: 0.6,
      },
      {
        label: 'In Progress',
        data: [15, 10, 15, 20, 12, 7, 6],
        backgroundColor: '#10b981',
        borderRadius: 4,
        barPercentage: 0.5,
        categoryPercentage: 0.6,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, 
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f3f4f6', drawBorder: false },
        ticks: { stepSize: 10, font: { size: 11 }, color: '#9ca3af' },
        border: { display: false }
      },
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { font: { size: 11 }, color: '#9ca3af' },
        border: { display: false }
      }
    },
  };

  // Doughnut Chart Data
  const doughnutData = {
    labels: ['Completed', 'In Progress', 'Overdue'],
    datasets: [
      {
        data: [completedTasks || 59, inProgressTasks || 41, pendingTasks || 8],
        backgroundColor: ['#10b981', '#3b82f6', '#ef4444'],
        borderWidth: 0,
        cutout: '75%',
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    }
  };

  return (
    <div className="font-sans text-gray-800 bg-gray-50/30 p-6 lg:p-8 min-h-full w-full">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
            <p className="text-sm text-gray-500 mt-1">Track your team's performance and key activities.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
              This Week <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Top 5 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-gray-500">Team Members</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">12</h3>
              <p className="text-xs text-green-500 font-medium mt-1">Active</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 text-purple-500 rounded-lg">
                <ClipboardList className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-gray-500">Tasks Assigned</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{tasks.length || 58}</h3>
              <p className="text-xs text-green-500 font-medium mt-1">↑ 12% vs last week</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 text-orange-500 rounded-lg">
                <Hourglass className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-gray-500">Tasks In Progress</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{inProgressTasks || 24}</h3>
              <p className="text-xs text-gray-400 font-medium mt-1">41% of total</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 text-green-500 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-gray-500">Tasks Completed</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{completedTasks || 34}</h3>
              <p className="text-xs text-green-500 font-medium mt-1">↑ 15% vs last week</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                <Target className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-gray-500">Overdue Tasks</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{pendingTasks || 5}</h3>
              <p className="text-xs text-red-500 font-medium mt-1">↓ 5% vs last week</p>
            </div>
          </div>
        </div>

        {/* Middle Section: Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Bar Chart Container */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900">Team Performance</h3>
              <div className="flex items-center gap-6">
                <div className="flex gap-4 text-xs font-medium text-gray-500">
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Completed</span>
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> In Progress</span>
                </div>
                <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600">
                  This Week <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="h-64 w-full">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>

          {/* Doughnut Chart Container */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900">Task Progress</h3>
              <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">See all</span>
            </div>
            
            <div className="flex-1 flex items-center justify-center gap-8">
              <div className="relative w-36 h-36">
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-bold text-gray-900">{tasks.length || 58}</span>
                  <span className="text-[10px] text-gray-500">Total Tasks</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs font-medium text-gray-700">Completed</span>
                  </div>
                  <span className="text-xs text-gray-500 ml-4">{completedTasks || 34} (59%)</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-xs font-medium text-gray-700">In Progress</span>
                  </div>
                  <span className="text-xs text-gray-500 ml-4">{inProgressTasks || 24} (41%)</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-xs font-medium text-gray-700">Pending</span>
                  </div>
                  <span className="text-xs text-gray-500 ml-4">{pendingTasks || 5} (8%)</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Section: 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Upcoming Meetings */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900">Upcoming Meetings</h3>
              <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">See all</span>
            </div>
            <div className="space-y-4">
              {meetings.length > 0 ? meetings.map(meeting => (
                <div key={meeting.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{meeting.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{meeting.date} {meeting.time && `, ${meeting.time}`}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded flex items-center gap-1">
                    <Users className="w-3 h-3"/> {meeting.platform || 'Meeting'}
                  </span>
                </div>
              )) : (
                <p className="text-sm text-gray-500 text-center py-4">No upcoming meetings</p>
              )}
            </div>
          </div>

          {/* Top Team Members */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900">Top Team Members</h3>
              <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">See all</span>
            </div>
            <div className="space-y-5">
              {[
                { name: 'Alex User', tasks: 24, pct: '+12%' },
                { name: 'Sarah Smith', tasks: 18, pct: '+9%' },
                { name: 'John Doe', tasks: 15, pct: '+7%' },
                { name: 'Michael Brown', tasks: 12, pct: '+5%' },
              ].map((user, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{user.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-xs text-gray-500">{user.tasks} Tasks</span>
                    <span className="text-xs font-semibold text-green-500 w-8 text-right">{user.pct}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-6">Recent Activity (ActivityLog)</h3>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              {logs.length > 0 ? logs.map((log) => (
                <div key={log.id} className="relative flex items-start gap-4">
                  <div className="w-5 h-5 rounded-full bg-white border-2 z-10 flex items-center justify-center mt-0.5 shrink-0 border-indigo-500">
                    <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">{log.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}