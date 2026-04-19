import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
import { createClient } from '@supabase/supabase-js';

async function run() {
  const kioskUser = await prisma.user.findFirst({ where: { role: 'ATTENDANCE_KIOSK' }});
  if (!kioskUser) {
    console.log("No Kiosk User Found");
    return;
  }
  console.log("Kiosk user:", kioskUser.email);
  console.log("Kiosk user ID in Prisma:", kioskUser.id);
  
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabaseAdmin.auth.admin.listUsers();
  const sbUser = data.users.find(u => u.email === kioskUser.email);
  console.log("Supabase User Found:", !!sbUser);
  if (sbUser) {
      console.log("Supabase User ID:", sbUser.id);
      console.log("Email Confirmed at:", sbUser.email_confirmed_at);
      
      const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
        email: kioskUser.email,
        password: 'kioskpassword123',
      });
      console.log("Test Login with 'kioskpassword123':", authError ? authError.message : "Success");
  }
}
run();
