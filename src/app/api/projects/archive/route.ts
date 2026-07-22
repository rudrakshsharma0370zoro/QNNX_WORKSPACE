import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminGet, firestoreAdminList, firestoreAdminDelete } from '@/lib/firestoreAdmin';
import { uploadJsonToS3 } from '@/lib/s3';

export const runtime = 'edge';

/**
 * POST /api/projects/archive
 * 
 * Archives older projects to AWS S3. 
 * Expected payload: { projectIds: string[] }
 */
export const POST = requireRole(['admin'], async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { projectIds } = body;

    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json(
        { error: 'Bad Request', details: 'Must provide an array of projectIds to archive.' },
        { status: 400 }
      );
    }

    const allTasks = await firestoreAdminList('tasks');
    const archivedList: string[] = [];
    const failedList: string[] = [];

    for (const projectId of projectIds) {
      if (typeof projectId !== 'string') continue;
      
      try {
        const projectData = await firestoreAdminGet('projects', projectId);
        if (!projectData) {
          failedList.push(projectId);
          continue;
        }

        const projectTasks = allTasks.filter((t: any) => t.projectId === projectId);
        
        const archivePayload = {
          archivedAt: new Date().toISOString(),
          project: { id: projectId, ...projectData },
          tasks: projectTasks,
        };

        const s3Key = `archives/projects/${projectId}.json`;
        await uploadJsonToS3(s3Key, archivePayload);

        // Delete from Firestore
        await Promise.all([
          firestoreAdminDelete('projects', projectId),
          ...projectTasks.map((t: any) => firestoreAdminDelete('tasks', String(t.id)))
        ]);

        archivedList.push(projectId);
      } catch (err) {
        console.error(`Failed to archive project ${projectId}:`, err);
        failedList.push(projectId);
      }
    }

    return NextResponse.json({
      success: true,
      archived: archivedList,
      failed: failedList,
      message: `Successfully archived ${archivedList.length} projects.`
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Operation failed.';
    console.error('[API Projects Archive] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: message }, { status: 500 });
  }
});
