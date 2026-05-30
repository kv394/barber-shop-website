import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({ error: 'Please provide an email query parameter' }, { status: 400 });
  }

  try {
    const result = await prisma.user.updateMany({
      where: { email },
      data: { role: 'SITE_ADMIN' }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Upgraded ${email} to SITE_ADMIN.`,
      recordsUpdated: result.count 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
