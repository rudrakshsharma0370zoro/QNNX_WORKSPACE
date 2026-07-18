import Link from 'next/link';
import { ShieldCheck, Users, User } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">QNNX Portals</h1>
        <p className="text-gray-500">Select a dashboard environment to test</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
        
        {/* Admin Portal */}
        <Link href="/dashboard/admin" className="group">
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-center flex flex-col items-center h-full">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
            <p className="text-sm text-gray-500">Manage users, roles, teams, and system settings.</p>
          </div>
        </Link>

        {/* Lead Portal */}
        <Link href="/dashboard/lead" className="group">
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:blue-300 transition-all text-center flex flex-col items-center h-full">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Lead Dashboard</h2>
            <p className="text-sm text-gray-500">Track team metrics, activity logs, and assignments.</p>
          </div>
        </Link>

        {/* User Portal */}
        <Link href="/dashboard/user" className="group">
          <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:green-300 transition-all text-center flex flex-col items-center h-full">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <User className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Employee Dashboard</h2>
            <p className="text-sm text-gray-500">View personal tasks, meetings, and documents.</p>
          </div>
        </Link>

      </div>
    </div>
  );
}
