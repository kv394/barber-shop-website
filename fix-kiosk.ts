import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log("Fetching all users...");
  let page = 1;
  let allUsers: any[] = [];
  while (true) {
      const { data: usersData, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
      if (error) throw error;
      const users = usersData.users;
      allUsers = allUsers.concat(users);
      if (users.length < 100) break;
      page++;
  }

  console.log(`Found ${allUsers.length} total users in Supabase.`);
  
  const kioskUsers = allUsers.filter(u => u.email && u.email.includes('kiosk'));
  console.log(`Found ${kioskUsers.length} kiosk users in Supabase:`, kioskUsers.map(u => u.email));

  for (const u of kioskUsers) {
      console.log(`Updating password for ${u.email} (ID: ${u.id})...`);
      const { error } = await supabaseAdmin.auth.admin.updateUserById(u.id, {
          password: 'kioskpassword123',
          email_confirm: true,
      });
      if (error) {
          console.error(`Failed to update ${u.email}:`, error.message);
      } else {
          console.log(`Successfully updated ${u.email}`);
      }
  }
}
run();
