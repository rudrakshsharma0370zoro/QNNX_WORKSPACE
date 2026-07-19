import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminList } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

export const GET = requireRole(['admin', 'lead', 'user'], async (req) => {
  try {
    const url = new URL(req.url);
    const query = (url.searchParams.get('q') || '').toLowerCase();
    
    if (!query) {
      return NextResponse.json({ success: true, results: { users: [], projects: [], tasks: [] } });
    }
    
    // In a real large-scale application, you would use Algolia or Typesense for full-text search.
    // For now, we perform basic string matching across collections.
    const [users, projects, tasks] = await Promise.all([
      firestoreAdminList('users'),
      firestoreAdminList('projects'),
      firestoreAdminList('tasks')
    ]);
    
    const matchedUsers = users.filter((u: any) => 
      (u.name && u.name.toLowerCase().includes(query)) || 
      (u.email && u.email.toLowerCase().includes(query))
    );
    
    const matchedProjects = projects.filter((p: any) => 
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.description && p.description.toLowerCase().includes(query))
    );
    
    const matchedTasks = tasks.filter((t: any) => 
      (t.title && t.title.toLowerCase().includes(query)) ||
      (t.description && t.description.toLowerCase().includes(query))
    );
    
    return NextResponse.json({
      success: true,
      results: {
        users: matchedUsers,
        projects: matchedProjects,
        tasks: matchedTasks
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});