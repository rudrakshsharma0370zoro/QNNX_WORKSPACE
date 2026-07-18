"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  LayoutDashboard, Briefcase, CheckSquare, CalendarDays, FolderOpen,
  Search, Bell, Settings, LogOut, X, User as UserIcon
} from 'lucide-react';

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: 'John Doe',
    role: 'UI/UX Designer',
    email: 'john.doe@qnnx.com'
  });

  const navItems = [
    { name: 'Dashboard', href: '/dashboard/user', icon: LayoutDashboard },
    { name: 'My Projects', href: '/dashboard/user/projects', icon: Briefcase },
    { name: 'My Tasks', href: '/dashboard/user/tasks', icon: CheckSquare },
    { name: 'Meetings', href: '/dashboard/user/meetings', icon: CalendarDays },
    { name: 'Documents', href: '/dashboard/user/documents', icon: FolderOpen },
  ];

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
          <button className="flex items-center gap-3 px-3 py-2.5 w-full text-[13px] font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors">
            <LogOut className="w-[18px] h-[18px]" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-8 relative z-20">
          
          {/* Global Search Bar */}
          <div className="relative w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search tasks, projects, or documents..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-r border-gray-200 pr-6 relative">
              
              {/* Settings Dropdown */}
              <div className="relative">
                <button onClick={() => {setIsSettingsOpen(!isSettingsOpen); setIsNotifOpen(false);}} className="text-gray-400 hover:text-gray-600 transition-colors" title="Settings">
                  <Settings className="w-5 h-5" />
                </button>
                {isSettingsOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                    <button className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50">Account Settings</button>
                    <button className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50">Preferences</button>
                    <button className="w-full text-left px-4 py-2 text-[13px] text-gray-700 hover:bg-gray-50">Theme Options</button>
                  </div>
                )}
              </div>

              {/* Notifications Dropdown */}
              <div className="relative">
                <button onClick={() => {setIsNotifOpen(!isNotifOpen); setIsSettingsOpen(false);}} className="relative text-gray-400 hover:text-gray-600 transition-colors" title="Notifications">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                {isNotifOpen && (
                  <div className="absolute right-0 mt-3 w-72 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                      <span className="text-sm font-bold text-gray-900">Notifications</span>
                      <span className="text-[11px] text-indigo-600 cursor-pointer">Mark all read</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <div className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer">
                        <p className="text-[12px] font-semibold text-gray-900">New Task Assigned</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Alex Lead assigned you to "Design Wireframes"</p>
                      </div>
                      <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                        <p className="text-[12px] font-semibold text-gray-900">Meeting Reminder</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Sprint Planning starts in 15 minutes.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Profile Block */}
            <div 
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="text-right">
                <p className="text-[13px] font-semibold text-gray-900">{profileData.name}</p>
                <p className="text-[11px] text-gray-500">{profileData.role}</p>
              </div>
              <div className="w-9 h-9 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-sm">
                {profileData.name.charAt(0)}
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

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setIsProfileOpen(false)} className="px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={() => setIsProfileOpen(false)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[13px] font-semibold hover:bg-indigo-700 transition-colors">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
