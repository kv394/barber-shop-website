import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { validateParams } from '@/app/lib/validation';
import { AuthCallbackSchema } from '@/lib/schemas/authCallback';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { code, redirect_to } = validateParams(AuthCallbackSchema, requestUrl.searchParams);

  // SECURITY: Validate redirect_to to prevent open redirect attacks.
  // Only allow relative paths that start with "/" and don't start with "//" (protocol-relative URLs).
  let next = '/';
  if (redirect_to) {
    const isRelativePath = redirect_to.startsWith('/') && !redirect_to.startsWith('//');
    if (isRelativePath) {
      next = redirect_to;
    }
    // Silently ignore invalid redirect_to values — don't reveal the restriction
  }

 if (code) {
 const supabase = await createClient();
 await supabase.auth.exchangeCodeForSession(code);
 }

 return NextResponse.redirect(new URL(next, requestUrl.origin));
}
