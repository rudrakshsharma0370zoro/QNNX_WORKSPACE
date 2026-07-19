import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { firestoreAdminList } from '@/lib/firestoreAdmin';

export const runtime = 'edge';

export const GET = requireRole(['admin'], async (req) => {
  try {
    const start = Date.now();
    // Perform a lightweight query to verify DB connection
    await firestoreAdminList('organization_profile');
    const latency = Date.now() - start;
    
    return NextResponse.json({
      success: true,
      status: 'healthy',
      database: 'connected',
      latencyMs: latency,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      status: 'degraded',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
});