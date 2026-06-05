import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { validateParams } from '@/app/lib/validation';
import { AuthCallbackSchema } from '@/lib/schemas/authCallback';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { code, redirect_to } = validateParams(AuthCallbackSchema, requestUrl.searchParams);
  const next = redirect_to ?? '/';

 if (code) {
 const supabase = await createClient();
 await supabase.auth.exchangeCodeForSession(code);
 }

 return NextResponse.redirect(new URL(next, requestUrl.origin));
}
