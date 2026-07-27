import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminDelete, firestoreAdminUpdate, firestoreAdminGet } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

// PATCH to update completion status
export const PATCH = requireRole(['admin', 'lead', 'user'], async (req, { params }) => {
  try {
    const { id } = await params;
    const body = await req.json();
    const uid = req.user.uid;

    if (!id) {
      return NextResponse.json({ error: 'Todo ID is required' }, { status: 400 });
    }

    // Verify ownership
    const todo = await firestoreAdminGet('todos', id);
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }
    if (todo.userId !== uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (body.isComplete !== undefined) {
      await firestoreAdminUpdate('todos', id, { isComplete: body.isComplete });
    }
    
    // Explicitly DO NOT call logActivityServer here to ensure privacy

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating todo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

// DELETE a todo
export const DELETE = requireRole(['admin', 'lead', 'user'], async (req, { params }) => {
  try {
    const { id } = await params;
    const uid = req.user.uid;

    if (!id) {
      return NextResponse.json({ error: 'Todo ID is required' }, { status: 400 });
    }

    // Verify ownership
    const todo = await firestoreAdminGet('todos', id);
    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 });
    }
    if (todo.userId !== uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await firestoreAdminDelete('todos', id);
    
    // Explicitly DO NOT call logActivityServer here to ensure privacy

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting todo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
