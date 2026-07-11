import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  console.log('Creating auth user for admin@rhythmdance.com...');
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@rhythmdance.com',
    password: 'password123',
    options: {
      data: {
        full_name: 'Jane Doe',
      }
    }
  });

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Successfully created auth user! Password: password123');
  }
}
main();
