import { NextResponse } from 'next/server';
import { firestoreAdminCreate, firestoreAdminUpdate } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

export async function GET() {
  // Prevent running in production environment for database safety
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Database seeding is forbidden in production.' }, { status: 403 });
  }

  // Basic check to ensure environment variables are present before trying to connect
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    return NextResponse.json({ 
      error: 'Firebase Configuration Missing. Please fill in the environment variables in your .env.local file.' 
    }, { status: 500 });
  }

  try {
    const now = new Date();

    // 1. Seed a Default Admin User Document
    // Using a static ID 'test_user_123' so you can use it for API requests
    await firestoreAdminCreate('users', {
      email: 'rudrakshsharma0370@gmail.com',
      name: 'Rudraksh Sharma',
      role: 'admin',
      createdAt: now,
      updatedAt: now
    }, 'test_user_123');

    // 2. Seed a Sample Task (linked to the admin user)
    await firestoreAdminCreate('tasks', {
      title: 'Complete Architecture Migration',
      description: 'Set up edge-compatible jose verifier and connect S3.',
      status: 'In Progress',
      priority: 'medium',
      s3Key: null,
      assigneeId: 'test_user_123',
      createdBy: 'test_user_123',
      createdAt: now,
      updatedAt: now
    }, 'sample_task_001');

    // 3. Seed a Sample Meeting
    await firestoreAdminCreate('meetings', {
      title: 'Architecture Review Sync',
      scheduledAt: now.toISOString(),
      hostId: 'test_user_123',
      s3Key: null,
      attendees: ['test_user_123'],
      createdAt: now,
      updatedAt: now
    }, 'sample_meeting_001');

    return NextResponse.json({ 
      success: true, 
      message: 'Database seeded successfully with users, tasks, and meetings collections via Admin SDK!' 
    });
  } catch (error: any) {
    console.error('Database seeding failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Seeding failed.' 
    }, { status: 500 });
  }
}
