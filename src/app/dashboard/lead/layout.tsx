"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CheckSquare, Calendar, FolderOpen, Bell, Settings, LogOut } from 'lucide-react';

export default function LeadLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const navItems = [
    { name: 'Dashboard', href: '/dashboard/lead', icon: LayoutDashboard },
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
          <h1 className="text-xl font-bold text-gray-900">QNNX</h1>
          <p className="text-xs text-gray-500 tracking-wider">WORKSPACE</p>
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
          <button className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50">
            <Settings className="w-5 h-5" /> Settings
          </button>
          <button className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-50">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-8">
          <div className="flex items-center gap-6">
            <button className="relative text-gray-500 hover:text-gray-700">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Lead User</p>
                <p className="text-xs text-gray-500">Team Lead</p>
              </div>
              <div className="w-9 h-9 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                L
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