require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const kioskUsers = await prisma.user.findMany({ where: { role: 'ATTENDANCE_KIOSK' } });
  
  console.log(`Found ${kioskUsers.length} kiosk users in Prisma`);
  
  for (const k of kioskUsers) {
      console.log(`Processing ${k.email}...`);
      
      // Paginate through Supabase to see if it exists
      let sbUser = null;
      let page = 1;
      while (true) {
          const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
          if (error) throw error;
          const match = data.users.find(u => u.email === k.email);
          if (match) {
              sbUser = match;
              break;
          }
          if (data.users.length < 100) break;
          page++;
      }
      
      if (sbUser) {
          console.log(`Found Supabase user ${sbUser.id}. Updating password...`);
          await supabaseAdmin.auth.admin.updateUserById(sbUser.id, { password: 'kioskpassword123', email_confirm: true });
          await prisma.user.update({ where: { id: k.id }, data: { id: sbUser.id }});
      } else {
          console.log(`Supabase user missing. Renaming Prisma user...`);
          const tempEmail = 'temp_' + Date.now() + '_' + k.email;
          await prisma.user.update({ where: { id: k.id }, data: { email: tempEmail } });
          
          console.log(`Creating Supabase user...`);
          const { data: newSb, error } = await supabaseAdmin.auth.admin.createUser({
              email: k.email,
              password: 'kioskpassword123',
              email_confirm: true,
              user_metadata: { name: k.name }
          });
          
          if (error) {
             console.log(`Create error:`, error);
             await prisma.user.update({ where: { id: k.id }, data: { email: k.email } });
          } else {
             console.log(`Created! ID: ${newSb.user.id}`);
             await prisma.user.delete({ where: { id: newSb.user.id } }).catch(() => {});
             await prisma.user.update({
                 where: { id: k.id },
                 data: { id: newSb.user.id, email: k.email }
             });
          }
      }
  }
}
run();