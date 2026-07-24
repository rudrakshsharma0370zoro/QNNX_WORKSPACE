import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminList } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

export const GET = requireRole(['admin', 'lead', 'user'], async (req) => {
  try {
    const url = new URL(req.url);
    const query = (url.searchParams.get('q') || '').toLowerCase();

    if (!query) {
      return NextResponse.json({ success: true, results: [] });
    }

    // In a real large-scale application, you would use Algolia or Typesense for full-text search.
    // For now, we perform basic string matching across collections.
    const [users, projects, tasks, documents] = await Promise.all([
      firestoreAdminList('users'),
      firestoreAdminList('projects'),
      firestoreAdminList('tasks'),
      firestoreAdminList('documents')
    ]);

    // This route reads via the service account, bypassing firestore.rules, so
    // the same visibility policy those rules would enforce must be re-applied
    // here. A plain 'user' must only see tasks/projects they're assigned to
    // or created — otherwise search leaks every task in the org (see security
    // review: "/api/search leaking all tasks").
    const role = req.user.role || 'user';
    const uid = req.user.uid;
    const isPrivileged = role === 'admin' || role === 'lead';

    const visibleTasks = isPrivileged
      ? tasks
      : tasks.filter((t: any) =>
          t.createdBy === uid ||
          (Array.isArray(t.assignees) && t.assignees.includes(uid))
        );

    const visibleProjects = isPrivileged
      ? projects
      : projects.filter((p: any) =>
          p.createdBy === uid ||
          p.leadId === uid ||
          (Array.isArray(p.employeeIds) && p.employeeIds.includes(uid))
        );

    const matchedUsers = users.filter((u: any) =>
      (u.name && u.name.toLowerCase().includes(query)) ||
      (u.email && u.email.toLowerCase().includes(query))
    );

    const matchedProjects = visibleProjects.filter((p: any) =>
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.description && p.description.toLowerCase().includes(query))
    );

    const matchedTasks = visibleTasks.filter((t: any) =>
      (t.title && t.title.toLowerCase().includes(query)) ||
      (t.description && t.description.toLowerCase().includes(query))
    );

    const matchedDocuments = documents.filter((d: any) =>
      (d.title && d.title.toLowerCase().includes(query)) ||
      (d.name && d.name.toLowerCase().includes(query)) ||
      (d.filename && d.filename.toLowerCase().includes(query))
    );

    // Map matched items into a unified result set
    const unifiedResults: any[] = [];
    
    matchedUsers.forEach((u: any) => {
      unifiedResults.push({
        id: u.id,
        title: u.name || 'Unknown User',
        type: 'employee',
        url: `/dashboard/admin/employees/${u.id}`,
        subtitle: u.email || 'No email'
      });
    });

    matchedDocuments.forEach((d: any) => {
      unifiedResults.push({
        id: d.id,
        title: d.title || d.name || d.filename || 'Untitled Document',
        type: 'document',
        url: '/dashboard/admin/documents', // We route them to the documents overview
        subtitle: d.category || 'Document'
      });
    });

    return NextResponse.json({
      success: true,
      results: unifiedResults
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});