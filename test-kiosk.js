const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  // Need to know what the kiosk email is. Let's query Prisma.
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const kioskUser = await prisma.user.findFirst({ where: { role: 'ATTENDANCE_KIOSK' }});
  
  if (!kioskUser) {
    console.log("No Kiosk User Found");
    return;
  }
  console.log("Kiosk user:", kioskUser.email);
  
  // we don't know the password they set. Let's list users from Supabase admin to see if it's there.
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data } = await supabaseAdmin.auth.admin.listUsers();
  const sbUser = data.users.find(u => u.email === kioskUser.email);
  console.log("Supabase User Found:", !!sbUser);
  if (sbUser) {
      console.log("Supabase User ID:", sbUser.id);
      console.log("Prisma User ID:", kioskUser.id);
      console.log("Email Confirmed at:", sbUser.email_confirmed_at);
  }
}
run();
