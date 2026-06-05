import { NextResponse } from 'next/server';
import { processMessage } from '@/lib/ai/chat';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
 try {
 const { message, shopId } = await req.json();
 if (!message || !shopId) {
 return NextResponse.json({ reply: 'Missing required fields.' }, { status: 400 });
 }

 // Get session via Supabase server client
 const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
  return NextResponse.json({ reply: 'Unauthorized' }, { status: 401 });
  }
  const userRole = user.app_metadata?.role || 'SHOP_STAFF';

 const result = await processMessage({ message, shopId, userRole });
 return NextResponse.json(result);
 } catch (err) {
 console.error('Chat API error:', err);
 return NextResponse.json({ reply: '⚠️ Internal error processing your request.' }, { status: 500 });
 }
}
