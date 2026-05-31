import { logger } from "@/lib/logger";
import { prisma, getTenantClient } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
 request: Request,
 { params }: { params: Promise<{ shopId: string }> }
) {
 try {
 const { shopId } = await params;
    const tenantClient = await getTenantClient(shopId);
 const supabase = await createClient();
 const { data: { session } } = await supabase.auth.getSession();
  const authUserSession = session?.user;
 let userId = authUserSession?.id;
 const authUserEmail = authUserSession?.email;
 if (!userId) {
 return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
 }

 // Verify user is SHOP_ADMIN or SITE_ADMIN for this shop
 const currentUser = await tenantClient.user.findFirst({ where: { OR: [{ id: userId || '' }, { email: authUserEmail || '' }] } });
 if (!currentUser || (currentUser.role !== 'SITE_ADMIN' && (currentUser.role !== 'SHOP_ADMIN' || (currentUser.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: currentUser.id, shopId } })))))) {
 return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 }

 const body = await request.json();
 const { email, password } = body;

 if (!email || !password) {
 return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
 }

 // SECURITY: Enforce minimum password length
 if (typeof password !== 'string' || password.length < 8) {
 return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
 }

 // SECURITY: Verify the target email belongs to a kiosk user of THIS shop
 // Prevents a SHOP_ADMIN from changing passwords for users in other shops
 const targetUser = await tenantClient.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });
 if (!targetUser || (targetUser.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: targetUser.id, shopId } }))) || targetUser.role !== 'ATTENDANCE_KIOSK') {
 return NextResponse.json({ error: 'Target user must be a kiosk account for this shop' }, { status: 403 });
 }

 const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
 const supabaseAdmin = createSupabaseClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
 );

 // Create or update user in Supabase
 let targetSupabaseId: string | null = null;

 // Supabase Admin API listUsers is paginated. We must paginate to find the user by email.
 let page = 1;
 while (true) {
 const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
 if (listError) throw listError;
 
 const users = usersData.users || [];
 const existing = users.find((u: any) => u.email === email);
 
 if (existing) {
 targetSupabaseId = existing.id;
 break;
 }
 
 if (users.length < 100) break;
 page++;
 }

 if (targetSupabaseId) {
 // User exists, update password
 const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetSupabaseId, {
 password: password,
 email_confirm: true,
 });
 if (updateError) throw updateError;
 
 // Ensure our local DB is synced with the correct Supabase ID
 await tenantClient.user.update({
 where: { email: email },
 data: { id: targetSupabaseId }
 });
 } else {
 // User does not exist, create them
 const existingPrismaUser = await tenantClient.user.findUnique({ where: { email: email }});
 
 let tempEmail = '';
 if (existingPrismaUser) {
 // Temporarily rename the email to bypass the Supabase trigger unique constraint
 tempEmail = `temp_${Date.now()}_${email}`;
 await tenantClient.user.update({
 where: { email: email },
 data: { email: tempEmail },
 });
 }

 const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
 email: email,
 password: password,
 email_confirm: true,
 user_metadata: { name: existingPrismaUser?.name || 'Kiosk' }
 });
 
 if (createError) {
 // If it failed, try to restore the original user's email
 if (existingPrismaUser) {
 await tenantClient.user.update({ where: { id: existingPrismaUser.id }, data: { email: email }});
 }
 throw createError;
 }
 
 targetSupabaseId = newUser.user.id;

 if (existingPrismaUser) {
 // The DB trigger might have created a new row for the new Supabase ID.
 // Delete the new row (if it exists) and update the original row to link it to the new Supabase ID.
 await tenantClient.user.delete({ where: { id: targetSupabaseId! } }).catch(() => {});

 await tenantClient.user.update({
 where: { id: existingPrismaUser.id },
 data: {
 id: targetSupabaseId!,
 email: email,
 role: existingPrismaUser.role,
 shopId: existingPrismaUser.shopId,
 barcode: existingPrismaUser.barcode,
 name: existingPrismaUser.name
 } as any
 });
 }
 }

 return NextResponse.json({ success: true, message: 'Kiosk password set successfully.' });

 } catch (error: any) {
 logger.error('Error setting kiosk password:', error);
 return NextResponse.json({ error: 'Failed to set password.' }, { status: 500 });
 }
}
