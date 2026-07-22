import { NextRequest, NextResponse } from 'next/server';
import { firestoreAdminCreate, firestoreAdminUpdate } from '@/lib/firestoreAdmin';
import { timingSafeEqual } from '@/lib/security';

export const runtime = 'edge';

/**
 * Dev/debug routes are a common source of prod exposure: relying on
 * `NODE_ENV === 'production'` alone is fragile — plenty of preview/staging
 * deploys (including Cloudflare Pages preview branches) don't set NODE_ENV to
 * exactly 'production', which would leave this reachable by anyone on the
 * internet with no credentials (see security review, "dev/seed reachable
 * without auth"). Require an explicit secret header in addition, and require
 * that secret to actually be configured — if `DEV_SEED_SECRET` is unset, the
 * route is unconditionally disabled regardless of NODE_ENV.
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Database seeding is forbidden in production.' }, { status: 403 });
  }

  const seedSecret = process.env.DEV_SEED_SECRET;
  const provided = req.headers.get('x-dev-seed-secret');
  if (!seedSecret || !provided || !timingSafeEqual(provided, seedSecret)) {
    return NextResponse.json(
      { error: 'Forbidden', details: 'Missing or invalid x-dev-seed-secret header.' },
      { status: 403 }
    );
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
    // Using a static ID 'test_user_123' so you can use it for API requests.
    // Placeholder email — never seed a real person's address into a database
    // that a public repo's seed script can recreate.
    await firestoreAdminCreate('users', {
      email: 'seed-admin@example.com',
      name: 'Seed Admin',
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
