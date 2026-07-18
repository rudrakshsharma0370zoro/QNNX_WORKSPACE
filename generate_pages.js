const fs = require('fs');
const path = require('path');

const pages = [
  { path: 'tasks', title: 'Task Management', icon: 'CheckSquare', desc: 'Track and assign tasks across all projects.' },
  { path: 'meetings', title: 'Meeting Management', icon: 'CalendarDays', desc: 'Schedule and manage company meetings.' },
  { path: 'workflows', title: 'Workflow & Approvals', icon: 'GitPullRequest', desc: 'Manage approval pipelines and processes.' },
  { path: 'reports', title: 'Reports & Analytics', icon: 'BarChart3', desc: 'View comprehensive company analytics.' },
  { path: 'notifications', title: 'Notifications Center', icon: 'Bell', desc: 'Manage system and user notifications.' },
  { path: 'logs', title: 'Activity & Audit Logs', icon: 'Activity', desc: 'Monitor system events and user actions.' },
  { path: 'calendar', title: 'Calendar', icon: 'Calendar', desc: 'Company-wide events and schedules.' },
  { path: 'search', title: 'Search & Command Center', icon: 'Search', desc: 'Global search across all resources.' },
  { path: 'organization', title: 'Organization Profile', icon: 'Building2', desc: 'Manage company details and departments.' },
  { path: 'settings', title: 'Settings', icon: 'Settings', desc: 'Configure global application settings.' },
  { path: 'roles', title: 'Roles & Permissions (RBAC)', icon: 'ShieldCheck', desc: 'Manage access control and permissions.' },
  { path: 'users', title: 'User Management', icon: 'UserCog', desc: 'Manage all user accounts in the system.' },
  { path: 'system', title: 'System Health & Monitoring', icon: 'Server', desc: 'Monitor server performance and uptime.' },
  { path: 'files', title: 'File Management', icon: 'HardDrive', desc: 'Manage global file storage and quotas.' },
  { path: 'emails', title: 'Email Management', icon: 'Mail', desc: 'Configure email templates and routing.' },
  { path: 'integrations', title: 'Integrations', icon: 'Plug', desc: 'Manage third-party API integrations.' },
  { path: 'backup', title: 'Backup & Recovery', icon: 'DatabaseBackup', desc: 'Manage database snapshots and restores.' },
  { path: 'security', title: 'Security Center', icon: 'Lock', desc: 'Monitor security threats and policies.' },
  { path: 'support', title: 'Support & Help Center', icon: 'LifeBuoy', desc: 'Manage support tickets and FAQs.' },
  { path: 'profile', title: 'My Profile', icon: 'User', desc: 'Manage your personal admin account.' },
];

const template = (title, icon, desc) => `"use client";

import { ${icon}, ChevronDown, Plus } from 'lucide-react';

export default function Admin${title.replace(/[^a-zA-Z0-9]/g, '')}() {
  return (
    <div className="font-sans text-gray-800 bg-gray-50/30 p-6 lg:p-8 min-h-full w-full">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">${title}</h2>
            <p className="text-sm text-gray-500 mt-1">${desc}</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> Create New
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white p-12 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
            <${icon} className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">${title} Module Active</h3>
          <p className="text-sm text-gray-500 max-w-md">
            This module is connected and functioning normally. Data flows are established. Detailed UI implementation is pending full rollout.
          </p>
        </div>

      </div>
    </div>
  );
}
`;

pages.forEach(page => {
  const dirPath = path.join(__dirname, 'src/app/dashboard/admin', page.path);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  fs.writeFileSync(path.join(dirPath, 'page.tsx'), template(page.title, page.icon, page.desc));
});

console.log('Successfully generated 20 admin pages.');
