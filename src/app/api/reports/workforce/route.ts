import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminList } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

export const GET = requireRole(['admin', 'lead'], async (req) => {
  try {
    const users = await firestoreAdminList('users');
    const tasks = await firestoreAdminList('tasks');
    
    // Workforce aggregation
    const employeeCount = users.filter(u => u.role === 'user').length;
    const leadCount = users.filter(u => u.role === 'lead').length;
    
    const taskCompletionRates = users.map(user => {
      const userTasks = tasks.filter(t => t.assigneeId === user.id);
      const completed = userTasks.filter(t => t.status === 'Completed').length;
      return {
        userId: user.id,
        name: user.name || user.email,
        totalTasks: userTasks.length,
        completedTasks: completed,
        completionRate: userTasks.length ? Math.round((completed / userTasks.length) * 100) : 0
      };
    });
    
    return NextResponse.json({
      success: true,
      stats: {
        totalEmployees: employeeCount,
        totalLeads: leadCount,
        overallTaskCount: tasks.length
      },
      performance: taskCompletionRates
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});