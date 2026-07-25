"use client";

import { 
  Users, Calendar, ChevronDown, ClipboardList, 
  Hourglass, CheckCircle2, Target, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
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

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: '#f3f4f6', drawBorder: false },
      ticks: { stepSize: 5, font: { size: 11 }, color: '#9ca3af' },
      border: { display: false }
    },
    x: {
      grid: { display: false, drawBorder: false },
      ticks: { font: { size: 11 }, color: '#9ca3af' },
      border: { display: false }
    }
  },
};

const getDayCounts = (tasksArray: any[], targetStatus: string) => {
  const days = [0, 0, 0, 0, 0, 0, 0]; // Mon-Sun
  tasksArray.filter(t => t.status === targetStatus).forEach(t => {
    if (!t.createdAt) return;
    const date = typeof t.createdAt.toDate === 'function' ? t.createdAt.toDate() : new Date(t.createdAt);
    let dayIndex = date.getDay() - 1;
    if (dayIndex === -1) dayIndex = 6;
    days[dayIndex]++;
  });
  return days;
};

export default function LeadDashboard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [timeFilter, setTimeFilter] = useState<'all' | 'week'>('all');

  useEffect(() => {
    const unsubTasks = onSnapshot(query(collection(db, 'tasks')), snapshot => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubMeetings = onSnapshot(query(collection(db, 'meetings'), orderBy('date', 'desc'), limit(5)), snapshot => {
      setMeetings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubLogs = onSnapshot(query(collection(db, 'activityLog'), orderBy('createdAt', 'desc'), limit(10)), snapshot => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubUsers = onSnapshot(query(collection(db, 'users')), snapshot => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubTasks(); unsubMeetings(); unsubLogs(); unsubUsers(); };
  }, []);

  // Apply time filter
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (timeFilter === 'all') return true;
      if (!t.createdAt) return false;
      const date = typeof t.createdAt.toDate === 'function' ? t.createdAt.toDate() : new Date(t.createdAt);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return date >= oneWeekAgo;
    });
  }, [tasks, timeFilter]);

  const { completedTasks, inProgressTasks, pendingTasks, activeTeamMembers } = useMemo(() => {
    return {
      completedTasks: filteredTasks.filter(t => t.status === 'Completed').length,
      inProgressTasks: filteredTasks.filter(t => t.status === 'In Progress').length,
      pendingTasks: filteredTasks.filter(t => t.status === 'Pending').length,
      activeTeamMembers: users.filter(u => u.role === 'user').length
    };
  }, [filteredTasks, users]);

  const barChartData = useMemo(() => ({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Completed',
        data: getDayCounts(filteredTasks, 'Completed'),
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        barPercentage: 0.5,
        categoryPercentage: 0.6,
      },
      {
        label: 'In Progress',
        data: getDayCounts(filteredTasks, 'In Progress'),
        backgroundColor: '#10b981',
        borderRadius: 4,
        barPercentage: 0.5,
        categoryPercentage: 0.6,
      },
    ],
  }), [filteredTasks]);

  // Doughnut Chart Data
  const totalTasks = filteredTasks.length;
  const { doughnutData, doughnutOptions } = useMemo(() => ({
    doughnutData: {
      labels: ['Completed', 'In Progress', 'Pending'],
      datasets: [
        {
          data: totalTasks === 0 ? [1] : [completedTasks, inProgressTasks, pendingTasks],
          backgroundColor: totalTasks === 0 ? ['#f3f4f6'] : ['#10b981', '#3b82f6', '#ef4444'],
          borderWidth: 0,
          cutout: '75%',
        },
      ],
    },
    doughnutOptions: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: totalTasks > 0 }
      }
    }
  }), [totalTasks, completedTasks, inProgressTasks, pendingTasks]);

  // Calculate Top Team Members dynamically
  const topTeamMembers = useMemo(() => {
    const userTaskCounts: Record<string, number> = {};
    filteredTasks.forEach(t => {
      if (t.assigneeId) {
        userTaskCounts[t.assigneeId] = (userTaskCounts[t.assigneeId] || 0) + 1;
      }
    });
    
    return users
      .filter(u => u.role === 'user')
      .map(u => ({
        id: u.id,
        name: u.name || 'Unknown User',
        tasks: userTaskCounts[u.id] || 0,
      }))
      .sort((a, b) => b.tasks - a.tasks)
      .slice(0, 4);
  }, [filteredTasks, users]);

  const formattedLogs = useMemo(() => {
    return logs.map(log => ({
      ...log,
      formattedDate: new Date(log.createdAt).toLocaleString()
    }));
  }, [logs]);

  return (
    <div className="font-sans text-gray-800 bg-gray-50/30 p-6 lg:p-8 min-h-full w-full">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
            <p className="text-sm text-gray-500 mt-1">Track your team's performance and key activities.</p>
          </div>
          <div className="flex items-center gap-4 relative">
            <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as 'all' | 'week')}
              className="appearance-none flex items-center gap-2 px-4 py-2 pr-10 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Time</option>
              <option value="week">This Week</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 pointer-events-none text-gray-500" />
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
              <h3 className="text-2xl font-bold text-gray-900">{activeTeamMembers}</h3>
              <p className="text-xs text-green-500 font-medium mt-1">Active Accounts</p>
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
              <h3 className="text-2xl font-bold text-gray-900">{totalTasks}</h3>
              <p className="text-xs text-gray-400 font-medium mt-1">Total in workspace</p>
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
              <h3 className="text-2xl font-bold text-gray-900">{inProgressTasks}</h3>
              <p className="text-xs text-gray-400 font-medium mt-1">
                {totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0}% of total
              </p>
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
              <h3 className="text-2xl font-bold text-gray-900">{completedTasks}</h3>
              <p className="text-xs text-gray-400 font-medium mt-1">
                {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% of total
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                <Target className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-gray-500">Pending Tasks</p>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{pendingTasks}</h3>
              <p className="text-xs text-gray-400 font-medium mt-1">
                {totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0}% of total
              </p>
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
              </div>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              {totalTasks === 0 ? (
                <p className="text-sm text-gray-400">No task data available.</p>
              ) : (
                <Bar data={barChartData} options={barChartOptions} />
              )}
            </div>
          </div>

          {/* Doughnut Chart Container */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900">Task Progress</h3>
              <Link href="/dashboard/lead/tasks" className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">See all</Link>
            </div>
            
            <div className="flex-1 flex items-center justify-center gap-8">
              <div className="relative w-36 h-36">
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-bold text-gray-900">{totalTasks}</span>
                  <span className="text-[10px] text-gray-500">Total Tasks</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs font-medium text-gray-700">Completed</span>
                  </div>
                  <span className="text-xs text-gray-500 ml-4">
                    {completedTasks} ({totalTasks > 0 ? Math.round((completedTasks/totalTasks)*100) : 0}%)
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-xs font-medium text-gray-700">In Progress</span>
                  </div>
                  <span className="text-xs text-gray-500 ml-4">
                    {inProgressTasks} ({totalTasks > 0 ? Math.round((inProgressTasks/totalTasks)*100) : 0}%)
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="text-xs font-medium text-gray-700">Pending</span>
                  </div>
                  <span className="text-xs text-gray-500 ml-4">
                    {pendingTasks} ({totalTasks > 0 ? Math.round((pendingTasks/totalTasks)*100) : 0}%)
                  </span>
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
              <Link href="/dashboard/lead/meetings" className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">See all</Link>
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
              <Link href="/dashboard/lead/team" className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">See all</Link>
            </div>
            <div className="space-y-5">
              {topTeamMembers.length > 0 ? topTeamMembers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 uppercase">
                      {user.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{user.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-xs text-gray-500">{user.tasks} Tasks</span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-500 text-center py-4">No active team members.</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-6">Recent Activity</h3>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
              {formattedLogs.length > 0 ? formattedLogs.map((log) => (
                <div key={log.id} className="relative flex items-start gap-4">
                  <div className="w-5 h-5 rounded-full bg-white border-2 z-10 flex items-center justify-center mt-0.5 shrink-0 border-indigo-500">
                    <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">{log.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{log.formattedDate}</p>
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