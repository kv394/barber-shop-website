import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limiter';

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams.error;

  const signUpAction = async (formData: FormData) => {
    'use server';
    
    // Rate Limiting
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    const rateLimitResult = await rateLimit(`signup:${ip}`, 5, 60 * 60); // 5 signups per hour per IP
    
    if (!rateLimitResult.success) {
      return redirect(`/sign-up?error=${encodeURIComponent('Too many signup attempts. Please try again later.')}`);
    }

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const supabase = await createClient();
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (authError) {
      if (authError.message.includes('Database error saving new user')) {
        // This is a known Supabase issue when the user exists in Prisma but was not in Supabase Auth.
        // The DB trigger fails due to unique constraint on email.
        let redirectUrl = null;
        try {
          const existingUser = await prisma.user.findUnique({ where: { email } });
          if (!existingUser) {
            redirectUrl = `/sign-up?error=${encodeURIComponent(authError.message)}`;
          } else {
            // Temporarily rename the email to bypass the Supabase trigger unique constraint
            const tempEmail = `temp_${Date.now()}_${email}`;
            await prisma.user.update({
              where: { email },
              data: { email: tempEmail },
            });

            // Retry signup after moving the old email out of the way
            const retry = await supabase.auth.signUp({
              email,
              password,
              options: { data: { name } }
            });

            if (retry.error) {
               // Restore original email if retry fails
               await prisma.user.update({ where: { id: existingUser.id }, data: { email } });
               redirectUrl = `/sign-up?error=${encodeURIComponent(retry.error.message)}`;
            } else {
              if (retry.data?.user) {
                 // The DB trigger might have created a new row for the new Supabase ID.
                 // Delete the new row (if it exists) and update the original row to link it to the new Supabase ID.
                 await prisma.user.delete({ where: { id: retry.data.user.id } }).catch(() => {});

                 await prisma.user.update({
                   where: { id: existingUser.id },
                   data: {
                     id: retry.data.user.id,
                     email: email,
                     name: name || existingUser.name,
                   },
                 });
              }
              redirectUrl = '/?message=Account created successfully.';
            }
          }
        } catch (retryError: any) {
          console.error("Cleanup retry error:", retryError);
          redirectUrl = `/sign-up?error=${encodeURIComponent('Please contact support. Account is in an unrecoverable state.')}`;
        }
        
        if (redirectUrl) return redirect(redirectUrl);
      }
      return redirect(`/sign-up?error=${encodeURIComponent(authError.message)}`);
    }

    // Supabase security feature: If the user already exists in Auth, it returns the user object 
    // but with an empty identities array to prevent email enumeration. 
    // We can use this to show the correct duplicate account message!
    if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
      return redirect(`/sign-up?error=${encodeURIComponent('An account with this email already exists. Please sign in instead.')}`);
    }

    if (authData.user) {
      // Fix for disconnected developer environments:
      // If the user exists in Prisma but was deleted from Supabase Auth, their IDs will be out of sync.
      // We will attempt to update the Prisma ID to the new Supabase ID to heal the connection.
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== authData.user.id) {
        try {
          await prisma.$executeRaw`UPDATE "User" SET id = ${authData.user.id} WHERE email = ${email}`;
        } catch (e) {
          console.error("Could not update disconnected user ID", e);
        }
      }

      // Sync the new user to your Prisma database
      await prisma.user.upsert({
        where: { email: authData.user.email! },
        update: { name: name || undefined },
        create: {
          id: authData.user.id,
          email: authData.user.email!,
          name: name || null,
          role: 'CLIENT',
        },
      });
    }

    return redirect('/?message=Account created successfully');
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-8 mt-12 mb-12">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-gray-400">Join to book your next appointment</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg mb-6 text-sm text-center">{error}</div>
        )}

        <form action={signUpAction} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
            <input name="name" type="text" required placeholder="John Doe" className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
            <input name="email" type="email" required placeholder="you@example.com" className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <input name="password" type="password" required minLength={8} placeholder="••••••••" className="w-full bg-black/50 border border-white/20 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none" />
          </div>
          <button type="submit" className="w-full bg-brand-gold text-black font-bold py-3 rounded-lg hover:bg-white transition-colors mt-2">Sign Up</button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-8">Already have an account? <Link href="/sign-in" className="text-brand-gold hover:underline">Sign In</Link></p>
      </div>
    </div>
  );
}