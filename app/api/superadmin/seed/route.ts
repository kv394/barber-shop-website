
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const SHOP_ID = 'cmn9kj24n0000lqzc7kcsmpst';

// ─── Known IDs from seed-heritage.ts ──────────────────────────────────────
const STAFF = {
  marcus:  'heritage-staff-marcus',
  deshawn: 'heritage-staff-deshawn',
  elena:   'heritage-staff-elena',
  jasmine: 'heritage-staff-jasmine',
};

const CLIENTS = {
  mike:   'hh-client-mike',
  james:  'hh-client-james',
  omar:   'hh-client-omar',
  tyler:  'hh-client-tyler',
  carlos: 'hh-client-carlos',
  david:  'hh-client-david',
};

const APTS = {
  apt01: 'hh-apt-01', // Mike - Fade - COMPLETED
  apt02: 'hh-apt-02', // James - Cut+Beard - COMPLETED
  apt06: 'hh-apt-06', // David - Shave - COMPLETED
  apt07: 'hh-apt-07', // Mike - Facial - COMPLETED
  apt08: 'hh-apt-08', // Omar - Braids - COMPLETED
};

// ───────────────────────────────────────────────────────────────────────────

async function 

export async function POST() {
  try {
    await main();
    return NextResponse.json({ success: true, message: 'Seed executed successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Use POST to execute seed' });
}
