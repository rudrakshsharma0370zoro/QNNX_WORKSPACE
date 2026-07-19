"use client";

import { useState } from 'react';
import { 
  Users, Briefcase, UserCircle, Target, 
  ChevronDown, Activity
} from 'lucide-react';
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
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useEffect } from 'react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function AdminOverview() {
  const [isMonthFilterOpen, setIsMonthFilterOpen] = useState(false);
  const [isYearFilterOpen, setIsYearFilterOpen] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState('This Month');
  const [selectedYear, setSelectedYear] = useState('2026');
  
  const [projects, setProjects] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const unsubProjects = onSnapshot(query(collection(db, 'projects')), (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => { unsubProjects(); unsubUsers(); };
  }, []);

  const totalLeads = users.filter(u => u.role === 'lead').length;
  const totalEmployees = users.filter(u => u.role === 'user').length;

  // Bar Chart Data: Projects timeline mock
  const barChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Projects Started',
        data: [2, 3, 5, 4, 6, 8, projects.length],
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        barPercentage: 0.5,
        categoryPercentage: 0.6,
      },
      {
        label: 'Projects Completed',
        data: [1, 2, 3, 2, 4, 5, 2],
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
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f3f4f6', drawBorder: false },
        ticks: { stepSize: 2, font: { size: 11 }, color: '#9ca3af' },
        border: { display: false }
      },
      x: {
        grid: { display: false, drawBorder: false },
        ticks: { font: { size: 11 }, color: '#9ca3af' },
        border: { display: false }
      }
    },
  };

  const inProgressProjects = projects.filter(p => p.status === 'In Progress').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;

  // Doughnut Chart Data
  const doughnutData = {
    labels: ['Completed', 'In Progress'],
    datasets: [
      {
        data: [completedProjects, inProgressProjects],
        backgroundColor: ['#10b981', '#3b82f6'],
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
            <h2 className="text-2xl font-bold text-gray-900">Admin Overview</h2>
            <p className="text-sm text-gray-500 mt-1">Monitor company-wide performance, projects, and workforce.</p>
          </div>
          <div className="flex items-center gap-4 relative z-20">
            <div className="relative">
              <button 
                onClick={() => setIsMonthFilterOpen(!isMonthFilterOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {selectedMonth} <ChevronDown className="w-4 h-4" />
              </button>
              {isMonthFilterOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                  {['This Month', 'Last Month', 'Last 3 Months', 'This Year'].map(m => (
                    <button 
                      key={m}
                      onClick={() => { setSelectedMonth(m); setIsMonthFilterOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 text-blue-500 rounded-lg">
                  <Briefcase className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-500">Total Projects</p>
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">{projects.length}</h3>
              <p className="text-xs text-gray-500 mt-1">{inProgressProjects} active right now</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 text-purple-500 rounded-lg">
                  <Users className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-500">Total Leads</p>
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">{totalLeads}</h3>
              <p className="text-xs text-gray-500 mt-1">Across all departments</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-36">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-50 text-orange-500 rounded-lg">
                  <UserCircle className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-500">Total Employees</p>
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">{totalEmployees}</h3>
              <p className="text-xs text-gray-500 mt-1">Growing steadily</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Bar Chart Container */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900">Company Project Growth</h3>
              <div className="flex items-center gap-6">
                <div className="flex gap-4 text-xs font-medium text-gray-500">
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Started</span>
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div> Completed</span>
                </div>
                
                <div className="relative">
                  <button 
                    onClick={() => setIsYearFilterOpen(!isYearFilterOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    {selectedYear} <ChevronDown className="w-3 h-3" />
                  </button>
                  {isYearFilterOpen && (
                    <div className="absolute right-0 mt-2 w-24 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10">
                      {['2026', '2025', '2024'].map(y => (
                        <button 
                          key={y}
                          onClick={() => { setSelectedYear(y); setIsYearFilterOpen(false); }}
                          className="w-full text-left px-4 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          {y}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </div>
            <div className="h-64 w-full">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>

          {/* Doughnut Chart Container */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900">Project Status</h3>
              <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">See projects</span>
            </div>
            
            <div className="flex-1 flex items-center justify-center gap-8">
              <div className="relative w-36 h-36">
                <Doughnut data={doughnutData} options={doughnutOptions} />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-bold text-gray-900">{projects.length}</span>
                  <span className="text-[10px] text-gray-500">Total</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs font-medium text-gray-700">Completed</span>
                  </div>
                  <span className="text-xs text-gray-500 ml-4">{completedProjects}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-xs font-medium text-gray-700">In Progress</span>
                  </div>
                  <span className="text-xs text-gray-500 ml-4">{inProgressProjects}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            Pending Approvals
          </h3>
          
          <div className="space-y-4">
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="text-[13px] font-semibold text-gray-900">Q3 Financial Report - Final Review</p>
                <p className="text-[11px] text-gray-500 mt-1">Submitted by: Sarah (Finance Lead)</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors">Reject</button>
                <button className="px-3 py-1.5 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors">Approve</button>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="text-[13px] font-semibold text-gray-900">New Employee Hardware Request</p>
                <p className="text-[11px] text-gray-500 mt-1">Submitted by: IT Department</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors">Reject</button>
                <button className="px-3 py-1.5 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors">Approve</button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
