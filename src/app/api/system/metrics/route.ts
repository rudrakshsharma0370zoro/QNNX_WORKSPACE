import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminList } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

export const GET = requireRole(['admin'], async (req) => {
  try {
    const [users, projects, tasks, logs] = await Promise.all([
      firestoreAdminList('users'),
      firestoreAdminList('projects'),
      firestoreAdminList('tasks'),
      firestoreAdminList('activity_logs')
    ]);
    
    return NextResponse.json({
      success: true,
      metrics: {
        activeUsers: users.length,
        totalProjects: projects.length,
        totalTasks: tasks.length,
        recentActivities: logs.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});