import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const testEmail = 'trigger_test_' + Date.now() + '@example.com';
  
  // 1. Create a dummy user in Prisma
  const u = await prisma.user.create({
      data: {
          email: testEmail,
          role: 'CLIENT'
      }
  });

  console.log("Created Prisma User:", u.id);

  // 2. Temporarily rename
  const tempEmail = 'temp_' + Date.now() + '_' + testEmail;
  await prisma.user.update({
      where: { email: testEmail },
      data: { email: tempEmail }
  });

  // 3. Create in Supabase (fires trigger)
  console.log("Creating Supabase user...");
  const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'password123',
      email_confirm: true
  });
  
  if (error) {
      console.log("Supabase error:", error.message);
  } else {
      console.log("Supabase user created:", newUser.user.id);
      
      // 4. See if trigger created a new Prisma user
      const triggerUser = await prisma.user.findUnique({ where: { email: testEmail }});
      console.log("Trigger created Prisma user:", !!triggerUser);

      // Clean up
      if (triggerUser) {
          await prisma.user.delete({ where: { id: triggerUser.id } });
      }
  }

  // Final cleanup
  await prisma.user.delete({ where: { id: u.id }});
}
run();
