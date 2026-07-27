"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import NotificationBell from '@/components/NotificationBell';
import GlobalSearch from '@/components/GlobalSearch';
import { db } from '@/lib/firebaseClient';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { isUpcoming } from '@/utils/meeting';
import { fetchWithAuth } from '@/utils/fetchWithAuth';
import {
  LayoutDashboard, Briefcase, CheckSquare, CalendarDays, FolderOpen,
  Search, Bell, Settings, LogOut, X, User as UserIcon, ListTodo
} from 'lucide-react';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, profile, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && (!user || role !== 'user')) {
      router.push('/');
    }
  }, [user, role, loading, router]);

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Draft state for the Edit Profile modal, seeded from the real signed-in
  // profile once it loads (replaces the previous hardcoded "John Doe").
  const [profileData, setProfileData] = useState({ name: '', role: 'Employee', email: '' });
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setProfileData(prev => ({ ...prev, name: profile.name, email: profile.email }));
    }
  }, [profile]);

  const displayName = profile?.name || user?.email || 'User';

  const navItems = [
    { name: 'Dashboard', href: '/dashboard/user', icon: LayoutDashboard },
    { name: 'My Projects', href: '/dashboard/user/projects', icon: Briefcase },
    { name: 'My Tasks', href: '/dashboard/user/tasks', icon: CheckSquare },
    { name: 'To-Do List', href: '/dashboard/user/todo', icon: ListTodo },
    { name: 'Meetings', href: '/dashboard/user/meetings', icon: CalendarDays },
    { name: 'Documents', href: '/dashboard/user/documents', icon: FolderOpen },
    { name: 'Settings', href: '/dashboard/user/settings', icon: Settings },
  ];

  if (loading || !user || role !== 'user') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8FAFC] relative">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 z-10">
        <div className="p-6 border-b border-gray-100">
          <img src="/qnnx-logo.png" alt="QNNX Logo" className="h-8 w-auto mb-1" />
          <p className="text-[10px] text-gray-500 tracking-widest font-semibold mt-1">EMPLOYEE PORTAL</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard/user');
            return (
              <Link key={item.name} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                  isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                <item.icon className="w-[18px] h-[18px]" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button onClick={() => logout()} className="flex items-center gap-3 px-3 py-2.5 w-full text-[13px] font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            <LogOut className="w-[18px] h-[18px]" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-8 relative z-20">
          
          {/* Global Search Bar */}
          <GlobalSearch />

          {/* Right Header Actions */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-r border-gray-200 pr-6 relative">
              
              {/* Notifications Dropdown */}
              <NotificationBell />
            </div>
            
            {/* Profile Block */}
            <div 
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="text-right">
                <p className="text-[13px] font-semibold text-gray-900">{displayName}</p>
                <p className="text-[11px] text-gray-500">{profileData.role}</p>
              </div>
              <div className="w-9 h-9 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto relative z-0">
          {children}
        </main>
      </div>

      {/* Profile Edit Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 bg-gray-900/40 z-[100] flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-[400px] border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-indigo-600" /> Edit Profile
              </h3>
              <button onClick={() => setIsProfileOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={profileData.name}
                  onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Job Role</label>
                <input 
                  type="text" 
                  value={profileData.role}
                  onChange={(e) => setProfileData({...profileData, role: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={profileData.email}
                  onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[11px] font-bold text-gray-800 uppercase tracking-wider mb-3">Personal Details</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                    <input 
                      type="tel" 
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Home Address</label>
                    <input 
                      type="text" 
                      placeholder="123 Main St, City, State"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">SSN (Secure)</label>
                    <input 
                      type="password" 
                      placeholder="XXX-XX-XXXX"
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-between gap-3 bg-gray-50">
              <button 
                disabled={deleting}
                onClick={async () => {
                  if (confirm("Are you absolutely sure you want to delete your profile? This is permanent!")) {
                    setDeleting(true);
                    setError("");
                    try {
                      if (!user?.uid) throw new Error("Not logged in");
                      const res = await fetchWithAuth(`/api/users/${user.uid}`, { method: 'DELETE' });
                      if (!res.ok) throw new Error("Failed to delete profile");
                      await logout();
                      router.push("/");
                    } catch (err: any) {
                      setError(err.message || "Failed to delete account");
                      setDeleting(false);
                    }
                  }
                }}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-[13px] font-semibold hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
              <div className="flex gap-3">
                <button onClick={() => setIsProfileOpen(false)} disabled={saving} className="px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    if (!user?.uid) return;
                    setSaving(true);
                    setError('');
                    try {
                      await fetchWithAuth(`/api/users/${user.uid}`, {
                        method: 'PATCH',
                        body: JSON.stringify({ name: profileData.name }),
                      });
                      setIsProfileOpen(false);
                    } catch (err: any) {
                      setError(err.message || 'Failed to update profile');
                    } finally {
                      setSaving(false);
                    }
                  }} 
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
            {error && <div className="px-6 pb-4 bg-gray-50 text-red-500 text-xs text-right">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
