const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  // Get the kiosk email from the latest shop
  const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
  const kioskUser = usersData.users.find(u => u.email && u.email.includes('kiosk'));

  if (!kioskUser) {
    console.log("No Kiosk User found in Supabase.");
    return;
  }
  console.log("Found Kiosk User in Supabase:", kioskUser.email);

  // Force set password
  console.log("Updating password...");
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(kioskUser.id, {
    password: 'password123',
    email_confirm: true,
  });
  if (updateError) {
      console.log("Update error:", updateError.message);
  }

  console.log("Attempting sign in...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: kioskUser.email,
    password: 'password123',
  });

  if (error) {
    console.log("Sign in error:", error.message);
  } else {
    console.log("Sign in success! User ID:", data.user.id);
  }
}
run();
