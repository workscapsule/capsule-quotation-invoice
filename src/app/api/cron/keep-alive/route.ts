import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const timestamp = new Date().toISOString();
    
    // 1. Ping database through Prisma
    const [categoryCount, settings] = await Promise.all([
      prisma.category.count(),
      prisma.companySettings.findUnique({
        where: { id: 'default' },
        select: { companyName: true, updatedAt: true }
      })
    ]);

    // 2. Ping Supabase REST API directly
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    let restStatus = 'not_configured';

    if (supabaseUrl && supabaseAnonKey) {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/CompanySettings?select=id&limit=1`, {
          headers: {
            apikey: supabaseAnonKey,
            Authorization: `Bearer ${supabaseAnonKey}`
          },
          cache: 'no-store'
        });
        restStatus = res.ok ? 'active_healthy' : `status_${res.status}`;
      } catch (restErr: any) {
        restStatus = `error: ${restErr.message}`;
      }
    }

    return NextResponse.json({
      status: 'ok',
      message: 'Supabase keep-alive ping successful. Project is active and awake.',
      timestamp,
      database: {
        connected: true,
        companyName: settings?.companyName || 'Capsule Company',
        categoriesCount: categoryCount,
      },
      restApi: {
        status: restStatus
      }
    });
  } catch (error: any) {
    console.error('Keep-alive ping error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to execute keep-alive ping to Supabase',
        error: error.message
      },
      { status: 500 }
    );
  }
}
