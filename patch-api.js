const fs = require('fs');
const file = 'app/api/shops/[shopId]/appointments/route.ts';
let content = fs.readFileSync(file, 'utf8');

const targetContent = ` // SECURITY: Verify staff belongs to this shop (prevent cross-shop staff assignment)
 const staffMember = await prisma.user.findUnique({ where: { id: staffId } });
 if (!staffMember || (staffMember.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: staffMember.id, shopId } })))) {
 return NextResponse.json({ error: 'Staff member not found in this shop' }, { status: 404 });
 }

 const start = new Date(startTime);
 const end = new Date(start.getTime() + totalDuration * 60000);
 const blockEnd = new Date(end.getTime() + (service.bufferMinutes || 0) * 60000);`;

const newContent = ` // SECURITY: Verify staff belongs to this shop (prevent cross-shop staff assignment)
 const staffMember = await prisma.user.findUnique({ where: { id: staffId } });
 if (!staffMember || (staffMember.shopId !== shopId && !(await prisma.shopAccess.findFirst({ where: { userId: staffMember.id, shopId } })))) {
 return NextResponse.json({ error: 'Staff member not found in this shop' }, { status: 404 });
 }

 const start = new Date(startTime);
 const end = new Date(start.getTime() + totalDuration * 60000);
 const blockEnd = new Date(end.getTime() + (service.bufferMinutes || 0) * 60000);

 // Apply Dynamic Pricing Rules
 const shopRules = await prisma.dynamicPricingRule.findMany({
   where: { shopId, isActive: true }
 });
 const shopTz = (await prisma.shop.findUnique({ where: { id: shopId } }))?.timezone || 'America/New_York';
 // Get local time in shop's timezone
 const tzDate = new Date(start.toLocaleString('en-US', { timeZone: shopTz }));
 const dayOfWeek = tzDate.getDay();
 const timeStr = \`\${tzDate.getHours().toString().padStart(2, '0')}:\${tzDate.getMinutes().toString().padStart(2, '0')}\`;

 for (const rule of shopRules) {
   let matchesDay = true;
   if (rule.daysOfWeek && rule.daysOfWeek !== '[]') {
     try {
       const days = JSON.parse(rule.daysOfWeek);
       if (Array.isArray(days) && days.length > 0 && !days.includes(dayOfWeek)) matchesDay = false;
     } catch (e) {}
   }
   let matchesTime = true;
   if (rule.startTime && timeStr < rule.startTime) matchesTime = false;
   if (rule.endTime && timeStr >= rule.endTime) matchesTime = false;

   if (matchesDay && matchesTime) {
     if (rule.adjustmentType === 'PERCENTAGE') {
       const amount = totalPrice * (rule.adjustmentValue / 100);
       if (rule.type === 'SURGE') totalPrice += amount;
       else totalPrice -= amount;
     } else {
       if (rule.type === 'SURGE') totalPrice += rule.adjustmentValue;
       else totalPrice -= rule.adjustmentValue;
     }
   }
 }

 totalPrice = Math.max(0, totalPrice);`;

const targetContent2 = ` return tx.appointment.create({
 data: {
 shopId: shopId,
 serviceId: serviceId,
 userId: targetUserId,
 staffId: staffId,
 startTime: start,
 endTime: end,
 notes: notes || null,
 addons: addonsJson || null,
 },
 });`;

const newContent2 = ` return tx.appointment.create({
 data: {
 shopId: shopId,
 serviceId: serviceId,
 userId: targetUserId,
 staffId: staffId,
 startTime: start,
 endTime: end,
 notes: notes || null,
 addons: addonsJson || null,
 subtotal: totalPrice,
 totalAmount: totalPrice,
 },
 });`;

content = content.replace(targetContent, newContent);
content = content.replace(targetContent2, newContent2);
fs.writeFileSync(file, content);
