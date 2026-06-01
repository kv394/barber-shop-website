const fs = require('fs');
let content = fs.readFileSync('app/api/shops/[shopId]/referrals/route.ts', 'utf8');

// The block:
//  if (user.role !== 'SITE_ADMIN') {
//  if (['SHOP_ADMIN', 'STAFF'].includes(user.role) && (user.shopId !== shopId && !(await tenantClient.shopAccess.findFirst({ where: { userId: user.id, shopId } })))) {

content = content.replace(" if (user.role !== 'SITE_ADMIN') {\n if (['SHOP_ADMIN', 'STAFF'].includes(user.role)", " if (['SHOP_ADMIN', 'STAFF'].includes(user.role)");

// also remove the extra closing brace
content = content.replace(" }\n }\n\n // Ensure user has a referral code", " }\n\n // Ensure user has a referral code");

fs.writeFileSync('app/api/shops/[shopId]/referrals/route.ts', content, 'utf8');
