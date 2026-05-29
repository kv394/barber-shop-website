require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  
  const emails = ['admin@heritagehaircuts.com', 'admin@luxurynails.com'];
  
  for (const email of emails) {
    // We need to find the user id first
    const { data: usersData, error: errList } = await supabase.auth.admin.listUsers();
    if (errList) { console.error('List error:', errList); return; }
    
    const user = usersData.users.find(u => u.email === email);
    if (!user) { console.error('User not found:', email); continue; }
    
    const { data, error } = await supabase.auth.admin.updateUserById(user.id, {
      password: 'password123',
      email_confirm: true
    });
    
    if (error) {
      console.error(`Failed to update ${email}:`, error.message);
    } else {
      console.log(`Successfully updated password for ${email}`);
    }
  }
}
run();
