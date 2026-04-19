const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const kioskUser = await prisma.user.findFirst({ where: { role: 'ATTENDANCE_KIOSK' }});
  if (!kioskUser) return console.log("No Kiosk User");
  
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  console.log("Attempting login for:", kioskUser.email);
  // I'll try to set a new password first, then login
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  let targetSupabaseId;
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
  const existingSupabaseUser = usersData?.users?.find((u) => u.email === kioskUser.email);
  
  if (existingSupabaseUser) {
    targetSupabaseId = existingSupabaseUser.id;
    const { error } = await supabaseAdmin.auth.admin.updateUserById(targetSupabaseId, {
      password: 'kioskpassword123',
      email_confirm: true,
    });
    console.log("Update password error:", error);
  } else {
    console.log("Kiosk user not found in Supabase Auth. Creating...");
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: kioskUser.email,
      password: 'kioskpassword123',
      email_confirm: true,
    });
    console.log("Create user error:", error);
    if (!error) {
        await prisma.user.update({
            where: { email: kioskUser.email },
            data: { id: data.user.id }
        });
    }
  }

  // Now test login
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: kioskUser.email,
    password: 'kioskpassword123',
  });
  
  console.log("Login error:", authError?.message);
  console.log("Login success:", !!authData?.user);
}
run();
