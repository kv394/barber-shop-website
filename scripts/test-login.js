require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@heritagehaircuts.com',
    password: 'password123'
  });
  
  if (error) {
    console.error('Login failed:', error.message);
  } else {
    console.log('Login succeeded! User ID:', data.user.id);
  }
}
run();
