import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminList, firestoreAdminCreate } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

// GET all todos for the strictly logged-in user
export const GET = requireRole(['admin', 'lead', 'user'], async (req) => {
  try {
    const uid = req.user.uid;
    // Strictly filter by userId
    const allTodos = await firestoreAdminList('todos', 'userId', '==', uid);
    
    // Sort by createdAt descending since Firestore Admin list might not order them
    allTodos.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ todos: allTodos });
  } catch (error: any) {
    console.error('Error fetching todos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});

// POST a new todo for the strictly logged-in user
export const POST = requireRole(['admin', 'lead', 'user'], async (req) => {
  try {
    const body = await req.json();
    const uid = req.user.uid;

    if (!body.description || !body.deadline) {
      return NextResponse.json({ error: 'Description and deadline are required' }, { status: 400 });
    }

    const todoData = {
      userId: uid, // Strict lock to the current user
      description: body.description,
      deadline: body.deadline,
      isComplete: false,
      createdAt: new Date().toISOString()
    };

    const newDocId = await firestoreAdminCreate('todos', todoData);
    
    // Explicitly DO NOT call logActivityServer here to ensure privacy
    
    return NextResponse.json({ id: newDocId, ...todoData });
  } catch (error: any) {
    console.error('Error creating todo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
});
