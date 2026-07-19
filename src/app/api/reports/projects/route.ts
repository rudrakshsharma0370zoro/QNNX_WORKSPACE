import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminList } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

export const GET = requireRole(['admin', 'lead'], async (req) => {
  try {
    const projects = await firestoreAdminList('projects');
    
    // Aggregation logic
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;
    const activeProjects = projects.filter(p => p.status === 'Active' || p.status === 'In Progress').length;
    const pendingProjects = projects.filter(p => p.status === 'Pending').length;
    
    return NextResponse.json({
      success: true,
      stats: {
        total: totalProjects,
        completed: completedProjects,
        active: activeProjects,
        pending: pendingProjects
      },
      projects
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});