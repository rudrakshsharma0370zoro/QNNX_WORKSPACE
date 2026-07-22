"use client";
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { LayoutDashboard, Users, CheckSquare, Calendar, FolderOpen, Bell, Settings, LogOut, Briefcase } from 'lucide-react';

export default function LeadLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, loading, logout } = useAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  useEffect(() => {
    if (!loading && (!user || role !== 'lead')) {
      router.push('/');
    }
  }, [user, role, loading, router]);

  if (loading || !user || role !== 'lead') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard/lead', icon: LayoutDashboard },
    { name: 'Projects', href: '/dashboard/lead/projects', icon: Briefcase },
    { name: 'Team', href: '/dashboard/lead/team', icon: Users },
    { name: 'Tasks', href: '/dashboard/lead/tasks', icon: CheckSquare },
    { name: 'Meetings', href: '/dashboard/lead/meetings', icon: Calendar },
    { name: 'Documents', href: '/dashboard/lead/documents', icon: FolderOpen },
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6">
          <Image src="/qnnx-logo.png" alt="QNNX Logo" width={150} height={40} className="w-auto h-8 object-contain" />
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
                }`}>
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 space-y-1">
          <Link href="/dashboard/lead/settings" className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50">
            <Settings className="w-5 h-5" /> Settings
          </Link>
          <button onClick={() => logout()} className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-8">
          <div className="flex items-center gap-6">
            {/* Notifications Dropdown */}
            <div className="relative">
              <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative text-gray-500 hover:text-gray-700">
                <Bell className="w-5 h-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-900">Notifications</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <p className="px-4 py-6 text-[12px] text-gray-500 text-center">No new notifications.</p>
                  </div>
                </div>
              )}
            </div>
            <div 
              onClick={() => router.push('/dashboard/lead/settings')} 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name || user?.email || 'Lead User'}</p>
                <p className="text-xs text-gray-500 capitalize">{role || 'Team Lead'}</p>
              </div>
              <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm uppercase">
                {user?.name ? user.name.charAt(0) : user?.email ? user.email.charAt(0) : 'L'}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}