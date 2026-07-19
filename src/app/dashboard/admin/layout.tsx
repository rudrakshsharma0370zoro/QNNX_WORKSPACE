"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { 
  LayoutDashboard, Briefcase, Users, UserCircle, Bell, Settings, LogOut, FolderOpen,
  CheckSquare, CalendarDays, GitPullRequest, BarChart3, Activity, Calendar, Search,
  Building2, ShieldCheck, UserCog, Server, HardDrive, Mail, Plug, DatabaseBackup, Lock, LifeBuoy, User
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, loading, logout } = useAuth();
  
  useEffect(() => {
    if (!loading && (!user || role !== 'admin')) {
      router.push('/');
    }
  }, [user, role, loading, router]);

  if (loading || !user || role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  
  const navGroups = [
    {
      title: "Overview",
      items: [
        { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard }
      ]
    },
    {
      title: "People & Projects",
      items: [
        { name: 'Employees', href: '/dashboard/admin/employees', icon: UserCircle },
        { name: 'Leads', href: '/dashboard/admin/leads', icon: Users },
        { name: 'Teams', href: '/dashboard/admin/teams', icon: Users },
        { name: 'Projects', href: '/dashboard/admin/projects', icon: Briefcase },
        { name: 'Tasks', href: '/dashboard/admin/tasks', icon: CheckSquare }
      ]
    },
    {
      title: "Operations",
      items: [
        { name: 'Documents', href: '/dashboard/admin/documents', icon: FolderOpen },
        { name: 'Meetings', href: '/dashboard/admin/meetings', icon: CalendarDays }
      ]
    },
    {
      title: "System & Settings",
      items: [
        { name: 'Roles & Permissions', href: '/dashboard/admin/roles', icon: ShieldCheck },
        { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings }
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col h-full">
        <div className="p-6 shrink-0 border-b border-gray-100">
          <img src="/qnnx-logo.png" alt="QNNX Logo" className="h-8 w-auto mb-1" />
          <p className="text-xs text-gray-500 tracking-wider">ADMINISTRATION</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6 sidebar-scroll">
          {navGroups.map((group, idx) => (
            <div key={idx}>
              <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard/admin');
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
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 shrink-0 border-t border-gray-200 space-y-1">
          <button onClick={() => logout()} className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        {/* Top Header */}
        <header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-8">
          {/* Search Bar */}
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search across workspace..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-6">
            <Link href="/dashboard/admin/notifications" className="relative text-gray-500 hover:text-gray-700">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">System Administrator</p>
              </div>
              <Link href="/dashboard/admin/profile" className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm hover:ring-2 hover:ring-indigo-200 transition-all">
                A
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      <style jsx global>{`
        .sidebar-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .sidebar-scroll::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
        }
        .sidebar-scroll:hover::-webkit-scrollbar-thumb {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
