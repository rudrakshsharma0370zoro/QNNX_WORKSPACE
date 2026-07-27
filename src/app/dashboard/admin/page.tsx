"use client";

import { useState } from 'react';
import {
  Users, Briefcase, UserCircle, Target,
  ChevronDown, Activity, UserCheck
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
import { collection, onSnapshot, query, where, doc, deleteDoc } from 'firebase/firestore';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import { useUsers } from '@/components/AppDataProvider';
import { useEffect, useMemo } from 'react';

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

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: { enabled: false }
  }
};

export default function AdminOverview() {
  const [isMonthFilterOpen, setIsMonthFilterOpen] = useState(false);
  const [isYearFilterOpen, setIsYearFilterOpen] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState('This Month');
  const [selectedYear, setSelectedYear] = useState('2026');
  
  const [projects, setProjects] = useState<any[]>([]);
  // const [users, setUsers] = useState<any[]>([]);
  // const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const users = useUsers(); // shared roster — see src/components/AppDataProvider.tsx
  // Real pending sign-ups awaiting an admin's role assignment, derived from
  // the shared roster in memory instead of running a second Firestore query.
  const pendingUsers = useMemo(() => users.filter((u: any) => u.role === 'pending'), [users]);
  const [approvalBusyId, setApprovalBusyId] = useState<string | null>(null);
  const [approvalError, setApprovalError] = useState('');

  useEffect(() => {
    const unsubProjects = onSnapshot(query(collection(db, 'projects')), (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    // const unsubUsers = onSnapshot(query(collection(db, 'users')), (snapshot) => {
    //   setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    // });
    // const unsubPending = onSnapshot(
    //   query(collection(db, 'users'), where('role', '==', 'pending')),
    //   (snapshot) => {
    //     setPendingUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    //   }
    // );
    return () => { unsubProjects(); };
  }, []);

  // Approve: assigns the real role via the backend (sets the authoritative
  // Firebase custom claim and mirrors it onto the users doc).
  const handleApprove = async (uid: string, role: 'user' | 'lead' | 'admin') => {
    setApprovalBusyId(uid);
    setApprovalError('');
    try {
      const res = await fetchWithAuth(`/api/users/${uid}/role`, {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.details || body.error || 'Failed to approve user.');
      }
    } catch (e: any) {
      setApprovalError(e.message || 'Failed to approve user.');
    } finally {
      setApprovalBusyId(null);
    }
  };

  // Reject: removes the pending profile document (permitted directly by
  // firestore.rules for admins). Note this does not delete the underlying
  // Firebase Auth account — only an admin acting in the Firebase Console can
  // do that — so a rejected person could technically sign back in and their
  // pending doc would be recreated on next login.
  const handleReject = async (uid: string) => {
    setApprovalBusyId(uid);
    setApprovalError('');
    try {
      await deleteDoc(doc(db, 'users', uid));
    } catch (e: any) {
      setApprovalError(e.message || 'Failed to reject user.');
    } finally {
      setApprovalBusyId(null);
    }
  };

  const totalLeads = useMemo(() => users.filter(u => u.role === 'lead').length, [users]);
  const totalEmployees = useMemo(() => users.filter(u => u.role === 'user').length, [users]);

  const { barChartData, inProgressProjects, completedProjects, doughnutData } = useMemo(() => {
    // Dynamic Projects Timeline Data (Starts July 2026)
    const launchDate = new Date(2026, 6, 1); // July 2026 (month is 0-indexed)
    const currentDate = new Date();
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    let totalMonths = (currentDate.getFullYear() - launchDate.getFullYear()) * 12 + (currentDate.getMonth() - launchDate.getMonth()) + 1;
    if (totalMonths < 1) totalMonths = 1;

    const chartLabels: string[] = [];
    for (let i = 0; i < totalMonths; i++) {
      const d = new Date(launchDate.getFullYear(), launchDate.getMonth() + i, 1);
      chartLabels.push(monthNames[d.getMonth()]);
    }

    const startedData = Array(chartLabels.length).fill(0);
    const completedData = Array(chartLabels.length).fill(0);

    let inProgressCount = 0;
    let completedCount = 0;

    projects.forEach((p) => {
      if (p.status === 'In Progress') inProgressCount++;
      if (p.status === 'Completed') completedCount++;

      if (!p.createdAt) return;
      const d = new Date(p.createdAt);
      
      const monthDiff = (d.getFullYear() - launchDate.getFullYear()) * 12 + (d.getMonth() - launchDate.getMonth());
      
      if (monthDiff >= 0 && monthDiff < totalMonths) {
        startedData[monthDiff] += 1;
        if (p.status === 'Completed') {
          completedData[monthDiff] += 1;
        }
      }
    });

    return {
      inProgressProjects: inProgressCount,
      completedProjects: completedCount,
      barChartData: {
        labels: chartLabels,
        datasets: [
          {
            label: 'Projects Started',
            data: startedData,
            backgroundColor: '#3b82f6',
            borderRadius: 4,
            barPercentage: 0.5,
            categoryPercentage: 0.6,
          },
          {
            label: 'Projects Completed',
            data: completedData,
            backgroundColor: '#10b981',
            borderRadius: 4,
            barPercentage: 0.5,
            categoryPercentage: 0.6,
          },
        ],
      },
      doughnutData: {
        labels: ['Completed', 'In Progress'],
        datasets: [
          {
            data: [completedCount, inProgressCount],
            backgroundColor: ['#10b981', '#3b82f6'],
            borderWidth: 0,
            cutout: '75%',
          },
        ],
      }
    };
  }, [projects]);

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

        {/* Pending Approvals — real signups awaiting a role, not mock data */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-500" />
            Pending Approvals
            {pendingUsers.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-[11px] font-bold text-indigo-600 bg-indigo-50 rounded-full">
                {pendingUsers.length}
              </span>
            )}
          </h3>

          {approvalError && (
            <p className="mb-4 text-[12px] text-red-600">{approvalError}</p>
          )}

          {pendingUsers.length === 0 ? (
            <div className="py-8 text-center">
              <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-[13px] text-gray-500">No pending sign-ups right now.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((pu) => {
                const busy = approvalBusyId === pu.id;
                return (
                  <div key={pu.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                      <p className="text-[13px] font-semibold text-gray-900">{pu.name || 'Unnamed User'}</p>
                      <p className="text-[11px] text-gray-500 mt-1">{pu.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(pu.id)}
                        disabled={busy}
                        className="px-3 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors disabled:opacity-60"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(pu.id, 'user')}
                        disabled={busy}
                        className="px-3 py-1.5 text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-60"
                      >
                        {busy ? 'Working…' : 'Approve as User'}
                      </button>
                      <button
                        onClick={() => handleApprove(pu.id, 'lead')}
                        disabled={busy}
                        className="px-3 py-1.5 text-[11px] font-bold text-white bg-gray-700 hover:bg-gray-800 rounded-md transition-colors disabled:opacity-60"
                      >
                        {busy ? 'Working…' : 'Approve as Lead'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
