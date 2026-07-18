export const mockProjects = [
  { id: 'p1', name: 'Website Redesign', status: 'In Progress', deadline: '2026-08-15', leadId: 'l1', employeeIds: ['e1', 'e2'] },
  { id: 'p2', name: 'Mobile App Launch', status: 'In Progress', deadline: '2026-09-01', leadId: 'l2', employeeIds: ['e3', 'e4'] },
  { id: 'p3', name: 'Marketing Campaign Q3', status: 'Completed', deadline: '2026-07-10', leadId: 'l1', employeeIds: ['e2', 'e5'] },
];

export const mockLeads = [
  { id: 'l1', name: 'Alex Lead', department: 'Design', email: 'alex@qnnx.com', avatar: 'A' },
  { id: 'l2', name: 'Sarah Lead', department: 'Engineering', email: 'sarah@qnnx.com', avatar: 'S' },
];

export const mockTeams = [
  { id: 'tm1', name: 'Core Product Design', department: 'Design', leadId: 'l1', members: 4, status: 'Active' },
  { id: 'tm2', name: 'Backend Infrastructure', department: 'Engineering', leadId: 'l2', members: 6, status: 'Active' },
];

export const mockEmployees = [
  { id: 'e1', name: 'John Doe', role: 'UI/UX Designer', email: 'john@qnnx.com', avatar: 'J' },
  { id: 'e2', name: 'Jane Smith', role: 'Frontend Developer', email: 'jane@qnnx.com', avatar: 'J' },
  { id: 'e3', name: 'Michael Brown', role: 'Backend Developer', email: 'michael@qnnx.com', avatar: 'M' },
  { id: 'e4', name: 'Emily White', role: 'Mobile Developer', email: 'emily@qnnx.com', avatar: 'E' },
  { id: 'e5', name: 'Chris Green', role: 'Marketing Specialist', email: 'chris@qnnx.com', avatar: 'C' },
];

export const mockTasks = [
  { id: 't1', title: 'Design Homepage Wireframes', status: 'Completed', priority: 'High', assigneeId: 'e1', projectId: 'p1' },
  { id: 't2', title: 'Implement Auth Flow', status: 'In Progress', priority: 'Critical', assigneeId: 'e3', projectId: 'p2' },
  { id: 't3', title: 'Write Ad Copy', status: 'Pending', priority: 'Medium', assigneeId: 'e5', projectId: 'p3' },
];

export const mockMeetings = [
  { id: 'm1', title: 'Sprint Planning', date: '2026-07-20T10:00:00', duration: '60m', type: 'Video', attendees: ['l1', 'e1', 'e2'] },
  { id: 'm2', title: 'Architecture Review', date: '2026-07-21T14:30:00', duration: '90m', type: 'In-Person', attendees: ['l2', 'e3', 'e4'] },
];

export const mockLogs = [
  { id: 'log1', action: 'User Created', user: 'Admin', target: 'John Doe', time: '2026-07-17T09:12:00', status: 'Success' },
  { id: 'log2', action: 'Project Deleted', user: 'Alex Lead', target: 'Legacy App', time: '2026-07-16T15:45:00', status: 'Warning' },
  { id: 'log3', action: 'Failed Login', user: 'Unknown', target: 'System', time: '2026-07-16T22:10:00', status: 'Error' },
];

export const mockNotifications = [
  { id: 'n1', message: 'System update scheduled for midnight.', type: 'Info', read: false },
  { id: 'n2', message: 'High CPU usage detected on Node 3.', type: 'Alert', read: false },
];

export const mockEmails = [
  { id: 'em1', subject: 'Welcome to QNNX', from: 'HR', to: 'John Doe', date: '2026-07-01' },
  { id: 'em2', subject: 'Invoice #40291', from: 'Billing', to: 'Vendor Corp', date: '2026-07-15' },
];

export const mockSystemStats = {
  cpuUsage: 45,
  memoryUsage: 62,
  storageUsage: 80,
  activeConnections: 1205,
  uptime: '45d 12h 30m'
};
