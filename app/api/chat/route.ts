import { NextResponse } from 'next/server';
import { processMessage } from '@/lib/ai/chat';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
 try {
 const { message, shopId, role } = await req.json();
 if (!message || !shopId) {
 return NextResponse.json({ reply: 'Missing required fields.' }, { status: 400 });
 }

 // Get session via Supabase server client
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
 const userRole = role || session?.user?.app_metadata?.role || 'SHOP_STAFF';

 const result = await processMessage({ message, shopId, userRole });
 return NextResponse.json(result);
 } catch (err) {
 console.error('Chat API error:', err);
 return NextResponse.json({ reply: '⚠️ Internal error processing your request.' }, { status: 500 });
 }
}
