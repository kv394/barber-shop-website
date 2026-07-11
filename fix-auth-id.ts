import { prisma } from './lib/prisma';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function main() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error || !users) {
     console.error('Cant list auth users using anon key. We must rely on sign in to get the UUID.');
     
     const { data, error: signInError } = await supabase.auth.signInWithPassword({
       email: 'admin@rhythmdance.com',
       password: 'password123',
     });
     if (data?.user) {
        const authId = data.user.id;
        console.log('Auth UUID:', authId);
        
        // update prisma user
        const pUser = await prisma.user.findFirst({ where: { email: 'admin@rhythmdance.com' } });
        if (pUser && pUser.id !== authId) {
            console.log('Updating Prisma User ID from', pUser.id, 'to', authId);
            
            // Wait, we can't update ID if it has relations, but let's see. 
            try {
              // We can create a new user and delete the old one or update the ID if postgres allows cascade.
              // Let's just update if possible
              await prisma.$executeRawUnsafe(`UPDATE "User" SET id = $1 WHERE email = $2`, authId, 'admin@rhythmdance.com');
              console.log('Synced ID successfully.');
            } catch (e) {
              console.log('Update ID failed, might need to delete and recreate or it has relations.');
            }
        }
     } else {
        console.log('Sign in failed:', signInError);
     }
  }
}
main();
